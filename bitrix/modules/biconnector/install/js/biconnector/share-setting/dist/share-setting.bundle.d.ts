/* eslint-disable */
type ShareSettingBlockOptions = {
	dashboardId: number;
	state: ShareSettingState;
};

type ShareSettingState = {
	isBanned: boolean;
	canChange: boolean;
};

type ReducedSettingsOptions = {
	container: HTMLElement;
	dashboardId: number;
	dashboard: DashboardBaseInfo;
	shareSetting: ShareSettingState;
};

type DashboardBaseInfo = {
	title: string;
	owner: {
		id: number;
		name: string;
	} | null;
	groups: string[];
	dateCreateTimestamp: number;
	dateModifyTimestamp: number | null;
};

declare namespace BX.BIConnector.ShareSetting {
	class ShareSettingBlock {
		constructor(options: ShareSettingBlockOptions);
		render(): HTMLElement;
	}

	class ReducedSettings {
		constructor(options: ReducedSettingsOptions);
		render(): HTMLElement;
	}
}
