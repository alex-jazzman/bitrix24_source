declare type OpenDiscussChatParams = {
	reportId: number,
};

declare type OpenMonthPickerParams = {
	timestamp?: number,
	onPicked?: (monthStart: number) => void,
};

declare type OpenUserSelectorParams = {
	selectedUserIds?: number[],
	parentWidget?: object,
};
