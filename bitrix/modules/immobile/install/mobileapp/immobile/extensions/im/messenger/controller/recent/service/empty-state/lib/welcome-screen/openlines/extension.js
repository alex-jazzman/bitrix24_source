/**
 * @module im/messenger/controller/recent/service/empty-state/lib/welcome-screen/openlines
 */
jn.define('im/messenger/controller/recent/service/empty-state/lib/welcome-screen/openlines', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');

	const { WelcomeScreen } = require('im/messenger/lib/widget/chat-recent/welcome-screen');

	/**
	 * @class OpenlinesWelcomeScreen
	 */
	class OpenlinesWelcomeScreen
	{
		constructor()
		{
			this.welcomeScreen = WelcomeScreen.create()
				.setUpperText(Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_OPENLINE_TITLE'))
				.setLowerText(Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_OPENLINE_TEXT'))
				.setIconName('ws_employees')
			;
		}

		toChatRecentWidgetItem()
		{
			return this.welcomeScreen.toChatRecentWidgetItem();
		}
	}

	module.exports = OpenlinesWelcomeScreen;
});
