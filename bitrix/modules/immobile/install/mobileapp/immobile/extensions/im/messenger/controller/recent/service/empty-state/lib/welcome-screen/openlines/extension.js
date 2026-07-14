/**
 * @module im/messenger/controller/recent/service/empty-state/lib/welcome-screen/openlines
 */
jn.define('im/messenger/controller/recent/service/empty-state/lib/welcome-screen/openlines', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { IconType } = require('im/messenger/assets/icon');

	const { WelcomeScreen } = require('im/messenger/lib/widget/chat-recent/welcome-screen');
	const { ZefirWelcomeScreen } = require('im/messenger/controller/recent/service/empty-state/lib/layout/zefir');

	/**
	 * @implements IWelcomeScreen
	 * @class OpenlinesWelcomeScreen
	 */
	class OpenlinesWelcomeScreen
	{
		toChatRecentWidgetItem()
		{
			return WelcomeScreen.create()
				.setUpperText(Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_OPENLINE_TITLE'))
				.setLowerText(Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_OPENLINE_TEXT'))
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
				title: Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_OPENLINE_TITLE'),
				description: Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_OPENLINE_TEXT'),
				iconType: IconType.chatEmptyState,
				showArrow: false,
			});
		}
	}

	module.exports = OpenlinesWelcomeScreen;
});
