/**
 * @module im/messenger/controller/dialog/lib/sticker/src/utils/navigation
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/utils/navigation', (require, exports, module) => {
	const { NAVIGATION_BUTTON_WIDTH } = require('im/messenger/controller/dialog/lib/sticker/src/const');
	/**
	 * @class StickerNavigationUtils
	 */
	class StickerNavigationUtils
	{
		static calculatePackPageSize(deviceWidth)
		{
			return Math.ceil((deviceWidth - 8) / NAVIGATION_BUTTON_WIDTH);
		}
	}

	module.exports = { StickerNavigationUtils };
});
