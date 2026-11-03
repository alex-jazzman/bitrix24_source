import { CompletionStates } from './const';

export type CheckListCompletionSourceItem = {
	id: number | string,
	parentId?: number | string | null,
	title?: string | null,
	isComplete?: boolean | null,
	sortIndex?: number | string | null,
};

export type CheckListCompletionItem = Readonly<{
	id: number,
	rootId: number,
	title: string,
	depth: number,
	isContext: boolean,
}>;

export type CheckListCompletionGroup = Readonly<{
	id: number,
	title: string,
	completedCount: number,
	totalCount: number,
	items: ReadonlyArray<CheckListCompletionItem>,
}>;

export type CheckListCompletionSnapshot = Readonly<{
	groups: ReadonlyArray<CheckListCompletionGroup>,
	incompleteIds: ReadonlyArray<number>,
	firstIncompleteId: number | null,
}>;

export type CompletionActions = {
	complete: () => Promise<unknown | null>,
	completeWithChecklist: () => Promise<unknown | null>,
};

export type CompletionPromptTitleLink = Readonly<{
	text: string,
	onClick: () => void,
}>;

export type CompletionPromptPresentation = Readonly<{
	title?: string,
	titleLink?: CompletionPromptTitleLink,
	subtitle?: string,
	completeButtonText?: string,
	returnButtonText?: string,
}>;

export type CompletionPromptOptions = Readonly<{
	presentation?: CompletionPromptPresentation,
	beforeComplete?: () => Promise<boolean>,
}>;

export type CompletionState = (typeof CompletionStates)[keyof typeof CompletionStates];

export type CompletionResult = Readonly<{
	state: CompletionState,
	error: unknown | null,
	snapshot: CheckListCompletionSnapshot | null,
}>;

export type PromptDialogState = {
	loading: boolean,
	error: boolean,
};

export type PromptDialogOptions = {
	snapshot: CheckListCompletionSnapshot,
	onComplete: () => Promise<void> | void,
	onReturn?: () => void,
	onCancel: () => void,
	onClosed?: () => void,
	presentation?: CompletionPromptPresentation,
};
