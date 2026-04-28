/**
 * @module im/messenger/model/recent/filter/normalizer
 */

jn.define('im/messenger/model/recent/filter/normalizer', (require, exports, module) => {
	const { Type } = require('type');

	/**
	 * @param {RecentFilteredSetIdCollectionData} fields
	 */
	function normalize(fields)
	{
		const result = {};

		if (Type.isStringFilled(fields.tabId))
		{
			result.tabId = fields.tabId;
		}

		if (Type.isArray(fields.itemIds))
		{
			result.itemIds = fields.itemIds
				.filter((id) => Type.isStringFilled(id))
				.map(String);
		}

		return result;
	}

	module.exports = {
		normalize,
	};
});
