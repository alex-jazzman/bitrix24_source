/**
 * @module im/messenger/controller/dialog/lib/sticker/src/service/api
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/service/api', (require, exports, module) => {
	const { Type } = require('type');
	const { RestMethod } = require('im/messenger/const');
	const { createPromiseWithResolvers } = require('im/messenger/lib/utils');
	const { runAction } = require('im/messenger/lib/rest');

	/**
	 * @class StickerApiService
	 */
	class StickerApiService
	{
		/**
		 * @param {number} limit
		 * @return {Promise<StickerPackLoadResult>}
		 */
		async loadInitialStickers(limit = 10)
		{
			return runAction(RestMethod.imV2StickerPackLoad, {
				data: { limit },
			});
		}

		/**
		 * @param {StickerPackId} id
		 * @param {StickerPackType} type
		 * @return {Promise<StickerPackGetResult>}
		 */
		async loadStickerPack(id, type)
		{
			return runAction(RestMethod.imV2StickerPackGet, {
				data: { id, type },
			});
		}

		/**
		 * @param {StickerPackId} id
		 * @param {StickerPackType} type
		 * @param {number} limit
		 * @return {Promise<StickerPackTailResult>}
		 */
		async loadNextPage(id, type, limit)
		{
			return runAction(RestMethod.imV2StickerPackTail, {
				data: { id, type, limit },
			});
		}

		async deleteRecentSticker(stickerId, packId, packType)
		{
			return runAction(RestMethod.imV2StickerRecentDelete, {
				data: { id: stickerId, packId, packType },
			});
		}

		async deleteAllRecentStickers()
		{
			return runAction(RestMethod.imV2StickerRecentDeleteAll, { data: {} });
		}

		async createPack(title, fileIds, packType = 'custom')
		{
			return runAction(RestMethod.imV2StickerPackAdd, {
				data: {
					name: title,
					type: packType,
					uuids: fileIds,
				},
			});
		}

		async linkPack(packId, packType)
		{
			return runAction(RestMethod.imV2StickerPackLink, {
				data: { id: packId, type: packType },
			});
		}

		async deletePack(packId, packType)
		{
			return runAction(RestMethod.imV2StickerPackDelete, {
				data: { id: packId, type: packType },
			});
		}

		async unlinkPack(packId, packType)
		{
			return runAction(RestMethod.imV2StickerPackUnlink, {
				data: { id: packId, type: packType },
			});
		}

		async renamePack(packId, packType, name)
		{
			return runAction(RestMethod.imV2StickerPackRename, {
				data: { id: packId, type: packType, name },
			});
		}

		async deleteSticker(stickerId, packId, packType)
		{
			return runAction(RestMethod.imV2StickerDelete, {
				data: { ids: [stickerId], packId, packType },
			});
		}

		async deleteStickers(stickers, packId, packType)
		{
			return runAction(RestMethod.imV2StickerDelete, {
				data: { ids: stickers, packId, packType },
			});
		}

		async changePack(pack, changedFields)
		{
			const requestData = [];

			if (!Type.isNil(changedFields.title))
			{
				requestData.push({
					method: RestMethod.imV2StickerPackRename,
					params: {
						id: pack.id,
						type: pack.type,
						name: changedFields.title,
					},
				});
			}

			if (!Type.isNil(changedFields.addedStickers))
			{
				requestData.push({
					method: RestMethod.imV2StickerAdd,
					params: {
						packId: pack.id,
						packType: pack.type,
						uuids: changedFields.addedStickers,
					},
				});
			}

			if (!Type.isNil(changedFields.deletedStickers))
			{
				requestData.push({
					method: RestMethod.imV2StickerDelete,
					params: {
						packId: pack.id,
						packType: pack.type,
						ids: changedFields.deletedStickers,
					},
				});
			}

			requestData.push({
				method: RestMethod.imV2StickerPackGet,
				params: {
					id: pack.id,
					type: pack.type,
				},
			});

			const { promise, resolve } = createPromiseWithResolvers();
			BX.rest.callBatch(requestData, (result) => {
				const data = {};
				for (const ajaxResult of result)
				{
					if (ajaxResult.query.method === RestMethod.imV2StickerPackRename)
					{
						data.rename = {
							error: ajaxResult.error(),
							data: {
								packId: pack.id,
								packType: pack.type,
								name: changedFields.title,
							},
						};
					}

					if (ajaxResult.query.method === RestMethod.imV2StickerAdd)
					{
						data.addStickers = {
							error: ajaxResult.error(),
							data: {
								stickers: ajaxResult.data().stickers,
							},
						};
					}

					if (ajaxResult.query.method === RestMethod.imV2StickerDelete)
					{
						data.deleteStickers = {
							error: ajaxResult.error(),
							data: {
								packId: pack.id,
								packType: pack.type,
								ids: changedFields.deletedStickers,
							},
						};
					}
				}

				resolve(data);
			});

			return promise;
		}

		async addStickers(packId, packType, fileIds)
		{
			return runAction(RestMethod.imV2StickerAdd, {
				data: { uuids: fileIds, packId, packType },
			});
		}
	}

	module.exports = { StickerApiService };
});
