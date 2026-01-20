/**
 * @module im/messenger/lib/reaction-assets-manager
 */
jn.define('im/messenger/lib/reaction-assets-manager', (require, exports, module) => {
	const { Type } = require('type');
	const { ReactionPack, OrderType } = require('layout/ui/reaction/picker');

	const { ReactionType } = require('im/messenger/const');
	const { ReactionAssets, defaultUserIcon } = require('im/messenger/assets/common');
	const { Feature } = require('im/messenger/lib/feature');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { ChatAvatar } = require('im/messenger/lib/element/chat-avatar');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const REACTION_MESSAGE_MENU_COUNT = 6;

	/**
	 * @class ReactionAssetsManager
	 * @implements ReactionAssetsManagerInterface
	 */
	class ReactionAssetsManager
	{
		static instance = null;

		/**
		 * @return ReactionAssetsManager
		 */
		static getInstance()
		{
			if (!ReactionAssetsManager.instance)
			{
				ReactionAssetsManager.instance = new ReactionAssetsManager();
			}

			return ReactionAssetsManager.instance;
		}

		constructor()
		{
			this.availableReactionIdCollection = new Set();
			this.store = serviceLocator.get('core').getStore();
			this.logger = getLoggerWithContext('reaction-assets-manager', ReactionAssetsManager);
		}

		/**
		 * @return {DialogWidgetReactionSettings}
		 */
		getWidgetSettings()
		{
			return {
				...this.getReactionAssetsUrl(),
				currentUserAvatar: this.getCurrentUserAvatarForReactions(),
				version: Feature.isReactionsV2Enabled ? 2 : 1,
				isMultiSelection: Feature.isReactionsV2Enabled,
			};
		}

		/**
		 * @return {ReactionAssetsUrlData}
		 */
		getReactionAssetsUrl()
		{
			if (!Feature.isReactionsV2Enabled)
			{
				this.#updateAvailableReactions(Object.keys(this.#getReactionsLegacySvgUrl()));

				return { svg: this.#getReactionsLegacySvgUrl(), lottie: this.#getReactionsLegacyLottieUrl() };
			}

			const reactionPack = this.getPackByType(ReactionPack.ALL);

			const png = {};
			const lottie = {};
			reactionPack.forEach((reactionData) => {
				png[reactionData.id] = reactionData.imageUrl;
				lottie[reactionData.id] = reactionData.lottieUrl;
			});

			this.#updateAvailableReactions(Object.keys(png));

			return { png, lottie };
		}

		/**
		 * @return {Set<string>}
		 */
		getAvailableReactions()
		{
			return this.availableReactionIdCollection;
		}

		/**
		 * @param {Array<string>|ReactionPack|{ids:Array<string>}} type
		 * @return {Array<ReactionData>}
		 */
		getPackByType(type)
		{
			return ReactionPack.getPackByReactionIds(type, OrderType.DEFAULT, true);
		}

		/**
		 * @return {ReactionLottieUrlMap}
		 */
		#getReactionsLegacyLottieUrl()
		{
			return {
				[ReactionType.like]: ReactionAssets.getLottieUrl(ReactionType.like),
				[ReactionType.kiss]: ReactionAssets.getLottieUrl(ReactionType.kiss),
				[ReactionType.cry]: ReactionAssets.getLottieUrl(ReactionType.cry),
				[ReactionType.laugh]: ReactionAssets.getLottieUrl(ReactionType.laugh),
				[ReactionType.angry]: ReactionAssets.getLottieUrl(ReactionType.angry),
				[ReactionType.facepalm]: ReactionAssets.getLottieUrl(ReactionType.facepalm),
				[ReactionType.wonder]: ReactionAssets.getLottieUrl(ReactionType.wonder),
			};
		}

		/**
		 * @return {ReactionSvgUrlMap}
		 */
		#getReactionsLegacySvgUrl()
		{
			return {
				[ReactionType.like]: ReactionAssets.getSvgUrl(ReactionType.like),
				[ReactionType.kiss]: ReactionAssets.getSvgUrl(ReactionType.kiss),
				[ReactionType.cry]: ReactionAssets.getSvgUrl(ReactionType.cry),
				[ReactionType.laugh]: ReactionAssets.getSvgUrl(ReactionType.laugh),
				[ReactionType.angry]: ReactionAssets.getSvgUrl(ReactionType.angry),
				[ReactionType.facepalm]: ReactionAssets.getSvgUrl(ReactionType.facepalm),
				[ReactionType.wonder]: ReactionAssets.getSvgUrl(ReactionType.wonder),
			};
		}

		/**
		 * @return {DialogReactionSettingCurrentUserAvatar}
		 */
		getCurrentUserAvatarForReactions()
		{
			const currentUser = this.store.getters['usersModel/getById'](MessengerParams.getUserId());
			if (!currentUser)
			{
				return {
					defaultIconSvg: defaultUserIcon(),
				};
			}

			const avatar = ChatAvatar.createFromDialogId(currentUser.id).getReactionAvatarProps();
			if (Type.isStringFilled(currentUser.avatar))
			{
				return {
					imageUrl: currentUser.avatar,
					avatar,
				};
			}

			return {
				defaultIconSvg: defaultUserIcon(currentUser.color),
				avatar,
			};
		}

		/**
		 * @return {Array<LegacyReactionData>}
		 */
		getLegacyReactions()
		{
			const legacyReactionIds = [
				ReactionType.like,
				ReactionType.kiss,
				ReactionType.laugh,
				ReactionType.wonder,
				ReactionType.cry,
				ReactionType.angry,
				ReactionType.facepalm,
			];

			return legacyReactionIds.map((reactionId) => {
				return {
					id: reactionId,
					testId: `MESSAGE_MENU_REACTION_${String(reactionId).toUpperCase()}`,
					lottieUrl: ReactionAssets.getLottieUrl(reactionId),
					svgUrl: ReactionAssets.getSvgUrl(reactionId),
				};
			});
		}

		/**
		 * @return {Promise<Array<ReactionData>>}
		 */
		async getTopReactions()
		{
			try
			{
				const packFromCache = ReactionPack.getCurrentUserFavoritePackFromCache(REACTION_MESSAGE_MENU_COUNT);
				if (Type.isArrayFilled(packFromCache))
				{
					return packFromCache;
				}

				this.logger.warn('getTopReactions warn, favorites pack is empty, default pack will be used');

				return this.getPackByType(ReactionPack.QUICK);
			}
			catch (error)
			{
				this.logger.error('getTopReactions error, default pack will be used:', error);

				return this.getPackByType(ReactionPack.QUICK);
			}
		}

		/**
		 * @desc pre-warming the reaction storage cache via a request to the server
		 * @void
		 */
		prewarmFavoriteReactionsCache()
		{
			ReactionPack.getCurrentUserFavoritePackFromCache(REACTION_MESSAGE_MENU_COUNT);
		}

		/**
		 * @param {Array<string>} reactionIdList
		 */
		#updateAvailableReactions(reactionIdList)
		{
			this.availableReactionIdCollection = new Set([...this.availableReactionIdCollection, ...reactionIdList]);

			this.logger.log('updateAvailableReactions is updated', [...this.availableReactionIdCollection]);
		}
	}

	module.exports = {
		ReactionAssetsManager,
	};
});
