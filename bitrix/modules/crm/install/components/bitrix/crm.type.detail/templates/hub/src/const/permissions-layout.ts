// Layout of the "Access permissions" section: one action row over the existing navigation record.
// The record already carries actionKey 'permissions' and app.ts already handles it — only the
// presentation changes here.

// 'lock' (the name in the prototype) does not exist in the Outline set. 'o-roles-library' is the
// closest verified match for the "employees and roles" access concept, and keeps the MAIN_CARD_ICON
// convention of 'o-'-prefixed pictogram icons for a CrmHubCard header.
export const PERMISSIONS_CARD_ICON = 'o-roles-library';

export const PERMISSIONS_RECORD_ID = 'sp-permissions';

// Record ids this layout renders itself instead of handing them to the control renderer.
export const PERMISSIONS_LAYOUT_RECORD_IDS: string[] = [PERMISSIONS_RECORD_ID];
