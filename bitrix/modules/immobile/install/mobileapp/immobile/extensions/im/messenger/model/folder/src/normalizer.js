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

		if (Type.isString(folder.description) || Type.isNull(folder.description))
		{
			result.description = folder.description;
		}

		if (Type.isNumber(folder.sort))
		{
			result.sort = folder.sort;
		}

		if (Type.isBoolean(folder.visible))
		{
			result.visible = folder.visible;
		}

		// REST: parentChatId / chats / sourceFolders / recentSection live under definition -> flat
		if (!options.fromLocalDatabase && Type.isPlainObject(folder.definition))
		{
			// parentChatId: 0 - roots only, null - every nesting level, absent - model default
			if (Type.isNumber(folder.definition.parentChatId) || Type.isNull(folder.definition.parentChatId))
			{
				result.parentChatId = folder.definition.parentChatId;
			}

			if (Type.isArray(folder.definition.chats))
			{
				result.chatIds = folder.definition.chats
					.map((chat) => chat.chatId)
					.filter((chatId) => Type.isInteger(chatId) && chatId > 0);
			}

			if (Type.isArray(folder.definition.sourceFolders))
			{
				result.sourceFolders = folder.definition.sourceFolders
					.filter((code) => Type.isStringFilled(code));
			}

			if (Type.isStringFilled(folder.definition.recentSection) || Type.isNull(folder.definition.recentSection))
			{
				result.recentSection = folder.definition.recentSection;
			}
		}
		else
		{
			// LocalDB: already flat camelCase
			if (Type.isNumber(folder.parentChatId) || Type.isNull(folder.parentChatId))
			{
				result.parentChatId = folder.parentChatId;
			}

			if (Type.isArray(folder.chatIds))
			{
				result.chatIds = folder.chatIds;
			}

			if (Type.isArray(folder.sourceFolders))
			{
				result.sourceFolders = folder.sourceFolders;
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
