import type { FullReportToSend, ReportSettings, ReportUser } from '../../api/types';

declare global
{
	type WorkReportsListProps = {
		userId?: number,
		selectedUserIds?: number[],
		parentWidget?: object,
		draftReport?: FullReportToSend | null,
		settings?: ReportSettings,
	};

	type FilterBarSelectedUser = {
		id: number,
		name?: string,
		photo?: string,
	};

	type FilterBarProps = {
		parentWidget: object,
		selectedUserIds?: number[],
		timestamp?: number,
		onUsersSelected?: (users: FilterBarSelectedUser[]) => void,
		onMonthSelected?: (timestamp: number) => void,
	};

	type WorkReportUserItem = {
		id: string,
		itemType: 'WorkReportUser',
		userId: number,
		user: ReportUser,
		showBorder?: boolean,
	};

	type WorkReportRowItem = {
		id: string,
		itemType: 'WorkReportRow',
		userId: number,
		report: FullReportToSend,
		showBorder?: boolean,
		onMarkChange?: (rowId: string, nextState: MarkStateValue) => void,
	};

	type WorkReportListItem = WorkReportUserItem | WorkReportRowItem;

	type ReportItemProps = {
		item: WorkReportRowItem,
	};

	type UserItemProps = {
		item: WorkReportUserItem,
	};

	type WorkReportsListResponseData = {
		items: WorkReportListItem[],
		hasMore?: boolean,
		nextOffset?: number | null,
		settings?: ReportSettings,
	};

	type WorkReportsListLoadConfig = {
		navigation?: {
			page?: number,
			size?: number,
		},
	};

	type WorkReportsListNavigationRequest = {
		blockPage: number,
		itemsLoadLimit: number,
		defaultNavigation: object,
	};

	type WorkReportsListActionParams = {
		loadItems: {
			filter: {
				userIds?: number[],
				dateFrom: number,
				dateTo: number,
			},
		},
	};
}

export {};
