/**
 * @module im/messenger/model/dialogues/openlines/default-element
 */

jn.define('im/messenger/model/dialogues/openlines/default-element', (require, exports, module) => {
	const { OpenlineStatus } = require('im/messenger/const');
	const openLineDefaultElement = Object.freeze({
		id: 0,
		operatorId: 0,
		chatId: 0,
		status: OpenlineStatus.new,
		queueId: 0,
		pinned: false,
		isClosed: true,
	});

	module.exports = {
		openLineDefaultElement,
	};
});
