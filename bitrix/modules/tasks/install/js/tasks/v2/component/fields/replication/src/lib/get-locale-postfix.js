import { ReplicationWeekDayIndex } from 'tasks.v2.const';

export function getWeekDayGender(weekDay: $Values<typeof ReplicationWeekDayIndex>): '_M' | '_F' | ''
{
	if (weekDay === ReplicationWeekDayIndex.Sunday)
	{
		return '';
	}

	if (
		weekDay === ReplicationWeekDayIndex.Monday
		|| weekDay === ReplicationWeekDayIndex.Tuesday
		|| weekDay === ReplicationWeekDayIndex.Thursday
	)
	{
		return '_M';
	}

	return '_F';
}
