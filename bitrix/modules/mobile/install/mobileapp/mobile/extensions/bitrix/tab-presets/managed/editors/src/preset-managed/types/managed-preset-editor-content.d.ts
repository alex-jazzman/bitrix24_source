type ManagedPresetEditorContentProps = {
	testId: string;
	title: string;
	titleError: string;
	configError: string;
	mainTool: boolean;
	mainToolLocked: boolean;
	selfAssign: boolean;
	selectedRecipients: ManagedPresetDisplayRecipient[];
	activeItems: Array<ManagedPresetMenuItem>;
	canSetMainTool: boolean;
	canAssign: boolean;
	onTitleChange: (title: string) => void;
	onConfigure: () => void;
	onMainToolChange: (mainTool: boolean) => void;
	onSelfAssignChange: (selfAssign: boolean) => void;
	onOpenRecipientPicker: () => void;
	onSave: () => void;
};
