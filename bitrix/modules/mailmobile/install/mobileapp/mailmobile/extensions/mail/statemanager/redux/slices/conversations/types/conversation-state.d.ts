declare type ConversationId = string;

declare type ConversationSettings = {
	enabled?: boolean,
	onboardingSeen?: boolean,
	featureAvailable?: boolean,
};

declare type ConversationParticipant = {
	name?: string,
	email?: string,
};

/**
 * DTO-01 conversation summary.
 */
declare type ConversationSummary = {
	type: 'conversation',
	id: ConversationId,
	conversationId?: ConversationId,
	representativeMessageId: number,
	subject: string,
	preview: string,
	participants: ConversationParticipant[],
	lastActivityAt: string,
	messageCount: number,
	unreadCount: number,
	hasDraft: boolean,
	matchedCount: number,
	availableActions: string[],
	incomplete: boolean,
	retryAvailable: boolean,
	version: string,
};

declare type ConversationError = {
	code: string,
	message?: string,
};

declare type ConversationsSliceState = {
	ids: ConversationId[],
	entities: Record<ConversationId, ConversationSummary>,
	contextKey: string | null,
	grouped: boolean,
	nextCursor: string | null,
	settings: ConversationSettings,
	expandedIds: ConversationId[],
	childIdsByConversation: Record<ConversationId, string[]>,
	cursorByConversation: Record<ConversationId, string | null>,
	loadingByConversation: Record<ConversationId, boolean>,
	errorByConversation: Record<ConversationId, ConversationError | null>,
	incompleteByConversation: Record<ConversationId, boolean>,
	retryAvailableByConversation: Record<ConversationId, boolean>,
	remainingCountByConversation: Record<ConversationId, number>,
	childRecordsByConversation: Record<ConversationId, Record<string, ConversationChildRecord>>,
};

/**
 * Identity of the grid page the conversation state belongs to.
 */
declare type ConversationContext = {
	mailboxId?: number | null,
	folderPath?: string | null,
	virtualFolderKey?: string | null,
	filterParams?: Record<string, string | string[]>,
	sort?: { field?: string, direction?: string },
	grouped?: boolean,
	settings?: ConversationSettings,
};

declare type ConversationSelectors = {
	selectAll: (state: object) => ConversationSummary[],
	selectById: (state: object, conversationId: ConversationId) => ConversationSummary | null,
	selectEntities: (state: object) => Record<ConversationId, ConversationSummary>,
	selectIds: (state: object) => ConversationId[],
	selectTotal: (state: object) => number,
	selectContextKey: (state: object) => string | null,
	selectIsGrouped: (state: object) => boolean,
	selectNextCursor: (state: object) => string | null,
	selectSettings: (state: object) => ConversationSettings,
	selectExpandedIds: (state: object) => ConversationId[],
	selectIsConversationExpanded: (state: object, conversationId: ConversationId) => boolean,
	selectConversationChildren: (state: object, conversationId: ConversationId) => string[],
	selectConversationCursor: (state: object, conversationId: ConversationId) => string | null,
	selectConversationRemainingCount: (state: object, conversationId: ConversationId) => number,
	selectConversationChildRecord: (state: object, conversationId: ConversationId, childId: string) => ConversationChildRecord | null,
	selectConversationError: (state: object, conversationId: ConversationId) => ConversationError | null,
	selectConversationLoading: (state: object, conversationId: ConversationId) => boolean,
	selectConversationIncomplete: (state: object, conversationId: ConversationId) => boolean,
	selectConversationRetryAvailable: (state: object, conversationId: ConversationId) => boolean,
};
