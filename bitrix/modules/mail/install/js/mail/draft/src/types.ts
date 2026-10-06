export type DraftContext = {
	contextType: 'mail' | 'crm',
	crmEntityTypeId?: number,
	crmEntityId?: number,
};

export type DraftRecipient = {
	name: string,
	email: string,
	entityType?: string,
	entityId?: number,
	avatar?: string,
};

export type DraftAttachmentSource = {
	source: 'draft' | 'disk' | 'upload',
	id: string,
};

export type ComposeSnapshot = {
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
	largeAttachments?: Array<{
		token: string,
		publicUrl: string,
		fileIds: number[],
		sourceFileIds: number[],
		valid?: boolean,
	}>,
};

export type DraftView = {
	id: number,
	revision: number,
	contextType: 'mail' | 'crm',
	crmEntityTypeId: number | null,
	crmEntityId: number | null,
	updatedAt: string,
	expiresAt: string,
	snapshot: ComposeSnapshot,
	attachments: Array<{
		id: number,
		name: string,
		size: number,
		contentType: string | null,
		url?: string | null,
		previewUrl?: string | null,
		previewWidth?: number | null,
		previewHeight?: number | null,
	}>,
};

export type DraftAttachmentView = DraftView['attachments'][number];

export type DraftSaveRequest = {
	draftId: number | null,
	revision: number | null,
	snapshot: ComposeSnapshot,
};

export type RunAction = (action: string, options?: {
	data?: Record<string, unknown>,
	method?: string,
}) => Promise<{
	data: Record<string, unknown>,
}>;

export type DraftGateway = {
	config: () => Promise<{ available: boolean, retentionDays: number }>,
	save: (request: DraftSaveRequest) => Promise<DraftView>,
	get: (draftId: number) => Promise<DraftView>,
	getByContext: () => Promise<DraftView | null>,
	deleteCurrent: () => Promise<boolean>,
	delete: (draftId: number) => Promise<boolean>,
};

export type CloseGuard = {
	waitUntil: (promise: Promise<void>) => void,
	preventDefault: () => void,
};

export type SubmitGuard = Pick<CloseGuard, 'waitUntil'>;

export type ComposeForm = {
	getComposeSnapshot: () => ComposeSnapshot,
	waitForDraftReady?: () => Promise<void>,
	applyComposeSnapshot?: (
		snapshot: ComposeSnapshot,
		attachments?: DraftAttachmentView[],
	) => Promise<void> | void,
	syncDraftAttachmentSources?: (
		canonicalSources: DraftAttachmentSource[],
		attachments: DraftAttachmentView[],
		submittedSources?: DraftAttachmentSource[],
	) => void,
	setDraftLoading?: (loading: boolean) => void,
	setDraftRestoreFailed?: (failed: boolean) => void,
	getDraftLifecycleToken?: () => number,
	isDraftLifecycleActive?: (token: number) => boolean,
	showError?: (message: string) => void,
	subscribe?: (eventName: string, handler: (...data: never[]) => void) => void,
	unsubscribe?: (eventName: string, handler: (...data: never[]) => void) => void,
};
