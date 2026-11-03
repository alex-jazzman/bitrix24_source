/**
 * @module im/messenger/const/src/folder
 */
jn.define('im/messenger/const/src/folder', (require, exports, module) => {
	const { Type } = require('type');
	const { FolderEligibility } = require('im/messenger/lib/folder-eligibility');

	const MAX_PERSONAL_FOLDERS = 20;
	const MAX_CHATS_PER_FOLDER = 50;
	const MAX_FOLDER_TITLE_LENGTH = 30;

	const getMaxPersonalFolders = () => {
		const { maxFolders } = FolderEligibility.getLimits();

		return Type.isInteger(maxFolders) && maxFolders > 0 ? maxFolders : MAX_PERSONAL_FOLDERS;
	};

	const getMaxChatsPerFolder = () => {
		const { maxChatsPerFolder } = FolderEligibility.getLimits();

		return Type.isInteger(maxChatsPerFolder) && maxChatsPerFolder > 0
			? maxChatsPerFolder
			: MAX_CHATS_PER_FOLDER
		;
	};

	const getMaxFolderTitleLength = () => {
		const { maxTitleLength } = FolderEligibility.getLimits();

		return Type.isInteger(maxTitleLength) && maxTitleLength > 0
			? maxTitleLength
			: MAX_FOLDER_TITLE_LENGTH
		;
	};

	module.exports = {
		MAX_PERSONAL_FOLDERS,
		getMaxPersonalFolders,
		getMaxChatsPerFolder,
		getMaxFolderTitleLength,
	};
});
