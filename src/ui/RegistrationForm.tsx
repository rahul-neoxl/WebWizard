import {useCallback, useState} from "react";
import {isValidHandle} from "../utils/phone";

export interface RegistrationData {
  fullName: string;
  handle: string;
  companyName: string;
}

interface Props {
  onSubmit: (data: RegistrationData) => Promise<void>;
}

export function RegistrationForm({onSubmit}: Props) {
  const [fullName, setFullName] = useState("");
  const [handle, setHandle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const canSubmit =
    fullName.trim() &&
    companyName.trim() &&
    isValidHandle(handle) &&
    !loading;

  const submit = useCallback(async () => {
    if (!canSubmit) {
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      await onSubmit({
        fullName: fullName.trim(),
        handle: handle.trim(),
        companyName: companyName.trim(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send verification code.");
    } finally {
      setLoading(false);
    }
  }, [canSubmit, companyName, fullName, handle, onSubmit]);

  return (
    <div className="wizard-step fade-in">
      <div className="wizard-step-inner">
        {loading && (
          <div className="loading-overlay">
            <div className="spinner" />
          </div>
        )}

        <div className="wizard-auth-header">
          <h1>Get Started</h1>
          <p>Start now — it&apos;s free. No credit card required.</p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="field-group">
          <label className="field-label" htmlFor="fullName">
            Full name<span className="required">*</span>
          </label>
          <input
            id="fullName"
            className="field-input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name"
            autoComplete="name"
          />
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="handle">
            Mobile or email<span className="required">*</span>
          </label>
          <input
            id="handle"
            className="field-input"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="Phone number or email"
            autoComplete="email tel"
            inputMode="email"
          />
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="companyName">
            Company name<span className="required">*</span>
          </label>
          <input
            id="companyName"
            className="field-input"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Your company or team name"
            autoComplete="organization"
          />
        </div>

        <button
          type="button"
          className="btn-primary"
          disabled={!canSubmit}
          onClick={submit}
        >
          Start Now
        </button>

        <p className="terms-footer">
          By clicking on Start Now, you agree to our
          <br />
          <a
            href="https://www.neome.ai/about/terms-of-services/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Terms of service
          </a>{" "}
          &{" "}
          <a
            href="https://www.neome.ai/about/privacy-policy/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}
