/**
 * @module ui-system/blocks/avatar/src/elements/avatar-view
 */

// Avatar is an ambient native element, like View and Text; unlike them it is missing
// from the shared mobile eslint preset, so it is declared here.
/* global Avatar */
jn.define('ui-system/blocks/avatar/src/elements/avatar-view', (require, exports, module) => {
	const { Icon } = require('assets/icons');
	const { isFunction } = require('utils/object');
	const { withCurrentDomain } = require('utils/url');
	const { isNil, isNotEmptyString } = require('utils/type');
	const { isEmpty, omitBy } = require('utils/object');
	const { Component, Corner, Color } = require('tokens');
	const { PropTypes } = require('utils/validation');
	const { makeLibraryImagePath } = require('asset-manager');
	const { PureComponent } = require('layout/pure-component');
	const { EmptyAvatar } = require('ui-system/blocks/avatar/src/enums/empty-avatar');
	const { commonDefaultProps } = require('ui-system/blocks/avatar/src/defaults');
	const { getFirstLetters } = require('layout/ui/user/empty-avatar');
	const { AvatarShape } = require('ui-system/blocks/avatar/src/enums/shape');
	const { AvatarAccentType } = require('ui-system/blocks/avatar/src/enums/accent-type');
	const { AvatarAccentGradient } = require('ui-system/blocks/avatar/src/enums/accent-gradient');
	const { getBackgroundColorStyles: getLettresBackgroundColor } = require('layout/ui/user/empty-avatar');
	const { AvatarNativePlaceholderType } = require('ui-system/blocks/avatar/src/enums/native-placeholder-type');

	/**
	 * @extends {PureComponent<AvatarViewProps>}
	 */
	class AvatarView extends PureComponent
	{
		/**
		 * @param {AvatarViewProps} props
		 */
		constructor(props)
		{
			super(props);

			this.handleForwardRef = this.handleForwardRef.bind(this);
		}

		/**
		 * @param {boolean} rounded
		 * @param {number} size
		 * @return {number}
		 */
		static resolveBorderRadius(rounded, size)
		{
			if (rounded)
			{
				return Component.elementAccentCorner.toNumber();
			}

			if (size <= 27)
			{
				return Corner.XS.toNumber();
			}

			if (size <= 47)
			{
				return Corner.S.toNumber();
			}

			if (size <= 83)
			{
				return Corner.M.toNumber();
			}

			return Corner.L.toNumber();
		}

		/**
		 * @return {AvatarNativeRef}
		 */
		render()
		{
			if (this.shouldRenderOutline())
			{
				return this.renderOutlineWrapper(this.renderAvatar());
			}

			return this.renderAvatar();
		}

		/**
		 * @return {AvatarNativeRef}
		 */
		renderAvatar()
		{
			return Avatar(this.getAvatarProps());
		}

		/**
		 * @return {AvatarNativeParams}
		 */
		getAvatarProps()
		{
			const avatarProps = {
				ref: this.handleForwardRef,
				onUriLoadFailure: () => {
					console.error('Avatar image loading failed');
				},
				...this.getAvatarNativeProps(),
			};

			if (this.#hasOnClick())
			{
				avatarProps.onClick = this.#handleOnClick;
			}

			return avatarProps;
		}

		/**
		 * @public
		 * @return {AvatarNativeParams}
		 */
		getAvatarNativeProps()
		{
			return {
				testId: this.getTestId(),
				title: this.getUserName(),
				uri: this.getUri(),
				type: this.getShape().getValue(),
				radius: this.getBorderRadius(),
				placeholder: this.getPlaceholder(),
				backBorderWidth: this.getBackBorderWidth(),
				style: this.getContainerStyle(),
				hideOutline: !this.isAccent(),
				...this.#getAccent(),
			};
		}

		/**
		 * @return {AvatarNativeAccentParams}
		 */
		#getAccent()
		{
			const accent = {};

			if (!this.isAccent())
			{
				return accent;
			}

			accent.accentColorGradient = this.#getAccentColorGradient();
			accent.accentColor = this.#getAccentColor();
			accent.accentType = this.#getAccentType();

			return omitBy(accent, isNil);
		}

		/**
		 * @return {string | undefined}
		 */
		#getAccentColor()
		{
			const { accentColor } = this.props;

			return accentColor?.toHex();
		}

		/**
		 * @return {AvatarNativePlaceholderParams}
		 */
		getPlaceholder()
		{
			const placeholderType = this.getPlaceholderType();
			const placeholderParams = {
				type: placeholderType.getValue(),
				...this.getPlaceholderBackgroundColorParams(),
			};

			if (placeholderType.isSvg())
			{
				placeholderParams.svg = this.getPlaceholderSvgParams();
			}

			return placeholderParams;
		}

		/**
		 * @return {AvatarNativeSvgParams}
		 */
		getPlaceholderSvgParams()
		{
			const icon = this.getIcon();
			let placeholderSvgParams = {};

			if (icon)
			{
				placeholderSvgParams = this.getIconParams();
			}
			else
			{
				placeholderSvgParams = this.getEmptyAvatar();
			}

			return placeholderSvgParams;
		}

		/**
		 * @return {AvatarNativeSvgParams | null}
		 */
		getIconParams()
		{
			const icon = this.getIcon();

			if (isEmpty(icon.props))
			{
				return null;
			}

			const { color, icon: iconEnum, size } = icon.props;

			if (!Icon.hasIcon(iconEnum))
			{
				return null;
			}

			const tintColor = Color.resolve(color, Color.base0);

			return {
				size,
				tintColor: tintColor.toHex(),
				named: iconEnum.getIconName(),
			};
		}

		/**
		 * @param {AvatarNativeRef} avatar
		 * @return {AvatarNativeRef}
		 */
		renderOutlineWrapper(avatar)
		{
			const size = this.getSize();
			const outline = this.getOutline();

			return View(
				{
					style: {
						alignItems: 'center',
						justifyContent: 'center',
						width: size + outline,
						height: size + outline,
						backgroundColor: this.getOutlineColor(),
						borderRadius: this.getBorderRadius(),
					},
				},
				avatar,
			);
		}

		/**
		 * @return {number}
		 */
		getUserId()
		{
			const { id } = this.props;

			return Number(id) || 0;
		}

		/**
		 * @return {Partial<ElementStyle>}
		 */
		getStyle()
		{
			const { style } = this.props;

			return style || {};
		}

		/**
		 * @return {Partial<ElementStyle>}
		 */
		getContainerStyle()
		{
			const size = this.getSize();

			return {
				...this.getStyle(),
				width: size,
				height: size,
			};
		}

		/**
		 * @return {AvatarShape}
		 */
		getShape()
		{
			const { shape } = this.props;

			return AvatarShape.resolve(shape, AvatarShape.CIRCLE);
		}

		/**
		 * @return {string | undefined}
		 */
		getUserName()
		{
			const { name } = this.props;

			return name;
		}

		/**
		 * @return {string}
		 */
		getTestId()
		{
			const { testId } = this.props;
			const testIds = ['avatar'];

			if (this.hasUri())
			{
				testIds.push('image');
			}
			else if (this.isUseLetterImage())
			{
				testIds.push(AvatarNativePlaceholderType.LETTERS.getValue(), this.getFirstLetters());
			}
			else
			{
				testIds.push(AvatarNativePlaceholderType.SVG.getValue());
			}

			testIds.push(testId);

			return testIds.filter(Boolean).join('-');
		}

		/**
		 * @return {string | null}
		 */
		getUri()
		{
			const { uri } = this.props;

			return this.hasUri() ? encodeURI(withCurrentDomain(uri)) : null;
		}

		/**
		 * @return {boolean}
		 */
		hasUri()
		{
			const { uri } = this.props;

			return Boolean(uri);
		}

		/**
		 * @return {number}
		 */
		getBorderRadius()
		{
			return AvatarView.resolveBorderRadius(this.getShape().isCircle(), this.getSize());
		}

		/**
		 * @return {number}
		 */
		getSize()
		{
			const { size } = this.props;

			return size;
		}

		#handleOnClick = () => {
			const { onClick } = this.props;

			onClick?.({ id: this.getUserId() });
		};

		/**
		 * @return {string | null}
		 */
		getBackgroundColor()
		{
			const { backgroundColor } = this.props;

			if (Color.has(backgroundColor))
			{
				return backgroundColor.toHex();
			}

			return null;
		}

		/**
		 * @return {string}
		 */
		getOutlineColor()
		{
			const { style } = this.props;

			return style?.backgroundColor || Color.bgSecondary.toHex();
		}

		/**
		 * @return {AvatarColorGradient | null}
		 */
		#getAccentColorGradient()
		{
			const { accentGradientColors } = this.props;

			const accentGradients = Array.isArray(accentGradientColors)
				? accentGradientColors
				: this.getAvatarAccentGradient();

			if (!accentGradients)
			{
				return null;
			}

			const start = accentGradients[0];
			const middle = accentGradients[1] || start;
			const end = accentGradients[2] || middle;

			return { start, middle, end };
		}

		/**
		 * @return {string | null}
		 */
		getAvatarAccentGradient()
		{
			const { accentGradient } = this.props;

			if (AvatarAccentGradient.has(accentGradient))
			{
				return accentGradient.getValue();
			}

			return null;
		}

		/**
		 * @return {AvatarNativeSvgParams}
		 */
		getEmptyAvatar()
		{
			const { emptyAvatar } = this.getPlaceholderParams();

			const svgParams = {
				uri: isNotEmptyString(emptyAvatar)
					? emptyAvatar
					: makeLibraryImagePath(emptyAvatar?.uri, 'empty-avatar'),
			};

			if (emptyAvatar?.named)
			{
				svgParams.named = emptyAvatar.named.getNamed();
			}

			return svgParams;
		}

		/**
		 * @return {boolean}
		 */
		isAccent()
		{
			const { accent } = this.props;

			return Boolean(accent);
		}

		/**
		 * @return {boolean | string} the first letters when they are to be drawn, a falsy value otherwise
		 */
		isUseLetterImage()
		{
			const { useLetterImage } = this.props;

			return Boolean(useLetterImage) && this.getFirstLetters();
		}

		/**
		 * @return {AvatarNativePlaceholderType}
		 */
		getPlaceholderType()
		{
			if (this.isUseLetterImage())
			{
				return AvatarNativePlaceholderType.LETTERS;
			}

			return AvatarNativePlaceholderType.SVG;
		}

		/**
		 * @return {string}
		 */
		getFirstLetters()
		{
			return getFirstLetters(this.getUserName());
		}

		/**
		 * @return {Icon | undefined}
		 */
		getIcon()
		{
			const { icon } = this.props;

			return icon;
		}

		/**
		 * @return {number | null}
		 */
		getOutline()
		{
			const { outline } = this.props;

			return outline;
		}

		/**
		 * @return {AvatarPlaceholder}
		 */
		getPlaceholderParams()
		{
			const { placeholder } = this.props;

			return placeholder;
		}

		/**
		 * @return {{ backgroundColor?: string }}
		 */
		getPlaceholderBackgroundColorParams()
		{
			const backgroundColor = this.getBackgroundColor();
			if (backgroundColor)
			{
				return {
					backgroundColor,
				};
			}

			const placeholderBackgroundColor = this.getPlaceholderBackgroundColor();
			if (placeholderBackgroundColor)
			{
				return {
					backgroundColor: placeholderBackgroundColor,
				};
			}

			if (this.getPlaceholderType().isLetters())
			{
				return getLettresBackgroundColor(this.getUserId());
			}

			return {};
		}

		/**
		 * @return {string | null}
		 */
		getPlaceholderBackgroundColor()
		{
			const { backgroundColor } = this.getPlaceholderParams();

			if (Color.has(backgroundColor))
			{
				return backgroundColor.toHex();
			}

			return null;
		}

		/**
		 * @return {boolean}
		 */
		shouldRenderOutline()
		{
			return this.getOutline() > 0;
		}

		/**
		 * @param {AvatarNativeRef} ref
		 * @return {void}
		 */
		handleForwardRef(ref)
		{
			const { forwardRef } = this.props;

			forwardRef?.(ref);
		}

		/**
		 * @return {number | null}
		 */
		getBackBorderWidth()
		{
			const { backBorderWidth } = this.props;

			return backBorderWidth;
		}

		/**
		 * @return {string}
		 */
		#getAccentType()
		{
			const { accentType } = this.props;

			return AvatarAccentType.resolve(accentType, AvatarAccentType.BLUE).getValue();
		}

		/**
		 * @return {boolean}
		 */
		#hasOnClick()
		{
			const { onClick } = this.props;

			return isFunction(onClick);
		}
	}

	// the view declares only what it reads: entityType and emptyAvatar are resolved by the
	// wrapper into placeholder, and withRedux never leaves the wrapper
	AvatarView.defaultProps = commonDefaultProps;

	AvatarView.propTypes = {
		testId: PropTypes.string.isRequired,
		id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		uri: PropTypes.string,
		name: PropTypes.string,
		size: PropTypes.number,
		outline: PropTypes.number,
		backBorderWidth: PropTypes.number,
		shape: PropTypes.instanceOf(AvatarShape),
		accent: PropTypes.bool,
		accentType: PropTypes.instanceOf(AvatarAccentType),
		accentColor: PropTypes.instanceOf(Color),
		accentGradient: PropTypes.instanceOf(AvatarAccentGradient),
		accentGradientColors: PropTypes.arrayOf(PropTypes.string),
		backgroundColor: PropTypes.instanceOf(Color),
		useLetterImage: PropTypes.bool,
		icon: PropTypes.object,
		placeholder: PropTypes.shape({
			emptyAvatar: PropTypes.oneOfType([
				PropTypes.string,
				PropTypes.shape({
					uri: PropTypes.string,
					named: PropTypes.instanceOf(EmptyAvatar),
				}),
			]),
			backgroundColor: PropTypes.instanceOf(Color),
		}),
		style: PropTypes.object,
		forwardRef: PropTypes.func,
		onClick: PropTypes.func,
	};

	module.exports = {
		AvatarView,
	};
});
