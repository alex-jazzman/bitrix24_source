/**
 * @module in-app-url/deeplink
 */
jn.define('in-app-url/deeplink', (require, exports, module) => {
	const { inAppUrl } = require('in-app-url');
	const { isValidAuthUrl, openExternalAuth } = require('qrauth/utils');

	/**
	 * @param {UniversalLinkData} data
	 */
	function openDeeplink(data)
	{
		const url = data.url;
		if (!url)
		{
			return;
		}

		if (isValidAuthUrl(url))
		{
			openExternalAuth(data);

			return;
		}

		if (url)
		{
			inAppUrl.open(url, {
				...data,
				deeplink: true,
			});
		}
	}

	function registerDeeplink()
	{
		Application.on('universalLinkReceived', openDeeplink);
		const unhandled = Application.getUnhandledUniversalLink();
		if (unhandled)
		{
			openDeeplink(unhandled);
		}
	}

	module.exports = {
		registerDeeplink,
	};
});
