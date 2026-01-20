import { Loc } from 'main.core';

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
		const dailyMonthInterval = this.#replicateParams.dailyMonthInterval || 1;

		return Loc.getMessagePlural(
			'TASKS_V2_REPLICATION_DAILY',
			dailyMonthInterval,
			{
				'#NUMBER#': dailyMonthInterval > 1 ? ` ${dailyMonthInterval}` : '',
			},
		);
	}
}
