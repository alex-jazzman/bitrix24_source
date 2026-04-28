/**
 * @module ui-system/popups/popup-menu/src/menu-position
 */
jn.define('ui-system/popups/popup-menu/src/menu-position', (require, exports, module) => {
	const { BaseEnum } = require('utils/enums/base');

	/**
	 * @class MenuPosition
	 */
	class MenuPosition extends BaseEnum
	{
		static BOTTOM = new MenuPosition('BOTTOM', 'bottom');

		static TOP = new MenuPosition('TOP', 'top');

		static TOP_RIGHT = new MenuPosition('TOP_RIGHT', 'topright');
	}

	module.exports = {
		MenuPosition,
	};
});
