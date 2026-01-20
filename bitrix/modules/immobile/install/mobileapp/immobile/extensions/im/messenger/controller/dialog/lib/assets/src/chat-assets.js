/**
 * @module im/messenger/controller/dialog/lib/assets/chat-assets
 */
jn.define('im/messenger/controller/dialog/lib/assets/chat-assets', (require, exports, module) => {
	const { Logger } = require('im/messenger/lib/logger');
	const { ReactionAssetsManager } = require('im/messenger/lib/reaction-assets-manager');
	const { headerIconsPath, defaultGroupChatAvatar } = require('im/messenger/assets/common');
	const { backgroundCache } = require('im/messenger/lib/background-cache');

	/**
	 * @class ChatAssets
	 */
	class ChatAssets
	{
		preloadAssets()
		{
			this.preloadReactions();
		}

		/**
		 * @protected
		 */
		preloadReactions()
		{
			try
			{
				const currentAssetsPack = ReactionAssetsManager.getInstance().getReactionAssetsUrl();
				const imagesUrlArray = currentAssetsPack.svg
					? Object.values(currentAssetsPack.svg) : Object.values(currentAssetsPack.png);

				backgroundCache.downloadImages([
					...imagesUrlArray,
					headerIconsPath.subscribe,
					headerIconsPath.unsubscribe,
					defaultGroupChatAvatar,
				]);

				const lottiUrlArray = Object.values(currentAssetsPack.lottie);

				backgroundCache.downloadLottieAnimations(lottiUrlArray);
			}
			catch (error)
			{
				Logger.error('preloadReactions catch:', error);
			}
		}
	}

	module.exports = { ChatAssets };
});
