/**
 * @module im/messenger/controller/recent/service/empty-state/lib/welcome-screen/copilot
 */
jn.define('im/messenger/controller/recent/service/empty-state/lib/welcome-screen/copilot', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { IconType } = require('im/messenger/assets/icon');

	const { openChatCreateByActiveRecentTab } = require('im/messenger/lib/open-chat-create');
	const { WelcomeScreen } = require('im/messenger/lib/widget/chat-recent/welcome-screen');
	const { ZefirWelcomeScreen } = require('im/messenger/controller/recent/service/empty-state/lib/layout/zefir');

	/**
	 * @implements IWelcomeScreen
	 * @class CopilotWelcomeScreen
	 */
	class CopilotWelcomeScreen
	{
		toChatRecentWidgetItem()
		{
			return WelcomeScreen.create()
				.setUpperText(MessengerParams.getCopilotBotName())
				.setLowerText(Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_COPILOT_TEXT_V2'))
				.setIconName('bitrix_gpt')
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
				title: MessengerParams.getCopilotBotName(),
				description: Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_COPILOT_TEXT_V2'),
				iconType: IconType.copilotEmptyState,
				showArrow: true,
			});
		}
	}

	module.exports = CopilotWelcomeScreen;
});
