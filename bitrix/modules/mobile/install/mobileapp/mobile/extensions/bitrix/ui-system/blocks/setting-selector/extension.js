/**
 * @module ui-system/blocks/setting-selector
 */
jn.define('ui-system/blocks/setting-selector', (require, exports, module) => {
	const { Indent, Color } = require('tokens');
	const { Ellipsize } = require('utils/enums/style');
	const { mergeImmutable } = require('utils/object');
	const { PureComponent } = require('layout/pure-component');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Text3, Text4, Text5 } = require('ui-system/typography/text');
	const { PropTypes } = require('utils/validation');
	const { Switcher, SwitcherSize } = require('ui-system/blocks/switcher');
	const { SettingMode } = require('ui-system/blocks/setting-selector/src/mode-enum');

	/**
	 * How much of the row the value of a parameter may take by default. Without a cap it takes the
	 * width it needs and the title, which is the only shrinking part of the row, is left with a
	 * couple of narrow lines. A value that fits into the half keeps its own width, and a row whose
	 * value is the point of it names a cap of its own (`modeParams.maxWidth`).
	 *
	 * @type {string}
	 */
	const PARAMETER_MAX_WIDTH = '50%';

	/**
	 * Row of a settings list: a title with an optional icon and subtitle, and on the right whatever
	 * the mode puts there - a switch, a value with a chevron, or an icon. Props are declared in
	 * `types.d.ts`.
	 *
	 * @extends {PureComponent<SettingSelectorProps>}
	 */
	class SettingSelector extends PureComponent
	{
		constructor(props)
		{
			super(props);

			this.#initializeState(props);
		}

		componentWillReceiveProps(props)
		{
			this.#initializeState(props);
		}

		#initializeState(props = {})
		{
			const { checked } = props;

			this.state = {
				checked: Boolean(checked),
			};
		}

		render()
		{
			const { testId, additionalContent = null, ...restProps } = this.props;

			const renderProps = mergeImmutable(
				{
					testId,
					style: this.#dividerStyles(),
				},
				restProps,
				{
					onClick: this.#handleOnClick,
				},
			);

			return View(
				renderProps,
				View(
					{
						style: {
							flexDirection: 'column',
						},
					},
					this.#renderTopContainer(),
					this.renderSubtitle(),
					additionalContent,
				),
			);
		}

		#renderTopContainer()
		{
			return View(
				{
					style: {
						alignItems: 'center',
						flexDirection: 'row',
					},
				},
				View(
					{
						style: {
							flex: 1,
							flexDirection: 'row',
							paddingVertical: Indent.XS2.toNumber(),
						},
					},
					this.renderIcon(),
					this.renderTitle(),
				),
				this.#renderModeComponent(),
			);
		}

		renderTitle()
		{
			const { title, titleEllipsize, numberOfLinesTitle = 2, color = Color.base1 } = this.props;

			if (!title)
			{
				return null;
			}

			return Text3({
				text: title,
				color,
				numberOfLines: numberOfLinesTitle,
				ellipsize: this.#getEllipsize(titleEllipsize),
				style: {
					flex: 1,
					flexShrink: 1,
				},
			});
		}

		renderIcon()
		{
			const { icon, iconColor, locked } = this.props;
			const iconProps = {
				icon,
				size: 24,
				color: Color.resolve(iconColor, Color.base1),
				style: {
					marginRight: Indent.XS.toNumber(),
				},
			};

			if (locked)
			{
				iconProps.icon = Icon.LOCK;
				iconProps.color = Color.base1;
			}

			if (!iconProps.icon)
			{
				return null;
			}

			return IconView(iconProps);
		}

		renderSubtitle()
		{
			const { subtitle, numberOfLinesSubtitle = 5, subtitleEllipsize } = this.props;

			if (!subtitle)
			{
				return null;
			}

			return Text5({
				text: subtitle,
				color: Color.base3,
				numberOfLines: numberOfLinesSubtitle,
				ellipsize: this.#getEllipsize(subtitleEllipsize),
				style: {
					paddingVertical: Indent.XS2.toNumber(),
					marginRight: this.#getSwitchSize().getWidth(),
				},
			});
		}

		#renderModeComponent()
		{
			const { mode } = this.props;

			switch (mode)
			{
				case SettingMode.PARAMETER:
					return this.#renderParameterMode();
				case SettingMode.RIGHT_ICON:
					return this.#renderRightIcon();
				default:
					return this.#renderSwitch();
			}
		}

		#renderParameterMode()
		{
			const { testId } = this.props;
			const {
				chevron,
				text,
				iconRef,
				color,
				textColor,
				numberOfLines = 1,
				ellipsize,
				maxWidth = PARAMETER_MAX_WIDTH,
			} = this.#getModeParams();

			return View(
				{
					testId: `${testId}-parameter`,
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						flexShrink: 1,
						maxWidth,
						marginLeft: Indent.XL4.toNumber(),
					},
				},
				Boolean(text) && Text4({
					text,
					color: textColor ?? color ?? Color.base4,
					numberOfLines,
					ellipsize: this.#getEllipsize(ellipsize),
					style: {
						flexShrink: 1,
					},
				}),
				chevron && IconView({
					size: 20,
					icon: Icon.CHEVRON_TO_THE_RIGHT,
					color: color ?? Color.base4,
					forwardRef: iconRef,
					style: {
						marginLeft: Indent.XS.toNumber(),
						flexShrink: 0,
					},
				}),
			);
		}

		#renderRightIcon()
		{
			return IconView(this.#getModeParams());
		}

		#renderSwitch()
		{
			const { locked, testId } = this.props;
			const { checked } = this.state;

			return Switcher({
				testId: `${testId}_toggle`,
				checked,
				useState: false,
				disabled: locked,
				size: this.#getSwitchSize(),
				style: {
					paddingVertical: Indent.XS2.toNumber(),
					marginLeft: Indent.XL4.toNumber(),
				},
			});
		}

		#dividerStyles()
		{
			const { divider } = this.props;

			if (!divider)
			{
				return {};
			}

			return {
				borderBottomWidth: 1,
				borderBottomColor: Color.bgSeparatorSecondary.toHex(),
			};
		}

		#handleOnClick = () => {
			const { locked, onClick } = this.props;
			const { checked: stateChecked } = this.state;
			let checked = !stateChecked;

			if (locked)
			{
				checked = stateChecked;
			}
			else
			{
				this.setState({ checked });
			}

			if (onClick)
			{
				onClick(checked);
			}
		};

		#getSwitchSize()
		{
			return this.props.switcherSize ?? SwitcherSize.XL;
		}

		#getEllipsize(value)
		{
			return Ellipsize.resolve(value, Ellipsize.END).toString();
		}

		#getModeParams()
		{
			const { modeParams } = this.props;

			return modeParams || {};
		}
	}

	SettingSelector.defaultProps = {
		testId: null,
		checked: false,
		locked: false,
		divider: false,
	};

	SettingSelector.propTypes = {
		testId: PropTypes.string.isRequired,
		checked: PropTypes.bool,
		locked: PropTypes.bool,
		divider: PropTypes.bool,
		icon: PropTypes.instanceOf(Icon),
		iconColor: PropTypes.instanceOf(Color),
		title: PropTypes.string,
		color: PropTypes.instanceOf(Color),
		titleEllipsize: PropTypes.instanceOf(Ellipsize),
		numberOfLinesTitle: PropTypes.number,
		subtitle: PropTypes.string,
		subtitleEllipsize: PropTypes.instanceOf(Ellipsize),
		numberOfLinesSubtitle: PropTypes.number,
		mode: PropTypes.instanceOf(SettingMode),
		modeParams: PropTypes.object,
		switcherSize: PropTypes.instanceOf(SwitcherSize),
		additionalContent: PropTypes.object,
		style: PropTypes.object,
		onClick: PropTypes.func,
	};

	module.exports = {
		/** @param {SettingSelectorProps} props */
		SettingSelector: (props) => new SettingSelector(props),
		Icon,
		SettingMode,
		Ellipsize,
	};
});
