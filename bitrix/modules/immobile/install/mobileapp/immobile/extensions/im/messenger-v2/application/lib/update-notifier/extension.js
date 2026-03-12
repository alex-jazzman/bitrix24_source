/**
 * @module im/messenger-v2/application/lib/update-notifier
 */
jn.define('im/messenger-v2/application/lib/update-notifier', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { Feature } = require('im/messenger/lib/feature');
	const isUnsupportedAndroid = (
		Application.getPlatform() === 'android'
		&& parseInt(device.version, 10) < 10
	);

	function showUpdateAppScreenIfNeeded()
	{
		if (isUnsupportedAndroid)
		{
			return false;
		}

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
