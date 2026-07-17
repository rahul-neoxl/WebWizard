import {STUDIO_ENT_VERSION} from "../config";
import type {
  SigEntDeployStatus,
  StudioEnt,
  StudioEntDetails,
  StudioEntMap,
} from "../api/types";
import {storeItemEntMergeDeploy} from "../api/store";
import {studioEntDeployStatusGet} from "../api/studio";
import {newGuid, nextAdminId, nextEntId} from "../net/ids";
import {isoDateTimeNow, getCurrentTimeZone, getLocalDateFormat} from "../utils/date";

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 180000;

function emptyMap(): StudioEntMap {
  return {keys: [], map: {}};
}

function buildStudioVersion(adminId: string) {
  const now = isoDateTimeNow();
  return {
    version: newGuid(),
    versionCode: STUDIO_ENT_VERSION,
    lastUpdateTime: now,
    createdBy: adminId,
    creationTime: now,
    lastUpdateBy: adminId,
  };
}

/**
 * Builds the StudioEnt for storeItemEntMergeDeploy: version metadata + entId + the
 * enterprise details. Every content map is left empty — the server populates them by
 * merging the requested templates.
 */
function buildStudioEnt(
  adminId: string,
  entId: string,
  details: StudioEntDetails,
): StudioEnt {
  return {
    ...buildStudioVersion(adminId),
    entId,
    details,
    varMap: emptyMap(),
    translationMap: emptyMap(),
    actionMap: emptyMap(),
    automationMap: emptyMap(),
    driveSheetMap: emptyMap(),
    formMap: emptyMap(),
    moduleMap: emptyMap(),
    groupMap: emptyMap(),
    pluginMap: emptyMap(),
    roleMap: emptyMap(),
    reportMap: emptyMap(),
    deeplinkMap: emptyMap(),
    spreadsheetMap: emptyMap(),
    deployVarMap: emptyMap(),
  };
}

function generateIds() {
  return {
    adminId: nextAdminId(),
    entId: nextEntId(),
  };
}

async function pollDeployStatus(entId: string): Promise<void> {
  const started = Date.now();
  let sawStatus = false;

  while (Date.now() - started < POLL_TIMEOUT_MS) {
    let status: SigEntDeployStatus | undefined;
    try {
      status = await studioEntDeployStatusGet(entId);
      sawStatus = true;
    } catch (err) {
      // storeItemEntMergeDeploy queues an async job, so the enterprise's deploy status
      // may not be queryable on the very first poll(s). Tolerate that until we've read a
      // status once; after that, surface genuine errors.
      if (sawStatus) {
        throw err;
      }
    }

    if (status?.executionState === "completed") {
      return;
    }
    if (status?.executionState === "failed") {
      throw new Error(status.message || "App deployment failed.");
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error("Deployment timed out. Please try again.");
}

export interface DeployInput {
  companyName: string;
  preSelectedApps: string[];
  onStatus?: (message: string) => void;
}

export interface DeployResult {
  entId: string;
}

/**
 * Tracks how far a deploy attempt progressed so a retry can resume instead of starting
 * over. Once the merge-deploy job has been queued we keep the same entId and only
 * re-poll on retry — we never queue a second job (which would create a duplicate
 * enterprise).
 */
export interface DeployProgress {
  entId?: string;
  deployed?: boolean;
}

export async function runDeploy(
  input: DeployInput,
  progress: DeployProgress = {},
): Promise<DeployResult> {
  const name = input.companyName.trim();
  if (!name) {
    throw new Error("Company name is required.");
  }

  // Merge templates + create + deploy in a single server call, exactly once across
  // retries. templateCodes come straight from the ?app= query params.
  if (!progress.deployed) {
    input.onStatus?.("Setting up your app…");

    const {adminId, entId} = generateIds();
    const details: StudioEntDetails = {
      name,
      timeZone: getCurrentTimeZone(),
      displayDateFormat: getLocalDateFormat(),
    };

    await storeItemEntMergeDeploy({
      studioEnt: buildStudioEnt(adminId, entId, details),
      templateCodes: input.preSelectedApps,
    });

    progress.entId = entId;
    progress.deployed = true;
  }

  input.onStatus?.("Finishing setup…");
  await pollDeployStatus(progress.entId as string);

  return {entId: progress.entId as string};
}
