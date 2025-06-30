export type GroupAppParams = {
	groupId: string,
	groups: Group[],
	dashboards: Map<number, Dashboard>,
	saveEnabled: boolean,
	isNeedShowDeletionWarningPopup: boolean,
};

export type GroupAppState = {
	group: Group,
	otherGroups: Group[],
	dashboards: Map<number, Dashboard>,
	saveEnabled: boolean,
	isLoading: boolean,
	isNeedShowDeletionWarningPopup: boolean,
};

export const GroupType = {
	system: 'SYSTEM',
	custom: 'CUSTOM',
};

export const DashboardType = {
	system: 'SYSTEM',
	market: 'MARKET',
	custom: 'CUSTOM',
};

export type Group = {
	id: string,
	name: string,
	type: GroupType.system | GroupType.custom,
	scopes: Scope[],
	dashboardIds: number[],
}

export type Dashboard = {
	id: number,
	name: string,
	type: DashboardType.system | DashboardType.market | DashboardType.custom,
	scopes: Scope[],
};

export type Scope = {
	code: string,
	name: string,
};
