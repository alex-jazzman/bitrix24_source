/**
 * @module im/messenger/model/counter/default-element
 */

jn.define('im/messenger/model/counter/default-element', (require, exports, module) => {
	const counterDefaultElement = Object.freeze({
		chatId: 0,
		parentChatId: 0,
		type: 'CHAT',
		counter: 0,
	});

	module.exports = {
		counterDefaultElement,
	};
});
