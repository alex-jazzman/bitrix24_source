/**
 * @module im/messenger/model/folder/src/normalizer
 */
jn.define('im/messenger/model/folder/src/normalizer', (require, exports, module) => {
	const { Type } = require('type');

	/**
	 * Normalizes a folder payload from REST DTO-01 or LocalDB into a flat camelCase shape.
	 *
	 * @param {object} folder
	 * @param {object} [options]
	 * @param {boolean} [options.fromLocalDatabase] when true, payload is already flat camelCase.
	 * @return {Partial<FolderModelState>}
	 */
	function normalize(folder, options = {})
	{
		const result = {};

		if (Type.isNumber(folder.id))
		{
			result.id = folder.id;
		}

		if (Type.isNumber(folder.parentChatId))
		{
			result.parentChatId = folder.parentChatId;
		}

		if (Type.isStringFilled(folder.type))
		{
			result.type = folder.type;
		}

		if (Type.isStringFilled(folder.code) || Type.isNull(folder.code))
		{
			result.code = folder.code;
		}

		if (Type.isString(folder.title))
		{
			result.title = folder.title;
		}

		if (Type.isNumber(folder.sort))
		{
			result.sort = folder.sort;
		}

		// REST: definition.chatIds / definition.recentSection → flat
		if (!options.fromLocalDatabase && Type.isPlainObject(folder.definition))
		{
			if (Type.isArray(folder.definition.chatIds))
			{
				result.chatIds = folder.definition.chatIds;
			}

			if (Type.isStringFilled(folder.definition.recentSection) || Type.isNull(folder.definition.recentSection))
			{
				result.recentSection = folder.definition.recentSection;
			}
		}
		else
		{
			// LocalDB: already flat camelCase
			if (Type.isArray(folder.chatIds))
			{
				result.chatIds = folder.chatIds;
			}

			if (Type.isStringFilled(folder.recentSection) || Type.isNull(folder.recentSection))
			{
				result.recentSection = folder.recentSection;
			}
		}

		return result;
	}

	module.exports = { normalize };
});
