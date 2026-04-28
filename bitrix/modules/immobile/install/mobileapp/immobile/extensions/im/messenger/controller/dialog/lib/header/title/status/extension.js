/**
 * @module im/messenger/controller/dialog/lib/header/title/status
 */
jn.define('im/messenger/controller/dialog/lib/header/title/status', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { AppStatus } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	/**
	 * @param {JNWidgetTitleParams} titleParams
	 */
	function applyAppStatusToTitleParams(titleParams)
	{
		let detailLottie = null;
		const appStatus = serviceLocator.get('core').getAppStatus();
		switch (appStatus)
		{
			case AppStatus.networkWaiting:
				titleParams.detailText = Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_HEADER_TITLE_NETWORK_WAITING');
				break;

			case AppStatus.connection:
				titleParams.detailText = Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_HEADER_TITLE_CONNECTION');
				break;

			case AppStatus.sync:
				titleParams.detailText = Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_HEADER_TITLE_SYNC');
				break;

			default:
				detailLottie = titleParams.detailLottie;
				break;
		}

		titleParams.detailLottie = detailLottie;
	}

	module.exports = { applyAppStatusToTitleParams };
});
