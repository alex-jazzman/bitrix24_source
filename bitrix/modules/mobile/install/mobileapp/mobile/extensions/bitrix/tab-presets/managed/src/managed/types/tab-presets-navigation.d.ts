type TabPresetsEditorContext = {
	tabs?: TabPresetsTabs;
	capabilities?: TabPresetsCapabilities;
};

type OpenPresetInfoScreenParams = TabPresetInfoParams & {
	parentWidget: TabPresetLayoutWidget;
	testId: string;
	preset?: TabPreset;
	tabs?: TabPresetsTabs;
	onPresetSelected: () => void;
};

type OpenManagedPresetEditorParams = {
	parentWidget: TabPresetLayoutWidget;
	preset?: TabPreset | null;
	getEditorContext: () => TabPresetsEditorContext;
	onSave: (preset: TabPreset) => void;
	onInstallSelf: (presetId: string) => Promise<unknown>;
	onSetMainTool: (presetId: string) => Promise<unknown>;
	onOpenRecipientPicker: (preset: TabPreset) => void;
};

type OpenStockPresetEditorParams = {
	parentWidget: TabPresetLayoutWidget;
	preset: TabPresetItem;
	getEditorContext: () => TabPresetsEditorContext;
	onInstallSelf: (presetId: string, tabs: Record<string, number>) => Promise<unknown>;
	onSetMainTool: (presetId: string) => Promise<unknown>;
	onOpenRecipientPicker: (preset: TabPreset) => void;
};

type OpenRecipientPickerParams = {
	parentWidget: TabPresetLayoutWidget;
	preset: TabPreset;
	getEditorContext: () => TabPresetsEditorContext;
};

type GetPresetTabsDescriptionParams = {
	tabs?: Record<string, number>;
	tabsDescription?: Record<string, string>;
	tabItems: Record<string, TabPresetTab>;
};

type ManagedPresetEditorOpenProps = {
	tabs?: TabPresetsTabs;
	preset?: TabPreset | null;
	parentWidget: TabPresetLayoutWidget;
	canAssign: boolean;
	canSetMainTool: boolean;
	assignmentSelectorOptions?: ManagedPresetAssignmentSelectorOptions;
	onSave: (preset: TabPreset) => void;
	onInstallSelf: (presetId: string) => Promise<unknown>;
	onSetMainTool: (presetId: string) => Promise<unknown>;
	onOpenRecipientPicker: (preset: TabPreset) => void;
};

type StockPresetEditorOpenProps = {
	tabs?: TabPresetsTabs;
	preset: TabPresetItem;
	parentWidget: TabPresetLayoutWidget;
	assignmentSelectorOptions?: ManagedPresetAssignmentSelectorOptions;
	onInstallSelf: (presetId: string, tabs: Record<string, number>) => Promise<unknown>;
	onSetMainTool: (presetId: string) => Promise<unknown>;
	onOpenRecipientPicker: (preset: TabPreset) => void;
};

type RecipientPickerOpenProps = {
	preset: TabPreset;
	parentWidget: TabPresetLayoutWidget;
	assignmentSelectorOptions?: ManagedPresetAssignmentSelectorOptions;
	selectedRecipients?: TabPresetRecipient[];
	onSave?: (selection: TabPresetRecipientSelection) => void;
};

type ITabPresetEditor = {
	handleBackButton: () => boolean;
};

type TabPresetsEditorsExtension = {
	ManagedPresetEditor?: new (
		props: ManagedPresetEditorOpenProps,
	) => LayoutComponent<ManagedPresetEditorProps, ManagedPresetEditorState> & ITabPresetEditor;
	StockPresetEditor?: new (
		props: StockPresetEditorOpenProps,
	) => LayoutComponent<StockPresetEditorProps, StockPresetEditorState> & ITabPresetEditor;
	RecipientPicker?: {
		open: (props: RecipientPickerOpenProps) => Promise<void>;
	};
};
