/**
 * @module im/messenger/controller/recent/service/empty-state/lib/welcome-screen/copilot
 */
jn.define('im/messenger/controller/recent/service/empty-state/lib/welcome-screen/copilot', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { MessengerParams } = require('im/messenger/lib/params');

	const { openChatCreateByActiveRecentTab } = require('im/messenger/lib/open-chat-create');
	const { WelcomeScreen } = require('im/messenger/lib/widget/chat-recent/welcome-screen');

	/**
	 * @class CopilotWelcomeScreen
	 */
	class CopilotWelcomeScreen
	{
		constructor()
		{
			this.welcomeScreen = WelcomeScreen.create()
				.setUpperText(MessengerParams.getCopilotBotName())
				.setLowerText(Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_COPILOT_TEXT'))
				.setIconName('ws_copilot')
				.setListener(openChatCreateByActiveRecentTab)
			;
		}

		toChatRecentWidgetItem()
		{
			return this.welcomeScreen.toChatRecentWidgetItem();
		}
	}

	module.exports = CopilotWelcomeScreen;
});
