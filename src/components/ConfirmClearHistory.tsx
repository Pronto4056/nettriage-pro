import { useEffect, useRef } from 'react';

export function ConfirmClearHistory({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  function cancel() {
    dialog.current?.close();
    onCancel();
  }
  function confirm() {
    dialog.current?.close();
    onConfirm();
    requestAnimationFrame(() => {
      document.getElementById('main')?.focus({ preventScroll: true });
    });
  }
  return (
    <dialog
      ref={dialog}
      className="confirmation"
      aria-labelledby="clear-history-title"
      aria-describedby="clear-history-description"
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const controls = dialog.current?.querySelectorAll('button');
        if (!controls?.length) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        cancel();
      }}
    >
      <span className="eyebrow">LOCAL HISTORY</span>
      <h2 id="clear-history-title">Clear all saved sessions?</h2>
      <p id="clear-history-description">
        This removes diagnostic history from this browser and cannot be undone.
        Your current form remains available.
      </p>
      <div className="actions">
        <button type="button" onClick={cancel} autoFocus>
          Cancel
        </button>
        <button type="button" className="primary" onClick={confirm}>
          Clear saved sessions
        </button>
      </div>
    </dialog>
  );
}
