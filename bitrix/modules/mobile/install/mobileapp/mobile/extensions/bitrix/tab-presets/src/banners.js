/**
 * @module tab-presets/src/banners
 */
jn.define('tab-presets/src/banners', (require, exports, module) => {
	const { Loc } = require('loc');
	const { makeLibraryImagePath } = require('asset-manager');
	const { Text4 } = require('ui-system/typography/text');
	const { CardBanner } = require('ui-system/blocks/banners/card-banner');

	const CARD_SIZE = {
		width: 84,
		height: 84,
	};

	function PresetBanner(props)
	{
		const { testId } = props;

		return CardBanner({
			testId: `${testId}-preset-banner`,
			description: Loc.getMessage('TAB_PRESETS_PRESET_BANNER_DESCRIPTION'),
			hideCross: true,
			descriptionTypography: Text4,
			image: Image({
				resizeMode: 'contain',
				style: CARD_SIZE,
				uri: makeLibraryImagePath('preset-banner.png', 'graphic'),
			}),
		});
	}

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
