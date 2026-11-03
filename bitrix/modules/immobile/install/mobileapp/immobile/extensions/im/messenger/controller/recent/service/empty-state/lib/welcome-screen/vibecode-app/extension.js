/**
 * @module im/messenger/controller/recent/service/empty-state/lib/welcome-screen/vibecode-app
 */
jn.define('im/messenger/controller/recent/service/empty-state/lib/welcome-screen/vibecode-app', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { IconType } = require('im/messenger/assets/icon');
	const { WelcomeScreen } = require('im/messenger/lib/widget/chat-recent/welcome-screen');
	const { ZefirWelcomeScreen } = require('im/messenger/controller/recent/service/empty-state/lib/layout/zefir');

	/**
	 * @implements IWelcomeScreen
	 * @class VibecodeAppWelcomeScreen
	 */
	class VibecodeAppWelcomeScreen
	{
		toChatRecentWidgetItem()
		{
			return WelcomeScreen.create()
				.setUpperText(Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_VIBECODE_APP_TITLE'))
				.setLowerText(Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_VIBECODE_APP_TEXT'))
				.setIconName('ws_employees')
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
				title: Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_VIBECODE_APP_TITLE_V2'),
				description: Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_VIBECODE_APP_TEXT_V2'),
				iconType: IconType.chatEmptyState,
				showArrow: false,
			});
		}
	}

	module.exports = VibecodeAppWelcomeScreen;
});
