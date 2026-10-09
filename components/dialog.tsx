"use client";
import { useEffect, useRef, type ReactNode } from "react";
export function Dialog({
  open,
  close,
  label,
  children,
  className = "",
}: {
  open: boolean;
  close?: () => void;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open) d.showModal();
    else d.close();
    if (open) {
      const before = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = before;
      };
    }
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-label={label}
      className={className}
      onCancel={(e) => {
        e.preventDefault();
        close?.();
      }}
      onClick={(e) => {
        if (e.target === ref.current && close) {
          const b = ref.current.getBoundingClientRect();
          if (
            e.clientX < b.left ||
            e.clientX > b.right ||
            e.clientY < b.top ||
            e.clientY > b.bottom
          )
            close();
        }
      }}
    >
      {children}
    </dialog>
  );
}
