/**
 * @module ui-system/blocks/chips/chip-button
 */
jn.define('ui-system/blocks/chips/chip-button', (require, exports, module) => {
	const { Indent, Component } = require('tokens');
	const { mergeImmutable } = require('utils/object');
	const { IconView, Icon, iconTypes } = require('ui-system/blocks/icon');
	const { ChipButtonDesign } = require('ui-system/blocks/chips/chip-button/src/design-enum');
	const { ChipButtonMode } = require('ui-system/blocks/chips/chip-button/src/mode-enum');
	const { ChipButtonSize } = require('ui-system/blocks/chips/chip-button/src/size-enum');

	const Direction = {
		LEFT: 'left',
		RIGHT: 'right',
	};

	/**
	 * @class ChipButton
	 * @return ChipButton
	 */
	class ChipButton extends LayoutComponent
		/**
		 * @params {object} props
		 * @params {boolean} [props.text]
		 * @params {boolean} [props.compact]
		 * @params {ChipButtonSize} [props.size]
		 * @params {ChipButtonMode} [props.mode]
		 * @params {ChipButtonDesign} [props.design]
		 * @params {BadgeStatus | BadgeCounter} [props.badge]
		 * @params {function} [props.forwardRef]
		 */
	{
		constructor(props)
		{
			super(props);

			this.style = {};
			this.size = {};

			this.#initStyle(props);
		}

		componentWillReceiveProps(props)
		{
			this.#initStyle(props);
		}

		#initStyle(props)
		{
			const { design, mode, compact, disabled } = props;

			const finalDesign = disabled
				? design.getDisabled()
				: ChipButtonDesign.resolve(design, ChipButtonDesign.PRIMARY);

			this.style = finalDesign.getStyle(mode);
			this.size = compact ? ChipButtonSize.SMALL : ChipButtonSize.NORMAL;
		}

		#renderText()
		{
			const { text } = this.props;

			if (!text)
			{
				return null;
			}

			const { color } = this.style;
			const Typography = this.size.getTypography();

			return View(
				{
					style: {
						flexShrink: 1,
					},
				},
				Typography({
					text,
					color,
					ellipsize: 'end',
					numberOfLines: 1,
				}),
			);
		}

		#renderIcon()
		{
			const { icon, text } = this.props;

			if (!icon)
			{
				return null;
			}

			const { color } = this.style;

			const iconStyle = {
				flexGrow: 1,
				marginRight: text ? Indent.XS2.toNumber() : 0,
			};

			return IconView({
				color,
				icon,
				style: iconStyle,
			});
		}

		#renderDropdown()
		{
			const { dropdown } = this.props;
			if (!dropdown)
			{
				return null;
			}

			const { color } = this.style;

			return IconView({
				style: {
					flexGrow: 1,
				},
				color,
				icon: Icon.CHEVRON_DOWN,
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
						flexGrow: 1,
						marginLeft: Indent.XS.toNumber(),
					},
				},
				badge,
			);
		}

		render()
		{
			const { testId, style = {}, onLayout, onClick, forwardRef, ...restProps } = this.props;
			const renderProps = mergeImmutable(
				{
					...restProps,
					ref: forwardRef,
					testId,
					onClick,
					onLayout,
					style: {
						flexShrink: 1,
						alignItems: 'baseline',
						justifyContent: 'flex-start',
					},
				},
				{ style },
			);

			return View(
				renderProps,
				this.#renderBody(),
			);
		}

		#renderBody()
		{
			const { color, ...chipStyle } = this.style;

			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'center',
						height: this.size.getHeight(),
						borderRadius: Component.elementAccentCorner.toNumber(),
						paddingLeft: this.#getInternalPadding(Direction.LEFT),
						paddingRight: this.#getInternalPadding(Direction.RIGHT),
						paddingHorizontal: Indent.L.toNumber(),
						...chipStyle,
					},
				},
				this.#renderIcon(),
				this.#renderText(),
				this.#renderBadge(),
				this.#renderDropdown(),
			);
		}

		/**
		 * @param {string} direction
		 * @return {number}
		 */
		#getInternalPadding(direction)
		{
			const { icon, dropdown } = this.props;

			if (dropdown && direction === Direction.RIGHT)
			{
				return this.size.getIndent(direction, 'dropdown');
			}

			if ((icon && direction === Direction.LEFT) || this.isOnlyIcon())
			{
				return this.size.getIndent(direction, 'icon');
			}

			return this.size.getIndent(direction, 'text');
		}

		isOnlyIcon()
		{
			const { icon, dropdown, text } = this.props;

			return (icon || dropdown) && !text;
		}
	}

	ChipButton.defaultProps = {
		compact: false,
	};

	ChipButton.propTypes = {
		testId: PropTypes.string.isRequired,
		text: PropTypes.string,
		compact: PropTypes.bool,
		design: PropTypes.object,
		mode: PropTypes.object,
		badge: PropTypes.object,
		dropdown: PropTypes.bool,
		forwardRef: PropTypes.func,
	};

	module.exports = {
		ChipButton: (props) => new ChipButton(props),
		ChipButtonDesign,
		ChipButtonMode,
		iconTypes,
	};
});
