type TabPresetId = string;

type TabPresetConfig = Record<string, number>;

type TabPresetLayoutWidget = {
	openWidget: (name: string, params: Record<string, unknown>) => Promise<TabPresetLayoutWidget>,
	showComponent: (component: unknown) => void,
	setLeftButtons: (buttons: Array<{ type: string, callback: () => void }>) => void,
	expandBottomSheet: () => void,
	on: (eventName: string, handler: () => void) => void,
	close: (callback?: () => void) => void,
};

type TabPresetTabItem = {
	title: string,
	shortTitle?: string,
	iconId?: string,
	imageUrl?: string,
	name?: string,
	isAvatarEnabled?: boolean,
	canChangeSort?: boolean,
	canBeRemoved?: boolean,
	showBorderBottom?: boolean,
	disabled?: boolean,
	[key: string]: unknown,
};

type TabPresetMenuItem = TabPresetTabItem & {
	key: string,
	type: string,
};

type TabPresetAddButtonItem = {
	key: 'add_button',
	type: 'add_button',
	disabled: boolean,
};

type TabPresetManualListItem = TabPresetMenuItem | TabPresetAddButtonItem;

type TabPresetCurrentMenuItem = {
	canChangeSort?: boolean,
	canBeRemoved?: boolean,
	[key: string]: unknown,
};

type TabPresetTabs = {
	current: Record<string, TabPresetCurrentMenuItem>,
	list: Record<string, TabPresetTabItem>,
};

type LegacyTabPreset = {
	id?: TabPresetId,
	key?: TabPresetId,
	title?: string,
	tabs: TabPresetConfig,
	tabsDescription: Record<string, string>,
	sort?: number,
	source?: string,
	isPortalDefault?: boolean,
	[key: string]: unknown,
};

type TabPresetListItem = LegacyTabPreset & {
	key: TabPresetId,
	type: string,
	isFirst: boolean,
	isSelected: boolean,
};

type TabPresetsCollection = {
	current: TabPresetId,
	list: Record<TabPresetId, LegacyTabPreset>,
};

type LegacyTabPresetsData = {
	presets: TabPresetsCollection,
	tabs: TabPresetTabs,
};

type TabPresetGetDataResult = {
	data: LegacyTabPresetsData,
};

type LegacyTabPresetTabRenderParams = {
	isFirst: boolean,
	tabName: string,
	tabItem: TabPresetTabItem,
};
