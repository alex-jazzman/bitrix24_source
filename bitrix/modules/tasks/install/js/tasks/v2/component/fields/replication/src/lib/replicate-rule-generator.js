import { Loc } from 'main.core';
import { DateTimeFormat } from 'main.date';

import { ReplicationPeriod, ReplicationRepeatTill } from 'tasks.v2.const';
import type { TaskReplicateParams } from 'tasks.v2.model.tasks';

import { PeriodRuleDailyGenerator } from './period-rule-daily-generator';
import { PeriodRuleWeeklyGenerator } from './period-rule-weekly-generator';
import { PeriodRuleMonthlyGenerator } from './period-rule-monthly-generator';
import { PeriodRuleYearlyGenerator } from './period-rule-yearly-generator';
import { TimeStringConverter } from './time-string-converter';
import type { PeriodRuleGenerator } from '../types';

export class ReplicateRuleGenerator
{
	#replicateParams: TaskReplicateParams;
	#periodRuleGenerator: PeriodRuleGenerator;

	constructor(replicateParams: TaskReplicateParams)
	{
		this.#replicateParams = replicateParams;
		this.#setPeriodRuleGenerator(replicateParams.period);
	}

	#setPeriodRuleGenerator(period: $Values<typeof ReplicationPeriod>): void
	{
		switch (period)
		{
			case ReplicationPeriod.Weekly:
			{
				this.#periodRuleGenerator = new PeriodRuleWeeklyGenerator(this.#replicateParams);

				break;
			}

			case ReplicationPeriod.Monthly:
			{
				this.#periodRuleGenerator = new PeriodRuleMonthlyGenerator(this.#replicateParams);

				break;
			}

			case ReplicationPeriod.Yearly:
			{
				this.#periodRuleGenerator = new PeriodRuleYearlyGenerator(this.#replicateParams);

				break;
			}

			default:
			{
				this.#periodRuleGenerator = new PeriodRuleDailyGenerator(this.#replicateParams);
			}
		}
	}

	generate(): string
	{
		return [
			this.#periodRuleGenerator.generate(),
			this.#getStartTimeRule(),
			this.#getEndRule(),
		].join(' ');
	}

	#getStartTimeRule(): string
	{
		const timeTs = this.#replicateParams.startTs;

		return Loc.getMessage('TASKS_V2_REPLICATION_START_TIME', {
			'#TIME#': TimeStringConverter.format(timeTs),
		});
	}

	#getEndRule(): string
	{
		const repeatTill = this.#replicateParams.repeatTill;

		if (repeatTill === ReplicationRepeatTill.Times)
		{
			const times = this.#replicateParams.times;

			return Loc.getMessagePlural(
				'TASKS_V2_REPLICATION_END_AFTER_REPETITIONS',
				times,
				{
					'#COUNT#': times,
				},
			);
		}

		if (repeatTill === ReplicationRepeatTill.Date && this.#replicateParams.endTs)
		{
			return Loc.getMessage(
				'TASKS_V2_REPLICATION_END_DATE',
				{
					'#DATE#': DateTimeFormat.format('d.m.Y', new Date(this.#replicateParams.endTs)),
				},
			);
		}

		return '';
	}
}
