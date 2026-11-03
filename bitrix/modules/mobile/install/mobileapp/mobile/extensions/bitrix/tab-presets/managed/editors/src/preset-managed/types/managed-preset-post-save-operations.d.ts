type ManagedPresetPostSaveOperationTypeValue = 'setMainTool' | 'installSelf' | 'assignRecipients';

type ManagedPresetSetMainToolOperation = {
	type: 'setMainTool';
	presetId: string;
};

type ManagedPresetInstallSelfOperation = {
	type: 'installSelf';
	presetId: string;
};

type ManagedPresetAssignRecipientsOperation = {
	type: 'assignRecipients';
	presetId: string;
	recipients: ManagedPresetRecipientTarget[];
	tabs: Record<string, number>;
};

type ManagedPresetPostSaveOperation =
	| ManagedPresetSetMainToolOperation
	| ManagedPresetInstallSelfOperation
	| ManagedPresetAssignRecipientsOperation;

type ManagedPresetPostSaveOperationParams = {
	presetId: string;
	tabs: Record<string, number>;
	mainTool?: boolean;
	canSetMainTool?: boolean;
	isPortalDefault?: boolean;
	selfAssign?: boolean;
	canAssign?: boolean;
	recipientsChanged?: boolean;
	selectedRecipientTargets?: ManagedPresetRecipientTarget[];
};

type ManagedPresetFailedPostSaveOperation = {
	type: ManagedPresetPostSaveOperationTypeValue;
	error: unknown;
};
