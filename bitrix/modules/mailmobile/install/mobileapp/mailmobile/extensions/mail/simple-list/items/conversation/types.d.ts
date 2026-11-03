/**
 * Localized labels the dependency-free view model receives instead of requiring Loc.
 */
declare type ConversationRowLabels = {
	emptySubject?: string,
	noParticipants?: string,
};

/**
 * Collapsed conversation row derived from a DTO-01 summary.
 */
declare type ConversationRowViewModel = {
	id: string,
	testId: string,
	expandTestId: string,
	subject: string,
	participants: string,
	avatarName: string,
	avatarEmail: string,
	preview: string,
	timestamp: number,
	messageCount: number,
	isChain: boolean,
	hasUnread: boolean,
	unreadCount: number,
	hasDraft: boolean,
	incomplete: boolean,
	retryAvailable: boolean,
	showRetry: boolean,
	availableActions: string[],
	representativeMessageId: number,
};

declare type ConversationContentProps = {
	id: ConversationId,
	item?: ConversationSummary | null,
	isExpanded?: boolean,
	itemDetailOpenHandler?: (id: string) => void,
	onToggleExpand?: (id: string) => void,
	onRetry?: (id: string) => void,
	onLongClick?: () => void,
};

declare type ConversationItemsProps = {
	id: ConversationId,
	isExpanded?: boolean,
	childIds?: string[],
	records?: Record<string, ConversationChildRecord>,
	cursor?: string | null,
	loading?: boolean,
	incomplete?: boolean,
	retryAvailable?: boolean,
	remainingCount?: number,
	folderNamesByPath?: Record<string, string>,
	isMultiSelectMode?: boolean,
	selectedIds?: number[],
	itemDetailOpenHandler?: (id: string) => void,
	onLoadMore?: (id: string) => void,
	onRetry?: (id: string) => void,
};
