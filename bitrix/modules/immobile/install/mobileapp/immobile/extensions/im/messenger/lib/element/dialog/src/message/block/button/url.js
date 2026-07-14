/**
 * @module im/messenger/lib/element/dialog/message/block/button/url
 */
jn.define('im/messenger/lib/element/dialog/message/block/button/url', (require, exports, module) => {
	const { inAppUrl } = require('in-app-url');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const logger = getLoggerWithContext('dialog-element--custom-message', 'UrlButton');

	/**
	 * @class UrlButton
	 */
	class UrlButton
	{
		/**
		 * @param {string} url - URL to open
		 * @return {UrlButtonMetaData}
		 */
		static getMeta(url)
		{
			return {
				callback: () => {
					try
					{
						inAppUrl.open(url);
					}
					catch (error)
					{
						logger.error('UrlButton.openUrl callback error:', error);
					}
				},
			};
		}
	}

	module.exports = {
		UrlButton,
	};
});
