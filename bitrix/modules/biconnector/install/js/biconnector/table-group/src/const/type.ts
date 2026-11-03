export const TableGroupType = Object.freeze({
	system: 'SYSTEM',
	custom: 'CUSTOM',
});

// A table of the product against a dataset a person created: the pair the dashboard list tells apart too.
export const TableType = Object.freeze({
	system: 'SYSTEM',
	custom: 'CUSTOM',
});

export const TABLE_GROUP_POPUP_ID = 'biconnector-table-group';

// Contract C3: the outer interface of the extension. Every event carries the group as the popup sees it.
export const TableGroupPopupEvent = Object.freeze({
	GroupUpdated: 'BIConnector.TableGroupPopup:onGroupUpdated',
	GroupSaved: 'BIConnector.TableGroupPopup:onGroupSaved',
	PopupClose: 'BIConnector.TableGroupPopup:onPopupClose',
});

// A table is addressed by its string code everywhere: the numeric id of the dashboard axis has no analogue here.
export type Table = {
	code: string,
	name: string,
	type: string,
};

export type TableGroup = {
	id: string,
	name: string,
	type: string,
	tableCodes: string[],
};

export type TableGroupAppParams = {
	groupId: string,
	groups: TableGroup[],
	tables: Table[],
	// The button of the footer: the popup writes the group itself and tells about the save. Left out,
	// the popup speaks of every change instead and writes nothing - the contract the rights screen owns.
	saveEnabled?: boolean,
};

export type TableGroupAppState = {
	group: TableGroup,
	// The rest of the matrix as it stands on the page: the popup tells a table out of every group from a table
	// that stays in a neighbouring one.
	otherGroups: TableGroup[],
	tables: Map<string, Table>,
	saveEnabled?: boolean,
};
