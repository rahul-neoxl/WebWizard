import {STUDIO_ENT_VERSION} from "../config";
import type {
  MsgStudioEntCreate,
  StudioEntDetails,
  StudioEntMap,
} from "../api/types";
import {storeItemEntMerge, storeItemListGet} from "../api/store";
import {
  studioEntCreate,
  studioEntDeploy,
  studioEntDeployStatusGet,
} from "../api/studio";
import {newGuid, nextAdminId, nextEntId} from "../net/ids";
import {trackWizardEvent} from "../utils/analytics";
import {isoDateTimeNow, getCurrentTimeZone, getLocalDateFormat} from "../utils/date";
import {resolveTemplatePreselect} from "./templates";

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

export function buildCreateMsg(
  adminId: string,
  entId: string,
  details: StudioEntDetails,
): MsgStudioEntCreate {
  return {
    adminId,
    studioEnt: {
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
    },
  };
}

export function generateIds() {
  return {
    adminId: nextAdminId(),
    entId: nextEntId(),
  };
}

async function pollDeployStatus(entId: string): Promise<void> {
  const started = Date.now();

  while (Date.now() - started < POLL_TIMEOUT_MS) {
    const status = await studioEntDeployStatusGet(entId);

    if (status.executionState === "completed") {
      trackWizardEvent("wizard_enterprise_deployed");
      return;
    }
    if (status.executionState === "failed") {
      trackWizardEvent("wizard_enterprise_deploy_failed");
      throw new Error(status.message || "Enterprise deployment failed.");
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
 * Tracks how far a deploy attempt progressed so a retry can resume instead of
 * starting over. Pass the same object across retries: once the enterprise is
 * created we skip create+merge (which would otherwise spawn a duplicate
 * enterprise) and only re-run deploy/poll.
 */
export interface DeployProgress {
  entId?: string;
  created?: boolean;
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

  // Create the enterprise exactly once across retries.
  if (!progress.created) {
    input.onStatus?.("Loading templates…");
    const storeItems = await storeItemListGet();
    const {storeItemIds, templateCodes} = resolveTemplatePreselect(
      storeItems,
      input.preSelectedApps,
    );

    const {adminId, entId} = generateIds();
    const entDetails: StudioEntDetails = {
      name,
      timeZone: getCurrentTimeZone(),
      displayDateFormat: getLocalDateFormat(),
      ...(templateCodes.length > 0 ? {templateCodes} : {}),
    };

    let msgEnt = buildCreateMsg(adminId, entId, entDetails);

    if (storeItemIds.length > 0) {
      input.onStatus?.(
        storeItemIds.length > 1
          ? "Merging templates…"
          : "Applying template…",
      );
      const merged = await storeItemEntMerge({
        studioEnt: msgEnt.studioEnt,
        storeItemIdSet: storeItemIds,
      });
      msgEnt = {...msgEnt, studioEnt: merged.studioEnt};
    }

    input.onStatus?.("Creating app…");
    await studioEntCreate(msgEnt);
    progress.entId = msgEnt.studioEnt.entId;
    progress.created = true;
  }

  const finalEntId = progress.entId as string;

  // Kick off deployment once; polling below can safely resume against an
  // already-deploying enterprise.
  if (!progress.deployed) {
    input.onStatus?.("Deploying app…");
    await studioEntDeploy(finalEntId);
    progress.deployed = true;
  }

  input.onStatus?.("Finishing setup…");
  await pollDeployStatus(finalEntId);

  return {entId: finalEntId};
}
