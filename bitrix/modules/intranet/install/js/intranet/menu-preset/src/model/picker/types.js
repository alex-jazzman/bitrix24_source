export type MainToolPreset = {
	id: string,
	canApplyForAll: boolean,
};

export type MainToolPickerState = {
	availablePresets: Array<MainToolPreset>,
	currentPresetId: string | null,
	hasPersonalChoice: boolean,
	canChangePersonal: boolean,
	canManageAll: boolean,
	forced: boolean,
	forcedPresetId: string | null,
	renderRevision?: string,
	url: string | null,
	startUrl: string,
	autoEligible: boolean,
};

export type MainToolOpeningReason = 'manual' | 'auto';

export type MainToolPickerOptions = {
	state: MainToolPickerState,
	openingReason: MainToolOpeningReason,
	busy: boolean,
};

export type MainToolSelection = {
	presetId: string,
	applyForAll: boolean,
};
