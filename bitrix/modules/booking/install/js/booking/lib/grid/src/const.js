import { type BaseTokenKey, type TokenKey } from './types';

export const HoursInDay = 24;

export const GridTokenKey: { [key: TokenKey]: TokenKey } = Object.freeze({
	DayCellWidth: 'DayCellWidth',
	DayCellHeight: 'DayCellHeight',
	DayHourHeight: 'DayHourHeight',
	DayDaysPanelHeight: 'DayDaysPanelHeight',
	WeekCellWidth: 'WeekCellWidth',
	WeekCellHeight: 'WeekCellHeight',
	WeekCellPadding: 'WeekCellPadding',
	WeekDaysPanelHeight: 'WeekDaysPanelHeight',
	LeftPanelWidthDay: 'LeftPanelWidthDay',
	LeftPanelWidthAmPm: 'LeftPanelWidthAmPm',
	LeftPanelWidthWeek: 'LeftPanelWidthWeek',
	SidebarZoneWidth: 'SidebarZoneWidth',
	WeekHourWidth: 'WeekHourWidth',
});

export const GridTokenCssVar: { [key: BaseTokenKey]: string } = {
	DayCellWidth: '--booking-day-cell-width',
	DayCellHeight: '--booking-day-cell-height',
	DayHourHeight: '--booking-day-hour-height',
	DayDaysPanelHeight: '--booking-day-days-panel-height',
	WeekCellWidth: '--booking-week-cell-width',
	WeekCellHeight: '--booking-week-cell-height',
	WeekCellPadding: '--booking-week-cell-padding',
	WeekDaysPanelHeight: '--booking-week-days-panel-height',
	LeftPanelWidthDay: '--booking-day-left-panel-width',
	LeftPanelWidthAmPm: '--booking-am-pm-left-panel-width',
	LeftPanelWidthWeek: '--booking-week-left-panel-width',
	SidebarZoneWidth: '--booking-sidebar-zone-width',
};
