/**
 * @module vibecode/catalog/item
 */
jn.define('vibecode/catalog/item', (require, exports, module) => {
	const { Loc } = require('loc');
	const { createTestIdGenerator } = require('utils/test');
	const { withCurrentDomain } = require('utils/url');
	const { Color, Component, Corner, Indent } = require('tokens');
	const { SafeImage } = require('layout/ui/safe-image');
	const { Avatar, AvatarShape } = require('ui-system/blocks/avatar');
	const { BadgeCounter, BadgeCounterDesign, BadgeCounterSize } = require('ui-system/blocks/badges/counter');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Capital, Text4, Text5, Text6 } = require('ui-system/typography/text');
	const { getPressedColor, prepareHexColor } = require('utils/color');

	const LIST_ITEM_VERTICAL_PADDING = Indent.XL.toNumber();
	const LIST_ITEM_IMAGE_SIZE = 60;
	const LIST_ITEM_IMAGE_RADIUS = Corner.M.toNumber();
	const LIST_ITEM_TEXT_MARGIN = Indent.L.toNumber();
	const LIST_ITEM_SEPARATOR_HEIGHT = Component.separatorStroke.toNumber();
	const LIST_ITEM_SIDE_PADDING = Component.paddingLr.toNumber();
	const LIST_ITEM_ACTION_SIZE = 24;
	const LIST_ITEM_PIN_ICON_SIZE = 18;
	const LIST_ITEM_PLACEHOLDER_ICON_SIZE = 48;
	const LIST_ITEM_BOTTOM_MARGIN = Indent.XS.toNumber();
	const LIST_ITEM_ACTIONS_GAP = Indent.M.toNumber();
	const OWNER_AVATAR_SIZE = 20;
	const PRESS_FEEDBACK_DURATION = 120;

	function normalizeString(value = '', fallback = '')
	{
		const normalizedValue = String(value ?? '').trim();

		return normalizedValue || fallback;
	}

	function resolveProtocolPrefix()
	{
		const currentDomainUrl = String(withCurrentDomain('/'));
		const [protocol = 'https:'] = currentDomainUrl.split('//');

		return protocol.endsWith(':') ? protocol : `${protocol}:`;
	}

	function normalizeImageUrl(uri = '')
	{
		const normalizedUri = normalizeString(uri, '');
		if (!normalizedUri)
		{
			return '';
		}

		if (normalizedUri.startsWith('//'))
		{
			return encodeURI(`${resolveProtocolPrefix()}${normalizedUri}`);
		}

		return encodeURI(withCurrentDomain(normalizedUri));
	}

	function resolveTestIdPrefix(testId = '', entityId = '', prefix = '', emptyPrefix = prefix)
	{
		const normalizedTestId = normalizeString(testId, '');
		const normalizedEntityId = normalizeString(entityId, '');

		if (!normalizedTestId)
		{
			return normalizedEntityId ? `${prefix}-${normalizedEntityId}` : emptyPrefix;
		}

		if (!normalizedEntityId || normalizedTestId.endsWith(normalizedEntityId))
		{
			return normalizedTestId;
		}

		return `${normalizedTestId}-${normalizedEntityId}`;
	}

	function normalizePositiveInteger(value = null)
	{
		const normalizedValue = Number(value);

		return (Number.isInteger(normalizedValue) && normalizedValue > 0 ? normalizedValue : null);
	}

	function normalizeCounter(value = null)
	{
		const normalizedValue = Number(value);

		return (Number.isFinite(normalizedValue) && normalizedValue > 0 ? normalizedValue : null);
	}

	class VibeCodeCatalogItem extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: resolveTestIdPrefix(props.testId, props.item?.id, 'vibecode-list-item'),
			});
			this.state = {
				isPressed: false,
			};
			this.moreButtonRef = null;
			this.pressFeedbackTimeout = null;
		}

		componentWillUnmount()
		{
			clearTimeout(this.pressFeedbackTimeout);
		}

		getItem()
		{
			return this.props.item ?? {};
		}

		isLastItem()
		{
			return (this.props.item?.isLast ?? this.props.isLast) === true;
		}

		isPinned(item)
		{
			return item?.isPinned === true;
		}

		getBackgroundColor(item)
		{
			return this.isPinned(item) ? Color.accentSoftBlue3.toHex() : Color.bgContentPrimary.toHex();
		}

		getSeparatorColor()
		{
			return Color.bgSeparatorSecondary.toHex();
		}

		getInteractiveBackgroundColor(item)
		{
			const backgroundColor = this.getBackgroundColor(item);

			return this.state.isPressed ? getPressedColor(backgroundColor) : backgroundColor;
		}

		showPressFeedback = (callback = null) => {
			clearTimeout(this.pressFeedbackTimeout);
			this.setState({ isPressed: true }, () => {
				this.pressFeedbackTimeout = setTimeout(() => {
					this.setState({ isPressed: false });
				}, PRESS_FEEDBACK_DURATION);
				callback?.();
			});
		};

		getOnClick(item)
		{
			if (typeof this.props.onClick === 'function')
			{
				return (...args) => this.showPressFeedback(() => this.props.onClick(...args));
			}

			if (typeof this.props.itemDetailOpenHandler === 'function')
			{
				return () => this.showPressFeedback(
					() => this.props.itemDetailOpenHandler(item.id, item, this.props.params ?? {}),
				);
			}

			return () => {};
		}

		getMoreOnClick(item)
		{
			if (typeof this.props.params?.actionButtonClickHandler === 'function')
			{
				return () => this.showPressFeedback(() => {
					this.props.params.actionButtonClickHandler(
						item.id,
						item,
						{
							...(this.props.params ?? {}),
							targetRef: this.moreButtonRef,
						},
					);
				});
			}

			return () => {};
		}

		getOnLongClick(item)
		{
			if (typeof this.props.params?.itemLongClickHandler === 'function')
			{
				return () => this.props.params.itemLongClickHandler(
					item.id,
					item,
					{
						...(this.props.params ?? {}),
						targetRef: this.moreButtonRef,
					},
				);
			}

			return () => {};
		}

		render()
		{
			const item = this.getItem();
			const isLast = this.isLastItem();
			const bottomPadding = Number(this.props.params?.contentBottomPadding ?? 0);

			return View(
				{
					testId: this.getTestId(),
					style: {
						backgroundColor: Color.bgContentPrimary.toHex(),
					},
				},
				View(
					{
						style: {
							backgroundColor: this.getBackgroundColor(item),
						},
					},
					View(
						{
							style: {
								flexDirection: 'row',
								alignItems: 'flex-start',
								paddingHorizontal: LIST_ITEM_SIDE_PADDING,
								paddingTop: LIST_ITEM_VERTICAL_PADDING,
								paddingBottom: LIST_ITEM_VERTICAL_PADDING + (isLast ? bottomPadding : 0),
								backgroundColor: this.getInteractiveBackgroundColor(item),
							},
						},
						View(
							{
								onClick: this.getOnClick(item),
								onLongClick: this.getOnLongClick(item),
								style: {
									flex: 1,
									flexDirection: 'row',
									alignItems: 'flex-start',
								},
							},
							this.renderItemIcon(item),
							View(
								{
									style: {
										flex: 1,
										marginLeft: LIST_ITEM_TEXT_MARGIN,
									},
								},
								this.renderTitleRow(item),
								item.description
									? Text5({
										testId: this.getTestId('description'),
										text: item.description,
										color: Color.base3,
										numberOfLines: 2,
										ellipsize: 'end',
										style: {
											marginTop: Indent.XS.toNumber(),
										},
									})
									: null,
								this.renderOwnerRow(item),
							),
						),
						this.renderActions(item),
					),
					!isLast && View(
						{
							style: {
								height: LIST_ITEM_SEPARATOR_HEIGHT,
								marginLeft: LIST_ITEM_SIDE_PADDING + LIST_ITEM_IMAGE_SIZE + LIST_ITEM_TEXT_MARGIN,
								marginRight: LIST_ITEM_SIDE_PADDING,
								backgroundColor: this.getSeparatorColor(),
							},
						},
					),
				),
				View(
					{
						style: {
							height: LIST_ITEM_BOTTOM_MARGIN,
							backgroundColor: Color.bgContentPrimary.toHex(),
						},
					},
				),
			);
		}

		renderTitleRow(item)
		{
			const counter = normalizeCounter(item?.counter);

			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'center',
					},
				},
				Text4({
					testId: this.getTestId('title'),
					text: item.title,
					accent: true,
					numberOfLines: 1,
					ellipsize: 'end',
					style: {
						flex: 1,
					},
				}),
				item?.isNew === true
					? View(
						{
							testId: this.getTestId('badge-new'),
							style: {
								marginLeft: Indent.S.toNumber(),
								paddingVertical: Indent.XS2.toNumber(),
								paddingHorizontal: Indent.S.toNumber(),
								borderRadius: Corner.XS.toNumber(),
								backgroundColor: Color.accentMainAlert.toHex(),
								alignItems: 'center',
								justifyContent: 'center',
							},
						},
						Capital({
							text: Loc.getMessage('MOBILE_VIBECODE_CATALOG_ITEM_BADGE_NEW').toUpperCase(),
							accent: true,
							color: Color.baseWhiteFixed,
						}),
					)
					: null,
				counter === null
					? null
					: View(
						{
							style: {
								marginLeft: Indent.S.toNumber(),
							},
						},
						BadgeCounter({
							testId: this.getTestId('counter'),
							value: counter,
							design: BadgeCounterDesign.ALERT,
							size: BadgeCounterSize.XS,
						}),
					),
			);
		}

		renderOwnerRow(item)
		{
			const owner = item?.owner ?? {};
			const ownerId = normalizePositiveInteger(owner?.id);
			const ownerTitle = String(owner?.title ?? '').trim();

			return View(
				{
					testId: this.getTestId('owner-row'),
					style: {
						marginTop: Indent.S.toNumber(),
						flexDirection: 'row',
						alignItems: 'center',
					},
				},
				Avatar({
					testId: this.getTestId('owner-avatar'),
					id: ownerId,
					name: ownerTitle,
					size: OWNER_AVATAR_SIZE,
					shape: AvatarShape.CIRCLE,
					withRedux: ownerId !== null,
				}),
				Text6({
					testId: this.getTestId('owner-title'),
					text: ownerTitle,
					color: Color.base4,
					numberOfLines: 1,
					ellipsize: 'end',
					style: {
						flex: 1,
						marginLeft: Indent.XS.toNumber(),
					},
				}),
			);
		}

		renderActions(item)
		{
			const isPinned = this.isPinned(item);

			return View(
				{
					style: {
						marginLeft: Indent.S.toNumber(),
						alignItems: 'center',
						justifyContent: 'center',
					},
				},
				isPinned && IconView({
					testId: this.getTestId('pin-icon'),
					icon: Icon.SOLID_PIN,
					size: LIST_ITEM_PIN_ICON_SIZE,
					color: Color.accentMainPrimary,
				}),
				View(
					{
						testId: this.getTestId('menu'),
						ref: (ref) => {
							this.moreButtonRef = ref;
						},
						onClick: this.getMoreOnClick(item),
						style: {
							marginTop: isPinned ? LIST_ITEM_ACTIONS_GAP : 0,
							width: LIST_ITEM_ACTION_SIZE,
							height: LIST_ITEM_ACTION_SIZE,
							alignItems: 'center',
							justifyContent: 'center',
						},
					},
					IconView({
						testId: this.getTestId('menu-icon'),
						icon: Icon.MORE,
						size: LIST_ITEM_ACTION_SIZE,
						color: Color.base4,
					}),
				),
			);
		}

		renderItemIcon(item)
		{
			const imageUrl = normalizeImageUrl(item.iconUrl ?? item.imageUrl);
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
					resizeMode: 'cover',
				});
			}

			return View(
				{
					testId: this.getTestId('image-placeholder'),
					style: {
						width: LIST_ITEM_IMAGE_SIZE,
						height: LIST_ITEM_IMAGE_SIZE,
							borderRadius: LIST_ITEM_IMAGE_RADIUS,
							backgroundColor: item.color
								? prepareHexColor(item.color)
								: Color.accentSoftBlue2.toHex(),
						justifyContent: 'center',
						alignItems: 'center',
					},
				},
				IconView({
					testId: this.getTestId('image-placeholder-icon'),
					icon: Icon.APPS,
					size: LIST_ITEM_PLACEHOLDER_ICON_SIZE,
					color: Color.baseWhiteFixed,
				}),
			);
		}
	}

	module.exports = {
		VibeCodeCatalogItem: (props) => new VibeCodeCatalogItem(props),
	};
});
