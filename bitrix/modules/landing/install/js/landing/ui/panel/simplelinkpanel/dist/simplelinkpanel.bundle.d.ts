/* eslint-disable */
type SimpleLinkPanelOptions = {
	href?: string;
	onSave?: (url: string) => void;
	onRemove?: () => void;
	onAiSelect?: () => void;
};

declare namespace BX.Landing.UI.Panel {
	/**
	 * Lightweight floating inline panel for editing a link URL.
	 *
	 * Renders a single row (URL input + Save button), positions itself next to
	 * the given anchor element and returns the result through callbacks. It knows
	 * nothing about the link node or the selection: only the anchor, the initial
	 * value and the callbacks.
	 *
	 * Singleton: only one panel exists at a time (`getInstance()`); a repeated
	 * `show()` re-targets it to the new anchor. The layout is appended to the
	 * anchor's own document, so inside an editor iframe the panel is placed and
	 * positioned in the right document.
	 *
	 * @memberOf BX.Landing.UI.Panel
	 */
	class SimpleLinkPanel {
		static getInstance(): SimpleLinkPanel;
		constructor();
		/**
		 * Shows the panel next to the anchor and configures its callbacks.
		 * A repeated call re-targets the single panel to the new anchor.
		 */
		show(anchorEl: HTMLElement, options?: SimpleLinkPanelOptions): void;
		hide(): void;
		isShown(): boolean;
	}
}
