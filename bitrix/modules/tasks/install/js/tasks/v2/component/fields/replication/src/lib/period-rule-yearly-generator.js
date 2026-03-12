import { Loc } from 'main.core';
import { DateTimeFormat } from 'main.date';

import { ReplicationYearlyWeekDayIndex, ReplicationYearlyType } from 'tasks.v2.const';
import type { TaskReplicateParams } from 'tasks.v2.model.tasks';

import { getWeekDayGender } from './get-locale-postfix';
import type { PeriodRuleGenerator } from '../types';

export class PeriodRuleYearlyGenerator implements PeriodRuleGenerator
{
	#replicateParams: TaskReplicateParams;

	constructor(replicateParams: TaskReplicateParams)
	{
		this.#replicateParams = replicateParams;
	}

	generate(): string
	{
		return this.#replicateParams.yearlyType === ReplicationYearlyType.Absolute
			? this.#generateAbsolute()
			: this.#generateRelative();
	}

	#generateAbsolute(): string
	{
		const yearlyDayNum = this.#replicateParams.yearlyDayNum || 1;
		const yearlyMonth = this.#replicateParams.yearlyMonth1 || 1;

		return Loc.getMessage(
			'TASKS_V2_REPLICATION_YEARLY_1',
			{
				'#NUMBER#': ` ${yearlyDayNum}`,
				'#MONTH#': DateTimeFormat.format('F', new Date().setMonth(yearlyMonth - 1) / 1000),
			},
		);
	}

	#generateRelative(): string
	{
		const yearlyWeekDayNum = this.#replicateParams.yearlyWeekDayNum || 0;
		const yearlyWeekDay = this.#replicateParams.yearlyWeekDay || 0;
		const yearlyMonth = this.#replicateParams.yearlyMonth2 || 1;

		const dayNumberLabel = Loc.getMessage(`TASKS_V2_REPLICATION_NUMBER_${yearlyWeekDayNum}${getWeekDayGender(
			yearlyWeekDay - 1,
		)}`);

		return Loc.getMessage(
			`TASKS_V2_REPLICATION_YEARLY_2${this.#getLocaleType2Alt()}`,
			{
				'#DAY_NUMBER#': dayNumberLabel,
				'#WEEK_DAY#': Loc.getMessage(`TASKS_V2_REPLICATION_WD_ALT_${yearlyWeekDay}`),
				'#MONTH#': DateTimeFormat.format('F', new Date().setMonth(yearlyMonth - 1) / 1000),
			},
		);
	}

	#getLocaleType2Alt(): '_ALT_0' | '_ALT_1' | ''
	{
		const weekDay = this.#replicateParams.yearlyWeekDay;

		if (weekDay === ReplicationYearlyWeekDayIndex.Sunday)
		{
			return '_ALT_1';
		}

		if (weekDay === ReplicationYearlyWeekDayIndex.Wednesday
			|| weekDay === ReplicationYearlyWeekDayIndex.Saturday
			|| weekDay === ReplicationYearlyWeekDayIndex.Friday)
		{
			return '_ALT_0';
		}

		return '';
	}
}
