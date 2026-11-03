type StockPresetRecipient = ManagedPresetDisplayRecipient;

type StockPreset = TabPreset & {
	canConfigureMenu?: boolean;
	assignmentRecipients?: StockPresetRecipient[];
};

type StockPresetTabs = ManagedPresetFormTabs;

type StockPresetRecipientSelection = ManagedPresetRecipientSelection;

type StockPresetRecipientPickerPayload = StockPreset & {
	assignmentSelectorOptions?: ManagedPresetAssignmentSelectorOptions;
	assignmentTabs: Record<string, number>;
	selectedRecipients: StockPresetRecipient[];
	onRecipientsSelected: (selection: StockPresetRecipientSelection) => void;
};

type StockPresetEditorProps = {
	parentWidget: TabPresetLayoutWidget;
	tabs?: StockPresetTabs;
	preset?: StockPreset;
	assignmentSelectorOptions?: ManagedPresetAssignmentSelectorOptions;
	onInstallSelf?: (presetId: string | undefined, tabs: Record<string, number>) => void | Promise<unknown>;
	onSetMainTool?: (presetId: string | undefined) => void | Promise<unknown>;
	onOpenRecipientPicker?: (preset: StockPresetRecipientPickerPayload) => void;
};

type StockPresetEditorState = {
	configError: string;
	configureMode: boolean;
	selfAssign: boolean;
	mainTool: boolean;
	selectedRecipients: StockPresetRecipient[];
	selectedRecipientTargets: ManagedPresetRecipientTarget[];
	recipientsChanged: boolean;
};
