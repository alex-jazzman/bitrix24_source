export const CONSTRUCTION_TYPES = Object.freeze({
	CONDITION: {
		IF_CONDITION: 'condition:if',
		AND_CONDITION: 'condition:and',
		OR_CONDITION: 'condition:or',
	},
	ACTION: 'action',
	FILTER: 'filter',
	OUTPUT: 'output',
});

export const CRM_FILTER_BACKING_ACTIVITY_TYPE = 'CrmGetDynamicInfoActivity';
export const TASKS_FILTER_BACKING_ACTIVITY_TYPE = 'TasksComplexActivity';

export const NODE_FILTER_BACKING_ACTIVITY_TYPES = Object.freeze({
	crm: CRM_FILTER_BACKING_ACTIVITY_TYPE,
	tasks: TASKS_FILTER_BACKING_ACTIVITY_TYPE,
});

export const CONSTRUCTION_LABELS = Object.freeze({
	[CONSTRUCTION_TYPES.CONDITION.IF_CONDITION]: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_IF_CONDITION',
	[CONSTRUCTION_TYPES.CONDITION.AND_CONDITION]: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_AND_CONDITION',
	[CONSTRUCTION_TYPES.CONDITION.OR_CONDITION]: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_OR_CONDITION',
	[CONSTRUCTION_TYPES.ACTION]: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ACTION',
	[CONSTRUCTION_TYPES.FILTER]: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_FILTER',
	[CONSTRUCTION_TYPES.OUTPUT]: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_OUTPUT',
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

export const CONSTRUCTION_GROUPS = Object.freeze({
	conditions: 'conditions',
	actions: 'actions',
	filters: 'filters',
	outputs: 'outputs',
});
