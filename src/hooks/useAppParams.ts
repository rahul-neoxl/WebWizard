import {useEffect, useMemo} from "react";
import {APP_SELECTION_URL} from "../config";

export function useAppParams(): {
  preSelectedApps: string[];
  hasApps: boolean;
  isRedirecting: boolean;
} {
  const preSelectedApps = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.getAll("app").filter(Boolean);
  }, []);

  const hasApps = preSelectedApps.length > 0;

  useEffect(() => {
    if (!hasApps) {
      window.location.replace(APP_SELECTION_URL);
    }
  }, [hasApps]);

  return {
    preSelectedApps,
    hasApps,
    isRedirecting: !hasApps,
  };
}
