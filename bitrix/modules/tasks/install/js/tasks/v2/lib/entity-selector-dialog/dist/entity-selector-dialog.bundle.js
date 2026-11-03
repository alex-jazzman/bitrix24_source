/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports, ui_entitySelector) {
	'use strict';

	const SELECTOR_DIALOG_CLASS = '.ui-selector-dialog';

	/**
	 * Returns focus to the element that opened the selector, but only when the selector
	 * took the focus with it. The popup fires onClose on any close, including auto-hide
	 * on an outside click: by then the browser has already moved focus to whatever the
	 * user clicked, and pulling it back would type into the wrong field.
	 */
	function restoreOpenerFocus(opener) {
		if (isFocusLost()) {
			opener?.focus?.();
		}
	}

	/**
	 * Tells whether the focus belongs to nobody: it sits on the body, on nothing, on a node that
	 * has left the document, or inside a selector dialog that is closing (the popup is still on
	 * screen while onClose runs, so in the keyboard flow focus stays inside it). Only then may the
	 * code move the focus on its own without taking it away from the user.
	 */
	function isFocusLost() {
		const active = document.activeElement;
		return !active || active === document.body || !document.contains(active) || Boolean(active.closest?.(SELECTOR_DIALOG_CLASS));
	}

	class EntitySelectorDialog extends ui_entitySelector.Dialog {
		constructor(dialogOptions) {
			const minHeight = 280;
			const minTagSelectorHeight = 34;
			const options = {
				// height grows with the tag selector: reserve 2 extra lines of the ui.entity-selector 3-line default
				height: Math.max(minHeight, dialogOptions.height ?? window.innerHeight / 2 - minTagSelectorHeight * 2),
				...dialogOptions,
				offsetAnimation: false,
				compactView: true
			};
			super(options);
		}
		showTo(targetNode) {
			this.getPopup();
			this.setTargetNode(targetNode);
			this.getPopup().bringToFront();
			this.unfreeze();
			this.show();
		}
		selectItemsByIds(items) {
			this.getItems().forEach(item => {
				const isSelected = this.#inIds(item, items);
				if (isSelected) {
					item.select(true);
				}
				if (!isSelected) {
					item.deselect(true);
				}
			});
		}
		setSelectableByIds({
			selectable,
			unselectable
		}) {
			this.getItems().forEach(item => {
				if (this.#inIds(item, selectable)) {
					item.setDeselectable(true);
				}
				if (this.#inIds(item, unselectable)) {
					item.setDeselectable(false);
				}
			});
		}
		#inIds(item, items) {
			const itemId = [item.getEntityId(), item.getId()];
			return items.some(it => itemId[0] === it[0] && String(itemId[1]) === String(it[1]));
		}
	}

	exports.Item = ui_entitySelector.Item;
	exports.EntitySelectorDialog = EntitySelectorDialog;
	exports.isFocusLost = isFocusLost;
	exports.restoreOpenerFocus = restoreOpenerFocus;

})(this.BX.Tasks.V2.Lib = this.BX.Tasks.V2.Lib || {}, BX.UI.EntitySelector);
//# sourceMappingURL=entity-selector-dialog.bundle.js.map
