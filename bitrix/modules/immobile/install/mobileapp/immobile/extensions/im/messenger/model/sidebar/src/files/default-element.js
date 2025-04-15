/**
 * @module im/messenger/model/sidebar/files/default-element
 */

jn.define('im/messenger/model/sidebar/files/default-element', (require, exports, module) => {
	const fileItem = {
		id: 0,
		messageId: 0,
		chatId: 0,
		authorId: 0,
		dateCreate: new Date(),
		fileId: 0,
	};

	function fileDefaultElement()
	{
		return {
			items: new Map(),
			hasNextPage: true,
			isHistoryLimitExceeded: false,
		};
	}

	module.exports = {
		fileDefaultElement,
		fileItem,
	};
});
