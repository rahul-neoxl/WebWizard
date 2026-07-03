import type {ReactNode} from "react";

export function Shell(props: {children: ReactNode}) {
  return (
    <div className="wizard-shell">
      <div className="wizard-bg-orbs" aria-hidden="true" />
      <header className="wizard-header">
        <div className="wizard-header-brand">
          {/* Same wordmark as the neome.ai website header (logo.webp, h-40px)
              so the redirect from app-selection feels like the same site. */}
          <img src="/logo.webp" alt="Neome" />
        </div>
      </header>
      <main className="wizard-main">
        <div className="wizard-card">
          <div className="wizard-card-body">{props.children}</div>
        </div>
      </main>
    </div>
  );
}
