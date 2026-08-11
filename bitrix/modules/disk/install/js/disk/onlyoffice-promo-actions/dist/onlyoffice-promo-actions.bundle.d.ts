/* eslint-disable */
declare namespace BX.Disk.OnlyOfficePromoActions {
	class OnlyOfficePromoActions {
		private readonly action;
		private readonly isCreate;
		private readonly analytics;
		private documentEditSessionLimit;
		private readonly isCloud;
		constructor(isCreate?: boolean, analytics?: BX.UI.Analytics.AnalyticsOptions | null);
		shouldShow(): boolean;
		show(target: HTMLElement, needOverlay: boolean): void;
	}
}
