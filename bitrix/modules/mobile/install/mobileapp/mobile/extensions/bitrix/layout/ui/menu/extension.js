/**
 * @module layout/ui/menu
 */
jn.define('layout/ui/menu', (require, exports, module) => {
	const { PopupMenu, PopupMenuPosition, PopupMenuType } = require('ui-system/popups/popup-menu');

	module.exports = {
		/**
		 * @deprecated use PopupMenu
		 */
		UIMenu: PopupMenu,
		/**
		 * @deprecated use PopupMenuType
		 */
		UIMenuType: PopupMenuType,
		/**
		 * @deprecated use PopupMenuPosition
		 */
		UIMenuPosition: PopupMenuPosition,
	};
});

(() => {
	const { PopupMenu, PopupMenuType } = jn.require('ui-system/popups/popup-menu');

	/**
	 * @deprecated use PopupMenu
	 */
	this.UI = this.UI || {};
	/**
	 * @deprecated use PopupMenuType
	 */
	this.UI.Menu = PopupMenu;
	/**
	 * @deprecated use PopupMenuType
	 */
	this.UI.Menu.Types = PopupMenuType;
})();
