/**
 * @module im/messenger-v2/application/lib/update-notifier
 */
jn.define('im/messenger-v2/application/lib/update-notifier', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { Feature } = require('im/messenger/lib/feature');

	function showUpdateAppScreenIfNeeded()
	{
		if (Feature.isMessengerV2Enabled && !Feature.isTabsWidgetApiV2Supported)
		{
			Feature.showUnsupportedWidget({
				title: Loc.getMessage('IMMOBILE_MESSENGER_UPDATE_NOTIFIER_TITLE'),
				text: Loc.getMessage('IMMOBILE_MESSENGER_UPDATE_NOTIFIER_TEXT'),
				isOldBuild: true,
			});

			return true;
		}

		return false;
	}

	module.exports = { showUpdateAppScreenIfNeeded };
});
