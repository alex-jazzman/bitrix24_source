/**
 * @module im/messenger/controller/dialog/lib/sticker/src/service/model
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/service/model', (require, exports, module) => {
	const { Type } = require('type');

	/**
	 * @class StickerModelService
	 */
	class StickerModelService
	{
		/** @type {MessengerCoreStore} */
		#store;

		constructor(store) {
			this.#store = store;
		}

		isCurrentPacksLoaded()
		{
			return this.#store.getters['stickerPackModel/isCurrentStickersLoaded']();
		}

		isPackLoaded(packId, packType)
		{
			return this.#store.getters['stickerPackModel/isPackLoaded'](packId, packType);
		}

		/**
		 * @param packId
		 * @param packType
		 * @return {StickerPackState}
		 */
		getPack(packId, packType)
		{
			return this.#store.getters['stickerPackModel/getPack'](packId, packType);
		}

		getAllStickers()
		{
			return this.#store.getters['stickerPackModel/getAllStickers']();
		}

		getStickerData(stickerParams)
		{
			return this.#store.getters['stickerPackModel/getStickerData'](stickerParams);
		}

		/**
		 * @param packId
		 * @param packType
		 * @return {Array<StickerState>}
		 */
		getPackStickers(packId, packType)
		{
			return this.#store.getters['stickerPackModel/getPackStickers'](packId, packType);
		}

		async setState(state)
		{
			await this.#store.dispatch('stickerPackModel/setState', state);
		}

		/**
		 * @param {StickerPackTailResult} pageData
		 * @return {Promise<{packs: Array<PackWithStickers>, hasNextPage: boolean}>}
		 */
		async setPage(pageData)
		{
			return this.#store.dispatch('stickerPackModel/setPage', pageData);
		}

		async setPack(packData)
		{
			await this.#store.dispatch('stickerPackModel/setPack', packData);
		}

		async addRecentSticker(stickerData)
		{
			await this.#store.dispatch('stickerPackModel/addRecentSticker', stickerData);
		}

		async deleteRecentSticker(stickerData)
		{
			await this.#store.dispatch('stickerPackModel/deleteRecentSticker', stickerData);
		}

		async deleteAllRecentStickers()
		{
			await this.#store.dispatch('stickerPackModel/deleteAllRecentStickers');
		}

		async createPack(packData)
		{
			await this.#store.dispatch('stickerPackModel/createPack', { pack: packData.pack, stickers: packData.stickers });
		}

		async linkPack(packData)
		{
			const { packId, packType } = packData;

			const pack = this.getPack(packId, packType);
			await this.#store.dispatch('stickerPackModel/linkPack', { pack });
		}

		async deletePack(packData)
		{
			await this.#store.dispatch('stickerPackModel/deletePack', packData);
		}

		async unlinkPack(packData)
		{
			await this.#store.dispatch('stickerPackModel/unlinkPack', packData);
		}

		async renamePack(packData)
		{
			await this.#store.dispatch('stickerPackModel/renamePack', packData);
		}

		async deleteStickers(stickerData)
		{
			await this.#store.dispatch('stickerPackModel/deleteStickers', stickerData);
		}

		/**
		 * @param {{rename: {error, data}, addStickers: {error, data}, deleteStickers: {error, data}}} changeData
		 * @return {Promise<void>}
		 */
		async changePack(changeData)
		{
			if (!Type.isNil(changeData.rename) && Type.isNil(changeData.rename.error))
			{
				await this.renamePack(changeData.rename.data);
			}

			if (!Type.isNil(changeData.addStickers) && Type.isNil(changeData.addStickers.error))
			{
				await this.#store.dispatch('stickerPackModel/addStickers', changeData.addStickers.data);
			}

			if (!Type.isNil(changeData.deleteStickers) && Type.isNil(changeData.deleteStickers.error))
			{
				await this.deleteStickers(changeData.deleteStickers.data);
			}
		}
	}

	module.exports = { StickerModelService };
});
