/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports, ui_entitySelector) {
	'use strict';

	class EntitySelectorDialog extends ui_entitySelector.Dialog {
		constructor(dialogOptions) {
			const minHeight = 280;
			const minTagSelectorHeight = 34;
			const options = {
				tagSelectorOptions: {
					maxHeight: minTagSelectorHeight * 2,
					textBoxWidth: '50%'
				},
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
			return items.some(it => itemId[0] === it[0] && itemId[1] === it[1]);
		}
	}

	exports.Item = ui_entitySelector.Item;
	exports.EntitySelectorDialog = EntitySelectorDialog;

})(this.BX.Tasks.V2.Lib = this.BX.Tasks.V2.Lib || {}, BX.UI.EntitySelector);
//# sourceMappingURL=entity-selector-dialog.bundle.js.map
