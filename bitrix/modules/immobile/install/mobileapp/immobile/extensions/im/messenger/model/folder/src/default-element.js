/**
 * @module im/messenger/model/folder/src/default-element
 */
jn.define('im/messenger/model/folder/src/default-element', (require, exports, module) => {
	/** @type {FolderModelState} */
	const folderDefaultElement = Object.freeze({
		id: 0,
		parentChatId: 0, // 0 = user-global scope
		type: 'personal', // 'system' | 'personal'
		code: null, // 'default' | 'copilot' | 'collab' | ... | null (personal)
		title: '',
		description: '', // server-filled subtitle; empty for personal folders
		sort: 0,
		visible: true,
		chatIds: [], // membership — personal folders only
		recentSection: null, // 'default' | 'copilot' | ... — system folders only
		sourceFolders: [], // source folder codes - composite 'all' folder only
	});

	module.exports = {
		folderDefaultElement,
	};
});
