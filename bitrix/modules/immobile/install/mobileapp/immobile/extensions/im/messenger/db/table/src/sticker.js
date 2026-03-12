/**
 * @module im/messenger/db/table/sticker
 */
jn.define('im/messenger/db/table/sticker', (require, exports, module) => {
	const { unique } = require('utils/array');

	const {
		Table,
		FieldType,
	} = require('im/messenger/db/table/table');

	/**
	 * @class StickerTable
	 */
	class StickerTable extends Table
	{
		getName()
		{
			return 'b_im_sticker';
		}

		getPrimaryKey()
		{
			return 'compositeId';
		}

		getFields()
		{
			return [
				{ name: 'compositeId', type: FieldType.text, unique: true, index: true },
				{ name: 'id', type: FieldType.integer },
				{ name: 'packId', type: FieldType.integer },
				{ name: 'packType', type: FieldType.text },
				{ name: 'height', type: FieldType.integer },
				{ name: 'width', type: FieldType.integer },
				{ name: 'sort', type: FieldType.integer },
				{ name: 'type', type: FieldType.text },
				{ name: 'uri', type: FieldType.text },
			];
		}

		/**
		 * @param {Array<{id, packId, packType}>} stickerList
		 */
		getStickerList(stickerList)
		{
			const compositeIdList = stickerList.map((sticker) => this.buildCompositeId(sticker));

			return this.getListByIds(unique(compositeIdList));
		}

		/**
		 * @param {Array<{id, packId, packType}>} stickerList
		 */
		async deleteStickerList(stickerList)
		{
			const compositeIdList = stickerList.map((sticker) => this.buildCompositeId(sticker));

			return this.deleteByIdList(unique(compositeIdList));
		}

		/**
		 * @param packId
		 * @param packType
		 * @return {Promise<void>}
		 */
		async deletePack(packId, packType)
		{
			return this.delete({ packId, packType });
		}

		/**
		 * @param {{id, packId, packType}} sticker
		 * @return {string}
		 */
		buildCompositeId(sticker)
		{
			return `${sticker.id}:${sticker.packId}:${sticker.packType}`;
		}
	}

	module.exports = { StickerTable };
});
