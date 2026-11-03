type RecipientAccessProviderOptions = {
	allowedDepartmentIds?: Array<string | number>;
	disableUserSearch?: boolean;
};

type RecipientPickerStateApi = {
	getAccessProviderOptions: (
		options?: ManagedPresetAssignmentSelectorOptions,
	) => RecipientAccessProviderOptions;
	prepareRecipients: (selectedItems?: ManagedPresetSelectorItem[]) => ManagedPresetRecipientTarget[];
	prepareRecipient: (item: ManagedPresetSelectorItem) => ManagedPresetPreparedRecipient;
	prepareDisplayItems: (selectedItems?: ManagedPresetSelectorItem[]) => ManagedPresetDisplayRecipient[];
	getDisplayTitle: (item: ManagedPresetSelectorItem) => string;
	getInitialSelectedIds: (
		selectedRecipients?: TabPresetRecipient[],
	) => Array<[string, string | number]>;
	getRecipientType: (item: ManagedPresetSelectorItem) => 'department' | 'user' | null;
	getRecipientId: (item: ManagedPresetSelectorItem) => number;
	getDepartmentScope: (item: ManagedPresetSelectorItem) => 'flat' | 'recursive';
	isFlatDepartmentItem: (item: ManagedPresetSelectorItem) => boolean;
	getRecipientKey: (item: ManagedPresetSelectorItem) => string;
	getSelectorId: (item: ManagedPresetSelectorItem) => string | number;
	getInitialSelectorId: (item: TabPresetRecipient) => string | number;
	getDepartmentIdFromAccessCode: (item: ManagedPresetSelectorItem) => number;
};
