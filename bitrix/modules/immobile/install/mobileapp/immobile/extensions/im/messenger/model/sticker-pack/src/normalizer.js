/**
 * @module im/messenger/model/sticker-pack/normalizer
 */
jn.define('im/messenger/model/sticker-pack/normalizer', (require, exports, module) => {
	const { Type } = require('type');
	const { withCurrentDomain } = require('utils/url');
	/**
	 * @param {Partial<StickerPackState>} fields
	 * @return {Partial<StickerPackState>}
	 */
	function normalizeStickerPack(fields)
	{
		/**
		 * @type {Partial<StickerPackState>}
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

		if (Type.isStringFilled(fields.name))
		{
			result.name = fields.name;
		}

		if (Type.isNumber(fields.authorId))
		{
			result.authorId = fields.authorId;
		}

		if (Type.isBoolean(fields.isAdded))
		{
			result.isAdded = fields.isAdded;
		}

		return result;
	}

	/**
	 * @param {Partial<RecentStickerState>} fields
	 * @return {Partial<RecentStickerState>}
	 */
	function normalizeRecentSticker(fields)
	{
		/** @type {Partial<RecentStickerState>} */
		const result = {};

		if (Type.isNumber(fields.id))
		{
			result.id = fields.id;
		}

		if (Type.isNumber(fields.packId) || Type.isStringFilled(fields.packId))
		{
			result.packId = fields.packId;
		}

		if (Type.isStringFilled(fields.packType))
		{
			result.packType = fields.packType;
		}

		return result;
	}

	/**
	 * @param {Partial<StickerState>} fields
	 * @return {Partial<StickerState>}
	 */
	function normalizeSticker(fields)
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

	module.exports = {
		normalizeStickerPack,
		normalizeRecentSticker,
		normalizeSticker,
	};
});
