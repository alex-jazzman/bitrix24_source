import { Grid } from 'booking.const';

export type BaseTokenKey =
	| 'DayCellWidth'
	| 'DayCellHeight'
	| 'DayHourHeight'
	| 'DayDaysPanelHeight'
	| 'WeekCellWidth'
	| 'WeekCellHeight'
	| 'WeekCellPadding'
	| 'WeekDaysPanelHeight'
	| 'LeftPanelWidthDay'
	| 'LeftPanelWidthAmPm'
	| 'LeftPanelWidthWeek'
	| 'SidebarZoneWidth';

export type TokenKey = BaseTokenKey | 'WeekHourWidth';

export type TokenState = { [key: TokenKey]: number };

export type GridRenderParams = {
	gridMode: $Values<typeof Grid.Mode>,
	selectedDateTs: number,
	selectedFirstDayPeriodTs: number | null,
	resourcesIds: number[],
	zoom: number,
	fromHour: number,
	toHour: number,
	offHoursExpanded: boolean,
	offset?: number,
};
