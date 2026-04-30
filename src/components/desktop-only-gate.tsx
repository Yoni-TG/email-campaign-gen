import type { ReactNode } from "react";

export function DesktopOnlyGate({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-bg p-8 lg:hidden">
        <div className="max-w-sm text-center">
          <p className="font-mono text-[11px] uppercase tracking-wider text-ink-3">
            Theo Grace
          </p>
          <h1 className="mt-3 font-display text-3xl leading-tight text-ink">
            Best on desktop
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-2">
            The campaign generator is built for a wider screen. Open this on a
            desktop or laptop to continue.
          </p>
        </div>
      </div>
      <div className="hidden lg:block">{children}</div>
    </>
  );
}
