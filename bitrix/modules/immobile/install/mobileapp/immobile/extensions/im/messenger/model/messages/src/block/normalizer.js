/**
 * @module im/messenger/model/messages/block/normalizer
 */

jn.define('im/messenger/model/messages/block/normalizer', (require, exports, module) => {
	const { Type } = require('type');

	/**
	 * Normalizes block data from server or local DB.
	 *
	 * Accepts two formats:
	 * - New server format: { config: { background }, elements: [...] }
	 * - Legacy format (local DB): { blocks: [...], background }
	 *
	 * @param {object} blockData
	 * @return {BlockModelState|null}
	 */
	function normalize(blockData)
	{
		if (!Type.isPlainObject(blockData))
		{
			return null;
		}

		// fallback on blocks: SQLite stores legacy format with "blocks" key
		const elements = blockData.elements ?? blockData.blocks;
		if (!elements)
		{
			return null;
		}

		const normalizedElements = normalizeElements(elements);
		if (normalizedElements.length === 0)
		{
			return null;
		}

		const result = { elements: normalizedElements };

		const background = blockData.config?.background ?? blockData.background;
		if (Type.isStringFilled(background))
		{
			result.background = background;
		}

		return result;
	}

	/**
	 * @param {object} element
	 * @return {boolean}
	 */
	function isElementValid(element)
	{
		return Type.isPlainObject(element) && !Type.isNil(element.id);
	}

	/**
	 * @param {Array} elements
	 * @return {Array<BaseBlockElementType>}
	 */
	function normalizeElements(elements)
	{
		if (!Type.isArrayFilled(elements))
		{
			return [];
		}

		return elements.filter((element) => isElementValid(element));
	}

	module.exports = { normalize, isElementValid };
});
