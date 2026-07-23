import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import {MAX_RESEND_LIMIT, OTP_LENGTH, OTP_TOTAL_SECONDS} from "../config";

interface Props {
  handle: string;
  onVerify: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  onEdit: () => void;
}

export function OtpVerify({handle, onVerify, onResend, onEdit}: Props) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [secondsLeft, setSecondsLeft] = useState(OTP_TOTAL_SECONDS);
  const [resendCount, setResendCount] = useState(0);
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  // Synchronous guard — `loading` state updates too late to block a rapid
  // double-tap or an auto-submit racing the button (same fix as the form).
  const busyRef = useRef(false);

  // Move focus into the first box on mount. On mobile this also keeps the soft
  // keyboard up: App focuses an off-screen keeper input during the submit tap
  // (the only moment iOS will open the keyboard), and handing focus over here
  // keeps it open with the cursor in box 1 instead of dismissing it.
  useEffect(() => {
    refs.current[0]?.focus({preventScroll: true});
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }
    const timer = window.setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  const chars = Array.from({length: OTP_LENGTH}, (_, i) => otp[i] ?? "");
  const isComplete = chars.every((c) => c !== "");

  // Shared by auto-submit (as soon as the 6th digit is entered) and the
  // "Verify & Continue" button, so there is exactly one verify code path.
  const triggerVerify = useCallback(
    (value: string) => {
      if (value.length !== OTP_LENGTH || busyRef.current) {
        return;
      }
      busyRef.current = true;
      setLoading(true);
      setError(undefined);
      onVerify(value)
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Invalid code.");
          setOtp("");
          refs.current[0]?.focus();
        })
        .finally(() => {
          busyRef.current = false;
          setLoading(false);
        });
    },
    [onVerify],
  );

  const emit = useCallback(
    (arr: string[]) => {
      const value = arr.join("");
      setOtp(value);
      if (arr.every((c) => c !== "")) {
        triggerVerify(value);
      }
    },
    [triggerVerify],
  );

  const onCellChange = (index: number, raw: string) => {
    const digits = raw.replace(/\D/g, "");
    const arr = [...chars];

    if (digits === "") {
      arr[index] = "";
      emit(arr);
      return;
    }

    if (digits.length === 1) {
      arr[index] = digits;
      emit(arr);
      if (index < OTP_LENGTH - 1) {
        refs.current[index + 1]?.focus();
      }
      return;
    }

    const slice = digits.slice(0, OTP_LENGTH - index).split("");
    slice.forEach((c, k) => {
      arr[index + k] = c;
    });
    emit(arr);
    refs.current[Math.min(index + slice.length, OTP_LENGTH - 1)]?.focus();
  };

  const onKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      const arr = [...chars];
      if (chars[index] === "" && index > 0) {
        arr[index - 1] = "";
        emit(arr);
        refs.current[index - 1]?.focus();
        event.preventDefault();
      } else if (chars[index] !== "") {
        arr[index] = "";
        emit(arr);
      }
    } else if (event.key === "ArrowLeft" && index > 0) {
      refs.current[index - 1]?.focus();
      event.preventDefault();
    } else if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      refs.current[index + 1]?.focus();
      event.preventDefault();
    }
  };

  const onPaste = (event: ClipboardEvent) => {
    event.preventDefault();
    const text = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!text) {
      return;
    }
    const arr = Array.from({length: OTP_LENGTH}, (_, k) => text[k] ?? "");
    emit(arr);
    refs.current[Math.min(text.length, OTP_LENGTH - 1)]?.focus();
  };

  const resend = async () => {
    if (resendCount >= MAX_RESEND_LIMIT || secondsLeft > 0 || busyRef.current) {
      return;
    }
    busyRef.current = true;
    setLoading(true);
    setError(undefined);
    try {
      await onResend();
      setResendCount((c) => c + 1);
      setSecondsLeft(OTP_TOTAL_SECONDS);
      setOtp("");
      refs.current[0]?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code.");
    } finally {
      busyRef.current = false;
      setLoading(false);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="wizard-step fade-in">
      <div className="wizard-step-inner">
        {loading && (
          <div className="loading-overlay">
            <div className="spinner" />
          </div>
        )}

        <div className="wizard-auth-header">
          <h1>Verify it&apos;s you</h1>
          <p>
            Enter the 6-digit code sent to <strong>{handle}</strong>
          </p>
          <button type="button" className="btn-secondary" onClick={onEdit}>
            Change number/email
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="otp-boxes" onPaste={onPaste}>
          {chars.map((c, i) => (
            <input
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              className="otp-cell"
              value={c}
              disabled={loading}
              inputMode="numeric"
              maxLength={1}
              aria-label={`Digit ${i + 1}`}
              onChange={(e) => onCellChange(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              onFocus={(e) => e.target.select()}
            />
          ))}
        </div>

        <button
          type="button"
          className="btn-primary"
          disabled={loading || !isComplete}
          onClick={() => triggerVerify(otp)}
        >
          {loading ? "Verifying…" : "Verify & Continue"}
        </button>

        <div className="otp-meta">
          <span>
            {secondsLeft > 0
              ? `Resend code in ${formatTime(secondsLeft)}`
              : resendCount >= MAX_RESEND_LIMIT
                ? "Resend limit reached"
                : "Didn't receive a code?"}
          </span>
          <button
            type="button"
            className="btn-secondary"
            disabled={
              loading ||
              secondsLeft > 0 ||
              resendCount >= MAX_RESEND_LIMIT
            }
            onClick={resend}
          >
            Resend
          </button>
        </div>
      </div>
    </div>
  );
}
