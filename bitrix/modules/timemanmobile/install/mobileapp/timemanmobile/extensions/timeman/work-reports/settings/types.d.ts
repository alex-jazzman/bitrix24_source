declare type WorkReportsSettingsOpenOptions = {
	parentWidget?: object,
	onClose?: (() => void) | null,
};

declare type WorkReportsSettingsProps = {
	layoutWidget: object,
};

declare type WorkReportsSettingsData = {
	isWorkReportOptionEnabledInSettings: boolean,
	canChangeWorkReportOption: boolean,
};

declare type WorkReportsSettingsState = WorkReportsSettingsData & {
	isLoading: boolean,
};
