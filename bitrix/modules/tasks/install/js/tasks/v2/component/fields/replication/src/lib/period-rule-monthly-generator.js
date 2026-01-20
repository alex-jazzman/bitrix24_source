import { Loc } from 'main.core';
import { ReplicationMonthlyType, ReplicationWeekDayIndex } from 'tasks.v2.const';
import type { TaskReplicateParams } from 'tasks.v2.model.tasks';

import type { PeriodRuleGenerator } from '../types';
import { getWeekDayGender } from './get-locale-postfix';

export class PeriodRuleMonthlyGenerator implements PeriodRuleGenerator
{
	#replicateParams: TaskReplicateParams;

	constructor(replicateParams: TaskReplicateParams)
	{
		this.#replicateParams = replicateParams;
	}

	generate(): string
	{
		return this.#replicateParams.monthlyType === ReplicationMonthlyType.Absolute
			? this.#generateAbsolute()
			: this.#generateRelative();
	}

	#generateAbsolute(): string
	{
		const monthlyMonthNum = this.#replicateParams.monthlyMonthNum1 || 1;

		return Loc.getMessagePlural(
			'TASKS_V2_REPLICATION_MONTHLY_1',
			monthlyMonthNum,
			{
				'#NUMBER#': monthlyMonthNum > 1 ? ` ${monthlyMonthNum}` : '',
				'#DAY_NUMBER#': this.#replicateParams.monthlyDayNum,
			},
		);
	}

	#generateRelative(): string
	{
		const monthlyWeekDay = this.#replicateParams.monthlyWeekDay;
		const weekDayNum = this.#replicateParams.monthlyWeekDayNum;
		const localePostfix = getWeekDayGender(monthlyWeekDay);

		const dayNumber = Loc.getMessage(`TASKS_V2_REPLICATION_NUMBER_${weekDayNum}${localePostfix}`);
		const weekDay = Loc.getMessage(`TASKS_V2_REPLICATION_WD_ALT_${monthlyWeekDay + 1}`);
		const monthlyMonthNum = this.#replicateParams.monthlyMonthNum2 || 1;

		return Loc.getMessage(
			`TASKS_V2_REPLICATION_MONTHLY_2${this.#getLocaleMonthlyOfDayType2Alt()}`,
			{
				'#DAY_NUMBER#': dayNumber,
				'#WEEKDAY_NAME#': weekDay,
				'#NUMBER#': monthlyMonthNum > 1 ? ` ${monthlyMonthNum}` : '',
			},
		);
	}

	#getLocaleMonthlyOfDayType2Alt(): '_ALT_0' | '_ALT_1' | ''
	{
		const weekDay = this.#replicateParams.monthlyWeekDay;

		if (weekDay === ReplicationWeekDayIndex.Sunday)
		{
			return '_ALT_1';
		}

		if (weekDay === ReplicationWeekDayIndex.Wednesday
			|| weekDay === ReplicationWeekDayIndex.Friday
			|| weekDay === ReplicationWeekDayIndex.Saturday)
		{
			return '_ALT_0';
		}

		return '';
	}
}
