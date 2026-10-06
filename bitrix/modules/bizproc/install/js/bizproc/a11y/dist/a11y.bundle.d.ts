/* eslint-disable */
type DialogOptions = {
	label?: string;
	restoreTo?: BX.UI.Accessibility.RestoreFocus;
	looped?: boolean;
};

type DialogHandle = {
	destroy: () => void;
};

type AnnounceOptions = {
	assertive?: boolean;
	inTopWindow?: boolean;
};

type LabelFormControlsOptions = {
	blockSelector: string;
	labelSelector: string;
	contentSelector?: string;
	controlSelector?: string;
};

type InvalidControl = {
	name: string;
	messageId?: string | null;
};

type InvalidControlsOptions = {
	controlSelector?: string;
};

type EnhanceGridOptions = {
	gridId?: string;
	rowActionsLabel?: string;
	checkboxesFromTitle?: boolean;
	columnLabels?: {
		[dataName: string]: string;
	};
	toggles?: GridToggleOptions[];
};

type GridToggleOptions = {
	selector: string;
	label: string;
	activeClass?: string;
};

type GridSubscription = {
	destroy: () => void;
};

declare namespace BX.Bizproc.A11y {
	function setupDialog(container: HTMLElement, options?: DialogOptions): DialogHandle;

	function setBusy(container: HTMLElement, isBusy: boolean): void;

	function announce(message: string, options?: AnnounceOptions): void;

	function makeActivatable(element: HTMLElement, handler: (event: MouseEvent) => void): void;

	function visuallyHidden(text: string): HTMLElement;

	function labelFormControls(root: HTMLElement, options: LabelFormControlsOptions): void;

	/**
	 * Marks controls of the given fields as invalid and binds each of them to its error message.
	 * Returns the first marked control so the caller can move the focus to it.
	 */
	function markInvalidControls(root: HTMLElement, fields: InvalidControl[], options?: InvalidControlsOptions): HTMLElement | null;

	function clearInvalidControls(root: HTMLElement, options?: InvalidControlsOptions): void;

	/**
	 * Fallback for errors that came without a field key: the first required control left empty.
	 */
	function findUnfilledRequiredControl(root: HTMLElement, options?: InvalidControlsOptions): HTMLElement | null;

	function enhanceGrid(container: HTMLElement, options?: EnhanceGridOptions): void;

	function subscribeGridUpdated(gridId: string, handler: () => void): GridSubscription;
}
