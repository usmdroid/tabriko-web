"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({
  onClose,
  labelledBy,
  className = "",
  as = "div",
  onSubmit,
  children,
}: {
  onClose: () => void;
  labelledBy?: string;
  className?: string;
  as?: "div" | "form";
  onSubmit?: (e: React.FormEvent) => void;
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement | HTMLFormElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const container = containerRef.current;
    const initial = container?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    (initial ?? container)?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !container) return;
      const nodes = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetParent !== null,
      );
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const panelProps = {
    ref: containerRef as React.Ref<HTMLDivElement> & React.Ref<HTMLFormElement>,
    role: "dialog",
    "aria-modal": true,
    "aria-labelledby": labelledBy,
    tabIndex: -1,
    className,
    style: { animation: "modalIn 200ms ease forwards" },
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      {as === "form" ? (
        <form {...panelProps} onSubmit={onSubmit}>
          {children}
        </form>
      ) : (
        <div {...panelProps}>{children}</div>
      )}
    </div>
  );
}
