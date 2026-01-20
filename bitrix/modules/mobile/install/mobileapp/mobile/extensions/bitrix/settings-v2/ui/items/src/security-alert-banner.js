/**
 * @module settings-v2/ui/items/src/security-alert-banner
 */
jn.define('settings-v2/ui/items/src/security-alert-banner', (require, exports, module) => {
	const { createTestIdGenerator } = require('utils/test');
	const { CardBanner, CardDesign } = require('ui-system/blocks/banners/card-banner');
	const { Text4 } = require('ui-system/typography/text');
	const { SafeImage } = require('layout/ui/safe-image');
	const { ASSET_PATH } = require('settings-v2/const');
	const { Loc } = require('loc');
	const AppTheme = require('apptheme');

	const BANNER_ASSET_PATH = `${ASSET_PATH}banner/${AppTheme.id}`;

	class SecurityAlertBannerItem extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: 'settings-security-alert-banner-item',
				context: this,
			});

			this.state = {
				isVisible: !props.value,
			};
		}

		render()
		{
			return View(
				{
					style: {
						display: this.state.isVisible ? 'flex' : 'none',
					},
				},
				this.renderBanner(),
			);
		}

		renderBanner()
		{
			const { id } = this.props;

			return CardBanner({
				image: this.getImage(),
				testId: this.getTestId(id),
				description: Loc.getMessage('SETTINGS_V2_STRUCTURE_UI_ITEMS_SECURITY_ALERT_BANNER_TEXT'),
				descriptionTypography: Text4,
				hideCross: true,
				design: CardDesign.ALERT,
			});
		}

		getImage()
		{
			return SafeImage({
				uri: `${BANNER_ASSET_PATH}/alert.png`,
				withShimmer: true,
				style: {
					width: 54,
					height: 54,
				},
				resizeMode: 'contain',
			});
		}
	}

	module.exports = {
		SecurityAlertBannerItem,
	};
});
