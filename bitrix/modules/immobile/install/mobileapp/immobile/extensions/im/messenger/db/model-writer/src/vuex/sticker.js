/**
 * @module im/messenger/db/model-writer/vuex/sticker
 */
jn.define('im/messenger/db/model-writer/vuex/sticker', (require, exports, module) => {
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { Writer } = require('im/messenger/db/model-writer/vuex/writer');

	const logger = getLoggerWithContext('writer--sticker', 'StickerWriter');
	/**
	 * @class StickerWriter
	 */
	class StickerWriter extends Writer
	{
		initRouters()
		{
			super.initRouters();
			this.deletePackRouter = this.deletePackRouter.bind(this);
			this.deleteStickersRouter = this.deleteStickersRouter.bind(this);
		}

		subscribeEvents()
		{
			this.storeManager.on('stickerPackModel/addStickers', this.addRouter);
			this.storeManager.on('stickerPackModel/deletePack', this.deletePackRouter);
			this.storeManager.on('stickerPackModel/deleteStickers', this.deleteStickersRouter);
		}

		unsubscribeEvents()
		{
			this.storeManager.off('stickerPackModel/addStickers', this.addRouter);
			this.storeManager.off('stickerPackModel/deletePack', this.deletePackRouter);
			this.storeManager.off('stickerPackModel/deleteStickers', this.deleteStickersRouter);
		}

		/**
		 * @param {MutationPayload<StickerPackAddStickersData, StickerPackAddStickersActions>} mutation.payload
		 */
		addRouter(mutation)
		{
			if (!this.checkIsValidMutation(mutation))
			{
				return;
			}

			const { stickers } = mutation.payload.data;

			this.repository.sticker.saveFromModel(stickers)
				.catch((error) => {
					logger.error(error);
				});
		}

		deletePackRouter(mutation)
		{
			if (!this.checkIsValidMutation(mutation))
			{
				return;
			}

			const { packId, packType } = mutation.payload.data;

			this.repository.sticker.deleteStickersByPack({ packId, packType })
				.catch((error) => {
					logger.error(error);
				});
		}

		deleteStickersRouter(mutation)
		{
			if (!this.checkIsValidMutation(mutation))
			{
				return;
			}

			const { packId, packType, ids } = mutation.payload.data;

			const stickerList = ids.map((id) => ({ id, packId, packType }));

			this.repository.sticker.deleteStickerList(stickerList)
				.catch((error) => {
					logger.error(error);
				});
		}
	}

	module.exports = { StickerWriter };
});
