/* eslint-disable */
type FloatingNodePanelButton = {
	id: string;
	iconClass: string;
	title: string;
	onClick: (event: MouseEvent) => void;
};

type FloatingNodePanelOptions = {
	buttons: FloatingNodePanelButton[];
};

declare namespace BX.Landing.UI.Panel {
	/**
	 * Universal floating panel attached to an editable node.
	 *
	 * Shows itself in the top right corner of the target node on `mouseenter`
	 * and hides immediately on `mouseleave`. Moving the cursor between the node
	 * and the panel does not hide it: `mouseleave` is ignored when
	 * `event.relatedTarget` is inside the panel or the node. The same handlers
	 * back `focusin`/`focusout`, so the panel is fully reachable by keyboard:
	 * focusing the node (made focusable on attach) shows it and, when the focus
	 * came from the keyboard, moves focus onto the panel button.
	 * A shown panel is also dismissable with the Escape key (WCAG 1.4.13).
	 *
	 * The panel knows nothing about node types: buttons (icon + click handler)
	 * are fully provided by the caller.
	 *
	 * Lifecycle: the owner of the panel is responsible for calling `detach()`
	 * when the target node leaves the DOM (e.g. `Img.destroyFloatingPanel()`
	 * detaches on the `BX.Landing.Block:remove` custom event, fired on block
	 * remove and reload/undo/redo). Without `detach()` the panel layout stays
	 * in the body and retains the target node subtree.
	 *
	 * @memberOf BX.Landing.UI.Panel
	 */
	class FloatingNodePanel extends BX.Landing.UI.Panel.BasePanel {
		constructor(options: FloatingNodePanelOptions);
		/**
		 * Binds the panel to the target node: the panel is appended to the node's
		 * document and starts to show/hide on the node hover.
		 */
		attach(targetNode: HTMLElement): void;
		/**
		 * Removes hover listeners from the current target node
		 * and removes the panel layout from the DOM.
		 */
		detach(): void;
		show(): Promise<any>;
		hide(): Promise<any>;
	}
}
