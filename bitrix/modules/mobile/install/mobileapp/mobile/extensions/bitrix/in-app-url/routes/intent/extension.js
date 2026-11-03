/**
 * @module in-app-url/routes/intent
 */
jn.define('in-app-url/routes/intent', (require, exports, module) => {
	const { applyIntentCode } = require('intent/entry');
	const { openPortalPage } = require('in-app-url/portal-page');

	const INTENT_PARTS_DELIMITER = ';';

	/**
	 * @param {InAppUrl} inAppUrl
	 */
	module.exports = (inAppUrl) => {
		inAppUrl
			.addRoute('/\\?intent=:intent')
			.handler(({ intent }, { url, context, queryParams }) => {
				// the value carries the code and the one-time hash: the hash belongs to the native
				// authentication and the application layer neither uses nor passes it further.
				// The parsed parameter is decoded, the raw capture of the pattern is not
				const value = queryParams?.intent ?? intent;
				const [code] = String(value).split(INTENT_PARTS_DELIMITER);

				if (applyIntentCode(code))
				{
					return;
				}

				// the portal issues codes beyond the registry as well (network, bizproc, mobapp_popup):
				// they have no section of their own, so the address opens as a portal page
				console.error(`in-app-url/routes/intent: no action registered for intent code "${code}" (${url})`);
				openPortalPage(url, context);
			})
			.name('intent:code');
	};
});
