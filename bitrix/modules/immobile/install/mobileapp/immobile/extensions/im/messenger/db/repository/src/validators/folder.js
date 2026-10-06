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

		// Invariant: validateFolder only ever receives already-normalized flat folders.
		// FolderDataProvider.setList runs normalize() before repository.replaceAll, and
		// FolderRepository.getAll rebuilds chatIds from the membership table — the REST
		// `definition` shape never reaches this validator, so it is not read here.
		if (Type.isArray(folder.chatIds))
		{
			result.chatIds = folder.chatIds;
		}

		if (Type.isStringFilled(folder.recentSection) || Type.isNull(folder.recentSection))
		{
			result.recentSection = folder.recentSection;
		}

		return result;
	}

	module.exports = { validateFolder };
});
