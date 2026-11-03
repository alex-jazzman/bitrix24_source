type LegacyTabPresetsComponentProps = {
	parentWidget: TabPresetLayoutWidget,
};

type LegacyTabPresetsComponentState = {
	shouldShowBanner: boolean,
	presets?: TabPresetsCollection,
	tabs?: TabPresetTabs,
};

type TabPresetsComponentClass = new (props: LegacyTabPresetsComponentProps) => unknown;

type TabPresetsResolverState = {
	isModeResolved: boolean,
	Component: TabPresetsComponentClass | null,
};

type PresetManualMenuProps = {
	parentWidget: TabPresetLayoutWidget,
	tabs: TabPresetTabs,
	presetConfig?: TabPresetConfig,
};

type PresetManualMenuState = {
	shouldShowBanner: boolean,
};

type PresetManualMenuShowParams = {
	parentWidget: TabPresetLayoutWidget,
	tabs: TabPresetTabs,
	presetConfig?: TabPresetConfig,
};

type TabPresetItemDropPosition = {
	section: number,
	index: number,
};

type TabPresetItemDropParams = {
	from: TabPresetItemDropPosition,
	to: TabPresetItemDropPosition,
};
