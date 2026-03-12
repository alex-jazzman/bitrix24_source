/**
 * @module im/messenger/db/repository/sticker
 */
jn.define('im/messenger/db/repository/sticker', (require, exports, module) => {
	const { Type } = require('type');
	const { withCurrentDomain } = require('utils/url');
	const { StickerTable } = require('im/messenger/db/table');

	/**
	 * @class StickerRepository
	 */
	class StickerRepository
	{
		constructor()
		{
			this.stickerTable = new StickerTable();
		}

		/**
		 * @param {Array<{id, packId, packType}>} stickerList
		 * @return {Promise<{items: Array<StickerState>}>}
		 */
		async getStickerList(stickerList)
		{
			return this.stickerTable.getStickerList(stickerList);
		}

		/**
		 * @param {Array<StickerState>} stickerList
		 * @return {Promise<*>}
		 */
		async saveFromModel(stickerList)
		{
			const stickerListToAdd = stickerList
				.map((sticker) => this.normalizeSticker(sticker))
				.map((sticker) => ({
					...sticker,
					compositeId: this.stickerTable.buildCompositeId(sticker),
				}))
				.map((sticker) => this.stickerTable.validate(sticker))
			;

			return this.stickerTable.add(stickerListToAdd);
		}

		async deleteStickersByPack(packData)
		{
			const { packId, packType } = packData;

			this.stickerTable.deletePack(packId, packType)
				.catch((error) => {
					console.error(error);
				})
			;
		}

		/**
		 * @param {Array<{id, packId, packType}>} stickerList
		 * @return {Promise<void>}
		 */
		async deleteStickerList(stickerList)
		{
			return this.stickerTable.deleteStickerList(stickerList);
		}

		normalizeSticker(fields)
		{
			/**
			 * @type {Partial<StickerState>}
			 */
			const result = {};
			if (Type.isNumber(fields.id) || Type.isStringFilled(fields.id))
			{
				result.id = fields.id;
			}

			if (Type.isStringFilled(fields.type))
			{
				result.type = fields.type;
			}

			if (Type.isStringFilled(fields.uri))
			{
				result.uri = withCurrentDomain(fields.uri);
			}

			if (Type.isNumber(fields.height))
			{
				result.height = fields.height;
			}

			if (Type.isNumber(fields.width))
			{
				result.width = fields.width;
			}

			if (Type.isNumber(fields.packId) || Type.isStringFilled(fields.packId))
			{
				result.packId = fields.packId;
			}

			if (Type.isStringFilled(fields.packType))
			{
				result.packType = fields.packType;
			}

			if (Type.isNumber(fields.sort))
			{
				result.sort = fields.sort;
			}

			return result;
		}
	}

	module.exports = { StickerRepository };
});
