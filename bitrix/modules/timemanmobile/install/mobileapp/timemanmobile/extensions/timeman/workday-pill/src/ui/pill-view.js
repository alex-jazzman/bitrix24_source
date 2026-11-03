/**
 * @module timeman/workday-pill/src/ui/pill-view
 */
jn.define('timeman/workday-pill/src/ui/pill-view', (require, exports, module) => {
	const { ChipButton, ChipButtonDesign, ChipButtonMode, ChipButtonSize } = require('ui-system/blocks/chips/chip-button');
	const { WorkdayState } = require('timeman/const');
	const { PillDesign } = require('timeman/workday-pill/src/enum/pill-design');

	const DESIGN_BY_STATE = {
		[WorkdayState.NOT_STARTED]: PillDesign.NOT_STARTED,
		[WorkdayState.OPENED]: PillDesign.OPENED,
		[WorkdayState.PAUSED]: PillDesign.PAUSED,
		[WorkdayState.CLOSED]: PillDesign.CLOSED,
		[WorkdayState.EXPIRED]: PillDesign.EXPIRED,
	};

	const CHIP_BUTTON_MODE_BY_STATE = {
		[WorkdayState.NOT_STARTED]: {
			design: ChipButtonDesign.PRIMARY,
			mode: ChipButtonMode.SOLID,
		},
		[WorkdayState.OPENED]: {
			design: ChipButtonDesign.PRIMARY,
			mode: ChipButtonMode.SOLID,
		},
		[WorkdayState.PAUSED]: {
			design: ChipButtonDesign.PRIMARY,
			mode: ChipButtonMode.SOLID,
		},
		[WorkdayState.CLOSED]: {
			design: ChipButtonDesign.PRIMARY,
			mode: ChipButtonMode.SOLID,
		},
		[WorkdayState.EXPIRED]: {
			design: ChipButtonDesign.ALERT,
			mode: ChipButtonMode.SOLID,
		},
	};

	const SHOW_DURATION_STATES = new Set([
		WorkdayState.NOT_STARTED,
		WorkdayState.OPENED,
		WorkdayState.PAUSED,
		WorkdayState.CLOSED,
		WorkdayState.EXPIRED,
	]);

	function formatDuration(seconds)
	{
		const totalMinutes = Math.floor(seconds / 60);
		const hours = Math.floor(totalMinutes / 60);
		const minutes = totalMinutes % 60;

		return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
	}

	class PillView extends LayoutComponent
	{
		render()
		{
			const { testId, widgetState, duration, loading, onPress, forwardRef } = this.props;

			const pillDesign = DESIGN_BY_STATE[widgetState] ?? DESIGN_BY_STATE[WorkdayState.NOT_STARTED];
			const { design, mode } = CHIP_BUTTON_MODE_BY_STATE[widgetState]
			?? CHIP_BUTTON_MODE_BY_STATE[WorkdayState.NOT_STARTED];
			const text = SHOW_DURATION_STATES.has(widgetState) ? formatDuration(duration) : '';

			return View(
				{
					ref: forwardRef,
				},
				ChipButton({
					testId,
					icon: pillDesign.getIcon(),
					size: ChipButtonSize.L,
					text,
					design,
					mode,
					loading,
					dropdown: true,
					backgroundColor: pillDesign.getBgColor(),
					color: pillDesign.getTextColor(),
					iconColor: pillDesign.getIconColor(),
					onClick: loading ? null : onPress,
				}),
			);
		}
	}

	module.exports = { PillView: (props) => new PillView(props) };
});
