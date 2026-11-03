/**
 * @module intranet/cowork-meetup-promo/story/src/slides-config
 */
jn.define('intranet/cowork-meetup-promo/story/src/slides-config', (require, exports, module) => {
	const { Loc } = require('loc');
	const { getAssetUri } = require('intranet/cowork-meetup-promo/utils');

	/**
	 * @returns {Array<{
	 *     id: string,
	 *     image: {uri: string, heightRatio: number},
	 *     glow: {uri: string, heightRatio: number},
	 *     title: string,
	 *     description: string,
	 * }>}
	 */
	function getSlidesConfig()
	{
		return [
			{
				id: 'announce',
				image: { uri: getAssetUri('meetup-announce.png'), heightRatio: 738 / 726 },
				glow: { uri: getAssetUri('meetup-announce-glow.png'), heightRatio: 691 / 375 },
				title: Loc.getMessage('M_INTRANET_COWORK_MEETUP_PROMO_ANNOUNCE_TITLE'),
				description: Loc.getMessage('M_INTRANET_COWORK_MEETUP_PROMO_ANNOUNCE_DESCRIPTION'),
			},
			{
				id: 'cowork-code',
				image: { uri: getAssetUri('cowork-code-workspace.png'), heightRatio: 738 / 735 },
				glow: { uri: getAssetUri('cowork-code-workspace-glow.png'), heightRatio: 640 / 375 },
				title: Loc.getMessage('M_INTRANET_COWORK_MEETUP_PROMO_COWORK_CODE_TITLE'),
				description: Loc.getMessage('M_INTRANET_COWORK_MEETUP_PROMO_COWORK_CODE_DESCRIPTION'),
			},
			{
				id: 'vibecode',
				image: { uri: getAssetUri('vibecode-analytics.png'), heightRatio: 738 / 734 },
				glow: { uri: getAssetUri('vibecode-analytics-glow.png'), heightRatio: 580 / 375 },
				title: Loc.getMessage('M_INTRANET_COWORK_MEETUP_PROMO_VIBECODE_TITLE'),
				description: Loc.getMessage('M_INTRANET_COWORK_MEETUP_PROMO_VIBECODE_DESCRIPTION'),
			},
		];
	}

	module.exports = {
		getSlidesConfig,
	};
});
