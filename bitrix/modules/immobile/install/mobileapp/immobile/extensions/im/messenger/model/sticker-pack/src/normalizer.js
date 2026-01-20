/**
 * @module im/messenger/model/sticker-pack/normalizer
 */
jn.define('im/messenger/model/sticker-pack/normalizer', (require, exports, module) => {
	const { Type } = require('type');
	const { withCurrentDomain } = require('utils/url');
	/**
	 * @param {StickerPackModelState} fields
	 * @return {StickerPackModelState}
	 */
	function normalizeStickerPack(fields)
	{
		/**
		 * @type {Partial<StickerPackModelState>}
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

		return result;
	}

	/**
	 * @param {FullStickerData} fields
	 * @return {FullStickerData}
	 */
	function normalizeRecentSticker(fields)
	{
		/** @type {Partial<FullStickerData>} */
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

		return result;
	}

	/**
	 * @param {StickerState} fields
	 * @return {StickerState}
	 */
	function normalizeSticker(fields)
	{
		/**
		 * @type {Partial<StickerState>}
		 */
		const result = {};
		if (Type.isNumber(fields.id))
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

		return result;
	}

	module.exports = {
		normalizeStickerPack,
		normalizeRecentSticker,
		normalizeSticker,
	};
});
