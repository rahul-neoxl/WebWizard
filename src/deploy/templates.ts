import {WIZARD_MAX_TEMPLATE_SELECTIONS} from "../config";
import type {DtoStoreItemAvatar} from "../api/types";

export interface TemplateResolveResult {
  storeItemIds: string[];
  templateCodes: string[];
}

export function resolveTemplatePreselect(
  items: DtoStoreItemAvatar[],
  preSelectedApps: string[],
): TemplateResolveResult {
  const storeItemIds: string[] = [];
  const templateCodes = new Set<string>();
  let autoSelected = 0;

  for (const item of items) {
    if (autoSelected >= WIZARD_MAX_TEMPLATE_SELECTIONS) {
      break;
    }
    const code = item.templateCode;
    if (!code || !preSelectedApps.includes(code)) {
      continue;
    }
    templateCodes.add(code);
    if (!storeItemIds.includes(item.storeItemId)) {
      storeItemIds.push(item.storeItemId);
      autoSelected++;
    }
  }

  return {
    storeItemIds,
    templateCodes: [...templateCodes],
  };
}
