import { defineStore } from 'ui.vue3.pinia';

type AppState = {
	isShowRightPanel: boolean;
};

export const useAppStore = defineStore('bizprocdesigner-app-store', {
	state: (): AppState => ({
		isShownRightPanel: false,
		isShownPreviewPanel: false,
	}),
	actions:
	{
		showRightPanel(): void
		{
			this.isShownRightPanel = true;
		},
		hideRightPanel(): void
		{
			this.isShownRightPanel = false;
			this.isShownPreviewPanel = false;
		},
		setShowPreviewPanel(isShow: boolean): void
		{
			this.isShownPreviewPanel = isShow;
		},
		showPreviewPanel(): void
		{
			this.isShownPreviewPanel = true;
		},
		hidePreviewPanel(): void
		{
			this.isShownPreviewPanel = false;
		},
	},
});
