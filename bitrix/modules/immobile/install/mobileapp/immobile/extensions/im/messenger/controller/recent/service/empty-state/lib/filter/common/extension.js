/**
 * @module im/messenger/controller/recent/service/empty-state/lib/filter/common
 */
jn.define('im/messenger/controller/recent/service/empty-state/lib/filter/common', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');

	const { Feature } = require('im/messenger/lib/feature');
	const { WelcomeScreen } = require('im/messenger/lib/widget/chat-recent/welcome-screen');

	/**
	 * @class CommonFilterEmptyScreen
	 */
	class CommonFilterEmptyScreen
	{
		constructor()
		{
			const iconName = Feature.isEmptyFilterIconSupported ? 'ws_empty_filter' : 'ws_employees';
			const options = {
				upperText: Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_FILTER_TITLE'),
				lowerText: Loc.getMessage('IMMOBILE_RECENT_SERVICE_EMPTY_STATE_FILTER_TEXT'),
				iconName,
			};

			this.welcomeScreen = WelcomeScreen.create(options);
		}

		toChatRecentWidgetItem()
		{
			return this.welcomeScreen.toChatRecentWidgetItem();
		}
	}

	module.exports = CommonFilterEmptyScreen;
});
