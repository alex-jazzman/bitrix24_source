type TabPresetTab = {
	iconId?: string;
	imageUrl?: string;
	name?: string;
	title?: string;
	shortTitle?: string;
	description?: string;
	isAvatarEnabled?: boolean;
	sort?: number;
	[key: string]: unknown;
};

type TabPresetRecipient = {
	type: string;
	id: number;
	scope?: string | null;
	title?: string;
	subtitle?: string;
	imageUrl?: string;
	selectorId?: string | number;
	[key: string]: unknown;
};

type TabPresetRecipientSelection = {
	recipients?: TabPresetRecipient[];
	items?: TabPresetRecipient[];
};

type TabPresetCapabilities = {
	canEdit?: boolean;
	canAssign?: boolean;
	canDelete?: boolean;
	canSelfInstall?: boolean;
	canSetMainTool?: boolean;
	canCustomizeBuiltin?: boolean;
	[key: string]: unknown;
};

type TabPreset = {
	id?: string | number;
	key?: string;
	title?: string;
	tabs?: Record<string, number>;
	tabsDescription?: Record<string, string>;
	isManaged?: boolean;
	isEditable?: boolean;
	isBuiltin?: boolean;
	isAssignable?: boolean;
	isOwner?: boolean;
	isSelected?: boolean;
	isManual?: boolean;
	canDelete?: boolean;
	canSelfInstall?: boolean;
	canSetMainTool?: boolean;
	canCustomizeBuiltin?: boolean;
	isPortalDefault?: boolean;
	isLastAssigned?: boolean;
	source?: string;
	sort?: number;
	capabilities?: TabPresetCapabilities;
	assignmentTabs?: Record<string, number>;
	assignmentRecipients?: TabPresetRecipient[];
	selectedRecipients?: TabPresetRecipient[];
	onRecipientsSelected?: (selection: TabPresetRecipientSelection) => void;
	[key: string]: unknown;
};

type TabPresetItem = TabPreset & {
	key: string;
	type: string;
	source: string;
	isFirst: boolean;
	isSelected: boolean;
	isManual: boolean;
	isManaged: boolean;
	isBuiltin: boolean;
	isOwner: boolean;
	isEditable: boolean;
	isAssignable: boolean;
	canDelete: boolean;
	canSelfInstall: boolean;
	canSetMainTool: boolean;
	canCustomizeBuiltin: boolean;
	isPortalDefault: boolean;
	isLastAssigned: boolean;
};

type TabPresetsData = {
	list: Record<string, TabPreset>;
	current: string;
};

type TabPresetsTabs = {
	list: Record<string, TabPresetTab>;
	current?: Record<string, TabPresetTab>;
};

type ManagedPresetAssignmentSelectorOptions = Record<string, unknown> & {
	departmentIds?: Array<string | number>;
};

type TabPresetsCapabilities = {
	managedTabPresetsEnabled?: boolean;
	canCreateManagedPreset?: boolean;
	isManagedPresetLimitReached?: boolean;
	canManage?: boolean;
	canSetPortalDefault?: boolean;
	hrAvailable?: boolean;
	assignmentSelectorOptions?: ManagedPresetAssignmentSelectorOptions;
	[key: string]: unknown;
};

type TabPresetsComponentProps = {
	parentWidget: TabPresetLayoutWidget;
};

type TabPresetsComponentState = {
	shouldShowBanner: boolean;
	isLoading: boolean;
	presets?: TabPresetsData;
	tabs?: TabPresetsTabs;
	capabilities?: TabPresetsCapabilities;
};

type TabPresetsLoadData = {
	presets: TabPresetsData;
	tabs: TabPresetsTabs;
	capabilities?: TabPresetsCapabilities;
};

type TabPresetsCacheState = {
	presets?: TabPresetsData;
	[key: string]: unknown;
};

type TabPresetActionError = {
	code?: string;
	message?: string;
	[key: string]: unknown;
};

type TabPresetActionResult<Data = Record<string, unknown>> = {
	data?: Data;
	errors?: TabPresetActionError[];
	[key: string]: unknown;
};

type TabPresetsLoadResult = TabPresetActionResult<TabPresetsLoadData>;

type TabPresetInfoParams = {
	presetId: string;
	title?: string;
	tabsDescription?: Record<string, string>;
	isSelected: boolean;
};
