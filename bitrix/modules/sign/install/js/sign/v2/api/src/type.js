import type { MemberRoleType, ProviderCodeType, ReminderType } from 'sign.type';

export type Provider = {
	code: ProviderCodeType,
	uid: ?string,
	timestamp: ?number,
	virtual: boolean,
	autoRegister: boolean,
	name: ?string;
	description: ?string,
	iconUrl: ?string,
	expires: ?number,
	externalProviderId: ?string,
};

export type SourceType = 'manual' | 'hcmlink';

export type LoadedDocumentData = {
	blankId: number;
	entityId: number;
	entityType: string;
	entityTypeId: number;
	id: number;
	initiator: string;
	langId: string;
	parties: number;
	resultFileId: number;
	scenario: string;
	status: string;
	title: string;
	uid: string;
	version: number;
	providerCode: ProviderCodeType;
	dateSignUntilUserTime: string | null;
	inviteMessage: string | null;
	previewUrl?: string;
	externalDateCreateSourceType: SourceType;
	externalIdSourceType: SourceType;
	templateId: number | null;
	hcmLinkCompanyId: number | null;
};

export type Communication = {
	ID: number;
	TYPE: 'EMAIL' | 'PHONE';
	VALUE: string;
	VALUE_TYPE: string;
};
export type BlockData = {
	text?: string;
	field?: string;
	hasFields?: boolean;
	presetId?: number;
	__view?: { crmNumeratorUrl?: string; base64?: string; };
	fileId?: number;
};
type BlockSettings = {
	positon: {
		top: string;
		left: string;
		width: string;
		widthPx: number;
		height: string;
		heightPx: number;
	},
	style: { [$Keys<CSSStyleDeclaration>]: string; }
};
export type LoadedBlock = {
	code: string;
	data: BlockData;
	id: number;
	party: number;
	type: string;
	position: BlockSettings['position'];
	style: BlockSettings['style'];
};

export type SetupMember = {
	entityType: string;
	entityId: number;
	party: number;
	role?: Role;
	signingMethod?: ?string;
};

export type LoadedMember = {
	uid: string;
	entityId: number;
	entityType: string;
	entityTypeId: number | null;
	presetId: number | null;
	party: number;
	role: MemberRoleType;
	reminderType: ReminderType;
};

export type Company = {
	id: ?number,
	title: ?string,
	rqInn: ?number,
	registerUrl: ?string,
	providers: ?Array<Provider>,
	goskeyLiteAvailable: ?boolean,
	goskeyRepresentativeSigningAvailable: ?boolean,
};

export type B2eCompanyList = { companies: Array<Company>, showTaxId: boolean };

export type CountMember = {
	entityType: string;
	entityId: number | string;
};

export type HcmLinkMultipleVacancyEmployee = {
	userId: number,
	fullName: string,
	avatarLink: string,
	positions: Array<{
		position: string,
		employeeId: number,
	}>,
	order: number,
};

export type HcmLinkMultipleVacancyEmployeesLoadData = {
	company: {
		id: number,
		title: string,
	},
	employees: Array<HcmLinkMultipleVacancyEmployee>
};

export type EmployeeSaveData = {
	documentUid: string,
	selectedEmployeeCollection: Array<{userId: number, employeeId: number}>,
};

export type ControllerError = {
	message: string,
	code: string | number,
	customData: {},
}

export type HcmLinkNotMappedUsersData = {
	integrationId: number,
	userIds: Array<number>,
	allUserIds: Array<number>,
};

export type Restrictions = {
	isAvailable: boolean;
	smsAllowed: boolean;
	newDocAllowed: boolean;
	availableOnTariff: boolean;
	b2bPhoneVerificationRequired: boolean;
};

/**
 * Per-file outcome of the batch document creation.
 */
export type AddGroupDocumentsItem = {
	fileId: string,
	success: boolean,
	uid: string | null,
	documentId: number | null,
	blankId: number | null,
	/** Whether the blank of the file was created with placeholders; false for a failed file. */
	hasPlaceholders: boolean,
	errorCode: string | null,
};

export type AddGroupDocumentsResponse = {
	groupId: number,
	items: Array<AddGroupDocumentsItem>,
};

export type ModifyInviteMessageRequest = {
	uid: string;
	message: string | null;
};

export type ModifyDocumentsInviteMessageRequest = {
	documentIds: Array<number>;
	message: string | null;
};

export type ModifyInviteMessageResponse = {
	success: boolean;
};
