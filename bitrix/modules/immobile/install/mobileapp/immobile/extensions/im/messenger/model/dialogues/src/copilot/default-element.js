/**
 * @module im/messenger/model/dialogues/copilot/default-element
 */
jn.define('im/messenger/model/dialogues/copilot/default-element', (require, exports, module) => {
	const copilotDefaultElement = Object.freeze({
		dialogId: 'chat0',
		roles: {},
		/** @deprecated Property aiProvider - is deprecated and will be removed in future versions. */
		aiProvider: '',
		engine: {},
		chats: [],
		messages: [],
		changeEngine: false,
	});

	module.exports = {
		copilotDefaultElement,
	};
});
