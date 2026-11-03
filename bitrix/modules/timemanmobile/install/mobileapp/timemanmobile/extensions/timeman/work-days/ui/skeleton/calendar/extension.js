/**
 * @module timeman/work-days/ui/skeleton/calendar
 */
jn.define('timeman/work-days/ui/skeleton/calendar', (require, exports, module) => {
	const { Line } = require('utils/skeleton');
	const { Color, Component } = require('tokens');

	const PADDING = Component.paddingLr.toNumber();
	const LEFT_PADDING = PADDING - 5;
	const RIGHT_PADDING = PADDING + 5;
	const WEEKS_COUNT = 6;
	const WEEK_NUMBERS_COUNT = 4;
	const DAYS_IN_WEEK = 7;
	const DAY_CELL_HEIGHT = 37;
	const DAY_CELL_WIDTH = 40;
	const DAY_CAPSULE_WIDTH = 40;
	const DAY_CAPSULE_HEIGHT = 32;
	const DAY_CAPSULE_RADIUS = DAY_CAPSULE_HEIGHT / 2;
	const WEEKDAY_HEADER_HEIGHT = 28;
	const WEEKDAY_LABEL_WIDTH = 12;
	const WEEKDAY_LABEL_HEIGHT = 8;
	const WEEK_NUMBER_COLUMN_WIDTH = 24;
	const WEEK_NUMBER_LINE_WIDTH = 12;
	const WEEK_NUMBER_LINE_HEIGHT = 10;

	const renderWeekNumbers = () => View(
		{
			style: {
				position: 'absolute',
				top: WEEKDAY_HEADER_HEIGHT + DAY_CELL_HEIGHT / 2,
				left: LEFT_PADDING,
				width: WEEK_NUMBER_COLUMN_WIDTH,
			},
		},
		...Array.from({ length: WEEK_NUMBERS_COUNT }, () => (
			View(
				{
					style: {
						height: DAY_CELL_HEIGHT,
						alignItems: 'center',
						justifyContent: 'center',
					},
				},
				Line(WEEK_NUMBER_LINE_WIDTH, WEEK_NUMBER_LINE_HEIGHT),
			)
		)),
	);

	const renderWeekdayHeader = () => View(
		{
			style: {
				flexDirection: 'row',
				alignItems: 'center',
				height: WEEKDAY_HEADER_HEIGHT,
				paddingLeft: LEFT_PADDING,
				paddingRight: RIGHT_PADDING,
			},
		},
		View({ style: { width: WEEK_NUMBER_COLUMN_WIDTH } }),
		View(
			{
				style: {
					flex: 1,
					flexDirection: 'row',
					justifyContent: 'space-between',
					alignItems: 'center',
					marginLeft: -(WEEK_NUMBER_COLUMN_WIDTH / 2),
				},
			},
			...Array.from({ length: DAYS_IN_WEEK }, () => (
				View(
					{
						style: { width: DAY_CELL_WIDTH, alignItems: 'center' },
					},
					Line(WEEKDAY_LABEL_WIDTH, WEEKDAY_LABEL_HEIGHT),
				)
			)),
		),
	);

	const renderWeekRow = () => View(
		{
			style: {
				flexDirection: 'row',
				alignItems: 'center',
				height: DAY_CELL_HEIGHT,
				paddingLeft: LEFT_PADDING,
				paddingRight: RIGHT_PADDING,
			},
		},
		View({ style: { width: WEEK_NUMBER_COLUMN_WIDTH } }),
		View(
			{
				style: {
					flex: 1,
					flexDirection: 'row',
					justifyContent: 'space-between',
					alignItems: 'center',
					marginLeft: -(WEEK_NUMBER_COLUMN_WIDTH / 2),
				},
			},
			...Array.from({ length: DAYS_IN_WEEK }, () => (
				View(
					{
						style: { width: DAY_CELL_WIDTH, alignItems: 'center' },
					},
					Line(DAY_CAPSULE_WIDTH, DAY_CAPSULE_HEIGHT, 0, 0, DAY_CAPSULE_RADIUS),
				)
			)),
		),
	);

	const WorkDaysCalendarSkeleton = () => View(
		{
			style: {
				backgroundColor: Color.bgNavigation.toHex(),
				position: 'relative',
				paddingBottom: 4,
			},
		},
		renderWeekdayHeader(),
		...Array.from({ length: WEEKS_COUNT }, () => renderWeekRow()),
		renderWeekNumbers(),
	);

	module.exports = { WorkDaysCalendarSkeleton };
});
