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
