import { Loc } from 'main.core';
import { DateTimeFormat } from 'main.date';

import type { TaskReplicateParams } from 'tasks.v2.model.tasks';

import type { PeriodRuleGenerator } from '../types';

export class PeriodRuleDailyGenerator implements PeriodRuleGenerator
{
	#replicateParams: TaskReplicateParams;

	constructor(replicateParams: TaskReplicateParams)
	{
		this.#replicateParams = replicateParams;
	}

	generate(): string
	{
		const dailyMonthInterval = this.#replicateParams.dailyMonthInterval;
		const everyDay = this.#replicateParams.everyDay || 1;

		if (dailyMonthInterval > 0)
		{
			return Loc.getMessage('TASKS_V2_REPLICATION_MONTHLY_2', {
				'#DAY_NUMBER#': DateTimeFormat.format('ddiff', 0, everyDay * 60 * 60 * 24, true),
				'#WEEKDAY_NAME#': '',
				'#NUMBER#': ` ${dailyMonthInterval + 1}`,
			});
		}

		return Loc.getMessagePlural(
			'TASKS_V2_REPLICATION_DAILY',
			everyDay,
			{
				'#NUMBER#': everyDay > 1 ? ` ${everyDay}` : '',
			},
		);
	}
}
