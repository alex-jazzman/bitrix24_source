import { Loc } from 'main.core';

export const InspectorViewItemTypeDict = Object.freeze({
	GROUP: 'group',
	SECTION: 'section',
	NODE: 'node',
	DATA_GROUP: 'data-group',
	DATA: 'data',
});

export const DataTypeBaseType = Object.freeze({
	BOOL: 'bool',
	DATE: 'date',
	DATETIME: 'datetime',
	DOUBLE: 'double',
	DOCUMENT: 'document',
	FILE: 'file',
	INT: 'int',
	SELECT: 'select',
	INTERNALSELECT: 'internalselect',
	STRING: 'string',
	TEXT: 'text',
	USER: 'user',
	TIME: 'time',
});

export const DataTypeLabelMap: Record<string, string> = Object.freeze({
	[DataTypeBaseType.BOOL]: Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_TYPE_BOOL'),
	[DataTypeBaseType.DATE]: Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_TYPE_DATE'),
	[DataTypeBaseType.DATETIME]: Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_TYPE_DATETIME'),
	[DataTypeBaseType.DOUBLE]: Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_TYPE_DOUBLE'),
	[DataTypeBaseType.FILE]: Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_TYPE_FILE'),
	[DataTypeBaseType.INT]: Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_TYPE_INT'),
	[DataTypeBaseType.SELECT]: Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_TYPE_SELECT'),
	[DataTypeBaseType.INTERNALSELECT]: Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_TYPE_INTERNALSELECT'),
	[DataTypeBaseType.STRING]: Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_TYPE_STRING'),
	[DataTypeBaseType.TEXT]: Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_TYPE_TEXT'),
	[DataTypeBaseType.USER]: Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_TYPE_USER'),
	[DataTypeBaseType.TIME]: Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_TYPE_TIME'),
	[DataTypeBaseType.DOCUMENT]: Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_TYPE_DOCUMENT'),
});

export const InspectorViewItemGroupColorDict = Object.freeze({
	GREEN: 'green',
	BLUE: 'blue',
	ORANGE: 'orange',
	GRAY: 'gray',
});
