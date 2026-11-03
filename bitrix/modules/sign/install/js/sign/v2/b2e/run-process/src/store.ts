import { defineStore } from 'ui.vue3.pinia';
import { type ProcessStartMember } from 'sign.v2.api';

export type ProcessEntry = {
	id: number,
	name: string,
	hasParameters: boolean,
};

export type ProcessParameters = { [fieldId: string]: unknown };

export type ProcessCountResult = {
	count: number,
	totalCount: number,
	excludedCount: number,
};

export const RunProcessStepId = {
	Parameters: 'parameters',
	Employees: 'employees',
} as const;

export type RunProcessStepId = (typeof RunProcessStepId)[keyof typeof RunProcessStepId];

export type RunProcessState = {
	process: ProcessEntry | null,
	parameters: ProcessParameters,
	members: ProcessStartMember[],
	count: number,
	totalCount: number,
	excludedCount: number,
	countPending: boolean,
	hasFreshCount: boolean,
	launching: boolean,
	launchId: number | null,
};

function getSteps(process: ProcessEntry | null): RunProcessStepId[]
{
	if (process === null)
	{
		return [];
	}

	return process.hasParameters
		? [RunProcessStepId.Parameters, RunProcessStepId.Employees]
		: [RunProcessStepId.Employees]
	;
}

export const useRunProcessStore = defineStore('signB2eRunProcess', {
	state: (): RunProcessState => ({
		process: null,
		parameters: {},
		members: [],
		count: 0,
		totalCount: 0,
		excludedCount: 0,
		countPending: false,
		hasFreshCount: false,
		launching: false,
		launchId: null,
	}),
	getters: {
		steps: (state: RunProcessState): RunProcessStepId[] => getSteps(state.process),
		hasBreadcrumbs: (state: RunProcessState): boolean => getSteps(state.process).length > 1,
		launchCount: (state: RunProcessState): number => state.count,
		canLaunch: (state: RunProcessState): boolean => (
			state.members.length > 0
			&& state.hasFreshCount
			&& !state.countPending
			&& state.totalCount > 0
			&& state.count > 0
			&& !state.launching
		),
		hasExclusion: (state: RunProcessState): boolean => (
			state.hasFreshCount
			&& !state.countPending
			&& state.excludedCount > 0
			&& state.count > 0
		),
		isNobodyLeft: (state: RunProcessState): boolean => (
			state.hasFreshCount
			&& !state.countPending
			&& state.totalCount > 0
			&& state.count === 0
		),
	},
	actions: {
		setProcess(process: ProcessEntry): void
		{
			this.process = process;
		},
		setParameters(parameters: ProcessParameters): void
		{
			this.parameters = parameters;
		},
		setMembers(members: ProcessStartMember[]): void
		{
			this.members = members;
			this.count = 0;
			this.totalCount = 0;
			this.excludedCount = 0;
			this.hasFreshCount = false;
		},
		setCountResult(result: ProcessCountResult): void
		{
			this.count = result.count;
			this.totalCount = result.totalCount;
			this.excludedCount = result.excludedCount;
			this.hasFreshCount = true;
		},
		setCountPending(countPending: boolean): void
		{
			this.countPending = countPending;
		},
		setLaunching(launching: boolean): void
		{
			this.launching = launching;
		},
		setLaunchId(launchId: number): void
		{
			this.launchId = launchId;
		},
	},
});

export type RunProcessStore = ReturnType<typeof useRunProcessStore>;
