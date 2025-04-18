/**
 * @module layout/ui/simple-list/menu-engine
 */
jn.define('layout/ui/simple-list/menu-engine', (require, exports, module) => {
	const { ContextMenuEngine } = require('layout/ui/simple-list/menu-engine/src/context-menu-engine');
	const { PopupMenuEngine } = require('layout/ui/simple-list/menu-engine/src/popup-menu-engine');

	class MenuEngine
	{
		static createMenu(props, popupItemMenu)
		{
			if (popupItemMenu)
			{
				return new PopupMenuEngine(props);
			}

			return new ContextMenuEngine(props);
		}
	}

	module.exports = { MenuEngine };
});
