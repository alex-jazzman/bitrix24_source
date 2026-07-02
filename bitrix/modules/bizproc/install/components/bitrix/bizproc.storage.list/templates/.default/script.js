/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
(function (exports,main_core,main_core_events) {
	'use strict';

	var _gridId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("gridId");
	var _onStorageRemoveHandler = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onStorageRemoveHandler");
	var _onStorageRemove = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onStorageRemove");
	class StorageList {
	  constructor(options) {
	    var _BX$SidePanel, _BX$SidePanel$Instanc;
	    Object.defineProperty(this, _onStorageRemove, {
	      value: _onStorageRemove2
	    });
	    Object.defineProperty(this, _gridId, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _onStorageRemoveHandler, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _gridId)[_gridId] = options.gridId;
	    main_core.Runtime.loadExtension('bizproc.router').then(({
	      Router
	    }) => {
	      Router.init();
	    }).catch(e => console.error(e));
	    babelHelpers.classPrivateFieldLooseBase(this, _onStorageRemoveHandler)[_onStorageRemoveHandler] = babelHelpers.classPrivateFieldLooseBase(this, _onStorageRemove)[_onStorageRemove].bind(this);
	    top.BX.Event.EventEmitter.subscribe('BX.Bizproc.Component.StorageItemList:onStorageRemove', babelHelpers.classPrivateFieldLooseBase(this, _onStorageRemoveHandler)[_onStorageRemoveHandler]);
	    const slider = (_BX$SidePanel = BX.SidePanel) == null ? void 0 : (_BX$SidePanel$Instanc = _BX$SidePanel.Instance) == null ? void 0 : _BX$SidePanel$Instanc.getSliderByWindow(window);
	    if (slider) {
	      main_core_events.EventEmitter.subscribeOnce(slider, 'SidePanel.Slider:onDestroy', () => {
	        this.destroy();
	      });
	    }
	  }
	  destroy() {
	    top.BX.Event.EventEmitter.unsubscribe('BX.Bizproc.Component.StorageItemList:onStorageRemove', babelHelpers.classPrivateFieldLooseBase(this, _onStorageRemoveHandler)[_onStorageRemoveHandler]);
	  }
	}
	function _onStorageRemove2() {
	  const grid = BX.Main.gridManager.getInstanceById(babelHelpers.classPrivateFieldLooseBase(this, _gridId)[_gridId]);
	  if (grid) {
	    grid.reloadTable();
	  }
	}

	exports.StorageList = StorageList;

}((this.BX.Bizproc.Component = this.BX.Bizproc.Component || {}),BX,BX.Event));
//# sourceMappingURL=script.js.map
