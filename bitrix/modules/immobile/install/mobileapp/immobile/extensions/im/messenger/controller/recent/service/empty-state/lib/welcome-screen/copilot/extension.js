/**
 * @module im/messenger/controller/recent/service/empty-state/lib/welcome-screen/copilot
 */
jn.define('im/messenger/controller/recent/service/empty-state/lib/welcome-screen/copilot', (require, exports, module) => {
	const { MessengerParams } = require('im/messenger/lib/params');
	const { IconType } = require('im/messenger/assets/icon');

	const { openChatCreateByActiveRecentTab } = require('im/messenger/lib/open-chat-create');
	const { WelcomeScreen } = require('im/messenger/lib/widget/chat-recent/welcome-screen');
	const { ZefirWelcomeScreen } = require('im/messenger/controller/recent/service/empty-state/lib/layout/zefir');
	const {
		GreetingSelector,
	} = require('im/messenger/controller/recent/service/empty-state/lib/welcome-screen/copilot/greeting-selector');

	/**
	 * @implements IWelcomeScreen
	 * @class CopilotWelcomeScreen
	 */
	class CopilotWelcomeScreen
	{
		constructor()
		{
			const messages = MessengerParams.get('MESSAGES', {});
			this.greeting = new GreetingSelector(messages.COPILOT_GREETINGS ?? [], {
				weekHolidays: messages.COPILOT_GREETING_WEEK_HOLIDAYS ?? [],
			}).select();
		}

		toChatRecentWidgetItem()
		{
			return WelcomeScreen.create()
				.setUpperText(MessengerParams.getCopilotBotName())
				.setLowerText(this.greeting)
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
				description: this.greeting,
				iconType: IconType.copilotEmptyState,
				showArrow: true,
			});
		}
	}

	module.exports = CopilotWelcomeScreen;
});
