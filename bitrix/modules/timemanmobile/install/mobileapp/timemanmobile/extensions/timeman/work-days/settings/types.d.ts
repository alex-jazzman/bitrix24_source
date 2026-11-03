declare type WorkDaysSettingsProps = {
	layoutWidget: object,
};

declare type WorkDaysSettingsData = {
	isWorkShiftOptionEnabledInSettings: boolean,
	canChangeWorkShiftOption: boolean,
};

declare type WorkDaysSettingsState = WorkDaysSettingsData & {
	isLoading: boolean,
};
