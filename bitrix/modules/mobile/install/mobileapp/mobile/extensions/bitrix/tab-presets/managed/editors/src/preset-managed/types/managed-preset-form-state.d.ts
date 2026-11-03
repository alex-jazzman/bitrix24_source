type ManagedPresetFormTabs = {
	list?: Record<string, TabPresetTab>;
	current?: Record<string, TabPresetTab>;
};

type ManagedPresetFormStateParams = {
	tabs?: ManagedPresetFormTabs;
	preset?: Pick<TabPreset, 'tabs'> | null;
};

type ManagedPresetFormState = {
	activeItems: ManagedPresetMenuItem[];
	inactiveItems: ManagedPresetMenuItem[];
};
