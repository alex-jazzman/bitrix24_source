/**
 * @module ui-system/popups/popup-menu/src/menu-type
 */
jn.define('ui-system/popups/popup-menu/src/menu-type', (require, exports, module) => {
	const { BaseEnum } = require('utils/enums/base');

	/**
	 * @class MenuType
	 */
	class MenuType extends BaseEnum
	{
		static DEFAULT = new MenuType('DEFAULT', 'default');
		static DESKTOP = new MenuType('DESKTOP', 'desktop');
		static HELPDESK = new MenuType('HELPDESK', 'helpdesk');

		/**
		 * @returns {Object<string, string>}
		 */
		static getTypes()
		{
			return Object.fromEntries(
				this.getEntries()
					.map(([key, value]) => [key, value]),
			);
		}
	}

	module.exports = {
		MenuType,
	};
});
