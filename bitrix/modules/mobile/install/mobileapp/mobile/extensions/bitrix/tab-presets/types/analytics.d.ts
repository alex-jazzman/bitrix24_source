type PresetBottomMenuAnalyticsEventValue =
	| 'open_section'
	| 'add_preset'
	| 'save_preset'
	| 'assign_preset'
	| 'unassign_preset'
	| 'delete_preset'
	| 'set_default_preset'
	| 'edit_preset'
	| 'change_preset';

type PresetBottomMenuAnalyticsTypeValue =
	| 'builtin'
	| 'portal_default'
	| 'custom_employee'
	| 'custom_manager';

type PresetBottomMenuAnalyticsRoleValue = 'admin' | 'manager' | 'employee';

type PresetBottomMenuAnalyticsTargetValue =
	| 'target_none'
	| 'target_self'
	| 'target_users'
	| 'target_departments'
	| 'target_mixed';

type PresetBottomMenuAnalyticsParams = {
	event?: PresetBottomMenuAnalyticsEventValue | '',
	type?: PresetBottomMenuAnalyticsTypeValue | '',
	role?: PresetBottomMenuAnalyticsRoleValue | '',
	target?: PresetBottomMenuAnalyticsTargetValue | '',
	cSection?: string,
	cElement?: string,
};

type PresetBottomMenuAnalyticsData = {
	tool: 'intranet',
	category: 'preset_bottom_menu',
	event: PresetBottomMenuAnalyticsEventValue,
	c_section: string,
	c_element: string,
	type?: PresetBottomMenuAnalyticsTypeValue,
	p1?: string,
	p2?: PresetBottomMenuAnalyticsTargetValue,
};

type PresetBottomMenuCapabilities = {
	canSetPortalDefault?: boolean,
	canManage?: boolean,
	canCreateManagedPreset?: boolean,
};

type PresetBottomMenuAnalyticsPreset = {
	id?: TabPresetId,
	key?: TabPresetId,
	source?: string,
	isPortalDefault?: boolean,
};

type PresetBottomMenuRecipient = {
	type: 'user' | 'department',
};

type PresetBottomMenuTargetParams = {
	recipients?: Array<PresetBottomMenuRecipient>,
	selfAssign?: boolean,
};
