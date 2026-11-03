type RecipientPickerSelection = {
	recipients: ManagedPresetRecipientTarget[];
	items: ManagedPresetDisplayRecipient[];
};

type RecipientPickerPreset = TabPreset & {
	key?: string;
	assignmentSelectorOptions?: ManagedPresetAssignmentSelectorOptions;
	assignmentTabs?: Record<string, number>;
};

type RecipientPickerProps = {
	parentWidget: TabPresetLayoutWidget;
	preset?: RecipientPickerPreset;
	assignmentSelectorOptions?: ManagedPresetAssignmentSelectorOptions;
	selectedRecipients?: TabPresetRecipient[];
	onSave?: (selection: RecipientPickerSelection) => void;
};
