type StockPresetEditorContentProps = {
	testId: string;
	preset?: StockPreset;
	configError: string;
	mainTool: boolean;
	mainToolLocked: boolean;
	selfAssign: boolean;
	selectedRecipients: StockPresetRecipient[];
	activeItems: ManagedPresetMenuItem[];
	canConfigureMenu: boolean;
	canSetMainTool: boolean;
	canSelfInstall: boolean;
	canAssign: boolean;
	onConfigure: () => void;
	onMainToolChange: (mainTool: boolean) => void;
	onSelfAssignChange: (selfAssign: boolean) => void;
	onOpenRecipientPicker: () => void;
	onSave: () => void;
};
