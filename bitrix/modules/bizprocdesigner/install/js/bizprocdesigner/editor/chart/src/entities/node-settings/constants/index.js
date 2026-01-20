export const CONSTRUCTION_TYPES = Object.freeze({
	IF_CONDITION: 'condition:if',
	AND_CONDITION: 'condition:and',
	OR_CONDITION: 'condition:or',
	ACTION: 'action',
	OUTPUT: 'output',
});

export const CONSTRUCTION_LABELS = Object.freeze({
	[CONSTRUCTION_TYPES.IF_CONDITION]: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_IF_CONDITION',
	[CONSTRUCTION_TYPES.AND_CONDITION]: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_AND_CONDITION',
	[CONSTRUCTION_TYPES.OR_CONDITION]: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_OR_CONDITION',
	[CONSTRUCTION_TYPES.ACTION]: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ACTION',
	[CONSTRUCTION_TYPES.OUTPUT]: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_OUTPUT',
});

export const GENERAL_CONSTRUCTION_TYPES = Object.freeze({
	[CONSTRUCTION_TYPES.IF_CONDITION]: 'condition',
	[CONSTRUCTION_TYPES.AND_CONDITION]: 'condition',
	[CONSTRUCTION_TYPES.OR_CONDITION]: 'condition',
	[CONSTRUCTION_TYPES.ACTION]: 'action',
	[CONSTRUCTION_TYPES.OUTPUT]: 'output',
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
