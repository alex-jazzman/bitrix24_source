type ManagedPresetEditorPreset = TabPreset & {
	assignmentRecipients?: ManagedPresetDisplayRecipient[];
	canAssign?: boolean;
};

type ManagedPresetRecipientSelection = {
	recipients?: ManagedPresetRecipientTarget[];
	items?: ManagedPresetDisplayRecipient[];
};

type ManagedPresetRecipientPickerPayload = ManagedPresetEditorPreset & {
	assignmentSelectorOptions?: ManagedPresetAssignmentSelectorOptions;
	assignmentTabs: Record<string, number>;
	selectedRecipients: ManagedPresetDisplayRecipient[];
	onRecipientsSelected: (selection: ManagedPresetRecipientSelection) => void;
};

type ManagedPresetEditorProps = {
	parentWidget: TabPresetLayoutWidget;
	tabs?: ManagedPresetFormTabs;
	preset?: ManagedPresetEditorPreset | null;
	canAssign?: boolean;
	canSetMainTool?: boolean;
	assignmentSelectorOptions?: ManagedPresetAssignmentSelectorOptions;
	onSave?: (preset: ManagedPresetEditorPreset) => void;
	onInstallSelf?: (presetId: string) => void | Promise<unknown>;
	onSetMainTool?: (presetId: string) => void | Promise<unknown>;
	onOpenRecipientPicker?: (preset: ManagedPresetRecipientPickerPayload) => void;
};

type ManagedPresetEditorState = {
	title: string;
	titleError: string;
	configError: string;
	configureMode: boolean;
	selfAssign: boolean;
	mainTool: boolean;
	selectedRecipients: ManagedPresetDisplayRecipient[];
	selectedRecipientTargets: ManagedPresetRecipientTarget[];
	recipientsChanged: boolean;
};
