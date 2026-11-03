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

		// null has to survive the whitelist: an omitted key falls back to the column default 0
		if (Type.isNumber(folder.parentChatId) || Type.isNull(folder.parentChatId))
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

		// Invariant: validateFolder only ever receives already-normalized flat folders.
		// FolderDataProvider.setList runs normalize() before repository.replaceAll, and
		// FolderRepository.getAll rebuilds chatIds from the membership table — the REST
		// `definition` shape never reaches this validator, so it is not read here.
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

		return result;
	}

	module.exports = { validateFolder };
});
