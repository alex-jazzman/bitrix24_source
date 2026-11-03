export type DraftContext =
	| { type: 'mail' }
	| { type: 'crm', entityTypeId: number, entityId: number };

export type DraftRecipient = {
	name: string,
	email: string,
	entityType?: string,
	entityId?: number,
};

export type DraftAttachmentSource = {
	source: 'draft' | 'disk' | 'upload',
	id: string,
};

export type DraftSnapshot = {
	clientId: string,
	sender: { name: string, email: string } | null,
	to: DraftRecipient[],
	cc: DraftRecipient[],
	bcc: DraftRecipient[],
	subject: string,
	body: string,
	bodyFormat: 'html',
	mode: 'new' | 'reply' | 'forward',
	parentMessageId: number | null,
	attachments: DraftAttachmentSource[],
};

export type DraftAttachment = {
	id: number,
	name: string,
	size: number,
	contentType: string | null,
};

export type DraftView = {
	id: number,
	revision: number,
	contextType: 'mail' | 'crm',
	crmEntityTypeId: number | null,
	crmEntityId: number | null,
	updatedAt: string,
	expiresAt: string,
	snapshot: DraftSnapshot,
	attachments: DraftAttachment[],
};

export type DraftListItem = {
	id: number,
	revision: number,
	sender: { name: string, email: string } | null,
	recipients: DraftRecipient[],
	subject: string,
	bodyPreview: string,
	updatedAt: string,
	attachmentCount: number,
};

export type DraftPage = {
	items: DraftListItem[],
	total: number,
	page: number,
	pageSize: number,
};

export type DraftSaveParams = {
	draftId: number | null,
	revision: number | null,
	snapshot: DraftSnapshot,
};

export type DraftListParams = {
	page: number,
	pageSize: number,
	search: string,
};

export type DraftConnectorOptions = {
	context?: DraftContext,
	runAction?: (action: string, config: { data: Record<string, unknown> }) => Promise<unknown>,
	errorHandler?: (response: unknown) => Promise<unknown>,
};

export type DraftRequestOptions = {
	handleErrors?: boolean,
};
