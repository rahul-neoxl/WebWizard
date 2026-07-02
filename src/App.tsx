import {useCallback, useEffect, useRef, useState} from "react";
import {requestOtp, verifyOtpAndAuth} from "./auth/auth";
import {runDeploy, type DeployProgress} from "./deploy/deploy";
import {useAppParams} from "./hooks/useAppParams";
import {Deploying} from "./ui/Deploying";
import {OtpVerify} from "./ui/OtpVerify";
import {RegistrationForm, type RegistrationData} from "./ui/RegistrationForm";
import {Shell} from "./ui/Shell";
import {Success} from "./ui/Success";

type Step = "form" | "otp" | "deploying" | "success";

export default function App() {
  const {preSelectedApps, isRedirecting} = useAppParams();
  const [step, setStep] = useState<Step>("form");
  const [verifyKey, setVerifyKey] = useState<string>();
  const [verifyHandle, setVerifyHandle] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [deployStatus, setDeployStatus] = useState("Preparing your workspace…");
  const [deployError, setDeployError] = useState<string>();
  const [showDeployDialog, setShowDeployDialog] = useState(false);
  const deployProgress = useRef<DeployProgress>({});

  useEffect(() => {
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.title = "Neome Wizard";
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, []);

  const startDeploy = useCallback(async (name: string) => {
    setDeployError(undefined);
    setShowDeployDialog(true);
    setDeployStatus("Preparing your workspace…");
    try {
      await runDeploy(
        {
          companyName: name,
          preSelectedApps,
          onStatus: setDeployStatus,
        },
        deployProgress.current,
      );
      setShowDeployDialog(false);
      setStep("success");
    } catch (err) {
      setShowDeployDialog(false);
      setDeployError(
        err instanceof Error ? err.message : "Deployment failed.",
      );
    }
  }, [preSelectedApps]);

  const onFormSubmit = useCallback(async (data: RegistrationData) => {
    setFullName(data.fullName);
    setCompanyName(data.companyName);
    const result = await requestOtp(data.handle);

    // Already signed in: OTP not needed — go straight to deployment.
    // (Profile-name patch is skipped, matching the old app's authenticated
    // flow, so an existing profile name is not overwritten.)
    if (result.kind === "alreadySignedIn") {
      setStep("deploying");
      await startDeploy(data.companyName);
      return;
    }

    setVerifyKey(result.verifyKey);
    setVerifyHandle(data.handle);
    setStep("otp");
  }, [startDeploy]);

  const onOtpVerify = useCallback(
    async (otp: string) => {
      if (!verifyKey) {
        throw new Error("Session expired. Please start again.");
      }
      await verifyOtpAndAuth(verifyKey, otp, fullName);
      setStep("deploying");
      await startDeploy(companyName);
    },
    [verifyKey, fullName, companyName, startDeploy],
  );

  const onOtpResend = useCallback(async () => {
    if (!verifyHandle) {
      throw new Error("Missing contact information.");
    }
    const result = await requestOtp(verifyHandle);
    if (result.kind === "alreadySignedIn") {
      // Session established between send and resend — skip OTP, deploy.
      setStep("deploying");
      await startDeploy(companyName);
      return;
    }
    setVerifyKey(result.verifyKey);
  }, [verifyHandle, companyName, startDeploy]);

  const retryDeploy = useCallback(() => {
    setDeployError(undefined);
    setStep("deploying");
    void startDeploy(companyName);
  }, [companyName, startDeploy]);

  if (isRedirecting) {
    return null;
  }

  return (
    <Shell>
      {step === "form" && <RegistrationForm onSubmit={onFormSubmit} />}

      {step === "otp" && verifyKey && (
        <OtpVerify
          handle={verifyHandle}
          onVerify={onOtpVerify}
          onResend={onOtpResend}
          onEdit={() => setStep("form")}
        />
      )}

      {step === "deploying" && (
        <Deploying
          statusText={deployStatus}
          showDialog={showDeployDialog}
          error={deployError}
          onRetry={retryDeploy}
        />
      )}

      {step === "success" && <Success />}
    </Shell>
  );
}
