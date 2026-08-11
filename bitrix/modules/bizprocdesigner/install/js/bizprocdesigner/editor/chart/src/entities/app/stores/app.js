import { defineStore } from 'ui.vue3.pinia';
import { useNodeDataInspectorStore } from '../../../shared/stores/node-data-inspector-store';

type AppState = {
	isShowRightPanel: boolean;
	isShownPreviewPanel: boolean;
	isShownDebugBar: boolean;
	isDataInspectorPanelShown: boolean;
};

export const useAppStore = defineStore('bizprocdesigner-app-store', {
	state: (): AppState => ({
		isShownRightPanel: false,
		isShownPreviewPanel: false,
		isShownDebugBar: false,
		isDataInspectorPanelShown: true,
	}),
	actions:
	{
		showRightPanel(): void
		{
			this.isShownRightPanel = true;
		},
		hideRightPanel(): void
		{
			this.isDataInspectorPanelShown = false;
			this.isShownRightPanel = false;
			this.isShownPreviewPanel = false;
			useNodeDataInspectorStore().resetDataInspector();
		},
		setShowPreviewPanel(isShow: boolean): void
		{
			this.isShownPreviewPanel = isShow;
		},
		showPreviewPanel(): void
		{
			this.isShownPreviewPanel = true;
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
		toggleDataInspectorPanel(): void
		{
			this.isDataInspectorPanelShown = !this.isDataInspectorPanelShown;
		},
		setDebugEnabled(value): void
		{
			this.isShownDebugBar = value;
		},
	},
});
