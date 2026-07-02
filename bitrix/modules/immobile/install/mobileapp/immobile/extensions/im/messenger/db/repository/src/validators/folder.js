/**
 * @module im/messenger/db/repository/validators/folder
 */
jn.define('im/messenger/db/repository/validators/folder', (require, exports, module) => {
	const { Type } = require('type');

	function validateFolder(folder)
	{
		if (!Type.isPlainObject(folder))
		{
			return {};
		}

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

		if (Type.isPlainObject(folder.definition))
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

	module.exports = { validateFolder };
});
