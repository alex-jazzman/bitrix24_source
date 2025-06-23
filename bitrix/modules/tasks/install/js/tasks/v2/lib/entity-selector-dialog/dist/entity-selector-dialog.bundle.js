/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports,ui_entitySelector) {
	'use strict';

	var _isSelectProgrammatically = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isSelectProgrammatically");
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
	      height: Math.max(minHeight, (_dialogOptions$height = dialogOptions.height) != null ? _dialogOptions$height : window.innerHeight / 2 - minTagSelectorHeight),
	      events: {
	        ...dialogOptions.events,
	        'Item:onSelect': () => {
	          var _dialogOptions$events, _dialogOptions$events2;
	          if (babelHelpers.classPrivateFieldLooseBase(this, _isSelectProgrammatically)[_isSelectProgrammatically]) {
	            return;
	          }
	          (_dialogOptions$events = dialogOptions.events) == null ? void 0 : (_dialogOptions$events2 = _dialogOptions$events['Item:onSelect']) == null ? void 0 : _dialogOptions$events2.call(_dialogOptions$events);
	        },
	        'Item:onDeselect': () => {
	          var _dialogOptions$events3, _dialogOptions$events4;
	          if (babelHelpers.classPrivateFieldLooseBase(this, _isSelectProgrammatically)[_isSelectProgrammatically]) {
	            return;
	          }
	          (_dialogOptions$events3 = dialogOptions.events) == null ? void 0 : (_dialogOptions$events4 = _dialogOptions$events3['Item:onDeselect']) == null ? void 0 : _dialogOptions$events4.call(_dialogOptions$events3);
	        }
	      }
	    };
	    super(options);
	    Object.defineProperty(this, _inIds, {
	      value: _inIds2
	    });
	    Object.defineProperty(this, _isSelectProgrammatically, {
	      writable: true,
	      value: false
	    });
	  }
	  showTo(targetNode) {
	    this.getPopup();
	    this.setTargetNode(targetNode);
	    this.show();
	  }
	  selectItemsByIds(items) {
	    babelHelpers.classPrivateFieldLooseBase(this, _isSelectProgrammatically)[_isSelectProgrammatically] = true;
	    this.getItems().forEach(item => {
	      const isSelected = babelHelpers.classPrivateFieldLooseBase(this, _inIds)[_inIds](item, items);
	      if (!item.isSelected() && isSelected) {
	        item.select();
	      }
	      if (item.isSelected() && !isSelected) {
	        item.deselect();
	      }
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _isSelectProgrammatically)[_isSelectProgrammatically] = false;
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
