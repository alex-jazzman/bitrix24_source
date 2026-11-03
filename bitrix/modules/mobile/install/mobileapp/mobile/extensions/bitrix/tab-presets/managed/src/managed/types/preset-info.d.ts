type PresetInfoProps = {
	parentWidget: TabPresetLayoutWidget;
	presetTitle?: string;
	presetImagePath?: string;
	isPresetSelected: boolean;
	tabsDescription?: Record<string, string>;
	tabsIcons?: Record<string, string>;
	testId: string;
	onPresetSelected: () => void;
};

type PresetInfoShowParams = PresetInfoProps;
