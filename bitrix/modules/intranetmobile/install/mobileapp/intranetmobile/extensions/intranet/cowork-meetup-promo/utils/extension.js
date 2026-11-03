/**
 * @module intranet/cowork-meetup-promo/utils
 */
jn.define('intranet/cowork-meetup-promo/utils', (require, exports, module) => {
	const { downloadImages } = require('asset-manager');
	const { withCurrentDomain } = require('utils/url');

	const ASSET_PATH = withCurrentDomain(
		'/bitrix/mobileapp/intranetmobile/extensions/intranet/cowork-meetup-promo/story/src/assets',
	);

	const ASSET_FILES = [
		'meetup-announce.png',
		'meetup-announce-glow.png',
		'cowork-code-workspace.png',
		'cowork-code-workspace-glow.png',
		'vibecode-analytics.png',
		'vibecode-analytics-glow.png',
	];

	/**
	 * @param {string} filename
	 * @returns {string}
	 */
	function getAssetUri(filename)
	{
		return `${ASSET_PATH}/${filename}`;
	}

	/**
	 * Slides turn over on their own, so the images have to reach the cache before the story opens.
	 * @returns {Promise<void>}
	 */
	function preloadPromoAssets()
	{
		return downloadImages(ASSET_FILES.map((filename) => getAssetUri(filename))).catch((error) => {
			console.error('CoworkMeetupPromo: asset preload failed', error);
		});
	}

	module.exports = {
		getAssetUri,
		preloadPromoAssets,
	};
});
