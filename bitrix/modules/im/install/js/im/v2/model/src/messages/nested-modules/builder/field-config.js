import { Type } from 'main.core';

import { isNumberOrString } from '../../../utils/format';
import { formatFieldsWithConfig, type FieldsConfig } from '../../../utils/validate.js';

import { prepareSources } from './format-functions.js';

export const builderFieldsConfig: FieldsConfig = [
	{
		fieldName: 'config',
		targetFieldName: 'config',
		checkFunction: Type.isPlainObject,
		formatFunction: (target) => formatFieldsWithConfig(target, configFieldsConfig),
	},
	{
		fieldName: 'elements',
		targetFieldName: 'elements',
		checkFunction: Type.isArray,
		formatFunction: (target) => {
			return target.map((block) => formatFieldsWithConfig(block, blocksBuilderFieldsConfig));
		},
	},
];

const configFieldsConfig: FieldsConfig = [
	{
		fieldName: 'background',
		targetFieldName: 'background',
		checkFunction: Type.isString,
	},
];

export const blocksBuilderFieldsConfig: FieldsConfig = [
	{
		fieldName: 'id',
		targetFieldName: 'id',
		checkFunction: isNumberOrString,
	},
	{
		fieldName: 'type',
		targetFieldName: 'type',
		checkFunction: Type.isString,
	},
	{
		fieldName: 'text',
		targetFieldName: 'text',
		checkFunction: Type.isString,
	},
	{
		fieldName: 'title',
		targetFieldName: 'title',
		checkFunction: Type.isString,
	},
	{
		fieldName: 'color',
		targetFieldName: 'color',
		checkFunction: Type.isString,
	},
	{
		fieldName: 'size',
		targetFieldName: 'size',
		checkFunction: isNumberOrString,
	},
	{
		fieldName: 'imageUrl',
		targetFieldName: 'imageUrl',
		checkFunction: Type.isString,
	},
	{
		fieldName: 'icon',
		targetFieldName: 'icon',
		checkFunction: Type.isPlainObject,
		formatFunction: (target) => formatFieldsWithConfig(target, iconFieldsConfig),
	},
	{
		fieldName: 'status',
		targetFieldName: 'status',
		checkFunction: Type.isString,
	},
	{
		fieldName: 'title',
		targetFieldName: 'title',
		checkFunction: Type.isString,
	},
	{
		fieldName: 'elements',
		targetFieldName: 'elements',
		checkFunction: Type.isArray,
		formatFunction: (target) => {
			return target.map((block) => formatFieldsWithConfig(block, blocksBuilderFieldsConfig));
		},
	},
	{
		fieldName: 'sources',
		targetFieldName: 'sources',
		checkFunction: Type.isPlainObject,
		formatFunction: (target) => prepareSources(target, sourceItemFieldsConfig),
	},
	{
		fieldName: 'fold',
		targetFieldName: 'fold',
		checkFunction: Type.isPlainObject,
		formatFunction: (target) => formatFieldsWithConfig(target, foldFieldsConfig),
	},
	{
		fieldName: 'progress',
		targetFieldName: 'progress',
		checkFunction: Type.isPlainObject,
		formatFunction: (target) => formatFieldsWithConfig(target, progressFieldsConfig),
	},
	{
		fieldName: 'buttons',
		targetFieldName: 'buttons',
		checkFunction: Type.isArray,
		formatFunction: (target) => {
			return target.map((row) => row.map((button) => {
				return formatFieldsWithConfig(button, buttonFieldsConfig);
			}));
		},
	},
	{
		fieldName: 'rows',
		targetFieldName: 'rows',
		checkFunction: Type.isArray,
		formatFunction: (row) => {
			return row.map((column) => {
				return column.map((block) => formatFieldsWithConfig(block, blocksBuilderFieldsConfig));
			});
		},
	},
	{
		fieldName: 'fileIds',
		targetFieldName: 'fileIds',
		checkFunction: Type.isArray,
	},
	{
		fieldName: 'fileId',
		targetFieldName: 'fileId',
		checkFunction: Type.isNumber,
	},
	{
		fieldName: 'label',
		targetFieldName: 'label',
		checkFunction: Type.isString,
	},
	{
		fieldName: 'placeholder',
		targetFieldName: 'placeholder',
		checkFunction: Type.isString,
	},
	{
		fieldName: 'disabled',
		targetFieldName: 'disabled',
		checkFunction: Type.isBoolean,
	},
	{
		fieldName: 'options',
		targetFieldName: 'options',
		checkFunction: Type.isArray,
		formatFunction: (target) => {
			return target.map((option) => formatFieldsWithConfig(option, formFieldOptionFieldsConfig));
		},
	},
];

const iconFieldsConfig: FieldsConfig = [
	{
		fieldName: 'type',
		targetFieldName: 'type',
		checkFunction: Type.isString,
	},
	{
		fieldName: 'color',
		targetFieldName: 'color',
		checkFunction: Type.isString,
	},
];

const formFieldOptionFieldsConfig: FieldsConfig = [
	{
		fieldName: 'id',
		targetFieldName: 'id',
		checkFunction: Type.isString,
	},
	{
		fieldName: 'label',
		targetFieldName: 'label',
		checkFunction: Type.isString,
	},
];

const buttonFieldsConfig: FieldsConfig = [
	{
		fieldName: 'id',
		targetFieldName: 'id',
		checkFunction: isNumberOrString,
	},
	{
		fieldName: 'type',
		targetFieldName: 'type',
		checkFunction: Type.isString,
	},
	{
		fieldName: 'title',
		targetFieldName: 'title',
		checkFunction: Type.isString,
	},
	{
		fieldName: 'url',
		targetFieldName: 'url',
		checkFunction: Type.isString,
	},
	{
		fieldName: 'design',
		targetFieldName: 'design',
		checkFunction: Type.isString,
	},
	{
		fieldName: 'actionId',
		targetFieldName: 'actionId',
		checkFunction: Type.isString,
	},
	{
		fieldName: 'actionParams',
		targetFieldName: 'actionParams',
		checkFunction: Type.isPlainObject,
	},
	{
		fieldName: 'disabled',
		targetFieldName: 'disabled',
		checkFunction: Type.isBoolean,
	},
];

const sourceItemFieldsConfig: FieldsConfig = [
	{
		fieldName: 'url',
		targetFieldName: 'url',
		checkFunction: Type.isString,
	},
	{
		fieldName: 'metaData',
		targetFieldName: 'metaData',
		checkFunction: Type.isPlainObject,
		formatFunction: (target) => formatFieldsWithConfig(target, sourceMetaDataFieldsConfig),
	},
];

const sourceMetaDataFieldsConfig: FieldsConfig = [
	{
		fieldName: 'title',
		targetFieldName: 'title',
		checkFunction: Type.isString,
	},
	{
		fieldName: 'description',
		targetFieldName: 'description',
		checkFunction: Type.isString,
	},
];

const foldFieldsConfig: FieldsConfig = [
	{
		fieldName: 'isOpened',
		targetFieldName: 'isOpened',
		checkFunction: Type.isBoolean,
	},
	{
		fieldName: 'title',
		targetFieldName: 'title',
		checkFunction: Type.isString,
	},
];

const progressFieldsConfig: FieldsConfig = [
	{
		fieldName: 'value',
		targetFieldName: 'value',
		checkFunction: Type.isNumber,
	},
	{
		fieldName: 'colorToken',
		targetFieldName: 'colorToken',
		checkFunction: Type.isString,
	},
];
