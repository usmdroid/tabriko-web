"use client";

export function Spinner({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      aria-hidden
      className={`animate-spin shrink-0 ${className}`}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
    >
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
      <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
