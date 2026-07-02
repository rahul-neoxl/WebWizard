interface Props {
  statusText: string;
  showDialog: boolean;
  error?: string;
  onRetry?: () => void;
}

export function Deploying({statusText, showDialog, error, onRetry}: Props) {
  if (error && !showDialog) {
    return (
      <div className="wizard-step fade-in">
        <div className="wizard-step-inner deploy-center">
          <div className="error-banner">{error}</div>
          {onRetry && (
            <button type="button" className="btn-primary" onClick={onRetry}>
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="wizard-step fade-in">
        <div className="deploy-center">
          <div className="spinner" />
          <p style={{fontWeight: 500, color: "var(--color-text-muted)"}}>
            {statusText || "Preparing your workspace…"}
          </p>
        </div>
      </div>

      {showDialog && (
        <div className="deploy-dialog-backdrop" role="dialog" aria-modal="true">
          <div className="deploy-dialog">
            <div className="deploy-dialog-icon">
              <div className="deploy-ring" />
              {/* Rotating arc — replica of the old dialog's MUI CircularProgress
                  (size 140, thickness 2, rounded linecap). */}
              <svg className="deploy-progress" viewBox="22 22 44 44" aria-hidden="true">
                <circle cx="44" cy="44" r="21" fill="none" strokeWidth="2" />
              </svg>
              <div className="deploy-pulse">
                <svg
                  width="44"
                  height="44"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth="1.5"
                >
                  <path d="M12 3L2 9v12h20V9L12 3z" />
                  <path d="M9 21V12h6v9" />
                </svg>
              </div>
            </div>
            <h2>Deploying Enterprise</h2>
            <p>
              Please wait a few moments while we prepare and deploy your
              organization&apos;s workspace. This may take some time.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
