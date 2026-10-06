/* eslint-disable */
type BootstrapOptions = {
	form: ComposeForm;
	clientId: string;
	draftId?: number | null;
	draft?: DraftView | null;
	connector?: DraftGateway;
	context?: DraftContext;
	onDraftIdChange?: (draftId: number, revision: number) => void;
	onCancel?: () => Promise<void> | void;
};

type ComposeForm = {
	getComposeSnapshot: () => ComposeSnapshot;
	waitForDraftReady?: () => Promise<void>;
	applyComposeSnapshot?: (snapshot: ComposeSnapshot, attachments?: DraftAttachmentView[]) => Promise<void> | void;
	syncDraftAttachmentSources?: (canonicalSources: DraftAttachmentSource[], attachments: DraftAttachmentView[], submittedSources?: DraftAttachmentSource[]) => void;
	setDraftLoading?: (loading: boolean) => void;
	setDraftRestoreFailed?: (failed: boolean) => void;
	getDraftLifecycleToken?: () => number;
	isDraftLifecycleActive?: (token: number) => boolean;
	showError?: (message: string) => void;
	subscribe?: (eventName: string, handler: (...data: never[]) => void) => void;
	unsubscribe?: (eventName: string, handler: (...data: never[]) => void) => void;
};

type ComposeSnapshot = {
	clientId: string;
	sender: {
		name: string;
		email: string;
	} | null;
	to: DraftRecipient[];
	cc: DraftRecipient[];
	bcc: DraftRecipient[];
	subject: string;
	body: string;
	bodyFormat: 'html';
	mode: 'new' | 'reply' | 'forward';
	parentMessageId: number | null;
	attachments: DraftAttachmentSource[];
	largeAttachments?: Array<{
		token: string;
		publicUrl: string;
		fileIds: number[];
		sourceFileIds: number[];
		valid?: boolean;
	}>;
};

type DraftRecipient = {
	name: string;
	email: string;
	entityType?: string;
	entityId?: number;
	avatar?: string;
};

type DraftAttachmentSource = {
	source: 'draft' | 'disk' | 'upload';
	id: string;
};

type DraftAttachmentView = DraftView['attachments'][number];

type DraftView = {
	id: number;
	revision: number;
	contextType: 'mail' | 'crm';
	crmEntityTypeId: number | null;
	crmEntityId: number | null;
	updatedAt: string;
	expiresAt: string;
	snapshot: ComposeSnapshot;
	attachments: Array<{
		id: number;
		name: string;
		size: number;
		contentType: string | null;
		url?: string | null;
		previewUrl?: string | null;
		previewWidth?: number | null;
		previewHeight?: number | null;
	}>;
};

type DraftGateway = {
	config: () => Promise<{
		available: boolean;
		retentionDays: number;
	}>;
	save: (request: DraftSaveRequest) => Promise<DraftView>;
	get: (draftId: number) => Promise<DraftView>;
	getByContext: () => Promise<DraftView | null>;
	deleteCurrent: () => Promise<boolean>;
	delete: (draftId: number) => Promise<boolean>;
};

type DraftSaveRequest = {
	draftId: number | null;
	revision: number | null;
	snapshot: ComposeSnapshot;
};

type DraftContext = {
	contextType: 'mail' | 'crm';
	crmEntityTypeId?: number;
	crmEntityId?: number;
};

type CoordinatorOptions = {
	form: ComposeForm;
	connector: Pick<DraftGateway, 'save' | 'get'>;
	debounceDelay?: number;
	draft?: DraftView | null;
	onFlushError?: (error: Error) => Promise<FlushDecision>;
	onStateChange?: (state: {
		draftId: number | null;
		revision: number | null;
	}) => void;
	onCloseWithSavedDraft?: () => void;
	onDeleteDraft?: (draftId: number) => Promise<boolean>;
};

type FlushDecision = 'retry' | 'close-with-risk' | 'cancel';

type CrmDraftContextOptions = {
	entityTypeId?: number;
	entityId?: number;
	ownerEntityTypeId?: number;
	ownerEntityId?: number;
};

type CrmRestoreDialogPresentation = {
	shell: 'ui.system.dialog';
	width: number;
	buttonGroup: 'centerButtons';
	hasOverlay: boolean;
	buttons: {
		continue: DialogButtonPresentation;
		startNew: DialogButtonPresentation;
	};
};

type DialogButtonPresentation = {
	size: string;
	style: string;
	useAirDesign: boolean;
};

type RunAction = (action: string, options?: {
	data?: Record<string, unknown>;
	method?: string;
}) => Promise<{
	data: Record<string, unknown>;
}>;

declare namespace BX.Mail.Draft {
	function bootstrapMailDraft(options: BootstrapOptions): Promise<DraftCoordinator | null>;

	class DraftCoordinator {
		constructor(options: CoordinatorOptions);
		getState(): {
			draftId: number | null;
			revision: number | null;
		};
		flush(): Promise<void>;
		destroy(): void;
		markChanged(): void;
	}

	function bootstrapCrmDraft(options: BootstrapOptions): Promise<DraftCoordinator | null>;

	function resolveCrmDraftContext(options: CrmDraftContextOptions): {
		entityTypeId: number;
		entityId: number;
	};

	function resolveCrmRestoreDecision(decision: 'continue' | 'start-new' | 'cancel', connector: Pick<DraftGateway, 'deleteCurrent'>): Promise<'continue' | 'start-new' | 'cancel'>;

	function isDraftRoute(path: string): boolean;

	function getCrmRestoreDialogPresentation(): CrmRestoreDialogPresentation;

	class DraftConnector {
		constructor(context: DraftContext, runAction?: RunAction);
		config(): Promise<{
			available: boolean;
			retentionDays: number;
		}>;
		save(request: DraftSaveRequest): Promise<DraftView>;
		get(draftId: number): Promise<DraftView>;
		getByContext(): Promise<DraftView | null>;
		deleteCurrent(): Promise<boolean>;
		delete(draftId: number): Promise<boolean>;
	}
}
