/**
 * @module in-app-url
 */
jn.define('in-app-url', (require, exports, module) => {
	const { InAppUrl } = require('in-app-url/src/in-app-url');
	const { extensions } = require('in-app-url/src/in-app-extensions');
	const { loadExtensions } = require('require-lazy/extension-loader');

	const inAppUrl = new InAppUrl();

	void loadExtensions({
		extensions,
		context: inAppUrl,
		logPrefix: 'in-app-url',
	});

	module.exports = { inAppUrl };
});
