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

  const emit = useCallback(
    (arr: string[]) => {
      const value = arr.join("");
      setOtp(value);
      if (arr.every((c) => c !== "") && !loading) {
        setLoading(true);
        setError(undefined);
        onVerify(value)
          .catch((err) => {
            setError(err instanceof Error ? err.message : "Invalid code.");
            setOtp("");
            refs.current[0]?.focus();
          })
          .finally(() => setLoading(false));
      }
    },
    [loading, onVerify],
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
    if (resendCount >= MAX_RESEND_LIMIT || secondsLeft > 0 || loading) {
      return;
    }
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
            Edit contact
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
              autoFocus={i === 0}
              inputMode="numeric"
              maxLength={1}
              aria-label={`Digit ${i + 1}`}
              onChange={(e) => onCellChange(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              onFocus={(e) => e.target.select()}
            />
          ))}
        </div>

        <div className="otp-meta">
          <span>
            {secondsLeft > 0
              ? `Resend in ${formatTime(secondsLeft)}`
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
