/**
 * @module im/messenger/controller/recent/service/empty-state/lib/welcome-screen/nested
 */
jn.define('im/messenger/controller/recent/service/empty-state/lib/welcome-screen/nested',(require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { RecentTab, ActionByUserType } = require('im/messenger/const');
	const { IconType } = require('im/messenger/assets/icon');
	const { UserPermission } = require('im/messenger/lib/permission-manager');

	const { WelcomeScreen } = require('im/messenger/lib/widget/chat-recent/welcome-screen');
	const { ZefirWelcomeScreen } = require('im/messenger/controller/recent/service/empty-state/lib/layout/zefir');

	/**
	 * @implements IWelcomeScreen
	 * @class NestedChatWelcomeScreen
	 */
	class NestedChatWelcomeScreen
	{
		constructor(props)
		{
			this.props = props;
		}

		toChatRecentWidgetItem()
		{
			const params = this.getWelcomeScreenParams(this.props.recentSection);
			const welcomeScreen = WelcomeScreen.create()
				.setUpperText(params.title)
				.setLowerText(params.description)
				.setIconName('ws_channels')
			;

			return welcomeScreen.toChatRecentWidgetItem();
		}

		/**
		 * @param recentSection
		 * @return {{title: string, description: string, iconType: string, showArrow: boolean}}
		 */
		getWelcomeScreenParams(recentSection)
		{
			const showArrow = UserPermission.canPerformActionByUserType(ActionByUserType.createChat);

			switch (recentSection)
			{
				case RecentTab.collabChat:
					return {
						title: Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_NESTED_CHAT_TITLE'),
						description: Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_NESTED_CHAT_TEXT'),
						iconType: IconType.projectEmptyState,
						showArrow,
					};
				case RecentTab.copilot:
					return {
						title: Loc.getMessageWithCopilotBotName('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_NESTED_COPILOT_TITLE'),
						description: Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_NESTED_COPILOT_TEXT'),
						iconType: IconType.copilotEmptyState,
						showArrow,
					};
				case RecentTab.tasksTask:
					return {
						title: Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_NESTED_TASK_TITLE'),
						description: Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_NESTED_TASK_TEXT'),
						iconType: IconType.taskEmptyState,
						showArrow,
					};
				case RecentTab.calendar:
					return {
						title: Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_NESTED_CALENDAR_TITLE'),
						description: Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_NESTED_CALENDAR_TEXT'),
						iconType: IconType.calendarEmptyState,
						showArrow,
					};
				default:
					return {
						title: '',
						description: '',
						iconType: IconType.projectEmptyState,
						showArrow,
					}
			}
		}

		isLayoutComponentSupported()
		{
			return true;
		}

		toLayoutComponent()
		{
			const params = this.getWelcomeScreenParams(this.props.recentSection);

			return new ZefirWelcomeScreen(params);
		}
	}

	module.exports = NestedChatWelcomeScreen;
});
