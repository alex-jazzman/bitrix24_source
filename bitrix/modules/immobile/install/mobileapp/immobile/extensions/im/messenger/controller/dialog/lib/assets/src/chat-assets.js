/**
 * @module im/messenger/controller/dialog/lib/assets/chat-assets
 */
jn.define('im/messenger/controller/dialog/lib/assets/chat-assets', (require, exports, module) => {
	const { ReactionType } = require('im/messenger/const');
	const { ReactionAssets } = require('im/messenger/assets/common');
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
			backgroundCache.downloadImages([
				ReactionAssets.getImageUrl(ReactionType.like),
				ReactionAssets.getImageUrl(ReactionType.kiss),
				ReactionAssets.getImageUrl(ReactionType.laugh),
				ReactionAssets.getImageUrl(ReactionType.wonder),
				ReactionAssets.getImageUrl(ReactionType.angry),
				ReactionAssets.getImageUrl(ReactionType.cry),
				ReactionAssets.getImageUrl(ReactionType.facepalm),
			]);

			backgroundCache.downloadLottieAnimations([
				ReactionAssets.getLottieUrl(ReactionType.like),
				ReactionAssets.getLottieUrl(ReactionType.kiss),
				ReactionAssets.getLottieUrl(ReactionType.laugh),
				ReactionAssets.getLottieUrl(ReactionType.wonder),
				ReactionAssets.getLottieUrl(ReactionType.angry),
				ReactionAssets.getLottieUrl(ReactionType.cry),
				ReactionAssets.getLottieUrl(ReactionType.facepalm),
			]);
		}
	}

	module.exports = { ChatAssets };
});
