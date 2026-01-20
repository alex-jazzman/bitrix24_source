/**
 * @module intranet/results-year/story/src/constants
 */
jn.define('intranet/results-year/story/src/constants', (require, exports, module) => {
	const { withCurrentDomain } = require('utils/url');

	const ASSET_PATH = withCurrentDomain('/bitrix/mobileapp/intranetmobile/extensions/intranet/results-year/story/src/assets');

	module.exports = {
		ASSET_PATH,
	};
});
