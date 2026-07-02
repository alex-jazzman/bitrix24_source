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
		sort: 0,
		chatIds: [], // membership — personal folders only
		recentSection: null, // 'default' | 'copilot' | ... — system folders only
	});

	module.exports = {
		folderDefaultElement,
	};
});
