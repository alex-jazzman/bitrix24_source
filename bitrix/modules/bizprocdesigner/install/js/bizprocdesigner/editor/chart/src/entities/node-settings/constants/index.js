export const CONSTRUCTION_TYPES = Object.freeze({
	CONDITION: {
		IF_CONDITION: 'condition:if',
		AND_CONDITION: 'condition:and',
		OR_CONDITION: 'condition:or',
	},
	ACTION: 'action',
	FILTER: 'filter',
	OUTPUT: 'output',
	// 1:1 mirror of server-side ConstructionType::BASE_SETTINGS (Variant A)
	BASE_SETTINGS: 'base-settings',
});

export const CRM_FILTER_BACKING_ACTIVITY_TYPE = 'CrmGetDynamicInfoActivity';
export const TASKS_FILTER_BACKING_ACTIVITY_TYPE = 'TasksComplexActivity';

// Module of the document -> activity whose settings dialog backs the selection editor. A module absent
// from the map has no editor, and the server hides the selection block for it anyway.
export const NODE_FILTER_BACKING_ACTIVITY_TYPES = Object.freeze({
	crm: CRM_FILTER_BACKING_ACTIVITY_TYPE,
	tasks: TASKS_FILTER_BACKING_ACTIVITY_TYPE,
});

// Developer stand only, kept apart from the shipped map above: the virtual `bizproc` document has no
// filter-result resolver of its own, the dev environment delegates it to crm
// (bizproc/dev/integration/bizproc/nodefilter), which is why the CRM dialog fits it there. On a
// portal such a document has no selection block at all, so the entry is never reached.
export const DEV_NODE_FILTER_BACKING_ACTIVITY_TYPES = Object.freeze({
	bizproc: CRM_FILTER_BACKING_ACTIVITY_TYPE,
});

export const CONSTRUCTION_LABELS = Object.freeze({
	[CONSTRUCTION_TYPES.CONDITION.IF_CONDITION]: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_IF_CONDITION',
	[CONSTRUCTION_TYPES.CONDITION.AND_CONDITION]: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_AND_CONDITION',
	[CONSTRUCTION_TYPES.CONDITION.OR_CONDITION]: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_OR_CONDITION',
	[CONSTRUCTION_TYPES.ACTION]: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ACTION',
	[CONSTRUCTION_TYPES.FILTER]: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_FILTER',
	[CONSTRUCTION_TYPES.OUTPUT]: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_OUTPUT',
	[CONSTRUCTION_TYPES.BASE_SETTINGS]: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_BASE_SETTINGS_TOOLBAR_ITEM',
});

export const CONSTRUCTION_OPERATORS = Object.freeze({
	equal: '=',
	notEqual: '!=',
	empty: 'empty',
	notEmpty: '!empty',
	contain: 'contain',
	notContain: '!contain',
	in: 'in',
	notIn: '!in',
	greaterThan: '>',
	greaterThanOrEqual: '>=',
	lessThan: '<',
	lessThanOrEqual: '<=',
});

export const FIELD_OBJECT_TYPES = Object.freeze({
	DOCUMENT: 'Document',
	CONSTANT: 'Constant',
	PARAMETER: 'Template',
	VARIABLE: 'Variable',
});

export const EVENT_NAMES = Object.freeze({
	BEFORE_SUBMIT_EVENT: 'BizprocDesigner.NodeSettings.BeforeSubmit',
});

// Display order of the universal actions, mirrors server-side ActionGroup enum.
export const ACTION_GROUP_ORDER = Object.freeze([
	'create',
	'update',
	'change_status',
	'assign',
	'add',
	'send',
	'get',
	'run',
	'write',
	'stop',
	'grant_access',
	'revoke_access',
	'attach',
	'call',
]);

export const CONSTRUCTION_GROUPS = Object.freeze({
	conditions: 'conditions',
	actions: 'actions',
	filters: 'filters',
	outputs: 'outputs',
});
