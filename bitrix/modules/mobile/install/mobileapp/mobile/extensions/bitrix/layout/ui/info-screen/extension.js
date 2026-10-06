/**
 * @module layout/ui/info-screen
 */
jn.define('layout/ui/info-screen', (require, exports, module) => {
	const { Type } = require('type');
	const { PureComponent } = require('layout/pure-component');
	const { Color, Corner, Indent } = require('tokens');
	const { Area } = require('ui-system/layout/area');
	const { Box } = require('ui-system/layout/box');
	const { BoxFooter } = require('ui-system/layout/dialog-footer');
	const { IconView } = require('ui-system/blocks/icon');
	const { Link4 } = require('ui-system/blocks/link');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons/button');
	const { Text2, Text4, Text5 } = require('ui-system/typography/text');
	const { BBCodeText } = require('ui-system/typography/bbcodetext');

	const DEFAULT_TEST_ID = 'info-screen';
	const DEFAULT_CONTENT_MAX_WIDTH = 340;
	const DEFAULT_IMAGE_MARGIN_BOTTOM = Indent.XL3.toNumber();
	const DEFAULT_ITEM_ICON_SIZE = 28;

	/**
	 * @extends {PureComponent<InfoScreenProps, Record<string, never>>}
	 */
	class InfoScreenComponent extends PureComponent
	{
		render()
		{
			const {
				safeArea = { bottom: true },
				withScroll = false,
			} = this.props;

			return Box(
				{
					testId: this.getTestId('box'),
					safeArea,
					withScroll,
					footer: this.renderFooter(),
				},
				this.renderContent(),
				this.renderBottomBlock(),
			);
		}

		renderContent()
		{
			return Area(
				{
					testId: this.getTestId('content'),
					style: {
						...styles.content,
						backgroundColor: this.getBackgroundColorValue(),
					},
				},
				this.renderImage(),
				this.renderTextContent(),
			);
		}

		renderImage()
		{
			const { image } = this.props;

			if (!image || (!Type.isStringFilled(image.uri) && !image.named && !image.svg))
			{
				return null;
			}

			const {
				uri,
				named,
				svg,
				width,
				height,
				maxWidth,
				resizeMode = 'contain',
				style = {},
			} = image;

			return View(
				{
					style: styles.imageWrapper,
				},
				Image({
					testId: this.getTestId('image'),
					uri,
					named,
					svg,
					resizeMode,
					style: {
						width,
						height,
						maxWidth,
						marginBottom: DEFAULT_IMAGE_MARGIN_BOTTOM,
						...style,
					},
				}),
			);
		}

		renderTextContent()
		{
			return View(
				{
					style: {
						...styles.textContent,
						maxWidth: this.getContentMaxWidth(),
					},
				},
				this.renderTitle(),
				this.renderDescription(),
				this.renderItems(),
				this.renderContentFootnote(),
				this.renderSecondaryLink(),
			);
		}

		renderTitle()
		{
			const { title } = this.props;

			if (!Type.isStringFilled(title))
			{
				return null;
			}

			return BBCodeText({
				testId: `${this.getTestId('content')}-title`,
				value: this.prepareAccentText(title),
				size: 3,
				header: true,
				accent: true,
				color: this.getTitleColor(),
				style: {
					...styles.title,
					marginBottom: this.hasTextContentAfterTitle() ? Indent.XL3.toNumber() : 0,
				},
			});
		}

		renderDescription()
		{
			const { description } = this.props;

			if (!Type.isStringFilled(description))
			{
				return null;
			}

			return BBCodeText({
				testId: `${this.getTestId('content')}-description`,
				value: description,
				size: 3,
				color: this.getDescriptionColor(),
				style: {
					...styles.description,
					marginBottom: this.hasContentAfterDescription() ? Indent.XL.toNumber() : 0,
				},
			});
		}

		renderItems()
		{
			const {
				items = [],
				itemsPaddingHorizontal = Indent.XL3.toNumber(),
			} = this.props;

			if (!Type.isArrayFilled(items))
			{
				return null;
			}

			return View(
				{
					testId: `${this.getTestId('content')}-items`,
					style: {
						...styles.items,
						paddingHorizontal: itemsPaddingHorizontal,
					},
				},
				...items.map((item, index) => this.renderItem(item, index)),
			);
		}

		/**
		 * @param {InfoScreenItem} item
		 * @param {number} index
		 * @return {BaseMethods}
		 */
		renderItem(item, index)
		{
			const isDetailedItem = Type.isStringFilled(item.title);

			return View(
				{
					testId: `${this.getTestId('content')}-item-${index}`,
					style: {
						...styles.item,
						marginTop: index === 0 ? 0 : Indent.XL2.toNumber(),
					},
				},
				this.renderItemIcon(item.icon, index),
				isDetailedItem
					? View(
						{
							style: styles.itemDetails,
						},
						Text2({
							testId: `${this.getTestId('content')}-item-${index}-title`,
							text: item.title,
							color: Color.base1,
							colorGradient: item.titleGradient,
						}),
						Type.isStringFilled(item.description)
							? Text4({
								testId: `${this.getTestId('content')}-item-${index}-description`,
								text: item.description,
								color: Color.base3,
								style: styles.itemDescription,
							})
							: null,
					)
					: Text4({
						testId: `${this.getTestId('content')}-item-${index}-text`,
						text: item.text,
						color: Color.base2,
						style: styles.itemText,
					}),
			);
		}

		renderItemIcon(icon, index)
		{
			const accentColor = this.getAccentColor();
			const testId = `${this.getTestId('content')}-item-${index}-icon`;

			if (this.isSvgItemIcon(icon))
			{
				return Image({
					testId,
					svg: icon.svg,
					resizeMode: 'contain',
					style: styles.itemIcon,
				});
			}

			if (Type.isString(icon))
			{
				return Image({
					testId,
					named: this.getIconName(icon),
					tintColor: accentColor.toHex(),
					style: styles.itemIcon,
				});
			}

			return IconView({
				testId,
				icon,
				size: DEFAULT_ITEM_ICON_SIZE,
				color: accentColor,
				style: {
					marginRight: Indent.L.toNumber(),
				},
			});
		}

		/**
		 * @param {InfoScreenItemIcon} icon
		 * @return {boolean}
		 */
		isSvgItemIcon(icon)
		{
			return Type.isPlainObject(icon) && Type.isStringFilled(icon.svg?.content);
		}

		renderContentFootnote()
		{
			const { bottomBlock } = this.props;

			if (bottomBlock)
			{
				return null;
			}

			return this.renderFootnote({
				color: this.getContentFootnoteColor(),
				typography: Text5,
				style: styles.contentFootnote,
			});
		}

		renderBottomBlock()
		{
			const { bottomBlock } = this.props;

			if (!bottomBlock || (!this.shouldRenderBottomButton() && !this.hasFootnote()))
			{
				return null;
			}

			return View(
				{
					testId: this.getTestId('bottomBlock'),
					style: {
						...styles.bottomBlock,
						backgroundColor: this.getBackgroundColorValue(),
					},
				},
				this.shouldRenderBottomButton() ? this.renderPrimaryButton() : null,
				this.renderFootnote({
					color: this.getBottomFootnoteColor(),
					typography: Text4,
					style: styles.bottomFootnote,
				}),
			);
		}

		renderFootnote({ color, typography, style })
		{
			const { footnote } = this.props;

			if (!Type.isStringFilled(footnote))
			{
				return null;
			}

			return typography({
				testId: this.getTestId('footnote'),
				text: footnote,
				color,
				style,
			});
		}

		renderSecondaryLink()
		{
			const { secondaryLink } = this.props;

			if (!secondaryLink || !Type.isStringFilled(secondaryLink.text))
			{
				return null;
			}

			const {
				testId,
				style = {},
				...linkProps
			} = secondaryLink;

			return Link4({
				testId: testId ?? `${this.getTestId('content')}-secondary-link`,
				...linkProps,
				style: {
					...styles.secondaryLink,
					...style,
				},
			});
		}

		renderFooter()
		{
			const { footer } = this.props;

			if (!footer || !this.hasPrimaryButton())
			{
				return null;
			}

			return BoxFooter(
				{
					testId: this.getTestId('footer'),
					safeArea: true,
					style: {
						backgroundColor: this.getBackgroundColorValue(),
					},
				},
				this.renderPrimaryButton(),
			);
		}

		renderPrimaryButton()
		{
			const { primaryButton } = this.props;

			if (!this.hasPrimaryButton())
			{
				return null;
			}

			return Button({
				size: ButtonSize.L,
				design: ButtonDesign.FILLED,
				stretched: true,
				...primaryButton,
				testId: primaryButton.testId ?? this.getTestId('primaryButton'),
			});
		}

		shouldRenderBottomButton()
		{
			const { footer } = this.props;

			return !footer && this.hasPrimaryButton();
		}

		hasPrimaryButton()
		{
			const { primaryButton } = this.props;

			return Boolean(primaryButton && Type.isStringFilled(primaryButton.text));
		}

		hasFootnote()
		{
			const { footnote } = this.props;

			return Type.isStringFilled(footnote);
		}

		hasTextContentAfterTitle()
		{
			const { description, items = [], secondaryLink } = this.props;

			return Type.isStringFilled(description)
				|| Type.isArrayFilled(items)
				|| this.hasFootnote()
				|| Boolean(secondaryLink);
		}

		hasContentAfterDescription()
		{
			const { items = [], secondaryLink } = this.props;

			return Type.isArrayFilled(items) || this.hasFootnote() || Boolean(secondaryLink);
		}

		getTestId(name)
		{
			const {
				testId = DEFAULT_TEST_ID,
				testIds = {},
			} = this.props;

			const testIdMap = {
				box: `${testId}-box`,
				content: testId,
				image: `${testId}-image`,
				footer: `${testId}-footer`,
				bottomBlock: `${testId}-bottom-block`,
				primaryButton: `${testId}-primary-button`,
				footnote: `${testId}-footnote`,
			};

			return testIds[name] ?? testIdMap[name] ?? testId;
		}

		getContentMaxWidth()
		{
			const { contentMaxWidth = DEFAULT_CONTENT_MAX_WIDTH } = this.props;

			return contentMaxWidth;
		}

		getBackgroundColor()
		{
			const { backgroundColor = Color.bgContentPrimary } = this.props;

			return Color.resolve(backgroundColor, Color.bgContentPrimary);
		}

		getBackgroundColorValue()
		{
			return this.getBackgroundColor().toHex();
		}

		getAccentColor()
		{
			const { accentColor = Color.accentMainPrimary } = this.props;

			return Color.resolve(accentColor, Color.accentMainPrimary);
		}

		getTitleColor()
		{
			const { titleColor } = this.props;

			return Color.resolve(titleColor, Color.base2);
		}

		getDescriptionColor()
		{
			const { descriptionColor } = this.props;

			return Color.resolve(descriptionColor, Color.base2);
		}

		getContentFootnoteColor()
		{
			const { footnoteColor } = this.props;

			return Color.resolve(footnoteColor, Color.base3);
		}

		getBottomFootnoteColor()
		{
			const { footnoteColor } = this.props;

			return Color.resolve(footnoteColor, Color.base4);
		}

		getAccentColorValue()
		{
			return this.getAccentColor().toHex();
		}

		prepareAccentText(text)
		{
			return text.replaceAll('[COLOR]', `[COLOR=${this.getAccentColorValue()}]`);
		}

		getIconName(icon)
		{
			if (icon && Type.isFunction(icon.getIconName))
			{
				return icon.getIconName();
			}

			return icon;
		}
	}

	const styles = {
		content: {
			flexGrow: 1,
			flexDirection: 'column',
			justifyContent: 'center',
			alignItems: 'center',
		},
		imageWrapper: {
			alignItems: 'center',
		},
		textContent: {
			width: '100%',
			alignItems: 'center',
		},
		title: {
			textAlign: 'center',
		},
		description: {
			textAlign: 'center',
		},
		items: {
			width: '100%',
			paddingTop: Indent.XL2.toNumber(),
		},
		item: {
			width: '100%',
			flexDirection: 'row',
			justifyContent: 'flex-start',
			alignItems: 'flex-start',
		},
		itemIcon: {
			width: DEFAULT_ITEM_ICON_SIZE,
			height: DEFAULT_ITEM_ICON_SIZE,
			marginRight: Indent.L.toNumber(),
		},
		itemText: {
			flexShrink: 1,
		},
		itemDetails: {
			flexDirection: 'column',
			flexShrink: 1,
		},
		itemDescription: {
			marginTop: Indent.S.toNumber(),
		},
		contentFootnote: {
			textAlign: 'center',
			marginTop: Indent.S.toNumber(),
		},
		bottomBlock: {
			width: '100%',
			paddingHorizontal: Indent.XL3.toNumber(),
			paddingBottom: Corner.XL2.toNumber(),
		},
		bottomFootnote: {
			alignSelf: 'stretch',
			textAlign: 'center',
			marginTop: Indent.S.toNumber(),
			paddingTop: Indent.M.toNumber(),
		},
		secondaryLink: {
			alignSelf: 'center',
			marginTop: Indent.XL3.toNumber(),
		},
	};

	module.exports = {
		/**
		 * @param {InfoScreenProps} props
		 * @returns {InfoScreenComponent}
		 */
		InfoScreen: (props = {}) => new InfoScreenComponent(props),
	};
});
