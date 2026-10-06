/**
 * @module market/install/src/steps/base-step
 */
jn.define('market/install/src/steps/base-step', (require, exports, module) => {
	const { makeLibraryImagePath } = require('asset-manager');
	const { PureComponent } = require('layout/pure-component');
	const { Color, Indent } = require('tokens');
	const { Text4 } = require('ui-system/typography/text');

	const MARKET_INSTALL_ASSET_FOLDER = 'market/install';
	const PROMO_ICON_SIZE = 64;

	class MarketInstallBaseStep extends PureComponent
	{
		getStepId()
		{
			return 'base';
		}

		getStepStyle()
		{
			return {};
		}

		getHeaderConfig()
		{
			return null;
		}

		getTestId(suffix)
		{
			return this.props.getTestId(suffix);
		}

		getAssetPath(fileName)
		{
			return makeLibraryImagePath(fileName, MARKET_INSTALL_ASSET_FOLDER, undefined, false);
		}

		render()
		{
			const props = {
				testId: this.getTestId(`${this.getStepId()}-step`),
				style: this.getStepStyle(),
			};

			return View(
				props,
				this.renderHeader(),
				this.renderContent(),
			);
		}

		renderHeader()
		{
			const headerConfig = this.getHeaderConfig();

			if (!headerConfig)
			{
				return null;
			}

			return this.renderPromo(headerConfig);
		}

		renderContent()
		{
			return null;
		}

		renderPromo({
			id,
			iconName,
			text,
			paddingTop = Indent.M.toNumber(),
			paddingBottom = Indent.M.toNumber(),
		})
		{
			return View(
				{
					testId: this.getTestId(`${id}-promo`),
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						paddingHorizontal: Indent.XL3.toNumber(),
						paddingTop,
						paddingBottom,
					},
				},
				Image({
					testId: this.getTestId(`${id}-promo-icon`),
					uri: this.getAssetPath(iconName),
					resizeMode: 'contain',
					style: {
						width: PROMO_ICON_SIZE,
						height: PROMO_ICON_SIZE,
					},
				}),
				Text4({
					testId: this.getTestId(`${id}-promo-text`),
					text,
					color: Color.base2,
					style: {
						flex: 1,
						marginLeft: Indent.XL.toNumber(),
					},
				}),
			);
		}
	}

	module.exports = {
		MarketInstallBaseStep,
	};
});
