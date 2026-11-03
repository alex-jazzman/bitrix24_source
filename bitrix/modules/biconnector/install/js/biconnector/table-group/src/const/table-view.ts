import { type Table, TableType } from './type';

// The icons of the dashboard list, taken as they are: both lists tell the same two kinds of a row apart.
const SYSTEM_TABLE_ICON_PATH = '/bitrix/images/biconnector/database-connections/system.svg';
const CUSTOM_TABLE_ICON_PATH = '/bitrix/images/biconnector/superset-dashboard-selector/icon-type-custom.webp';

export const getTableIconPath = (tableType: string): string => {
	return tableType === TableType.custom ? CUSTOM_TABLE_ICON_PATH : SYSTEM_TABLE_ICON_PATH;
};

// The code stands next to the name and not in a column of its own: one line names the table the way
// the person reads it and the way the portal stores it.
export const getTableLabel = (table: Table): string => {
	return `${table.name} (${table.code})`;
};
