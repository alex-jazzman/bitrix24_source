/* eslint-disable */
type SyncTabBannerSurface = 'messenger' | 'sync-page';

type SyncTabBannerOptions = {
	onClose?: () => void;
	surface?: SyncTabBannerSurface;
};

declare namespace BX.Call.Component {
	class SyncTabBanner {
		static show(options?: SyncTabBannerOptions): void;
		static close(): void;
		static launch(surface?: SyncTabBannerSurface): void;
		static cancel(): void;
		constructor(options: SyncTabBannerOptions);
		close(): void;
	}
}
