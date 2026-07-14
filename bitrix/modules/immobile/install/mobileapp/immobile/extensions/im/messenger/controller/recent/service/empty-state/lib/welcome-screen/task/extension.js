/**
 * @module im/messenger/controller/recent/service/empty-state/lib/welcome-screen/task
 */
jn.define('im/messenger/controller/recent/service/empty-state/lib/welcome-screen/task', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { IconType } = require('im/messenger/assets/icon');

	const { WelcomeScreen } = require('im/messenger/lib/widget/chat-recent/welcome-screen');
	const { ZefirWelcomeScreen } = require('im/messenger/controller/recent/service/empty-state/lib/layout/zefir');

	/**
	 * @implements IWelcomeScreen
	 * @class TaskWelcomeScreen
	 */
	class TaskWelcomeScreen
	{
		toChatRecentWidgetItem()
		{
			return WelcomeScreen.create()
				.setUpperText(Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_TASK_TITLE'))
				.setLowerText(Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_TASK_TEXT'))
				.setIconName('ws_chat_tasks')
				.toChatRecentWidgetItem()
			;
		}

		isLayoutComponentSupported()
		{
			return true;
		}

		toLayoutComponent()
		{
			return new ZefirWelcomeScreen({
				title: Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_TASK_TITLE_V2'),
				description: Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_TASK_TEXT_V2'),
				iconType: IconType.taskEmptyState,
				showArrow: true,
			});
		}
	}

	module.exports = TaskWelcomeScreen;
});
