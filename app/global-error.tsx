"use client";

// Only if the app's frame itself fails. It replaces the whole page, without
// the app's styles, so it carries its own (ivory, or night in dark mode).
export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body>
        <title>King of Names</title>
        <style>{`
          body { margin: 0; min-height: 100dvh; display: grid; place-items: center; background: #f6f1e6; color: #1d2a24;
            font: 17px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
          main { max-width: 22rem; padding: 24px; }
          h1 { font: 400 2rem/1.1 Georgia, serif; margin: 0 0 12px; }
          p { margin: 0 0 20px; opacity: .75; }
          button { width: 100%; height: 52px; border: 0; border-radius: 14px; background: #1f4d3d; color: #fff; font: 600 1rem inherit; }
          @media (prefers-color-scheme: dark) { body { background: #0f1412; color: #ece6d6; } button { background: #c9a96a; color: #10221c; } }
        `}</style>
        <main>
          <h1>Something went wrong</h1>
          <p>Try again in a moment. Notes you recorded are safe on your phone.</p>
          <button onClick={() => retry()}>Try again</button>
        </main>
      </body>
    </html>
  );
}
