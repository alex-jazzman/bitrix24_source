import { GroupType, type User as user, type Scope as scope, type Dashboard as dashboard } from 'biconnector.dashboard-group';
import { type Table as table, type TableGroup as tableGroup } from 'biconnector.table-group';

export const SectionCode = Object.freeze({
	dashboardGroup: 'SECTION_RIGHTS_GROUP',
	tableGroup: 'SECTION_RIGHTS_TABLE_GROUP',
});

export type PermissionAppState = {
	groups: Group[],
	dashboards: Map<number, Dashboard>,
	newGroupPermissions: ?Object,
	tableGroups: TableGroup[],
	tables: Table[],
	newTableGroupPermissions: ?Object,
	appGuid: string,
	user: User,
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
export type User = user;
export type Table = table;
export type TableGroup = tableGroup;
