type SaveManagedPresetParams = {
	id?: number | null;
	title?: string;
	tabs?: Record<string, number>;
};

type SavedManagedPresetData = {
	preset?: TabPreset;
};

type SetPresetOptions = {
	throwOnError?: boolean;
	sendAnalytics?: boolean;
	showFeedback?: boolean;
};
