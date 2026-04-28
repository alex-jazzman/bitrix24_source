/**
 * @module im/messenger/controller/dialog/lib/mention/config
 */
jn.define('im/messenger/controller/dialog/lib/mention/config', (require, exports, module) => {

	const { ChatSearchConfig } = require('im/messenger/lib/chat-search');

	class MentionConfig extends ChatSearchConfig
	{
		constructor()
		{
			super();
			this.id = 'search-experimental';
			this.clearUnavailableItems = false;
			this.context = 'IM_CHAT_SEARCH';
			this.preselectedItems = [];
			this.entities = [
				{
					id: 'im-recent-v2',
					dynamicSearch: true,
					dynamicLoad: true,
				},
			];
		}

		getConfig()
		{
			/** @type {ajaxConfig} */
			return {
				json: {
					dialog: {
						entities: this.entities,
						preselectedItems: this.preselectedItems,
						clearUnavailableItems: this.clearUnavailableItems,
						context: this.context,
						id: this.id,
					},
				},
			};
		}
	}

	module.exports = { MentionConfig };
});
