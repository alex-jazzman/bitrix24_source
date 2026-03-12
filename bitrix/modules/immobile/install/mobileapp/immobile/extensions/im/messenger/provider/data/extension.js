/**
 * @module im/messenger/provider/data
 */
jn.define('im/messenger/provider/data', (require, exports, module) => {
	const { ChatDataProvider } = require('im/messenger/provider/data/chat');
	const { RecentDataProvider } = require('im/messenger/provider/data/recent');
	const { DataProviderResult } = require('im/messenger/provider/data/result');
	const { MessageDataProvider } = require('im/messenger/provider/data/message');
	const { ReactionDataProvider } = require('im/messenger/provider/data/reaction');
	const { StickerDataProvider } = require('im/messenger/provider/data/sticker');

	module.exports = {
		ChatDataProvider,
		RecentDataProvider,
		MessageDataProvider,
		ReactionDataProvider,
		StickerDataProvider,

		DataProviderResult,
	};
});
