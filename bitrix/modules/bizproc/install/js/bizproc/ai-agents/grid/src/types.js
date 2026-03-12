import { ACTION_TYPE, AJAX_REQUEST_TYPE, GRID_API_ACTION } from './constants';

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
	ragFilesStatuses: ?RagFilesStatusesDataType,
};

export type DepartmentFieldType = {
	[key: number]: string,
};

export type UsedByFieldFieldType = {
	users?: UserFieldType[],
	chats?: ChatInfo[],
	departments?: DepartmentFieldType[],
};

export type ChatInfo = {
	chatId?: string,
	chatName?: string,
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
	isGroupAction: ?boolean,
	params: BaseActionParams,
	filter: ?Object,
};

export type BaseActionParams = {
	showPopups: ?boolean,
	filter: ?Object,
};

export type AjaxRequestType = $Values<typeof AJAX_REQUEST_TYPE>;
export type ActionType = $Values<typeof ACTION_TYPE>;
export type GridApiAction = $Values<typeof GRID_API_ACTION>;

export type ActionConfig = {
	type: AjaxRequestType,
	name: GridApiAction,
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
};

export type GridRowAction = {
	[key: string]: any,
};

export type BaseAjaxResponse = {
	status: string,
	data: Array,
	errors: BaseAjaxError[],
};

export type BaseAjaxError = {
	message: string,
	code: number | string | null,
	customData: ?Array<{ [key: string]: any }>,
};

export type ExtensionSettings = {
	tariffInfo: {
		isAiAgentsAvailable: boolean,
		aiAgentsTariffSliderCode: ?string,
	},
};

export type RagFilesStatusesDataType = {
	status: ?string,
	statusMessage: ?string,
	descriptionMessage: ?string,
	files: RagFileStatusDataType[],
	iconClass: string,
};

export type RagFileStatusDataType = {
	fileName: string,
	status: ?string,
	statusMessage: ?string,
	iconClass: string,
};