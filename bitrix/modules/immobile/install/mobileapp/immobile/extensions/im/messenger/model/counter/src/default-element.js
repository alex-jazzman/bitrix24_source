/**
 * @module im/messenger/model/counter/src/default-element
 */
jn.define('im/messenger/model/counter/src/default-element', (require, exports, module) => {
	/** @type {CounterModelState} */
	const counterDefaultElement = Object.freeze({
		chatId: 0,
		parentChatId: 0,
		counter: 0,
		recentSections: [],
		isMarkedAsUnread: false,
		isMuted: false,
	});

	module.exports = {
		counterDefaultElement,
	};
});
