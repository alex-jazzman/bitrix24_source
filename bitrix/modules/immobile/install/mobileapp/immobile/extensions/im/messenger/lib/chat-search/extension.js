/**
 * @module im/messenger/lib/chat-search
 */
jn.define('im/messenger/lib/chat-search', (require, exports, module) => {
	const { ChatSearchSelector } = require('im/messenger/lib/chat-search/src/selector');
	const { ChatSearchProvider } = require('im/messenger/lib/chat-search/src/provider');
	const { ChatSearchConfig } = require('im/messenger/lib/chat-search/src/config');
	const { getWordsFromText } = require('im/messenger/lib/chat-search/src/helper/get-words-from-text');

	module.exports = {
		ChatSearchSelector,
		ChatSearchProvider,
		ChatSearchConfig,
		getWordsFromText,
	};
});
