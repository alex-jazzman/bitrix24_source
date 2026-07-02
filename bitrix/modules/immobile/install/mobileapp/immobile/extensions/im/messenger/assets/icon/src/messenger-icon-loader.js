/**
 * @module im/messenger/assets/icon/src/messenger-icon-loader
 */
jn.define('im/messenger/assets/icon/src/messenger-icon-loader', (require, exports, module) => {
	const { backgroundCache } = require('im/messenger/lib/background-cache');
	const { MessengerIcon, IconType } = require('im/messenger/assets/icon/src/messenger-icon');

	class MessengerIconLoader
	{
		static preload()
		{
			const urls = Object.values(IconType).map((type) => MessengerIcon.getByType(type));

			return backgroundCache.downloadImages(urls);
		}
	}

	module.exports = { MessengerIconLoader };
});
