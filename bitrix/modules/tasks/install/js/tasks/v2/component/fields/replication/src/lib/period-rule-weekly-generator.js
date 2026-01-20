import { Loc } from 'main.core';

import type { TaskReplicateParams } from 'tasks.v2.model.tasks';

import type { PeriodRuleGenerator } from '../types';

export class PeriodRuleWeeklyGenerator implements PeriodRuleGenerator
{
	#replicateParams: TaskReplicateParams;

	constructor(replicateParams: TaskReplicateParams)
	{
		this.#replicateParams = replicateParams;
	}

	generate(): string
	{
		const everyWeek = this.#replicateParams.everyWeek || 1;

		const weekDaysLabel = this.#weekDays.length === 7
			? Loc.getMessage('TASKS_V2_REPLICATION_WEEKLY_EVERYDAY')
			: this.#weekDays.map((wd) => Loc.getMessage(`TASKS_V2_REPLICATION_WD_${wd}`)).join(', ');

		return Loc.getMessagePlural(
			'TASKS_V2_REPLICATION_WEEKLY',
			everyWeek,
			{
				'#NUMBER#': everyWeek > 1 ? ` ${everyWeek}` : '',
				'#WEEKDAYS#': ` (${weekDaysLabel})`,
			},
		);
	}

	get #weekDays(): number[]
	{
		const weekDays = this.#replicateParams.weekDays;

		return [...(weekDays?.length > 0 ? weekDays : [1])].sort();
	}
}
