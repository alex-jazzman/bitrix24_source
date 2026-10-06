/**
 * @module market/app-list-item
 */
jn.define('market/app-list-item', (require, exports, module) => {
	const { createTestIdGenerator } = require('utils/test');
	const { normalizeImageUrl, resolveTestIdPrefix } = require('market/utils');
	const { Color, Component, Corner, Indent } = require('tokens');
	const { SafeImage } = require('layout/ui/safe-image');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons/button');
	const { Text4, Text5, Text6 } = require('ui-system/typography/text');

	const LIST_ITEM_VERTICAL_PADDING = Indent.XL.toNumber();
	const LIST_ITEM_IMAGE_SIZE = 68;
	const LIST_ITEM_IMAGE_RADIUS = Corner.L.toNumber();
	const LIST_ITEM_META_TOP_MARGIN = Indent.M.toNumber();
	const LIST_ITEM_SEPARATOR_HEIGHT = Component.separatorStroke.toNumber();
	const LIST_ITEM_SIDE_PADDING = Component.paddingLr.toNumber();

	class MarketListItem extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

				this.getTestId = createTestIdGenerator({
					prefix: resolveTestIdPrefix(props.testId, props.item?.id, 'market-list-item'),
				});
			}

		getItem()
		{
			return this.props.item ?? {};
		}

		isLastItem()
		{
			return (this.props.item?.isLast ?? this.props.isLast) === true;
		}

		getOnClick(item)
		{
			if (typeof this.props.onClick === 'function')
			{
				return this.props.onClick;
			}

			if (typeof this.props.itemDetailOpenHandler === 'function')
			{
				return () => this.props.itemDetailOpenHandler(item.id, item, this.props.params ?? {});
			}

			return () => {};
		}

		getActionOnClick(item)
		{
			if (typeof this.props.params?.actionButtonClickHandler === 'function')
			{
				return () => this.props.params.actionButtonClickHandler(item.id, item, this.props.params ?? {});
			}

			return this.getOnClick(item);
		}

		render()
		{
			const item = this.getItem();
			const isLast = this.isLastItem();
			const onClick = this.getOnClick(item);
			const actionOnClick = this.getActionOnClick(item);
			const bottomPadding = Number(this.props.params?.contentBottomPadding ?? 0);
			const shouldShowActionButton = this.shouldShowActionButton(item);

			return View(
				{
					testId: this.getTestId(),
					onClick,
					style: {
						backgroundColor: Color.bgContentPrimary.toHex(),
						paddingHorizontal: LIST_ITEM_SIDE_PADDING,
						paddingTop: LIST_ITEM_VERTICAL_PADDING,
						paddingBottom: LIST_ITEM_VERTICAL_PADDING + (isLast ? bottomPadding : 0),
						borderBottomWidth: isLast ? 0 : LIST_ITEM_SEPARATOR_HEIGHT,
						borderBottomColor: Color.base7.toHex(),
					},
				},
				View(
					{
						style: {
							flexDirection: 'row',
							alignItems: 'flex-start',
						},
					},
					this.renderItemIcon(item),
					View(
						{
							style: {
								flex: 1,
								marginLeft: Indent.L.toNumber(),
							},
						},
						Text4({
							testId: this.getTestId('title'),
							text: item.title,
							accent: true,
							numberOfLines: 1,
							ellipsize: 'end',
						}),
						item.description
							? Text5({
								testId: this.getTestId('description'),
								text: item.description,
								color: Color.base3,
								numberOfLines: 1,
								ellipsize: 'end',
								style: {
									marginTop: Indent.XS.toNumber(),
								},
							})
							: null,
						View(
							{
								style: {
									marginTop: LIST_ITEM_META_TOP_MARGIN,
									flexDirection: 'row',
									alignItems: 'center',
								},
							},
							shouldShowActionButton
								? Button({
									testId: this.getTestId('action'),
									text: item.actionTitle,
									design: ButtonDesign.TINTED,
									size: ButtonSize.XS,
									onClick: actionOnClick,
								})
								: null,
							View(
								{
									style: {
										flexDirection: 'row',
										alignItems: 'center',
										marginLeft: shouldShowActionButton ? Indent.M.toNumber() : 0,
									},
								},
								IconView({
									testId: this.getTestId('installs-icon'),
									icon: Icon.DOWNLOAD,
									size: 16,
									color: Color.base5,
								}),
								Text6({
									testId: this.getTestId('installs'),
									text: this.formatInstallsCount(item.installsCount),
									color: Color.base4,
									style: {
										marginLeft: Indent.XS.toNumber(),
									},
								}),
							),
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

		shouldShowActionButton(item = {})
		{
			if (item?.showActionButton === false)
			{
				return false;
			}

			return String(item?.actionTitle ?? '').trim() !== '';
		}

		renderItemIcon(item)
		{
			const imageUrl = normalizeImageUrl(item.imageUrl);
			if (imageUrl)
			{
				return SafeImage({
					testId: this.getTestId('image'),
					uri: imageUrl,
					style: {
						width: LIST_ITEM_IMAGE_SIZE,
						height: LIST_ITEM_IMAGE_SIZE,
						borderRadius: LIST_ITEM_IMAGE_RADIUS,
					},
					resizeMode: 'contain',
				});
			}

			return View(
				{
					style: {
						width: LIST_ITEM_IMAGE_SIZE,
						height: LIST_ITEM_IMAGE_SIZE,
						borderRadius: LIST_ITEM_IMAGE_RADIUS,
						backgroundColor: Color.accentSoftBlue2.toHex(),
						justifyContent: 'center',
						alignItems: 'center',
					},
				},
				IconView({
					testId: this.getTestId('image-placeholder'),
					icon: Icon.APPS,
					size: 28,
					color: Color.accentMainPrimary,
				}),
			);
		}

		formatInstallsCount(value)
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
		MarketListItem: (props) => new MarketListItem(props),
	};
});
