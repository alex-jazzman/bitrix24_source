/**
 * DTO-01 draft of a grid row: the very shape the drafts list already receives.
 */
declare type GridDraftView = {
	id: number,
	revision?: number,
	subject?: string,
	bodyPreview?: string,
	updatedAt?: string,
	attachmentCount?: number,
	sender?: ConversationParticipant | null,
	recipients?: ConversationParticipant[],
};

/**
 * Message of a server page, before the message model of the numeric storage is built from it.
 */
declare type ServerMailMessage = {
	id: number | string,
	uidId?: string,
	direction?: number | string,
	date?: string,
	isRead?: number | boolean,
	isRemoved?: boolean,
	subject?: string,
	abbreviatedText?: string,
	withAttachments?: boolean,
	mailboxId?: number,
	folderId?: number | string | null,
};

/**
 * The draft row of the grid: the plain drafts list and a single DTO-01 draft use the same model.
 */
declare type DraftRowModel = {
	id: number | string,
	draftId?: number,
	revision?: number,
	isDraft: true,
	direction: number,
	to: Array<{ customData: ConversationParticipant }>,
	from: Array<{ customData: ConversationParticipant }>,
	subject?: string,
	abbreviatedText?: string,
	date: number,
	isRead: true,
	withAttachments: boolean,
};

/**
 * DTO-01 row: a single message, a single draft or a conversation summary.
 */
declare type GridItem = {
	type: 'message' | 'draft' | 'conversation',
	id: number | string,
	message?: ServerMailMessage | null,
	draft?: GridDraftView | null,
};

/**
 * DTO-02 item of an expanded conversation.
 */
declare type ConversationItem = {
	kind: 'message' | 'draft',
	id: string,
	messageId?: number | null,
	draftId?: number | null,
	matched?: boolean,
	folder?: { id?: number, name?: string, type?: string, path?: string },
	message?: ServerMailMessage | null,
	draft?: GridDraftView | null,
};

declare type RoutedGridItems = {
	messages: ServerMailMessage[],
	drafts: DraftRowModel[],
	conversations: ConversationSummary[],
};

/**
 * Display record of a nested conversation row kept in the slice: enough to draw the row without the
 * raw DTO-02 item and to address the numeric target of the open handler.
 */
declare type ConversationChildRecord = {
	id: string,
	kind: 'message' | 'draft',
	messageId: number,
	draftId: number,
	folder: { id?: number, name?: string, type?: string, path?: string } | null,
	matched: boolean,
	draft: DraftRowModel | null,
};

declare type RoutedConversationItems = {
	childIds: string[],
	messageIds: number[],
	draftIds: number[],
	messages: ServerMailMessage[],
	drafts: DraftRowModel[],
	records: Record<string, ConversationChildRecord>,
};

declare type ConversationListPayload = {
	contextKey: string | null,
	grouped?: boolean,
	items?: GridItem[],
	nextCursor?: string | null,
	settings?: ConversationSettings,
};

declare type ConversationPagePayload = {
	conversationId: ConversationId,
	items?: ConversationItem[],
	nextCursor?: string | null,
	incomplete?: boolean,
	retryAvailable?: boolean,
	remainingCount?: number,
	version?: string | null,
	mode?: 'first' | 'next' | 'sync',
};

/**
 * Localized labels the dependency-free nested-item view model receives instead of requiring Loc.
 */
declare type ConversationItemLabels = {
	matched?: string,
	folderTypeLabels?: Record<string, string>,
	folderNamesByPath?: Record<string, string>,
};

/**
 * Display model of a nested conversation row derived from a DTO-02 item.
 */
declare type ConversationItemViewModel = {
	id: string,
	testId: string,
	kind: 'message' | 'draft',
	isDraft: boolean,
	messageId: number,
	draftId: number,
	folderLabel: string,
	isSelected: boolean,
	matched: boolean,
	matchedLabel: string,
};

declare type ConversationSyncPayload = ConversationPagePayload & {
	summary?: ConversationSummary,
};

declare type ConversationVersionPayload = {
	conversationId: ConversationId,
	summary?: ConversationSummary,
};

declare type ConversationFailurePayload = {
	conversationId: ConversationId,
	error?: ConversationError | null,
	retryAvailable?: boolean,
};

declare type ConversationLoadingPayload = {
	conversationId: ConversationId,
	loading?: boolean,
};

declare type ConversationTogglePayload = {
	conversationId: ConversationId,
};

declare type ConversationReducers = {
	conversationListReceived: (state: ConversationsSliceState, action: { payload: ConversationListPayload }) => void,
	conversationsCleared: () => ConversationsSliceState,
	conversationLoadingChanged: (state: ConversationsSliceState, action: { payload: ConversationLoadingPayload }) => void,
	conversationPageReceived: (state: ConversationsSliceState, action: { payload: ConversationPagePayload }) => void,
	conversationPageFailed: (state: ConversationsSliceState, action: { payload: ConversationFailurePayload }) => void,
	conversationVersionMismatched: (state: ConversationsSliceState, action: { payload: ConversationVersionPayload }) => void,
	conversationMailboxSynchronized: (state: ConversationsSliceState, action: { payload: ConversationSyncPayload }) => void,
	conversationToggled: (state: ConversationsSliceState, action: { payload: ConversationTogglePayload }) => void,
};
