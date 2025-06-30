import { GroupType, type Scope as scope, type Dashboard as dashboard } from 'biconnector.dashboard-group';

export type PermissionAppState = {
	groups: Group[],
	dashboards: Map<number, Dashboard>,
	newGroupPermissions: ?Object,
	appGuid: string,
};

export type Group = {
	id: string,
	name: string,
	type: GroupType.system | GroupType.custom,
	scopes: Scope[],
	dashboardIds: number[],
}

export type GroupForSave = {
	id: string,
	name: string,
	type: GroupType.system | GroupType.custom,
	scopes: Scope[],
	dashboards: Dashboard[],
}

export type Dashboard = dashboard;
export type Scope = scope;
