export type ShareSettingState = {
	isBanned: boolean,
	canChange: boolean,
};

export type ShareSettingBlockOptions = {
	dashboardId: number,
	state: ShareSettingState,
};

export type DashboardBaseInfo = {
	title: string,
	owner: { id: number, name: string } | null,
	groups: string[],
	dateCreateTimestamp: number,
	dateModifyTimestamp: number | null,
};

export type ReducedSettingsOptions = {
	container: HTMLElement,
	dashboardId: number,
	dashboard: DashboardBaseInfo,
	shareSetting: ShareSettingState,
};
