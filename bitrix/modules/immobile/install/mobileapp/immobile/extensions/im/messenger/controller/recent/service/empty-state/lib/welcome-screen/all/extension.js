/**
 * @module im/messenger/controller/recent/service/empty-state/lib/welcome-screen/all
 */
jn.define('im/messenger/controller/recent/service/empty-state/lib/welcome-screen/all', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { ActionByUserType } = require('im/messenger/const');
	const { IconType } = require('im/messenger/assets/icon');
	const { UserPermission } = require('im/messenger/lib/permission-manager');

	const { openChatCreateByActiveRecentTab } = require('im/messenger/lib/open-chat-create');
	const { WelcomeScreen } = require('im/messenger/lib/widget/chat-recent/welcome-screen');
	const { ZefirWelcomeScreen } = require('im/messenger/controller/recent/service/empty-state/lib/layout/zefir');

	/**
	 * Empty state of the "All" folder, the only main section of the messenger: the screen calls to
	 * start a chat and points at the floating button, the same way the "Chats" tab it replaces does.
	 *
	 * @implements IWelcomeScreen
	 * @class AllWelcomeScreen
	 */
	class AllWelcomeScreen
	{
		toChatRecentWidgetItem()
		{
			return WelcomeScreen.create({
				upperText: Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_ALL_TITLE'),
				lowerText: Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_ALL_TEXT'),
				iconName: 'ws_employees',
				listener: openChatCreateByActiveRecentTab,
				startChatButton: {
					text: Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_ALL_BUTTON'),
					iconName: 'ws_plus',
				},
			}).toChatRecentWidgetItem();
		}

		isLayoutComponentSupported()
		{
			return true;
		}

		toLayoutComponent()
		{
			return new ZefirWelcomeScreen({
				title: Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_ALL_TITLE'),
				description: Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_ALL_TEXT'),
				iconType: IconType.chatEmptyState,
				showArrow: AllWelcomeScreen.canCreateChat(),
			});
		}

		/**
		 * The arrow points at the floating button, so it is drawn exactly when that button is: the
		 * condition repeats the one the tab gives its floating-button service.
		 *
		 * @return {boolean}
		 */
		static canCreateChat()
		{
			return UserPermission.canPerformActionByUserType(ActionByUserType.createChat)
				|| UserPermission.canPerformActionByUserType(ActionByUserType.createChannel)
				|| UserPermission.canPerformActionByUserType(ActionByUserType.createCollab);
		}
	}

	module.exports = AllWelcomeScreen;
});
