/* eslint-disable */
type GridManagerOptions = {
	gridId: string;
};

declare namespace BX.BIConnector.ShareRegistry {
	class GridManager {
		static Instance: GridManager | null;
		constructor(options: GridManagerOptions);
		destroy(): void;
		openDashboard(url: string): void;
		disableShares(ids: number[]): Promise<void>;
		disableSelected(): Promise<void>;
		openSettings(dashboardId: number, dashboardType: string): void;
		toggleAuthorFilter(authorId: number, authorName: string, isActive: boolean): void;
	}
}
