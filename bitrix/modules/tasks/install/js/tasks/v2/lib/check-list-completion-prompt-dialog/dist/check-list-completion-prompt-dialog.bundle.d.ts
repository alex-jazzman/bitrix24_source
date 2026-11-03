/* eslint-disable */
declare namespace BX.Tasks.V2.Lib {
	class CheckListCompletionPromptDialog {
		constructor({ snapshot, onComplete, onReturn, onCancel, onClosed, presentation }: BX.Tasks.V2.Lib.PromptDialogOptions);
		show(): void;
		close(): void;
		setLoading(loading: boolean): void;
		setError(): void;
		cancel(): void;
		returnToTask(onAfterClose?: () => void): void;
	}
}
