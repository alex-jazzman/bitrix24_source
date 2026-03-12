/**
 * @module im/messenger/controller/dialog/lib/sticker/src/service/service
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/service/service', (require, exports, module) => {
	const { Type } = require('type');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const { DEVICE_WIDTH } = require('im/messenger/controller/dialog/lib/sticker/src/const');
	const { StickerApiService } = require('im/messenger/controller/dialog/lib/sticker/src/service/api');
	const { StickerModelService } = require('im/messenger/controller/dialog/lib/sticker/src/service/model');
	const { StickerNavigationUtils } = require('im/messenger/controller/dialog/lib/sticker/src/utils/navigation');

	const logger = getLoggerWithContext('dialog--sticker', 'StickerService');

	/**
	 * @class StickerService
	 */
	class StickerService
	{
		/** @type {StickerModelService} */
		#modelService;
		/** @type {StickerApiService} */
		#apiService;
		#messageSender;

		constructor({ dialogLocator })
		{
			const store = serviceLocator.get('core').getStore();

			this.#modelService = new StickerModelService(store);
			this.#apiService = new StickerApiService();
			this.#messageSender = dialogLocator.get('message-sender');
		}

		isCurrentPacksLoaded()
		{
			return this.#modelService.isCurrentPacksLoaded();
		}

		/**
		 * @param {StickerPackId} packId
		 * @param {StickerPackType} packType
		 * @return {Boolean}
		 */
		isPackLoaded(packId, packType)
		{
			return this.#modelService.isPackLoaded(packId, packType);
		}

		/**
		 * @param {StickerPackId} packId
		 * @param {StickerPackType} packType
		 * @return {StickerPackState}
		 */
		getPack(packId, packType)
		{
			return this.#modelService.getPack(packId, packType);
		}

		getPackStickers(packId, packType)
		{
			return this.#modelService.getPackStickers(packId, packType);
		}

		/**
		 * @return {{recentStickers: Array<StickerState>, packs: Array<PackWithStickers>, hasNextPage: boolean}}
		 */
		getCurrentStickers()
		{
			return this.#modelService.getAllStickers();
		}

		async loadInitialStickers()
		{
			const limit = StickerNavigationUtils.calculatePackPageSize(DEVICE_WIDTH);
			const result = await this.#apiService.loadInitialStickers(limit);
			logger.log('loadInitialStickers', result);

			await this.#modelService.setState(result);

			return this.getCurrentStickers();
		}

		/**
		 * @param {{id: StickerPackId, type: StickerPackType}} pack
		 * @return {Promise<{packs: Array<PackWithStickers>, hasNextPage: boolean}>}
		 */
		async loadNextPage({ id, type })
		{
			const limit = StickerNavigationUtils.calculatePackPageSize(DEVICE_WIDTH);

			const apiResult = await this.#apiService.loadNextPage(id, type, limit);

			const storeResult = await this.#modelService.setPage(apiResult);

			return {
				packs: storeResult.packs.filter((pack) => pack.pack.id !== id || pack.pack.type !== type),
				hasNextPage: storeResult.hasNextPage,
			};
		}

		/**
		 * @param {StickerPackId} packId
		 * @param {StickerPackType} packType
		 * @return {Promise<PackWithStickers>}
		 */
		async loadStickerPack(packId, packType)
		{
			const result = await this.#apiService.loadStickerPack(packId, packType);

			await this.#modelService.setPack(result);

			return {
				pack: this.#modelService.getPack(packId, packType),
				stickers: this.#modelService.getPackStickers(packId, packType),
			};
		}

		/**
		 * @param {{stickerId: number, packId: StickerPackId, packType: StickerPackType, uri: string}} stickerParams
		 * @return {Promise<void>}
		 */
		async sendSticker(stickerParams)
		{
			const stickerData = this.#modelService.getStickerData({
				id: stickerParams.stickerId,
				packId: stickerParams.packId,
				packType: stickerParams.packType,
			});

			if (Type.isNil(stickerData))
			{
				logger.warn('Sticker not found for sending', stickerParams);

				return;
			}

			this.#modelService.addRecentSticker(stickerData)
				.catch((error) => {
					logger.error('sendSticker local error', error);
				});

			await this.#messageSender.sendStickerMessage(stickerData);
		}

		/**
		 * @param {string} title
		 * @param {Array<string>} files
		 * @return {Promise<void>}
		 */
		async createPack(title, files)
		{
			const result = await this.#apiService.createPack(title, files);
			await this.#modelService.createPack(result);
		}

		async changePack(pack, changedFields)
		{
			const result = await this.#apiService.changePack(pack, changedFields);
			await this.#modelService.changePack(result);

			return result;
		}

		async linkPack(packId, packType)
		{
			await this.#apiService.linkPack(packId, packType);
			await this.#modelService.linkPack({ packId, packType });
		}

		async deletePack(packId, packType)
		{
			await this.#apiService.deletePack(packId, packType);

			await this.#modelService.deletePack({
				packId,
				packType,
			});

			return {
				...this.#modelService.getAllStickers(),
			};
		}

		async unlinkPack(packId, packType)
		{
			await this.#apiService.unlinkPack(packId, packType);
			await this.#modelService.unlinkPack({ packId, packType });
		}

		async deleteSticker(stickerId, packId, packType)
		{
			await this.#apiService.deleteSticker(stickerId, packId, packType);

			await this.#modelService.deleteStickers({
				packId,
				packType,
				ids: [stickerId],
			});

			return {
				...this.#modelService.getAllStickers(),
			};
		}

		/**
		 * @param {number} stickerId
		 * @param {StickerPackId} packId
		 * @param {StickerPackType} packType
		 * @return {Promise<*>}
		 */
		async deleteRecentSticker(stickerId, packId, packType)
		{
			await this.#apiService.deleteRecentSticker(stickerId, packId, packType);

			await this.#modelService.deleteRecentSticker({
				stickerId,
				packId,
				packType,
			});

			return {
				...this.#modelService.getAllStickers(),
			};
		}

		async deleteAllRecentStickers()
		{
			await this.#apiService.deleteAllRecentStickers();
			await this.#modelService.deleteAllRecentStickers();

			return {
				...this.#modelService.getAllStickers(),
				recentStickers: [],
			};
		}

		async renamePack(packId, packType, name)
		{
			await this.#apiService.renamePack(packId, packType, name);

			await this.#modelService.renamePack({
				packId,
				packType,
				name,
			});

			return name;
		}
	}

	module.exports = { StickerService };
});
