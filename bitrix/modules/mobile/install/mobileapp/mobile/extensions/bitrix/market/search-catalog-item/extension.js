/**
 * @module market/search-catalog-item
 */
jn.define('market/search-catalog-item', (require, exports, module) => {
	const { createTestIdGenerator } = require('utils/test');
	const { normalizeHexColor, resolveTestIdPrefix } = require('market/utils');
	const { Color, Component, Indent } = require('tokens');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Text4, Text6 } = require('ui-system/typography/text');

	const ITEM_VERTICAL_PADDING = Indent.L.toNumber();
	const ITEM_SIDE_PADDING = Component.paddingLr.toNumber();
	const ITEM_IMAGE_SIZE = 68;
	const ITEM_IMAGE_RADIUS = 100;
	const ITEM_META_MARGIN_TOP = Indent.XS.toNumber();
	const ITEM_SEPARATOR_HEIGHT = Component.separatorStroke.toNumber();

	function resolveBackgroundColor(value = '')
	{
		return normalizeHexColor(value, Color.accentSoftBlue2.toHex());
	}

	class MarketSearchCatalogItem extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

				this.getTestId = createTestIdGenerator({
					prefix: resolveTestIdPrefix(
						props.testId,
						props.category?.code ?? props.category?.id,
						'market-search-category',
						'market-search-category-item',
					),
				});
			}

		getCategory()
		{
			return this.props.category ?? {};
		}

		isLastItem()
		{
			return (this.props.category?.isLast ?? this.props.isLast) === true;
		}

		render()
		{
			const category = this.getCategory();
			const bottomPadding = Number(this.props.contentBottomPadding ?? 0);
			const isLast = this.isLastItem();

			return View(
				{
					testId: this.getTestId(),
					onClick: this.props.onClick,
					style: {
						backgroundColor: Color.bgContentPrimary.toHex(),
						paddingHorizontal: ITEM_SIDE_PADDING,
						paddingTop: ITEM_VERTICAL_PADDING,
						paddingBottom: ITEM_VERTICAL_PADDING + (isLast ? bottomPadding : 0),
						borderBottomWidth: isLast ? 0 : ITEM_SEPARATOR_HEIGHT,
						borderBottomColor: Color.base7.toHex(),
					},
				},
				View(
					{
						style: {
							flexDirection: 'row',
							alignItems: 'center',
						},
					},
					View(
						{
							style: {
								width: ITEM_IMAGE_SIZE,
								height: ITEM_IMAGE_SIZE,
								borderRadius: ITEM_IMAGE_RADIUS,
								backgroundColor: resolveBackgroundColor(category.color),
								alignItems: 'center',
								justifyContent: 'center',
							},
						},
						IconView({
							testId: this.getTestId('image-placeholder'),
							icon: Icon.APPS,
							size: 40,
							color: Color.baseWhiteFixed,
						}),
					),
					View(
						{
							style: {
								flex: 1,
								marginLeft: Indent.L.toNumber(),
							},
						},
						Text4({
							testId: this.getTestId('title'),
							text: String(category.title ?? ''),
							accent: true,
							numberOfLines: 1,
							ellipsize: 'end',
						}),
						View(
							{
								style: {
									flexDirection: 'row',
									alignItems: 'center',
									marginTop: ITEM_META_MARGIN_TOP,
								},
							},
							IconView({
								testId: this.getTestId('count-icon'),
								icon: Icon.DOWNLOAD,
								size: 16,
								color: Color.base5,
							}),
							Text6({
								testId: this.getTestId('count'),
								text: this.formatCount(category.appsCount),
								color: Color.base4,
								style: {
									marginLeft: Indent.XS.toNumber(),
								},
							}),
						),
					),
					View(
						{
							style: {
								marginLeft: Indent.S.toNumber(),
								alignSelf: 'center',
							},
						},
						IconView({
							testId: this.getTestId('chevron'),
							icon: Icon.CHEVRON_TO_THE_RIGHT,
							size: 24,
							color: Color.base5,
						}),
					),
				),
			);
		}

		formatCount(value)
		{
			const normalizedValue = Number(value);

			if (!Number.isFinite(normalizedValue) || normalizedValue <= 0)
			{
				return '0';
			}

			return String(normalizedValue);
		}
	}

	module.exports = {
		MarketSearchCatalogItem: (props) => new MarketSearchCatalogItem(props),
	};
});
