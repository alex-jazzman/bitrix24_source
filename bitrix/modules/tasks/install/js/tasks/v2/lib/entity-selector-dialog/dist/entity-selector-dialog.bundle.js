/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports,ui_entitySelector) {
	'use strict';

	var _inIds = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("inIds");
	class EntitySelectorDialog extends ui_entitySelector.Dialog {
	  constructor(dialogOptions) {
	    var _dialogOptions$height;
	    const minHeight = 280;
	    const minTagSelectorHeight = 34;
	    const options = {
	      tagSelectorOptions: {
	        maxHeight: minTagSelectorHeight * 2
	      },
	      ...dialogOptions,
	      height: Math.max(minHeight, (_dialogOptions$height = dialogOptions.height) != null ? _dialogOptions$height : window.innerHeight / 2 - minTagSelectorHeight)
	    };
	    super(options);
	    Object.defineProperty(this, _inIds, {
	      value: _inIds2
	    });
	  }
	  showTo(targetNode) {
	    this.getPopup();
	    this.setTargetNode(targetNode);
	    this.show();
	  }
	  selectItemsByIds(items) {
	    this.getItems().forEach(item => {
	      const isSelected = babelHelpers.classPrivateFieldLooseBase(this, _inIds)[_inIds](item, items);
	      if (!item.isSelected() && isSelected) {
	        item.select(true);
	      }
	      if (item.isSelected() && !isSelected) {
	        item.deselect(true);
	      }
	    });
	  }
	  getItemsByIds(items) {
	    return this.getItems().filter(item => babelHelpers.classPrivateFieldLooseBase(this, _inIds)[_inIds](item, items));
	  }
	}
	function _inIds2(item, items) {
	  const itemId = [item.getEntityId(), item.getId()];
	  return items.some(it => itemId[0] === it[0] && itemId[1] === it[1]);
	}

	exports.EntitySelectorDialog = EntitySelectorDialog;

}((this.BX.Tasks.V2.Lib = this.BX.Tasks.V2.Lib || {}),BX.UI.EntitySelector));
//# sourceMappingURL=entity-selector-dialog.bundle.js.map
