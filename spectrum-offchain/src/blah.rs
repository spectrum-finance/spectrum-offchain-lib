use std::sync::Arc;

use tokio::sync::mpsc;
use tokio::sync::oneshot;
use tokio::sync::Mutex;

enum FlagState {
    True,
    False(oneshot::Receiver<()>),
}

async fn manage_rollback_flag(
    mut command_recv: mpsc::Receiver<bool>,
    mut request: mpsc::Receiver<()>,
    sender_flag_state: mpsc::Sender<FlagState>,
) {
    let flag = Arc::new(Mutex::new(false));
    let notifier: Arc<Mutex<Option<oneshot::Sender<()>>>> = Arc::new(Mutex::new(None));

    let flag_clone = flag.clone();
    let notifier_clone = notifier.clone();

    tokio::spawn(async move {
        while let Some(()) = request.recv().await {
            if *flag_clone.lock().await {
                let _ = sender_flag_state.send(FlagState::True).await;
            } else {
                let mut guard = notifier_clone.lock().await;
                let oneshot_sender = guard.take();
                assert!(oneshot_sender.is_none());
                let (new_sender, recv) = oneshot::channel();
                *guard = Some(new_sender);
                let _ = sender_flag_state.send(FlagState::False(recv)).await;
            }
        }
    });

    while let Some(new_flag_value) = command_recv.recv().await {
        *flag.lock().await = new_flag_value;
        if new_flag_value {
            let oneshot_sender = notifier.lock().await.take();
            if let Some(s) = oneshot_sender {
                s.send(()).unwrap();
            }
        }
    }
}
