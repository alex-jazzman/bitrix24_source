/**
 * @module im/messenger/controller/recent/service/empty-state/lib/welcome-screen/folder
 */
jn.define(
	'im/messenger/controller/recent/service/empty-state/lib/welcome-screen/folder',
	(require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { WelcomeScreen } = require('im/messenger/lib/widget/chat-recent/welcome-screen');

	class FolderWelcomeScreen
	{
		constructor()
		{
			this.welcomeScreen = WelcomeScreen.create()
				.setUpperText(Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_FOLDER_TITLE'))
				.setLowerText(Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_FOLDER_TEXT'))
				.setIconName('ws_employees')
			;
		}

		toChatRecentWidgetItem()
		{
			return this.welcomeScreen.toChatRecentWidgetItem();
		}
	}

	module.exports = FolderWelcomeScreen;
	},
);
