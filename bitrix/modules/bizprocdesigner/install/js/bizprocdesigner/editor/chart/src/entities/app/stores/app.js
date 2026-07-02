import { defineStore } from 'ui.vue3.pinia';

type AppState = {
	isShowRightPanel: boolean;
	isShownPreviewPanel: boolean;
	isShownDebugBar: boolean;
};

export const useAppStore = defineStore('bizprocdesigner-app-store', {
	state: (): AppState => ({
		isShownRightPanel: false,
		isShownPreviewPanel: false,
		isShownDebugBar: false,
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
		showDebugBar(): void
		{
			this.isShownDebugBar = true;
		},
		hideDebugBar(): void
		{
			this.isShownDebugBar = false;
		},
		toggleDebugBar(): void
		{
			this.isShownDebugBar = !this.isShownDebugBar;
		},
		setDebugEnabled(value): void
		{
			this.isShownDebugBar = value;
		},
	},
});
