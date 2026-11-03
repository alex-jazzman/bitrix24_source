/**
 * @module tab-presets/managed/src/managed/banner
 */
jn.define('tab-presets/managed/src/managed/banner', (require, exports, module) => {
	const { Loc } = require('loc');
	const { makeLibraryImagePath } = require('asset-manager');
	const { Text4 } = require('ui-system/typography/text');
	const { CardBanner } = require('ui-system/blocks/banners/card-banner');

	const CARD_SIZE = {
		width: 84,
		height: 84,
	};

	/**
	 * @param {PresetBannerProps} props
	 * @return {ReturnType<typeof CardBanner>}
	 */
	function PresetBanner(props)
	{
		const { testId, description = Loc.getMessage('TAB_PRESETS_PRESET_BANNER_DESCRIPTION') } = props;

		return CardBanner({
			testId: `${testId}-preset-banner`,
			description,
			hideCross: true,
			descriptionTypography: Text4,
			image: Image({
				resizeMode: 'contain',
				style: CARD_SIZE,
				uri: makeLibraryImagePath('preset-banner.png', 'graphic'),
			}),
		});
	}

	/**
	 * @param {ManualBannerProps} props
	 * @return {ReturnType<typeof CardBanner>}
	 */
	function ManualBanner(props)
	{
		const { testId } = props;

		return CardBanner({
			testId: `${testId}-manual-banner`,
			description: Loc.getMessage('TAB_PRESETS_MANUAL_BANNER_DESCRIPTION'),
			hideCross: true,
			descriptionTypography: Text4,
			image: Image({
				resizeMode: 'contain',
				style: CARD_SIZE,
				uri: makeLibraryImagePath('manual-preset-banner.png', 'graphic'),
			}),
		});
	}

	module.exports = {
		ManualBanner,
		PresetBanner,
	};
});
