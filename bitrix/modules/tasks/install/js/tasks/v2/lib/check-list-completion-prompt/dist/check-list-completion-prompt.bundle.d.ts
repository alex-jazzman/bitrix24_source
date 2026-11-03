/* eslint-disable */
type DialogFactory = (options: PromptDialogOptions) => PromptDialog | Promise<PromptDialog>;

type PromptDialogOptions = {
	snapshot: CheckListCompletionSnapshot;
	onComplete: () => Promise<void> | void;
	onReturn?: () => void;
	onCancel: () => void;
	onClosed?: () => void;
	presentation?: CompletionPromptPresentation;
};

type CheckListCompletionSnapshot = Readonly<{
	groups: ReadonlyArray<CheckListCompletionGroup>;
	incompleteIds: ReadonlyArray<number>;
	firstIncompleteId: number | null;
}>;

type CheckListCompletionGroup = Readonly<{
	id: number;
	title: string;
	completedCount: number;
	totalCount: number;
	items: ReadonlyArray<CheckListCompletionItem>;
}>;

type CheckListCompletionItem = Readonly<{
	id: number;
	rootId: number;
	title: string;
	depth: number;
	isContext: boolean;
}>;

type CompletionPromptPresentation = Readonly<{
	title?: string;
	titleLink?: CompletionPromptTitleLink;
	subtitle?: string;
	completeButtonText?: string;
	returnButtonText?: string;
}>;

type CompletionPromptTitleLink = Readonly<{
	text: string;
	onClick: () => void;
}>;

type PromptDialog = {
	show: () => void;
	close: () => void;
	setLoading: (loading: boolean) => void;
	setError: () => void;
};

type CompletionActions = {
	complete: () => Promise<unknown | null>;
	completeWithChecklist: () => Promise<unknown | null>;
};

type CompletionPromptOptions = Readonly<{
	presentation?: CompletionPromptPresentation;
	beforeComplete?: () => Promise<boolean>;
}>;

type CompletionResult = Readonly<{
	state: CompletionState;
	error: unknown | null;
	snapshot: CheckListCompletionSnapshot | null;
}>;

type CompletionState = (typeof BX.Tasks.V2.Lib.CompletionStates)[keyof typeof BX.Tasks.V2.Lib.CompletionStates];

type CheckListCompletionSourceItem = {
	id: number | string;
	parentId?: number | string | null;
	title?: string | null;
	isComplete?: boolean | null;
	sortIndex?: number | string | null;
};

type PromptDialogState = {
	loading: boolean;
	error: boolean;
};

declare namespace BX.Tasks.V2.Lib {
	const checkListCompletionPromptRunner: CheckListCompletionPromptRunner;

	class CheckListCompletionPromptRunner {
		constructor(createDialog?: DialogFactory);
		runForTask(taskId: number, actions: CompletionActions, options?: CompletionPromptOptions): Promise<CompletionResult>;
		run(snapshot: CheckListCompletionSnapshot, actions: CompletionActions, options?: CompletionPromptOptions): Promise<CompletionResult>;
	}

	const CompletionStates: Readonly<{
		readonly Success: "success";
		readonly Returned: "returned";
		readonly Cancelled: "cancelled";
		readonly Failed: "failed";
	}>;

	function buildCompletionSnapshot(source: ReadonlyArray<CheckListCompletionSourceItem>): CheckListCompletionSnapshot;
}
