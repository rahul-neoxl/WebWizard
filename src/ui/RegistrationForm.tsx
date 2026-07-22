import {useCallback, useEffect, useId, useRef, useState} from "react";
import {COMPANY_SIZE_OPTIONS} from "../api/contact";
import {isValidHandle} from "../utils/phone";

export interface RegistrationData {
  fullName: string;
  handle: string;
  companyName: string;
  companySize?: string;
}

interface Props {
  onSubmit: (data: RegistrationData) => Promise<void>;
  initialValues?: RegistrationData;
}

function CompanySizeSelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = COMPANY_SIZE_OPTIONS.find((option) => option.value === value);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (rootRef.current && target && !rootRef.current.contains(target)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown, {passive: true});
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className={`field-select${open ? " is-open" : ""}`} ref={rootRef}>
      <button
        type="button"
        id={id}
        className={`field-input field-select-trigger${selected ? "" : " is-placeholder"}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="field-select-value">
          {selected ? selected.label : "Select company size (optional)"}
        </span>
        <svg
          className="field-select-chevron"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <>
          <button
            type="button"
            className="field-select-backdrop"
            aria-label="Close company size options"
            onClick={() => setOpen(false)}
          />
          <ul
            id={listId}
            role="listbox"
            aria-labelledby={id}
            className="field-select-menu"
          >
            {COMPANY_SIZE_OPTIONS.map((option) => {
              const isSelected = option.value === value;
              return (
                <li key={option.value} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`field-select-option${isSelected ? " is-selected" : ""}`}
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                  >
                    {option.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

export function RegistrationForm({onSubmit, initialValues}: Props) {
  const [fullName, setFullName] = useState(initialValues?.fullName ?? "");
  const [handle, setHandle] = useState(initialValues?.handle ?? "");
  const [companyName, setCompanyName] = useState(initialValues?.companyName ?? "");
  const [companySize, setCompanySize] = useState(initialValues?.companySize ?? "");
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
        ...(companySize ? {companySize} : {}),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send verification code.");
    } finally {
      setLoading(false);
    }
  }, [canSubmit, companyName, companySize, fullName, handle, onSubmit]);

  return (
    <div className="wizard-step fade-in">
      <div className="wizard-step-inner">
        {loading && (
          <div className="loading-overlay">
            <div className="spinner" />
          </div>
        )}

        <div className="wizard-auth-header">
          <h1>Start Your Free Trial</h1>
          <p>Set up your app in minutes. No credit card required.</p>
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
            placeholder="Mobile number or work email"
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

        <div className="field-group">
          <label className="field-label" htmlFor="companySize">
            Company size
          </label>
          <CompanySizeSelect
            id="companySize"
            value={companySize}
            onChange={setCompanySize}
          />
        </div>

        <button
          type="button"
          className="btn-primary"
          disabled={!canSubmit}
          onClick={submit}
        >
          Create Free App
        </button>

        <p className="terms-footer">
          By clicking on Create Free App, you agree to our
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
