import type { PreselectedSignerEntity } from 'sign.v2.b2e.user-party';

/**
 * Entities preselected on the signers step of the wizard. Optional: without them the wizard
 * opens exactly as it does from the KEDO section, with an empty signers step.
 */
export type B2ETemplatesSignSettingsOptions = {
	preselectedSigners?: Array<PreselectedSignerEntity>,
};

export type DocumentSettings = {
	registrationNumber: string,
	creationDate: Date,
	signingDate: Date,
};

export type TemplateDocumentUid = string;

export type DocumentSettingsByTemplateDocumentUid = Record<TemplateDocumentUid, DocumentSettings>;
