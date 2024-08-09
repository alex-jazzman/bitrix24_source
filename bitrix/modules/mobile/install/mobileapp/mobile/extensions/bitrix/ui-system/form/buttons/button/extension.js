/**
 * @module ui-system/form/buttons/button
 */
jn.define('ui-system/form/buttons/button', (require, exports, module) => {
	const { Component, Color } = require('tokens');
	const { isLightColor } = require('utils/color');
	const { capitalize } = require('utils/string');
	const { Ellipsize } = require('utils/enums/style');
	const { mergeImmutable } = require('utils/object');
	const { Text } = require('ui-system/typography/text');
	const { SpinnerLoader, SpinnerDesign } = require('layout/ui/loaders/spinner');
	const { PropTypes } = require('utils/validation');
	const { IconView, iconTypes, Icon } = require('ui-system/blocks/icon');
	const { ButtonSize } = require('ui-system/form/buttons/button/src/size-enum');
	const { ButtonDesign } = require('ui-system/form/buttons/button/src/design-enum');

	const Direction = {
		LEFT: 'left',
		RIGHT: 'right',
	};

	/**
	 * @class Button
	 * @param {object} props
	 * @param {string} [props.text]
	 * @param {ButtonDesign} [props.design=ButtonDesign.FILLED]
	 * @param {ButtonSize} [props.size]
	 * @param {string} [props.color]
	 * @param {boolean} [props.stretched]
	 * @param {boolean} [props.rounded]
	 * @param {boolean} [props.disabled]
	 * @param {string} [props.leftIcon]
	 * @param {Color} [props.leftIconColor]
	 * @param {string} [props.rightIcon]
	 * @param {Color} [props.rightIconColor]
	 * @param {boolean} [props.border]
	 * @param {Ellipsize} [props.ellipsize]
	 * @param {boolean} [props.loading]
	 * @param {Color} [props.borderColor]
	 * @param {Color} [props.backgroundColor]
	 * @param {object} [props.style]
	 * @param {function} [props.onClick]
	 * @params {function} [props.forwardRef]
	 * @return {Button}
	 */
	class Button extends LayoutComponent
	{
		/**
		 * @return {ButtonSize}
		 */
		get size()
		{
			const { size } = this.props;

			return ButtonSize.resolve(size, ButtonSize.XL);
		}

		/**
		 * @return {ButtonDesign}
		 */
		get design()
		{
			const { design } = this.props;

			return ButtonDesign.resolve(design, ButtonDesign.FILLED);
		}

		get designStyle()
		{
			return this.design.getStyle();
		}

		render()
		{
			const { testId, forwardRef, style = {}, onLayout } = this.props;

			if (!this.shouldRenderButton())
			{
				return null;
			}

			const mainProps = mergeImmutable(
				{
					testId,
					onLayout,
					style: this.getMainStyle(),
				},
				{ style },
			);

			return View(
				mainProps,
				View(
					{
						ref: forwardRef,
						style: this.getButtonStyle(),
						onClick: this.#handleOnClick,
						onLongClick: this.#handleOnLongClick,
					},
					this.#renderBody(),
				),
			);
		}

		shouldRenderButton()
		{
			const { text, leftIcon, rightIcon } = this.props;

			return text || leftIcon || rightIcon;
		}

		isSquared()
		{
			const { leftIcon, rightIcon, text } = this.props;

			return (leftIcon || rightIcon) && !text;
		}

		#renderBody()
		{
			const { leftIcon, rightIcon, badge } = this.props;

			return View(
				{
					style: {
						flexShrink: 1,
						position: 'relative',
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'center',
					},
				},
				this.#renderLoader(),
				View(
					{
						style: {
							flexShrink: 1,
							flexDirection: 'row',
							alignItems: 'center',
							opacity: this.isLoading() ? 0 : 1,
						},
					},
					this.#renderIcon({
						icon: leftIcon,
						direction: Direction.LEFT,
					}),
					this.#renderText(),
					this.#renderIcon({
						icon: rightIcon,
						direction: Direction.RIGHT,
						badge,
					}),
					this.#renderBadge(),
				),
			);
		}

		#renderText()
		{
			const { text, leftIcon, rightIcon, badge } = this.props;

			if (!text)
			{
				return null;
			}

			const { accent, size } = this.size.getTypography();

			return Text({
				accent,
				size,
				text,
				color: this.getColor(),
				numberOfLines: 1,
				ellipsize: this.#getEllipsize(),
				style: {
					flexShrink: 1,
					marginLeft: this.size.getTextIndents({ icon: Boolean(leftIcon) }),
					marginRight: this.size.getTextIndents({ icon: Boolean(rightIcon), badge }),
				},
			});
		}

		#renderIcon({ icon, direction, badge })
		{
			if (!icon)
			{
				return null;
			}

			let style = {
				flexGrow: 1,
			};

			if (direction)
			{
				style[`margin${capitalize(direction)}`] = this.size.getIconIndents({ badge });
			}

			if (this.isSquared())
			{
				const horizontal = this.size.getIconIndents({ squared: true });

				style = {
					marginRight: horizontal,
					marginLeft: horizontal,
				};
			}

			return IconView({
				icon,
				size: this.size.getIconSize(),
				color: this.getIconColor(direction),
				style,
			});
		}

		#renderBadge()
		{
			const { badge } = this.props;

			if (!badge)
			{
				return null;
			}

			return View(
				{
					style: {
						marginRight: this.size.getBadgeIndent(),
					},
				},
				badge,
			);
		}

		#renderLoader()
		{
			if (!this.isLoading())
			{
				return null;
			}

			return SpinnerLoader({
				size: this.size.getIconSize(),
				design: this.#getLoaderDesign(),
				style: {
					position: 'absolute',
				},
			});
		}

		#getLoaderDesign()
		{
			const { loaderDesign } = this.props;
			const backgroundColor = this.getBackgroundColor();
			const hex = typeof backgroundColor === 'object' ? backgroundColor?.default : backgroundColor;
			const design = !hex || isLightColor(hex)
				? SpinnerDesign.BLUE
				: SpinnerDesign.WHITE;

			return SpinnerDesign.resolve(loaderDesign, design);
		}

		#handleOnClick = () => {
			const { onClick, onDisabledClick, disabled } = this.props;

			if (onClick && !disabled)
			{
				onClick();
			}

			if (onDisabledClick && disabled)
			{
				onDisabledClick();
			}
		};

		#handleOnLongClick = () => {
			const { onLongClick, disabled } = this.props;

			if (onLongClick && !disabled)
			{
				onLongClick();
			}
		};

		getMainStyle()
		{
			return {
				flexShrink: 1,
				flexDirection: 'row',
				alignItems: 'flex-start',
				...this.getStretchedStyle(),
			};
		}

		getButtonStyle()
		{
			const {
				rounded = false,
			} = this.props;

			const { radius } = this.size.getBorder();

			const style = {
				flexDirection: 'row',
				flexShrink: 1,
				backgroundColor: this.getBackgroundColor(),
				justifyContent: 'center',
				borderRadius: radius.toNumber(),
				height: this.size.getHeight(),
				...this.getBorderStyle(),
				...this.getStretchedStyle(),
			};

			if (rounded)
			{
				style.borderRadius = Component.elementAccentCorner.toNumber();
			}

			return style;
		}

		getBorderStyle()
		{
			const { borderColor: designBorderColor } = this.designStyle;
			const { border, borderColor, design, disabled } = this.props;

			if ((design && designBorderColor) || (border && borderColor))
			{
				const { width: borderWidth } = this.size.getBorder();
				let buttonBorderColor = designBorderColor;

				if (borderColor)
				{
					buttonBorderColor = borderColor;
				}

				if (disabled)
				{
					buttonBorderColor = this.getDisabledStyle().borderColor;
				}

				const opacity = designBorderColor
					? this.design.getOpacity('borderColor')
					: null;

				return {
					borderWidth,
					borderColor: buttonBorderColor.toHex(opacity),
				};
			}

			return {};
		}

		/**
		 * @return {ColorEnum}
		 */
		getColor()
		{
			let { color: designColor } = this.designStyle;
			const { color: propsColor, disabled } = this.props;

			if (disabled)
			{
				designColor = this.getDisabledStyle().color;
			}

			return Color.resolve(propsColor, designColor);
		}

		/**
		 * @param {Direction} direction
		 * @return {ColorEnum}
		 */
		getIconColor(direction)
		{
			const iconColor = this.props[`${direction}IconColor`];

			return Color.resolve(iconColor, this.getColor());
		}

		getBackgroundColor()
		{
			const { backgroundColor: designBackgroundColor } = this.designStyle;
			const { backgroundColor, disabled } = this.props;
			const background = backgroundColor || designBackgroundColor;

			if (background)
			{
				return disabled
					? this.getDisabledStyle().backgroundColor.toHex()
					: background?.withPressed();
			}

			return designBackgroundColor?.withPressed();
		}

		getDisabledStyle()
		{
			return this.design.getDisabled().getStyle();
		}

		getStretchedStyle()
		{
			if (!this.isStretched())
			{
				return {};
			}

			return {
				flexShrink: 1,
				width: '100%',
				alignItems: 'center',
			};
		}

		#getEllipsize()
		{
			const { ellipsize } = this.props;

			return Ellipsize.resolve(ellipsize, Ellipsize.END).toString();
		}

		isStretched()
		{
			const { stretched = false } = this.props;

			return stretched;
		}

		isLoading()
		{
			const { loading } = this.props;

			return Boolean(loading);
		}
	}

	Button.defaultProps = {
		stretched: false,
		rounded: false,
		border: false,
		loading: false,
	};

	Button.propTypes = {
		testId: PropTypes.string.isRequired,
		text: PropTypes.string,
		leftIcon: PropTypes.object,
		leftIconColor: PropTypes.object,
		rightIcon: PropTypes.object,
		rightIconColor: PropTypes.object,
		size: PropTypes.object,
		badge: PropTypes.object,
		ellipsize: PropTypes.object,
		design: PropTypes.object,
		loaderDesign: PropTypes.object,
		stretched: PropTypes.bool,
		rounded: PropTypes.bool,
		border: PropTypes.bool,
		loading: PropTypes.bool,
		color: PropTypes.object,
		borderColor: PropTypes.object,
		backgroundColor: PropTypes.object,
	};

	module.exports = {
		Button: (props) => new Button(props),
		ButtonDesign,
		ButtonSize,
		LoaderDesign: SpinnerDesign,
		Icon,
		IconTypes: iconTypes,
		Ellipsize,
	};
});
