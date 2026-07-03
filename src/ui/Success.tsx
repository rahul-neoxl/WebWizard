import {config, WIZARD_FREE_TRIAL_DAYS, WIZARD_MAX_USERS} from "../config";
import {formatTrialEndDate} from "../utils/date";

export function Success() {
  const trialEnd = formatTrialEndDate(WIZARD_FREE_TRIAL_DAYS);

  const startApp = () => {
    window.location.href = config.webBaseUrl;
  };

  return (
    <div className="wizard-step fade-in">
      <div className="success-card">
        <div className="success-hero">
          <div className="success-check" aria-hidden="true">
            ✓
          </div>
        </div>

        <h1>Your App Is Ready</h1>
        <p className="subtitle">Start exploring your free app.</p>

        <div className="plan-card">
          <div className="plan-card-title">Plan Details</div>
          <div className="plan-row">
            <span>Plan</span>
            <span>Free Trial</span>
          </div>
          <div className="plan-row">
            <span>Trial ends</span>
            <span>{trialEnd}</span>
          </div>
          <div className="plan-row">
            <span>Duration</span>
            <span>{WIZARD_FREE_TRIAL_DAYS} days</span>
          </div>
          <div className="plan-row">
            <span>Total users allowed</span>
            <span>{WIZARD_MAX_USERS}</span>
          </div>
        </div>

        <button type="button" className="btn-primary btn-start-app" onClick={startApp}>
          Open Your App →
        </button>

        <div className="mobile-download">
          <div className="mobile-download-label">Continue on mobile</div>
          <div className="store-buttons">
            <div className="store-item">
              <a
                className="store-link"
                href={config.playStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src="/play-store-btn.svg" alt="Get it on Google Play" />
              </a>
              <img
                className="store-qr"
                src="/play-store-qr.png"
                alt="Google Play QR"
              />
            </div>
            <div className="store-item">
              <a
                className="store-link"
                href={config.appStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src="/app-store-btn.svg" alt="Download on the App Store" />
              </a>
              <img
                className="store-qr"
                src="/app-store-qr.png"
                alt="App Store QR"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
