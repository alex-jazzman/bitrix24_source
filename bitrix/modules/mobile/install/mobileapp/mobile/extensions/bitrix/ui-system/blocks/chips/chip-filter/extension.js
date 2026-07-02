/**
 * @module ui-system/blocks/chips/chip-filter
 */
jn.define('ui-system/blocks/chips/chip-filter', (require, exports, module) => {
	const { Color, Indent } = require('tokens');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const {
		ChipInnerTabClass,
		ChipInnerTabDesign,
		ChipInnerTabMode,
		ChipInnerTabBadgeType,
		BadgeCounterDesign,
	} = require('ui-system/blocks/chips/chip-inner-tab');

	/**
	 * @function ChipFilter
	 * @param {object} props
	 * @param {string} [props.text]
	 * @param {value} [props.counterValue]
	 * @param {BadgeCounterDesign} [props.counterDesign]
	 * @param {boolean} [props.selected=false]
	 * @param {boolean} [props.modeMore=false]
	 * @param {boolean} [props.showCross=true]
	 * @param {function} [props.forwardRef]
	 * @return ChipFilter
	 */
	class ChipFilter extends ChipInnerTabClass
	{
		renderContent()
		{
			const { modeMore } = this.props;

			if (!modeMore)
			{
				return super.renderContent();
			}

			return this.renderMoreButton();
		}

		renderMoreButton()
		{
			return this.renderContentWrapper(
				IconView({
					icon: Icon.MORE,
					size: 22,
					color: this.getIconColor(),
				}),
			);
		}

		renderAdditionalContent()
		{
			return this.renderIconCross();
		}

		renderIconCross()
		{
			if (!this.shouldRenderCross())
			{
				return null;
			}

			return IconView({
				icon: Icon.CROSS,
				size: 22,
				color: this.getIconColor(),
			});
		}

		shouldRenderCross()
		{
			const { showCross, selected, modeMore } = this.props;

			return showCross && selected && !modeMore;
		}

		getBadgeCounterDesign()
		{
			const { counterDesign } = this.props;

			return counterDesign;
		}

		getContentStyle()
		{
			const backgroundColor = this.selected ? Color.accentSoftBlue2 : Color.bgNavigation;

			return {
				...super.getContentStyle(),
				backgroundColor: backgroundColor?.withPressed(),
			};
		}

		getBorderColor()
		{
			return this.selected ? Color.accentSoftBlue1 : Color.bgSeparatorPrimary;
		}

		getContentBaseStyle()
		{
			if (!this.shouldRenderCross())
			{
				return super.getContentBaseStyle();
			}

			return {
				...super.getContentBaseStyle(),
				paddingRight: Indent.XS.toNumber(),
			};
		}

		getIconColor()
		{
			return Color.base4;
		}
	}

	ChipFilter.defaultProps = {
		selected: false,
		modeMore: false,
		showCross: true,
	};

	ChipFilter.propTypes = {
		testId: PropTypes.string.isRequired,
		text: PropTypes.string,
		modeMore: PropTypes.bool,
		selected: PropTypes.bool,
		showCross: PropTypes.bool,
		counterValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		counterDesign: PropTypes.object,
		forwardRef: PropTypes.func,
	};

	module.exports = {
		ChipFilter: (props) => new ChipFilter(props),
		ChipInnerTabDesign,
		ChipInnerTabMode,
		ChipInnerTabBadgeType,
		BadgeCounterDesign,
	};
});
