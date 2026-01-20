import {
	ReplicationPeriod,
	ReplicationRepeatTill,
	ReplicationMonthlyType, ReplicationYearlyType,
} from 'tasks.v2.const';
import type {
	TaskReplicateParams,
	TaskReplicationDaily,
	TaskReplicationWeekly,
	TaskReplicationMonthly,
	TaskReplicationYearly,
} from 'tasks.v2.model.tasks';

export class ReplicateCreator
{
	static createEmptyReplicateParams(): TaskReplicateParams
	{
		return {
			period: ReplicationPeriod.Daily,
			time: null,
			startDate: null,
			repeatTill: ReplicationRepeatTill.Endless,
			endDate: null,
			times: null,
			nextExecutionTime: null,
			deadlineOffset: null,
			...ReplicateCreator.createReplicateParamsDaily(),
			...ReplicateCreator.createReplicateParamsWeekly(),
			...ReplicateCreator.createReplicateParamsMonthly(),
			...ReplicateCreator.createReplicateParamsYearly(),
		};
	}

	static createReplicateParamsDaily(data: Partial<TaskReplicationDaily> = {}): TaskReplicationDaily
	{
		return {
			dailyMonthInterval: null,
			...data,
		};
	}

	static createDefaultReplicationParamsDaily(): TaskReplicationDaily
	{
		return ReplicateCreator.createReplicateParamsDaily({});
	}

	static createReplicateParamsWeekly(data: Partial<TaskReplicationWeekly> = {}): TaskReplicationWeekly
	{
		return {
			everyWeek: null,
			weekDays: [],
			...data,
		};
	}

	static createDefaultReplicationParamsWeekly(): TaskReplicationWeekly
	{
		return ReplicateCreator.createReplicateParamsWeekly({});
	}

	static createReplicateParamsMonthly(data: Partial<TaskReplicationMonthly> = {}): TaskReplicationMonthly
	{
		return {
			monthlyData: null,
			monthlyDataNum: null,
			monthlyMonthNum1: null,
			monthlyMonthNum2: null,
			monthlyWeekDay: null,
			monthlyWeekDayNum: null,
			...data,
		};
	}

	static createDefaultReplicationParamsMonthly(): TaskReplicationMonthly
	{
		return ReplicateCreator.createReplicateParamsMonthly({
			monthlyType: ReplicationMonthlyType.Absolute,
			monthlyDayNum: 1,
		});
	}

	static createReplicateParamsYearly(data: Partial<TaskReplicationYearly> = {}): TaskReplicationYearly
	{
		return {
			yearlyData: null,
			yearlyDayNum: null,
			yearlyMonth1: null,
			yearlyMonth2: null,
			yearlyWeekDay: null,
			yearlyWeekDayNum: null,
			...data,
		};
	}

	static createDefaultReplicationParamsYearly(): TaskReplicationYearly
	{
		return ReplicateCreator.createReplicateParamsYearly({
			yearlyType: ReplicationYearlyType.Absolute,
			yearlyDayNum: 1,
			yearlyMonth1: 1,
		});
	}
}
