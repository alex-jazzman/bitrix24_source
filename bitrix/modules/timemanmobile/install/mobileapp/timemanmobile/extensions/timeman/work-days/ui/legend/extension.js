/**
 * @module timeman/work-days/ui/legend
 */
jn.define('timeman/work-days/ui/legend', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { Indent, Color } = require('tokens');
	const { ChipButton, ChipButtonDesign, ChipButtonMode, ChipButtonSize } = require('ui-system/blocks/chips/chip-button');
	const { BadgeCounter, BadgeCounterDesign } = require('ui-system/blocks/badges/counter');
	const { Loc } = require('loc');
	const { DAY_TYPES } = require('timeman/work-days/enums');
	const { createTestIdGenerator } = require('utils/test');

	const LEGEND_ITEMS = [
		{
			type: DAY_TYPES.WORK,
			chipDesign: ChipButtonDesign.BLACK,
			badgeDesign: BadgeCounterDesign.SUCCESS,
		},
		{
			type: DAY_TYPES.DAY_OFF,
			chipDesign: ChipButtonDesign.BLACK,
			badgeDesign: BadgeCounterDesign.LIGHT_GREY,
		},
		{
			type: DAY_TYPES.SICK_LEAVE,
			chipDesign: ChipButtonDesign.BLACK,
			badgeDesign: BadgeCounterDesign.ALERT,
		},
		{
			type: DAY_TYPES.TIME_OFF,
			chipDesign: ChipButtonDesign.BLACK,
			badgeDesign: BadgeCounterDesign.PRIMARY_EFFECTIVINESS,
		},
		{
			type: DAY_TYPES.VACATION,
			chipDesign: ChipButtonDesign.BLACK,
			badgeDesign: BadgeCounterDesign.PRIMARY,
		},
	];

	class CalendarLegend extends PureComponent
	{
		/**
		 * @param {CalendarLegendProps} props
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({ prefix: 'legend', context: this });
		}

		render()
		{
			return View(
				{
					testId: this.getTestId(),
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'center',
						flexWrap: 'wrap',
						paddingVertical: Indent.M.toNumber(),
						borderTopWidth: 1,
						borderTopColor: Color.bgSeparatorSecondary.toHex(),
					},
				},
				...LEGEND_ITEMS.map((item, index) => this.#renderItem(item, index)),
			);
		}

		#renderItem(item, index)
		{
			const { counts } = this.props;
			const count = counts?.[item.type.id] || 0;

			return count > 0 && ChipButton({
				testId: this.getTestId(`item-${index}`),
				text: Loc.getMessage(item.type.messageKey),
				design: null,
				mode: ChipButtonMode.OUTLINE,
				size: ChipButtonSize.S,
				badge: BadgeCounter({
					testId: this.getTestId(`item-badge-${index}`),
					value: count,
					design: item.badgeDesign,
					showRawValue: true,
				}),
				style: {
					marginLeft: index > 0 ? Indent.XS2.toNumber() : 0,
					marginBottom: Indent.XS2.toNumber(),
					borderColor: Color.bgContentSecondary.toHex(),
				},
				compact: false,
			});
		}
	}

	module.exports = { CalendarLegend };
});
