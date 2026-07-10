"use client";

import { Spinner } from "@/app/components/Spinner";
import { Modal } from "@/app/components/Modal";

interface ConfirmModalProps {
  message: React.ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  busy: boolean;
}

export function ConfirmModal({
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onClose,
  busy,
}: ConfirmModalProps) {
  return (
    <Modal onClose={onClose} labelledBy="confirm-modal-message" className="surface-card w-full max-w-xs p-6 flex flex-col gap-4">
      <p id="confirm-modal-message" className="text-sm font-medium text-primary">{message}</p>
      <div className="flex gap-2 justify-end">
        <button
          onClick={onClose}
          className="rounded-lg border border-line px-4 py-2 text-sm text-muted hover:bg-card transition-colors"
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          disabled={busy}
          className="flex items-center gap-1.5 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors disabled:opacity-60"
        >
          {busy && <Spinner size={13} />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
