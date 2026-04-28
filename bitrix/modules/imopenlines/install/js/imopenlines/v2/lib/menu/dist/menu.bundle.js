/* eslint-disable */
this.BX = this.BX || {};
this.BX.OpenLines = this.BX.OpenLines || {};
this.BX.OpenLines.v2 = this.BX.OpenLines.v2 || {};
(function (exports,main_core,im_v2_const,im_v2_lib_layout,im_v2_lib_menu,im_v2_lib_utils) {
	'use strict';

	const OPENLINES_PAGE_PATH = '/online/?IM_LINES=';
	var _getOpenItem = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getOpenItem");
	var _getOpenItemInNewTab = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getOpenItemInNewTab");
	class RecentContextMenu extends im_v2_lib_menu.BaseMenu {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _getOpenItemInNewTab, {
	      value: _getOpenItemInNewTab2
	    });
	    Object.defineProperty(this, _getOpenItem, {
	      value: _getOpenItem2
	    });
	  }
	  getMenuItems() {
	    return [babelHelpers.classPrivateFieldLooseBase(this, _getOpenItem)[_getOpenItem](), babelHelpers.classPrivateFieldLooseBase(this, _getOpenItemInNewTab)[_getOpenItemInNewTab]()];
	  }
	}
	function _getOpenItem2() {
	  return {
	    title: main_core.Loc.getMessage('IM_LIB_MENU_OPEN'),
	    onClick: () => {
	      void im_v2_lib_layout.LayoutManager.getInstance().setLayout({
	        name: im_v2_const.Layout.openlinesV2,
	        entityId: this.context.dialogId
	      });
	      this.menuInstance.close();
	    }
	  };
	}
	function _getOpenItemInNewTab2() {
	  return {
	    title: main_core.Loc.getMessage('IM_LIB_MENU_OPEN_IN_NEW_TAB'),
	    onClick: () => {
	      im_v2_lib_utils.Utils.browser.openLink(`${OPENLINES_PAGE_PATH}${this.context.dialogId}`);
	    }
	  };
	}

	exports.RecentContextMenu = RecentContextMenu;

}((this.BX.OpenLines.v2.Lib = this.BX.OpenLines.v2.Lib || {}),BX,BX.Messenger.v2.Const,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib));
//# sourceMappingURL=menu.bundle.js.map
