/**
 * @module im/messenger/model/messages/builder/validator
 */

jn.define('im/messenger/model/messages/builder/validator', (require, exports, module) => {
	const { Type } = require('type');

	/**
	 * @param {object} block
	 * @return {boolean}
	 */
	function validateBlock(block)
	{
		return Type.isPlainObject(block) && !Type.isNil(block.id);
	}

	/**
	 * @param {Array} blocks
	 * @return {Array<BaseBuilderBlockType>}
	 */
	function validateBlocks(blocks)
	{
		if (!Type.isArrayFilled(blocks))
		{
			return [];
		}

		return blocks.filter((block) => validateBlock(block));
	}

	module.exports = { validateBlock, validateBlocks };
});
