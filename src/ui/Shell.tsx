import type {ReactNode} from "react";

export function Shell(props: {children: ReactNode}) {
  return (
    <div className="wizard-shell">
      <div className="wizard-bg-orbs" aria-hidden="true" />
      <header className="wizard-header">
        <div className="wizard-header-brand">
          <img src="/logo.png" alt="Neome" />
          <span>Neome</span>
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
