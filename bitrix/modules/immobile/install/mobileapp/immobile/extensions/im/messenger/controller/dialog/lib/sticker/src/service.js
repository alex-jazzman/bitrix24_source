/**
 * @module im/messenger/controller/dialog/lib/sticker/src/service
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/service', (require, exports, module) => {
	const { Type } = require('type');
	const { RestMethod } = require('im/messenger/const');
	const { runAction } = require('im/messenger/lib/rest');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const logger = getLoggerWithContext('dialog--sticker', 'StickerService');

	/**
	 * @class StickerService
	 */
	class StickerService
	{
		/** @type {MessengerCoreStore} */
		#store;

		constructor(dialogLocator)
		{
			/**
			 * @type {DialogLocator}
			 */
			this.dialogLocator = dialogLocator;
		}

		/**
		 * @return {MessengerCoreStore}
		 */
		get store()
		{
			this.#store = this.#store ?? serviceLocator.get('core').getStore();

			return this.#store;
		}

		isCurrentPacksLoaded()
		{
			return this.store.getters['stickerPackModel/isCurrentStickersLoaded']();
		}

		/**
		 * @param {StickerPackId} packId
		 * @param {StickerPackType} packType
		 * @return {Boolean}
		 */
		isPackLoaded(packId, packType)
		{
			return this.store.getters['stickerPackModel/isPackLoaded'](packId, packType);
		}

		/**
		 * @param {StickerPackId} packId
		 * @param {StickerPackType} packType
		 * @return {StickerPackModelState}
		 */
		getPack(packId, packType)
		{
			return this.store.getters['stickerPackModel/getPack'](packId, packType);
		}

		/**
		 * @return {{recentStickers: Array<FullStickerData>, packs: Array<StickerPackModelState>}}
		 */
		getCurrentStickers()
		{
			return this.store.getters['stickerPackModel/getAllStickers']();
		}

		async loadInitialStickers()
		{
			const result = await runAction(RestMethod.imV2StickerPackLoad, {
				data: {
					limit: 100,
				},
			});

			await this.store.dispatch('stickerPackModel/setState', result);

			return {
				...this.store.getters['stickerPackModel/getAllStickers'](),
				hasMore: result.hasMore ?? false,
			};
		}

		/**
		 * @param {StickerPackId} packId
		 * @param {StickerPackType} packType
		 * @return {Promise<StickerPackModelState>}
		 */
		async loadStickerPack(packId, packType)
		{
			const result = await runAction(RestMethod.imV2StickerPackGet, {
				data: {
					packId,
					packType,
				},
			});

			await this.store.dispatch('stickerPackModel/setPack', result.pack);

			return this.store.getters['stickerPackModel/getPack'](packId, packType);
		}

		/**
		 * @param {{stickerId: number, packId: StickerPackId, packType: StickerPackType, uri: string}} stickerParams
		 * @return {Promise<void>}
		 */
		async sendSticker(stickerParams)
		{
			const stickerData = this.store.getters['stickerPackModel/getStickerData']({
				id: stickerParams.stickerId,
				packId: stickerParams.packId,
				packType: stickerParams.packType,
			});

			if (Type.isNil(stickerData))
			{
				return;
			}

			this.store.dispatch('stickerPackModel/addRecentSticker', stickerData).catch((error) => {
				logger.error('sendSticker local error', error);
			});

			await this.dialogLocator.get('message-sender').sendStickerMessage(stickerData);
		}

		/**
		 * @param {number} stickerId
		 * @param {StickerPackId} packId
		 * @param {StickerPackType} packType
		 * @return {Promise<*>}
		 */
		async deleteRecentSticker(stickerId, packId, packType)
		{
			await runAction(RestMethod.imV2StickerRecentDelete, {
				data: {
					stickerId,
					packId,
					packType,
				},
			});

			await this.store.dispatch('stickerPackModel/deleteRecentSticker', {
				stickerId,
				packId,
				packType,
			});

			return {
				...this.store.getters['stickerPackModel/getAllStickers'](),
			};
		}

		async deleteAllRecentStickers()
		{
			await runAction(RestMethod.imV2StickerRecentDeleteAll, {
				data: {},
			});

			await this.store.dispatch('stickerPackModel/deleteAllRecentStickers');

			return {
				...this.store.getters['stickerPackModel/getAllStickers'](),
			};
		}
	}

	module.exports = { StickerService };
});
