/**
 * @module im/messenger/controller/recent/service/empty-state/lib/welcome-screen/collab
 */
jn.define('im/messenger/controller/recent/service/empty-state/lib/welcome-screen/collab', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { ActionByUserType } = require('im/messenger/const');
	const { IconType } = require('im/messenger/assets/icon');
	const { UserPermission } = require('im/messenger/lib/permission-manager');

	const { openChatCreateByActiveRecentTab } = require('im/messenger/lib/open-chat-create');
	const { WelcomeScreen } = require('im/messenger/lib/widget/chat-recent/welcome-screen');
	const { ZefirWelcomeScreen } = require('im/messenger/controller/recent/service/empty-state/lib/layout/zefir');

	/**
	 * @implements IWelcomeScreen
	 * @class CollabWelcomeScreen
	 */
	class CollabWelcomeScreen
	{
		toChatRecentWidgetItem()
		{
			return WelcomeScreen.create()
				.setUpperText(Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_PROJECT_TITLE'))
				.setLowerText(Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_PROJECT_TEXT'))
				.setIconName('ws_collabs')
				.setListener(openChatCreateByActiveRecentTab)
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
				title: Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_PROJECT_TITLE'),
				description: Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_PROJECT_TEXT'),
				iconType: IconType.projectEmptyState,
				showArrow: UserPermission.canPerformActionByUserType(ActionByUserType.createCollab),
			});
		}
	}

	module.exports = CollabWelcomeScreen;
});
