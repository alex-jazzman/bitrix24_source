/* eslint-disable */
type CallWindowNameSources = {
	entity?: CallWindowNameEntity | null;
	preparedCall?: PreparedCallSource | null;
};

type CallWindowNameEntity = {
	name?: string;
	advanced?: {
		chatType?: string;
	};
};

type PreparedCallSource = {
	user?: number | string | null;
	userData?: {
		[userId: string]: {
			name?: string;
		} | null;
	} | null;
};

type CallWindowName = {
	name: string;
	type: BX.Call.Lib.ViewContract.CallWindowNameTypeValue;
};

type WindowFocusScopeOptions = {
	scheduler?: FocusScheduler;
};

type FocusScheduler = {
	schedule: (callback: () => void) => number;
	cancel: (handle: number) => void;
};

type FocusWindowOptions = {
	force?: boolean;
};

declare namespace BX.Call.Lib {
	/**
	 * Names the call window from the first source that has a name. The call is authoritative; the
	 * prepared start only stands in for it while the window is already shown and the call is not
	 * created yet, and it never describes anything but a private call.
	 */
	function resolveCallWindowName(sources: CallWindowNameSources): CallWindowName | null;

	/**
	 * Conference is a special case of a group call, so it is matched first. Only the private type is
	 * recognised by name: a call from any other kind of chat (collab, task, CRM...) stays a group call.
	 */
	function resolveCallWindowNameType(entity: CallWindowNameEntity | null): BX.Call.Lib.ViewContract.CallWindowNameTypeValue;

	/**
	 * Owns the focus state of the call window: who opened it, when focus enters it and where focus goes
	 * back on close. Passive by design: it subscribes to nothing, gets the root as an argument and knows
	 * nothing about the window markup.
	 */
	class WindowFocusScope {
		constructor(options?: WindowFocusScopeOptions);
		/**
		 * Captured once per window lifetime: a repeated call keeps the first live opener, so a re-show
		 * or an unfold cannot overwrite it.
		 */
		captureOpener(candidate: HTMLElement | null): void;
		focusWindow(root: HTMLElement | null, options?: FocusWindowOptions): void;
		/**
		 * Runs while the root is still in the document, for a window that is being closed. Focus sitting
		 * outside the window is left where it is; focus of our own goes back to the captured opener,
		 * which is consumed here.
		 *
		 * @returns true when the caller must run restoreAfterDetach() once the root is out of the
		 *          document: the focus was ours and the addressed restore did not settle it.
		 */
		restoreBeforeDetach(root: HTMLElement | null): boolean;
		/**
		 * Runs while the root is still in the document, for a window that is being folded away rather
		 * than closed. Yields exactly like restoreBeforeDetach: focus sitting outside the window is left
		 * where it is. Unlike restoreBeforeDetach it keeps the captured opener (the window lives on and
		 * still needs it to return focus when the call ends) and never restores focus by itself.
		 *
		 * @returns true when the caller must run restoreAfterDetach() once the root is out of the
		 *          document: the focus was ours and nothing here moved it.
		 */
		releaseBeforeDetach(root: HTMLElement | null): boolean;
		/**
		 * Runs only after the root left the document (see ALG-02): while it is still there the history
		 * resolves to a node inside the dying window, the root itself included.
		 */
		restoreAfterDetach(): void;
		destroy(): void;
	}
}
