/* eslint-disable */
type ViewerItemConstructor = new (options: Record<string, unknown>) => ViewerItemInstance;

type ViewerItemInstance = {
	setPropertiesByNode(node: HTMLElement): void;
	setDownloadUrl(url: string | null): void;
	getDownloadUrl(): string | null | undefined;
	getTitle(): string | null | undefined;
	destroy(): void;
};

declare namespace BX.Disk.Viewer {
	class TiffItem extends ViewerItem {
		private tiffPreviewUrl;
		private previewData;
		private contentNode;
		private pollTimeoutId;
		private pollAttempts;
		private isActive;
		private isDestroyed;
		private isRequesting;
		private isVisibilityChangeBound;
		constructor(options?: Record<string, unknown>);
		setPropertiesByNode(node: HTMLElement): void;
		listContainerModifiers(): string[];
		loadData(): Promise<TiffItem>;
		private requestPreview;
		private normalizePreviewData;
		private createNetworkErrorData;
		render(): HTMLElement;
		private renderCurrentState;
		private renderImage;
		private renderPreparing;
		private renderError;
		private renderDownloadButton;
		private schedulePoll;
		private clearPollTimeout;
		afterRender(): void;
		beforeHide(): void;
		destroy(): void;
		private bindVisibilityChange;
		private unbindVisibilityChange;
		private handleVisibilityChange;
	}

	const ViewerItem: ViewerItemConstructor;
}
