/**
 * @module im/messenger/provider/data/sticker
 */
jn.define('im/messenger/provider/data/sticker', (require, exports, module) => {
	const { Type } = require('type');

	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	/**
	 * @class StickerDataProvider
	 */
	class StickerDataProvider
	{
		constructor()
		{
			this.store = serviceLocator.get('core').getStore();
		}

		/**
		 * @param {Array<SyncRawMessage| RawMessage | MessagesModelState>} messages
		 * @param {Array<StickerState>} stickers
		 * @return {Promise<void>}
		 */
		async removeDeletedStickers(messages, stickers)
		{
			const stickerKeys = new Set(
				stickers.map((sticker) => this.#createStickerKey(sticker.id, sticker.packId, sticker.packType)),
			);

			/** @type {Map<string, {packId: StickerPackId, packType: StickerPackType, ids: Set<number>}>} */
			const stickersToDelete = new Map();
			for (const message of messages)
			{
				if (!Type.isPlainObject(message.params?.STICKER_PARAMS))
				{
					continue;
				}

				const { id, packType, packId } = this.#normalizeParams(message.params?.STICKER_PARAMS);

				const stickerKey = this.#createStickerKey(id, packId, packType);
				if (stickerKeys.has(stickerKey))
				{
					continue;
				}

				const packKey = `${packId}:${packType}`;
				if (!stickersToDelete.has(packKey))
				{
					stickersToDelete.set(packKey, {
						packId,
						packType,
						ids: new Set(),
					});
				}

				stickersToDelete.get(packKey).ids.add(id);
			}

			if (stickersToDelete.size === 0)
			{
				return;
			}

			const deleteStickersPromiseList = [];
			for (const { packId, packType, ids } of stickersToDelete.values())
			{
				deleteStickersPromiseList.push(
					this.store.dispatch('stickerPackModel/deleteStickers', {
						packId,
						packType,
						ids: [...ids.values()],
					}),
				);
			}

			await Promise.all(deleteStickersPromiseList);
		}

		#normalizeParams(stickerParams)
		{
			return {
				id: stickerParams.id,
				packId: stickerParams.packId ?? stickerParams.pack_id,
				packType: stickerParams.packType ?? stickerParams.pack_type,
			};
		}

		#createStickerKey(stickerId, packId, packType)
		{
			return `${stickerId}:${packId}:${packType}`;
		}
	}

	module.exports = { StickerDataProvider };
});
