/* eslint-disable */
type TableGroupAppParams = {
	groupId: string;
	groups: TableGroup[];
	tables: Table[];
	saveEnabled?: boolean;
};

type TableGroup = {
	id: string;
	name: string;
	type: string;
	tableCodes: string[];
};

type Table = {
	code: string;
	name: string;
	type: string;
};

declare namespace BX.BIConnector {
	class TableGroupPopup {
		static open(appParams: TableGroupAppParams): void;
	}

	const TableGroupType: Readonly<{
		system: "SYSTEM";
		custom: "CUSTOM";
	}>;
}
