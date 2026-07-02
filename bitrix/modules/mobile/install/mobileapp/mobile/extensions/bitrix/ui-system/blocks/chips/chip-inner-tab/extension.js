/**
 * @module ui-system/blocks/chips/chip-inner-tab
 */
jn.define('ui-system/blocks/chips/chip-inner-tab', (require, exports, module) => {
	const { Type } = require('type');
	const { Color, Component, Indent } = require('tokens');
	const { mergeImmutable } = require('utils/object');
	const { Text4 } = require('ui-system/typography/text');
	const { BadgeCounter, BadgeCounterDesign, BadgeCounterSize } = require('ui-system/blocks/badges/counter');
	const { ReactionIconView, ReactionIcon } = require('ui-system/blocks/reaction/icon');
	const { IconView } = require('ui-system/blocks/icon');
	const { ChipInnerTabDesign } = require('ui-system/blocks/chips/chip-inner-tab/src/design-enum');
	const { ChipInnerTabMode } = require('ui-system/blocks/chips/chip-inner-tab/src/mode-enum');
	const { ChipInnerTabBadgeType } = require('ui-system/blocks/chips/chip-inner-tab/src/badge-type-enum');

	const BADGE_OVERFLOW = Math.ceil(BadgeCounterSize.M.getHeight() / 2);

	/**
	 * @function ChipInnerTab
	 * @param {object} props
	 * @param {string} props.testId
	 * @param {string} props.text
	 * @param {ChipInnerTabDesign} [props.design=ChipInnerTabDesign.OUTLINE]
	 * @param {ChipInnerTabMode} [props.mode=ChipInnerTabMode.ACTIVE]
	 * @param {ChipInnerTabBadgeType} [props.badgeType]
	 * @param {boolean} [props.selected=false]
	 * @param {number|string} [props.counterValue]
	 * @param {BadgeCounterDesign} [props.counterDesign]
	 * @param {Icon} [props.icon]
	 * @param {number} [props.iconSize]
	 * @param {Color} [props.accentBorderColor]
	 * @param {Color} [props.accentTextColor]
	 * @param {function} [props.onClick]
	 * @param {function} [props.forwardRef]
	 * @param {object} [props.style]
	 * @param {object} [props.textStyles]
	 */
	class ChipInnerTab extends LayoutComponent
	{
		get selected()
		{
			const { selected } = this.props;

			return selected;
		}

		render()
		{
			const {
				testId,
				onClick,
				forwardRef,
				style,
			} = this.props;

			const viewProps = mergeImmutable(
				{
					testId,
					onClick,
					ref: forwardRef,
					style: {
						flexShrink: 1,
						height: Component.itbChipHeight.toNumber() + BADGE_OVERFLOW,
						justifyContent: 'flex-end',
					},
				},
				{ style },
			);

			return View(
				viewProps,
				this.renderBadgeOverlay(),
				this.renderContent(),
			);
		}

		renderBadgeOverlay()
		{
			const { badgeType, counterValue } = this.props;

			if (ChipInnerTabBadgeType.has(badgeType))
			{
				return this.renderBadge(badgeType.getText(), badgeType.getDesign());
			}

			if (this.shouldRenderBadgeCounter())
			{
				return this.renderBadge(counterValue, this.getBadgeCounterDesign());
			}

			return null;
		}

		renderBadge(value, design)
		{
			return BadgeCounter({
				style: {
					alignSelf: 'flex-end',
					marginBottom: -BADGE_OVERFLOW,
					zIndex: 1,
				},
				value,
				design,
				showRawValue: Type.isString(value),
				testId: this.props.testId,
			});
		}

		renderIcon()
		{
			const { icon, text, iconSize } = this.props;

			if (!icon)
			{
				return null;
			}

			const iconStyle = {
				marginRight: text ? Indent.XS.toNumber() : 0,
			};
			const testId = `${this.props.testId}-icon`;

			if (icon instanceof ReactionIcon)
			{
				const type = Application.getPlatform() === 'ios' ? 'png' : 'svg'; // ios bug with render gradient in svg

				return ReactionIconView({
					icon,
					testId,
					size: iconSize,
					style: iconStyle,
					type,
				});
			}

			return IconView({
				icon,
				testId,
				size: iconSize,
				style: iconStyle,
			});
		}

		renderContent()
		{
			return this.renderContentWrapper(
				[
					this.renderIcon(),
					this.renderText(),
					this.renderAdditionalContent(),
				],
			);
		}

		renderContentWrapper(children)
		{
			const childrenView = Array.isArray(children) ? children : [children];

			return View(
				{
					style: {
						...this.getContentStyle(),
						...this.getContentBaseStyle(),
					},
				},
				...childrenView,
			);
		}

		renderText()
		{
			const { text, textStyles, testId } = this.props;

			return Text4({
				text,
				testId: `${testId}-field`,
				color: this.getTextColor(),
				ellipsize: 'end',
				numberOfLines: 1,
				style: textStyles,
			});
		}

		renderAdditionalContent()
		{
			const mode = ChipInnerTabMode.resolve(this.props.mode, ChipInnerTabMode.ACTIVE);
			const icon = mode.getIcon();

			if (!icon)
			{
				return null;
			}

			return IconView({
				icon,
				size: 22,
				color: Color.base0,
				testId: `${this.props.testId}-icon-${mode.getName()}`,
			});
		}

		shouldRenderBadgeCounter()
		{
			const { counterValue } = this.props;

			return Type.isNumber(counterValue);
		}

		getContentStyle()
		{
			return {
				borderColor: this.getBorderColor().toHex(),
			};
		}

		getContentBaseStyle()
		{
			const design = ChipInnerTabDesign.resolve(this.props.design, ChipInnerTabDesign.OUTLINE);
			const mode = ChipInnerTabMode.resolve(this.props.mode, ChipInnerTabMode.ACTIVE);

			return {
				flexDirection: 'row',
				alignItems: 'center',
				justifyContent: 'center',
				height: Component.itbChipHeight.toNumber(),
				borderRadius: Component.itbChipCorner.toNumber(),
				borderWidth: design.getBorderWidth(),
				paddingLeft: Component.itbChipPaddingLr.toNumber(),
				paddingRight: mode.getPaddingRight(),
			};
		}

		getBadgeCounterDesign()
		{
			return this.selected ? this.props.counterDesign : BadgeCounterDesign.GREY;
		}

		getBorderColor()
		{
			return this.selected ? this.props.accentBorderColor : Color.bgSeparatorPrimary;
		}

		getTextColor()
		{
			return this.selected ? this.props.accentTextColor : Color.base3;
		}
	}

	ChipInnerTab.defaultProps = {
		design: ChipInnerTabDesign.OUTLINE,
		mode: ChipInnerTabMode.ACTIVE,
		selected: false,
		counterDesign: BadgeCounterDesign.GREY,
		accentBorderColor: Color.base5,
		accentTextColor: Color.base1,
		style: {},
		textStyles: {},
	};

	ChipInnerTab.propTypes = {
		testId: PropTypes.string.isRequired,
		text: PropTypes.string.isRequired,
		design: PropTypes.instanceOf(ChipInnerTabDesign),
		mode: PropTypes.instanceOf(ChipInnerTabMode),
		badgeType: PropTypes.instanceOf(ChipInnerTabBadgeType),
		selected: PropTypes.bool,
		counterValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		counterDesign: PropTypes.instanceOf(BadgeCounterDesign),
		icon: PropTypes.object,
		iconSize: PropTypes.number,
		accentBorderColor: PropTypes.instanceOf(Color),
		accentTextColor: PropTypes.instanceOf(Color),
		onClick: PropTypes.func,
		forwardRef: PropTypes.func,
		style: PropTypes.object,
		textStyles: PropTypes.object,
	};

	module.exports = {
		ChipInnerTab: (props) => new ChipInnerTab(props),
		ChipInnerTabClass: ChipInnerTab,
		ChipInnerTabDesign,
		ChipInnerTabMode,
		ChipInnerTabBadgeType,
		BadgeCounterDesign,
	};
});
