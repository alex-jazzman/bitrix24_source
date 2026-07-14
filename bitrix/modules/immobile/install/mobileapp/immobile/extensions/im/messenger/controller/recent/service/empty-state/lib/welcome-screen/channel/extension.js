/**
 * @module im/messenger/controller/recent/service/empty-state/lib/welcome-screen/channel
 */
jn.define('im/messenger/controller/recent/service/empty-state/lib/welcome-screen/channel', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { IconType } = require('im/messenger/assets/icon');

	const { openChatCreateByActiveRecentTab } = require('im/messenger/lib/open-chat-create');
	const { WelcomeScreen } = require('im/messenger/lib/widget/chat-recent/welcome-screen');
	const { ZefirWelcomeScreen } = require('im/messenger/controller/recent/service/empty-state/lib/layout/zefir');

	/**
	 * @class ChannelWelcomeScreen
	 * @implements IWelcomeScreen
	 */
	class ChannelWelcomeScreen
	{
		toChatRecentWidgetItem()
		{
			return WelcomeScreen.create()
				.setUpperText(Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_CHANNEL_TITLE'))
				.setLowerText(Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_CHANNEL_TEXT'))
				.setIconName('ws_channels')
				.setListener(openChatCreateByActiveRecentTab)
				.toChatRecentWidgetItem()
			;
		}

		toLayoutComponent()
		{
			return new ZefirWelcomeScreen({
				title: Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_CHANNEL_TITLE_V2'),
				description: Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_CHANNEL_TEXT_V2'),
				iconType: IconType.channelEmptyState,
				showArrow: true,
			})
		}

		isLayoutComponentSupported()
		{
			return true;
		}
	}

	module.exports = ChannelWelcomeScreen;
});
