/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports,main_popup,tasks_v2_core,tasks_v2_const,tasks_v2_lib_entitySelectorDialog) {
	'use strict';

	var _ids, _selectableIds, _onSelect, _onDeselect, _onClose, _isMultiple, _withAngle, _enableSearch, _hidePromise, _shouldRecreateDialog, _createDialog, _fillDialog, _fillStore, _setSelectableByIds, _items, _mapIdsToItemIds;
	let dialog = null;
	const usersDialog = new (_ids = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("ids"), _selectableIds = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("selectableIds"), _onSelect = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onSelect"), _onDeselect = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onDeselect"), _onClose = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onClose"), _isMultiple = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isMultiple"), _withAngle = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("withAngle"), _enableSearch = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("enableSearch"), _hidePromise = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("hidePromise"), _shouldRecreateDialog = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("shouldRecreateDialog"), _createDialog = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createDialog"), _fillDialog = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("fillDialog"), _fillStore = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("fillStore"), _setSelectableByIds = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setSelectableByIds"), _items = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("items"), _mapIdsToItemIds = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("mapIdsToItemIds"), class {
	  constructor() {
	    Object.defineProperty(this, _mapIdsToItemIds, {
	      value: _mapIdsToItemIds2
	    });
	    Object.defineProperty(this, _items, {
	      get: _get_items,
	      set: void 0
	    });
	    Object.defineProperty(this, _setSelectableByIds, {
	      value: _setSelectableByIds2
	    });
	    Object.defineProperty(this, _fillStore, {
	      value: _fillStore2
	    });
	    Object.defineProperty(this, _fillDialog, {
	      value: _fillDialog2
	    });
	    Object.defineProperty(this, _createDialog, {
	      value: _createDialog2
	    });
	    Object.defineProperty(this, _shouldRecreateDialog, {
	      value: _shouldRecreateDialog2
	    });
	    Object.defineProperty(this, _ids, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _selectableIds, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _onSelect, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _onDeselect, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _onClose, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _isMultiple, {
	      writable: true,
	      value: true
	    });
	    Object.defineProperty(this, _withAngle, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _enableSearch, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _hidePromise, {
	      writable: true,
	      value: void 0
	    });
	  }
	  async show(params) {
	    var _dialog, _params$withAngle, _params$isMultiple, _params$enableSearch, _dialog2;
	    if ((_dialog = dialog) != null && _dialog.isOpen() && dialog.getTargetNode() !== params.targetNode) {
	      babelHelpers.classPrivateFieldLooseBase(this, _hidePromise)[_hidePromise] = new Resolvable();
	      await babelHelpers.classPrivateFieldLooseBase(this, _hidePromise)[_hidePromise];
	    }
	    if (babelHelpers.classPrivateFieldLooseBase(this, _shouldRecreateDialog)[_shouldRecreateDialog](params)) {
	      dialog.destroy();
	      dialog = null;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _ids)[_ids] = params.ids;
	    babelHelpers.classPrivateFieldLooseBase(this, _selectableIds)[_selectableIds] = params.selectableIds;
	    babelHelpers.classPrivateFieldLooseBase(this, _onClose)[_onClose] = params.onClose;
	    babelHelpers.classPrivateFieldLooseBase(this, _onSelect)[_onSelect] = params.onSelect;
	    babelHelpers.classPrivateFieldLooseBase(this, _onDeselect)[_onDeselect] = params.onDeselect;
	    babelHelpers.classPrivateFieldLooseBase(this, _withAngle)[_withAngle] = (_params$withAngle = params.withAngle) != null ? _params$withAngle : true;
	    babelHelpers.classPrivateFieldLooseBase(this, _isMultiple)[_isMultiple] = (_params$isMultiple = params.isMultiple) != null ? _params$isMultiple : true;
	    babelHelpers.classPrivateFieldLooseBase(this, _enableSearch)[_enableSearch] = (_params$enableSearch = params.enableSearch) != null ? _params$enableSearch : true;
	    (_dialog2 = dialog) != null ? _dialog2 : dialog = babelHelpers.classPrivateFieldLooseBase(this, _createDialog)[_createDialog]();
	    babelHelpers.classPrivateFieldLooseBase(this, _fillDialog)[_fillDialog](babelHelpers.classPrivateFieldLooseBase(this, _ids)[_ids]);
	    dialog.selectItemsByIds(babelHelpers.classPrivateFieldLooseBase(this, _items)[_items]);
	    babelHelpers.classPrivateFieldLooseBase(this, _setSelectableByIds)[_setSelectableByIds]();
	    dialog.showTo(params.targetNode);
	  }
	  getDialog() {
	    return dialog;
	  }
	})();
	function _shouldRecreateDialog2(params) {
	  var _params$isMultiple2, _params$enableSearch2, _params$withAngle2;
	  if (dialog === null) {
	    return false;
	  }
	  return babelHelpers.classPrivateFieldLooseBase(this, _isMultiple)[_isMultiple] !== ((_params$isMultiple2 = params.isMultiple) != null ? _params$isMultiple2 : true) || babelHelpers.classPrivateFieldLooseBase(this, _enableSearch)[_enableSearch] !== ((_params$enableSearch2 = params.enableSearch) != null ? _params$enableSearch2 : true) || babelHelpers.classPrivateFieldLooseBase(this, _withAngle)[_withAngle] !== ((_params$withAngle2 = params.withAngle) != null ? _params$withAngle2 : true);
	}
	function _createDialog2() {
	  const restrictions = tasks_v2_core.Core.getParams().restrictions;
	  return new tasks_v2_lib_entitySelectorDialog.EntitySelectorDialog({
	    context: 'tasks-card',
	    enableSearch: babelHelpers.classPrivateFieldLooseBase(this, _enableSearch)[_enableSearch],
	    entities: [{
	      id: tasks_v2_const.EntitySelectorEntity.User,
	      options: {
	        emailUsers: true,
	        inviteGuestLink: true,
	        analyticsSource: 'tasks',
	        lockGuestLink: !restrictions.mailUserIntegration.available,
	        lockGuestLinkFeatureId: restrictions.mailUserIntegration.featureId
	      }
	    }, {
	      id: tasks_v2_const.EntitySelectorEntity.Department
	    }],
	    preselectedItems: babelHelpers.classPrivateFieldLooseBase(this, _items)[_items],
	    events: {
	      'Item:onSelect': event => {
	        const {
	          item
	        } = event.getData();
	        if (babelHelpers.classPrivateFieldLooseBase(this, _onSelect)[_onSelect]) {
	          babelHelpers.classPrivateFieldLooseBase(this, _onSelect)[_onSelect](item.getId());
	        }
	        if (babelHelpers.classPrivateFieldLooseBase(this, _isMultiple)[_isMultiple]) {
	          return;
	        }
	        dialog.selectItemsByIds(babelHelpers.classPrivateFieldLooseBase(this, _mapIdsToItemIds)[_mapIdsToItemIds]([item.getId()]));
	        dialog.hide();
	      },
	      'Item:onDeselect': event => {
	        if (babelHelpers.classPrivateFieldLooseBase(this, _onDeselect)[_onDeselect]) {
	          const {
	            item
	          } = event.getData();
	          babelHelpers.classPrivateFieldLooseBase(this, _onDeselect)[_onDeselect](item.getId());
	        }
	      },
	      onLoad: () => {
	        babelHelpers.classPrivateFieldLooseBase(this, _fillStore)[_fillStore]();
	        babelHelpers.classPrivateFieldLooseBase(this, _setSelectableByIds)[_setSelectableByIds]();
	      },
	      onHide: () => {
	        var _babelHelpers$classPr;
	        return (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _hidePromise)[_hidePromise]) == null ? void 0 : _babelHelpers$classPr.resolve();
	      }
	    },
	    popupOptions: {
	      events: {
	        onShow: baseEvent => {
	          const popup = baseEvent.getTarget();
	          if (!babelHelpers.classPrivateFieldLooseBase(this, _withAngle)[_withAngle]) {
	            popup.setAngle(false);
	            popup.setOffset({
	              offsetLeft: 0
	            });
	            return;
	          }
	          const popupWidth = popup.getPopupContainer().offsetWidth;
	          const targetNodeWidth = 10;
	          const offsetLeft = targetNodeWidth - popupWidth / 2;
	          const angleShift = main_popup.Popup.getOption('angleLeftOffset') - main_popup.Popup.getOption('angleMinTop');
	          popup.setAngle({
	            offset: popupWidth / 2 - angleShift
	          });
	          popup.setOffset({
	            offsetLeft: offsetLeft + main_popup.Popup.getOption('angleLeftOffset')
	          });
	        },
	        onClose: () => {
	          var _babelHelpers$classPr2, _babelHelpers$classPr3;
	          babelHelpers.classPrivateFieldLooseBase(this, _fillStore)[_fillStore]();
	          const ids = dialog.getSelectedItems().map(item => item.getId());
	          (_babelHelpers$classPr2 = (_babelHelpers$classPr3 = babelHelpers.classPrivateFieldLooseBase(this, _onClose))[_onClose]) == null ? void 0 : _babelHelpers$classPr2.call(_babelHelpers$classPr3, ids);
	        }
	      }
	    }
	  });
	}
	function _fillDialog2(ids) {
	  if (!dialog || !dialog.isLoaded()) {
	    return;
	  }
	  const itemIds = new Set(dialog.getItems().map(it => it.getId()));
	  ids.filter(id => !itemIds.has(id)).forEach(id => {
	    const user = tasks_v2_core.Core.getStore().getters[`${tasks_v2_const.Model.Users}/getById`](id);
	    dialog.addItem({
	      id,
	      entityId: tasks_v2_const.EntitySelectorEntity.User,
	      entityType: user.type,
	      title: user.name,
	      avatar: user.image,
	      tabs: ['recents']
	    });
	  });
	}
	function _fillStore2() {
	  const users = dialog.getSelectedItems().map(item => ({
	    id: item.getId(),
	    name: item.getTitle(),
	    image: item.getAvatar(),
	    type: item.getEntityType()
	  }));
	  void tasks_v2_core.Core.getStore().dispatch(`${tasks_v2_const.Model.Users}/upsertMany`, users);
	}
	function _setSelectableByIds2() {
	  const selectableIds = dialog.getItems().map(item => item.getId());
	  const unselectableIds = babelHelpers.classPrivateFieldLooseBase(this, _ids)[_ids].filter(id => {
	    var _babelHelpers$classPr4;
	    return babelHelpers.classPrivateFieldLooseBase(this, _selectableIds)[_selectableIds] && !((_babelHelpers$classPr4 = babelHelpers.classPrivateFieldLooseBase(this, _selectableIds)[_selectableIds]) != null && _babelHelpers$classPr4.has(id));
	  });
	  dialog.setSelectableByIds({
	    selectable: babelHelpers.classPrivateFieldLooseBase(this, _mapIdsToItemIds)[_mapIdsToItemIds](selectableIds),
	    unselectable: babelHelpers.classPrivateFieldLooseBase(this, _mapIdsToItemIds)[_mapIdsToItemIds](unselectableIds)
	  });
	}
	function _get_items() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _mapIdsToItemIds)[_mapIdsToItemIds](babelHelpers.classPrivateFieldLooseBase(this, _ids)[_ids]);
	}
	function _mapIdsToItemIds2(ids) {
	  return ids.map(id => [tasks_v2_const.EntitySelectorEntity.User, id]);
	}
	function Resolvable() {
	  let resolve = null;
	  const promise = new Promise(res => {
	    resolve = res;
	  });
	  promise.resolve = resolve;
	  return promise;
	}

	exports.usersDialog = usersDialog;

}((this.BX.Tasks.V2.Lib = this.BX.Tasks.V2.Lib || {}),BX.Main,BX.Tasks.V2,BX.Tasks.V2.Const,BX.Tasks.V2.Lib));
//# sourceMappingURL=user-selector-dialog.bundle.js.map
