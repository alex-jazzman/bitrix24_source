import { ACTION_TYPE, AJAX_REQUEST_TYPE } from './constants';

export type AgentInfoFieldType = {
	name: string,
	description: ?string,
};

export type UserFieldType = {
	id: string,
	photoUrl: ?string,
	profileLink: ?string,
	fullName: ?string,
};

export type EmployeeFieldType = {
	user: UserFieldType,
};

export type LaunchControlFieldType = {
	agentId: number,
	launchedAt: ?number,
};

export type DepartmentFieldType = {
	[key: number]: string,
};

export type UsedByFieldFieldType = {
	users?: UserFieldType[],
	chatId?: string,
	chatName?: string,
	departments?: DepartmentFieldType[],
};

export type LoadIndicatorFieldType = {
	percentage: ?number,
};

export type SetSortType = {
	menuId: ?string,
	gridId: string,
	sortBy: string,
	order: 'ASC' | 'DESC',
}

export type SetFilterType = {
	gridId: string,
	filter: Object,
}

export type runActionConfig = {
	actionId: string,
	options: Array<{ [key: string]: any }>,
	params: Array<{ [key: string]: any }>,
};

export type BaseActionType = {
	grid: ?BX.Main.grid,
	showPopups: ?boolean,
	filter: ?Object,
};

export type AjaxRequestType = $Values<typeof AJAX_REQUEST_TYPE>;
export type ActionType = $Values<typeof ACTION_TYPE>;

export type ActionConfig = {
	type: AjaxRequestType,
	name: string,
	component?: string,
	options?: {
		[key: string]: any,
	},
};

export type EditActionParams = {
	editUri: string,
};

export type DeleteActionParams = {
	templateId: string,
};

export type DeleteActionDataType = {
	agentIds: number,
};

export type RestartActionParams = {
	templateId: string,
};

export type RestartActionDataType = {
	templateId: number,
};

export type AddRowOptions = {
	id: number | string,
	actions?: Array<{ [key: string]: any }>,
	columns?: { [key: string]: any },
	cellActions?: { [key: string]: any },
	append?: true,
	prepend?: true,
	insertBefore?: number | string,
	insertAfter?: number | string,
	animation?: boolean,
	counters?: {
		[colId: string]: {
			type: $Values<BX.Grid.Counters.Type>,
			color?: $Values<BX.Grid.Counters.Color>,
			secondaryColor?: $Values<BX.Grid.Counters.Color>,
			value: string | number,
			isDouble?: boolean,
		},
	},
};

export type FetchAiAgentRowResponse = {
	columns: GridColumns,
	actions: GridRowAction[],
};

export type CopyAndStartActionResponse = FetchAiAgentRowResponse;

export type GridColumns = {
	ID: string,
	LAUNCHED_BY: string,
	LAUNCH_CONTROL: string,
	NAME: string,
	USED_BY: string,
}

export type GridRowAction = {
	[key: string]: any,
}
