/**
 * @module im/messenger/controller/recent/service/empty-state/lib/welcome-screen/collab
 */
jn.define('im/messenger/controller/recent/service/empty-state/lib/welcome-screen/collab', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');

	const { openChatCreateByActiveRecentTab } = require('im/messenger/lib/open-chat-create');
	const { WelcomeScreen } = require('im/messenger/lib/widget/chat-recent/welcome-screen');

	/**
	 * @class CollabWelcomeScreen
	 */
	class CollabWelcomeScreen
	{
		constructor()
		{
			this.welcomeScreen = WelcomeScreen.create()
				.setUpperText(Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_COLLAB_TITLE'))
				.setLowerText(Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_COLLAB_TEXT'))
				.setIconName('ws_collabs')
				.setListener(openChatCreateByActiveRecentTab)
			;
		}

		toChatRecentWidgetItem()
		{
			return this.welcomeScreen.toChatRecentWidgetItem();
		}
	}

	module.exports = CollabWelcomeScreen;
});
