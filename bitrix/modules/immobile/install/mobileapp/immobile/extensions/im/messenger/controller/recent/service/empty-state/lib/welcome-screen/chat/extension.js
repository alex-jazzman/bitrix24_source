/**
 * @module im/messenger/controller/recent/service/empty-state/lib/welcome-screen/chat
 */
jn.define('im/messenger/controller/recent/service/empty-state/lib/welcome-screen/chat', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');
	const { Loc } = require('im/messenger/loc');
	const { ActionByUserType } = require('im/messenger/const');
	const { IconType } = require('im/messenger/assets/icon');
	const { UserPermission } = require('im/messenger/lib/permission-manager');


	const { Feature } = require('im/messenger/lib/feature');
	const { openChatCreateByActiveRecentTab } = require('im/messenger/lib/open-chat-create');
	const { WelcomeScreen } = require('im/messenger/lib/widget/chat-recent/welcome-screen');
	const { ZefirWelcomeScreen } = require('im/messenger/controller/recent/service/empty-state/lib/layout/zefir');

	/**
	 * @class ChatWelcomeScreen
	 * @implements IWelcomeScreen
	 */
	class ChatWelcomeScreen
	{
		static openIntranetInvite = () => {
			const { openIntranetInviteWidget } = require('intranet/invite-opener-new');
			openIntranetInviteWidget?.({
				analytics: new AnalyticsEvent().setSection('chat'),
			});
		};

		toChatRecentWidgetItem()
		{
			let options = {};
			if (Feature.isIntranetInvitationAvailable)
			{
				options = {
					upperText: Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_CHAT_TITLE'),
					lowerText: Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_CHAT_TEXT_INVITE'),
					iconName: 'ws_employees',
					listener: ChatWelcomeScreen.openIntranetInvite,
				};
			}
			else
			{
				options = {
					upperText: Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_CHAT_TEXT_INVITE'),
					lowerText: Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_CHAT_TEXT_CREATE'),
					iconName: 'ws_employees',
					listener: openChatCreateByActiveRecentTab,
				};
			}

			options.startChatButton = {
				text: Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_CHAT_BUTTON'),
				iconName: 'ws_plus',
			};

			return WelcomeScreen.create(options).toChatRecentWidgetItem();
		}

		isLayoutComponentSupported()
		{
			return true;
		}

		toLayoutComponent()
		{
			return new ZefirWelcomeScreen({
				title: Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_CHAT_TITLE_V2'),
				description: Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_CHAT_TEXT_V2'),
				iconType: IconType.chatEmptyState,
				showArrow: UserPermission.canPerformActionByUserType(ActionByUserType.createChat)
					|| UserPermission.canPerformActionByUserType(ActionByUserType.createChannel)
					|| UserPermission.canPerformActionByUserType(ActionByUserType.createCollab),
			});
		}
	}

	module.exports = ChatWelcomeScreen;
});
