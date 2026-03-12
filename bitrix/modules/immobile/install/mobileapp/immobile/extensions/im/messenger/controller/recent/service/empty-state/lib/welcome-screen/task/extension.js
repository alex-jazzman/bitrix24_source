/**
 * @module im/messenger/controller/recent/service/empty-state/lib/welcome-screen/task
 */
jn.define('im/messenger/controller/recent/service/empty-state/lib/welcome-screen/task', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');

	const { WelcomeScreen } = require('im/messenger/lib/widget/chat-recent/welcome-screen');

	/**
	 * @class TaskWelcomeScreen
	 */
	class TaskWelcomeScreen
	{
		constructor()
		{
			this.welcomeScreen = WelcomeScreen.create()
				.setUpperText(Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_TASK_TITLE'))
				.setLowerText(Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_TASK_TEXT'))
				.setIconName('ws_chat_tasks')
			;
		}

		toChatRecentWidgetItem()
		{
			return this.welcomeScreen.toChatRecentWidgetItem();
		}
	}

	module.exports = TaskWelcomeScreen;
});
