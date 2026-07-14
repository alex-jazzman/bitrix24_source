/**
 * @module im/messenger/lib/chat-search
 */
jn.define('im/messenger/lib/chat-search', (require, exports, module) => {
	const { ChatSearchSelector } = require('im/messenger/lib/chat-search/src/selector');
	const { ChatSearchProvider } = require('im/messenger/lib/chat-search/src/provider');
	const { ChatSearchConfig } = require('im/messenger/lib/chat-search/src/config');
	const { getWordsFromText } = require('im/messenger/lib/chat-search/src/helper/get-words-from-text');

	const {
		RecentSectionLocalSearchStrategy,
	} = require('im/messenger/lib/chat-search/src/strategy/local/recent-section-local-search-strategy');
	const {
		DialogLocalSearchStrategy,
	} = require('im/messenger/lib/chat-search/src/strategy/local/dialog-local-search-strategy');
	const {
		UserLocalSearchStrategy,
	} = require('im/messenger/lib/chat-search/src/strategy/local/user-local-search-strategy');
	const {
		CompositeLocalSearchStrategy,
	} = require('im/messenger/lib/chat-search/src/strategy/local/composite-local-search-strategy');
	const {
		VuexLocalSearchStrategy,
	} = require('im/messenger/lib/chat-search/src/strategy/local/vuex-local-search-strategy');
	const {
		DefaultServerSearchStrategy,
	} = require('im/messenger/lib/chat-search/src/strategy/server/default-server-search-strategy');

	module.exports = {
		ChatSearchSelector,
		ChatSearchProvider,
		ChatSearchConfig,
		getWordsFromText,

		RecentSectionLocalSearchStrategy,
		DialogLocalSearchStrategy,
		UserLocalSearchStrategy,
		CompositeLocalSearchStrategy,
		VuexLocalSearchStrategy,
		DefaultServerSearchStrategy,
	};
});
