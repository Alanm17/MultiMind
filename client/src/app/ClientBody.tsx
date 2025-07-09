"use client";

import { useEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Toaster } from "sonner";

export default function ClientBody({
  children,
}: {
  children: React.ReactNode;
}) {
  // Remove any extension-added classes during hydration
  useEffect(() => {
    // This runs only on the client after hydration
    document.body.className = "antialiased";
  }, []);

  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div className="flex flex-col items-center justify-center h-screen bg-background text-center p-8">
          <h2 className="text-2xl font-bold mb-4 text-red-600">
            Something went wrong
          </h2>
          <pre className="text-sm text-muted-foreground mb-4 max-w-xl overflow-x-auto">
            {error.message}
          </pre>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={resetErrorBoundary}
          >
            Reload
          </button>
        </div>
      )}
    >
      <div className="antialiased">
        {children}
        <Toaster position="top-right" richColors />
      </div>
    </ErrorBoundary>
  );
}
