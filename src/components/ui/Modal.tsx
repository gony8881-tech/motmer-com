import type { PropsWithChildren } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
}

export function Modal({ open, onClose, title, children }: PropsWithChildren<ModalProps>) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-md2 bg-white p-6 shadow-lg" role="dialog" aria-modal="true">
        <div className="mb-4 flex items-center justify-between">
          {title && <h2 className="text-base font-semibold text-primary-900">{title}</h2>}
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="rounded-md2 p-1 text-primary-500 hover:bg-primary-50"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
