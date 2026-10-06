/* eslint-disable */
type LandingNodeBase = {
	node: HTMLElement;
	selector: string;
	getBlock: () => {
		id: number;
	} | null;
};

declare namespace BX.Landing.Copilot {
	/**
	 * Selection of AI-site targets in the editor: base-feature nodes
	 * (text/link/img), icons, LCA element groups and the whole block.
	 * Tracks hover with a search highlight frame, toggles the selected
	 * frame on click and publishes the selection (block id, selector,
	 * fingerprint) to the CoPilot PageContext.
	 * @memberOf BX.Landing.Copilot
	 */
	class ElementPicker {
		static instance: ElementPicker | null;
		static getInstance(): ElementPicker;
		static isEnabled(): boolean;
		activate(): void;
		/**
		 * Toggles single-element selection for the node (BX.Landing.Node.*):
		 * a repeated toggle of the same element clears the selection,
		 * a different element replaces the previous one. Node panels keep
		 * calling this public entry; internally the node becomes a target.
		 */
		toggleSelection(node: LandingNodeBase): void;
		clearSelection(): void;
	}
}
