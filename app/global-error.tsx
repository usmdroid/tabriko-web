"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="uz">
      <body style={{ display: "grid", placeItems: "center", minHeight: "100vh", fontFamily: "sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <h2>Kutilmagan xatolik yuz berdi.</h2>
          <button onClick={() => reset()} style={{ marginTop: 12, padding: "8px 16px", cursor: "pointer" }}>
            Qayta urinish
          </button>
        </div>
      </body>
    </html>
  );
}
