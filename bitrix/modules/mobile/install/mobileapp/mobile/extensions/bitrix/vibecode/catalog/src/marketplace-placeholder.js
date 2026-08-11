/**
 * @module vibecode/catalog/src/marketplace-placeholder
 */
jn.define('vibecode/catalog/src/marketplace-placeholder', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Color, Component, Indent } = require('tokens');
	const { Box } = require('ui-system/layout/box');
	const { H4 } = require('ui-system/typography/heading');
	const { Text5 } = require('ui-system/typography/text');

	class VibeCodeCatalogMarketplacePlaceholder extends LayoutComponent
	{
		constructor(props = {})
		{
			super(props);
		}

		componentDidMount()
		{
			this.notifyHeaderUpdate();
		}

		getHeaderConfig()
		{
			return {
				title: Loc.getMessage('MOBILE_VIBECODE_CATALOG_MARKETPLACE_TAB'),
				rightButtons: [],
			};
		}

		notifyHeaderUpdate()
		{
			if (typeof this.props.onHeaderUpdate === 'function')
			{
				this.props.onHeaderUpdate(this.getHeaderConfig());
			}
		}

		render()
		{
			return Box(
				{
					testId: this.props.testId || 'vibecode-catalog-marketplace-placeholder',
					safeArea: {
						top: false,
						bottom: true,
					},
					style: {
						flex: 1,
						backgroundColor: Color.bgContentPrimary.toHex(),
						paddingHorizontal: Component.paddingLr.toNumber(),
						alignItems: 'center',
						justifyContent: 'center',
					},
				},
				H4({
					testId: `${this.props.testId || 'vibecode-catalog-marketplace-placeholder'}-title`,
					text: Loc.getMessage('MOBILE_VIBECODE_CATALOG_MARKETPLACE_PLACEHOLDER_TITLE'),
					style: {
						textAlign: 'center',
					},
				}),
				Text5({
					testId: `${this.props.testId || 'vibecode-catalog-marketplace-placeholder'}-description`,
					text: Loc.getMessage('MOBILE_VIBECODE_CATALOG_MARKETPLACE_PLACEHOLDER_DESCRIPTION'),
					color: Color.base3,
					style: {
						marginTop: Indent.M.toNumber(),
						textAlign: 'center',
					},
				}),
			);
		}
	}

	module.exports = {
		VibeCodeCatalogMarketplacePlaceholder: (props) => new VibeCodeCatalogMarketplacePlaceholder(props),
	};
});
