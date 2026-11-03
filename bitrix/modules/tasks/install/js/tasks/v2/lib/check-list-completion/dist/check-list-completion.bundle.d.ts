/* eslint-disable */
type CompletionRunOptions = {
	taskId: number;
	complete: () => Promise<unknown | null>;
	completeWithChecklist: () => Promise<unknown | null>;
	beforeComplete?: () => Promise<boolean>;
};

declare namespace BX.Tasks.V2.Lib {
	const checkListCompletionService: CheckListCompletionService;

	class CheckListCompletionService {
		run(options: CompletionRunOptions): Promise<BX.Tasks.V2.Lib.CompletionResult>;
	}

	function isCompletionSuccessful(result: BX.Tasks.V2.Lib.CompletionResult): boolean;
}
