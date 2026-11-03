import { addDate } from './add-date';
import { floorDate } from './floor-date';

export function getGridStartDate(date: Date, firstWeekDay: number): Date
{
	const firstMonthDay = floorDate(date, 'month');
	let daysFromPrevMonth = firstMonthDay.getUTCDay() - firstWeekDay;
	daysFromPrevMonth = daysFromPrevMonth < 0 ? daysFromPrevMonth + 7 : daysFromPrevMonth;

	return addDate(firstMonthDay, 'day', -daysFromPrevMonth);
}
