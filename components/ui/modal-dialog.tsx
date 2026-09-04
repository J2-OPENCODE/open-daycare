"use client";

import {
  useEffect,
  useRef,
  type MouseEvent,
  type ReactNode,
  type RefObject,
  type SyntheticEvent,
} from "react";

type ModalDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onAfterClose?: () => void;
  ariaLabelledBy: string;
  ariaDescribedBy?: string;
  initialFocusRef?: RefObject<HTMLElement | null>;
  className?: string;
  children: ReactNode;
};

export function ModalDialog({
  isOpen,
  onClose,
  onAfterClose,
  ariaLabelledBy,
  ariaDescribedBy,
  initialFocusRef,
  className,
  children,
}: ModalDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocusRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (isOpen && !dialog.open) {
      const activeElement = document.activeElement;
      returnFocusRef.current =
        activeElement instanceof HTMLElement ? activeElement : null;
      dialog.showModal();
      initialFocusRef?.current?.focus();
      return;
    }

    if (!isOpen && dialog.open) {
      dialog.close();
      returnFocusRef.current?.focus();
      returnFocusRef.current = null;
      onAfterClose?.();
    }
  }, [initialFocusRef, isOpen, onAfterClose]);

  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    onClose();
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className={`modal-dialog ${className ?? ""}`.trim()}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
    >
      {children}
    </dialog>
  );
}
