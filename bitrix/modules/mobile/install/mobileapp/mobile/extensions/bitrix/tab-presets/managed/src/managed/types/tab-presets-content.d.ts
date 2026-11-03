type TabPresetsContentProps = {
	testId: string;
	isLoading: boolean;
	presets?: TabPresetsData;
	tabs?: TabPresetsTabs;
	capabilities?: TabPresetsCapabilities;
	onOpenPresetInfo: (params: TabPresetInfoParams) => Promise<void>;
	onOpenManagedPresetEditor: (preset?: TabPresetItem | null) => Promise<void>;
	onOpenStockPresetEditor: (preset: TabPresetItem) => Promise<void>;
	onInstallPreset: (presetId: string) => Promise<unknown>;
	onSetPortalDefaultPreset: (presetId: string) => Promise<unknown>;
	onDeleteManagedPreset: (preset: TabPresetItem) => void;
};

type PresetBannerProps = {
	testId: string;
	description?: string;
};

type ManualBannerProps = {
	testId: string;
};

type TabPresetActionId = 'installSelf' | 'setPortalDefault' | 'edit' | 'delete';

type TabPresetActionDescriptor = {
	id: TabPresetActionId;
	sectionCode?: string;
	destructive?: boolean;
};

type TabPresetActionIcon = {
	getIconName: () => string;
	getPath: () => string;
	getSvg: () => string;
	getImageUrl: () => string;
};

type TabPresetActionViewParams = {
	title?: string;
	icon?: TabPresetActionIcon;
};

type TabPresetPopupAction = TabPresetActionDescriptor & TabPresetActionViewParams & {
	testId: string;
	showTopSeparator: boolean;
	onItemSelected: () => void | Promise<unknown> | null;
};

type TabPresetTabRenderParams = {
	tabName: string;
	tabItem: TabPresetTab;
};
