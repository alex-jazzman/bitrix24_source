import { Type } from 'main.core';

import { type SettingBinding, type SettingValuePath } from '../../../model/types';
import { settingBindingRegistry } from '../../../registry/setting-binding-registry';
import {
	type HydratedSettingState,
	type HydratedSettingsPresentation,
	type ObjectSettingField,
	type SettingObjectValue,
	type SettingOption,
	type SettingPresentation,
	type SettingScalarValue,
	type SettingSchema,
	type SettingValue,
	type SettingsPresentation,
} from './types';

type UnknownRecord = Record<string, unknown>;

function fail(path: string, message: string): never
{
	throw new TypeError(`Invalid settings presentation at ${path}: ${message}`);
}

function isPlainRecord(value: unknown): value is UnknownRecord
{
	return Type.isPlainObject(value);
}

function readRecord(value: unknown, path: string): UnknownRecord
{
	return isPlainRecord(value) ? value : fail(path, 'plain object expected');
}

function assertExactKeys(record: UnknownRecord, keys: readonly string[], path: string): void
{
	const actualKeys = Object.keys(record);
	if (
		actualKeys.length !== keys.length
		|| actualKeys.some((key) => !keys.includes(key))
	)
	{
		fail(path, `expected fields ${keys.join(', ')}`);
	}
}

function readString(value: unknown, path: string): string
{
	return Type.isString(value) ? value : fail(path, 'string expected');
}

function readNonEmptyString(value: unknown, path: string): string
{
	const result = readString(value, path);

	return result === '' ? fail(path, 'non-empty string expected') : result;
}

function readNullableString(value: unknown, path: string): string | null
{
	return value === null ? null : readString(value, path);
}

function readBoolean(value: unknown, path: string): boolean
{
	return Type.isBoolean(value) ? value : fail(path, 'boolean expected');
}

function readInteger(value: unknown, path: string): number
{
	return Number.isInteger(value) ? value as number : fail(path, 'integer expected');
}

function readNullableInteger(value: unknown, path: string): number | null
{
	return value === null ? null : readInteger(value, path);
}

function parseScalarValue(value: unknown, path: string): SettingScalarValue
{
	if (Type.isBoolean(value) || Type.isString(value))
	{
		return value;
	}

	return readInteger(value, path);
}

function parseOption(value: unknown, path: string): SettingOption
{
	const option = readRecord(value, path);
	assertExactKeys(option, ['value', 'title', 'hint'], path);

	return {
		value: parseScalarValue(option.value, `${path}.value`),
		title: readString(option.title, `${path}.title`),
		hint: readNullableString(option.hint, `${path}.hint`),
	};
}

function parseOptions(value: unknown, path: string): readonly SettingOption[]
{
	if (!Array.isArray(value) || value.length === 0)
	{
		fail(path, 'non-empty options list expected');
	}

	const options = value.map((option, index) => parseOption(option, `${path}[${index}]`));
	for (const [index, option] of options.entries())
	{
		if (options.slice(0, index).some((existing) => existing.value === option.value))
		{
			fail(`${path}[${index}].value`, 'duplicate option value');
		}
	}

	return options;
}

function parseObjectField(value: unknown, path: string): ObjectSettingField
{
	const field = readRecord(value, path);
	assertExactKeys(field, ['code', 'title', 'hint', 'required', 'schema'], path);

	return {
		code: readNonEmptyString(field.code, `${path}.code`),
		title: readString(field.title, `${path}.title`),
		hint: readNullableString(field.hint, `${path}.hint`),
		required: readBoolean(field.required, `${path}.required`),
		schema: parseSettingSchema(field.schema, `${path}.schema`),
	};
}

function parseIntegerSchema(schema: UnknownRecord, path: string): SettingSchema
{
	assertExactKeys(schema, ['type', 'min', 'max', 'step'], path);
	const min = readNullableInteger(schema.min, `${path}.min`);
	const max = readNullableInteger(schema.max, `${path}.max`);
	const step = readInteger(schema.step, `${path}.step`);
	if (step < 1 || (min !== null && max !== null && min > max))
	{
		fail(path, 'invalid integer constraints');
	}

	return { type: 'integer', min, max, step };
}

function parseStringSchema(schema: UnknownRecord, path: string): SettingSchema
{
	assertExactKeys(schema, ['type', 'minLength', 'maxLength'], path);
	const minLength = readNullableInteger(schema.minLength, `${path}.minLength`);
	const maxLength = readNullableInteger(schema.maxLength, `${path}.maxLength`);
	if (
		(minLength !== null && minLength < 0)
		|| (maxLength !== null && maxLength < 0)
		|| (minLength !== null && maxLength !== null && minLength > maxLength)
	)
	{
		fail(path, 'invalid string constraints');
	}

	return { type: 'string', minLength, maxLength };
}

function parseObjectSchema(schema: UnknownRecord, path: string): SettingSchema
{
	assertExactKeys(schema, ['type', 'fields'], path);
	if (!Array.isArray(schema.fields) || schema.fields.length === 0)
	{
		fail(`${path}.fields`, 'non-empty fields list expected');
	}

	const fields = schema.fields.map((field, index) => parseObjectField(field, `${path}.fields[${index}]`));
	for (const [index, field] of fields.entries())
	{
		if (fields.slice(0, index).some((existing) => existing.code === field.code))
		{
			fail(`${path}.fields[${index}].code`, 'duplicate object field');
		}
	}

	return { type: 'object', fields };
}

function parseSettingSchema(value: unknown, path: string): SettingSchema
{
	const schema = readRecord(value, path);
	const type = readString(schema.type, `${path}.type`);

	switch (type)
	{
		case 'boolean':
			assertExactKeys(schema, ['type'], path);

			return { type };
		case 'integer':
			return parseIntegerSchema(schema, path);
		case 'string':
			return parseStringSchema(schema, path);
		case 'select':
		case 'multiSelect':
			assertExactKeys(schema, ['type', 'options'], path);

			return { type, options: parseOptions(schema.options, `${path}.options`) };
		case 'object':
			return parseObjectSchema(schema, path);
		default:
			return fail(`${path}.type`, `unknown schema type "${type}"`);
	}
}

function parseIntegerValue(value: unknown, schema: Extract<SettingSchema, { type: 'integer' }>, path: string): number
{
	const integer = readInteger(value, path);
	const stepBase = schema.min ?? 0;
	if (
		(schema.min !== null && integer < schema.min)
		|| (schema.max !== null && integer > schema.max)
		|| ((integer - stepBase) % schema.step !== 0)
	)
	{
		fail(path, 'integer violates schema constraints');
	}

	return integer;
}

function parseStringValue(value: unknown, schema: Extract<SettingSchema, { type: 'string' }>, path: string): string
{
	const string = readString(value, path);
	const length = [...string].length;
	if (
		(schema.minLength !== null && length < schema.minLength)
		|| (schema.maxLength !== null && length > schema.maxLength)
	)
	{
		fail(path, 'string violates schema constraints');
	}

	return string;
}

function parseSelectValue(
	value: unknown,
	schema: Extract<SettingSchema, { type: 'select' }>,
	path: string,
): SettingScalarValue
{
	const scalar = parseScalarValue(value, path);
	if (!schema.options.some((option) => option.value === scalar))
	{
		fail(path, 'value is not an allowed option');
	}

	return scalar;
}

function parseMultiSelectValue(
	value: unknown,
	schema: Extract<SettingSchema, { type: 'multiSelect' }>,
	path: string,
): readonly SettingScalarValue[]
{
	if (!Array.isArray(value))
	{
		fail(path, 'list expected');
	}

	const result = value.map((item, index) => parseScalarValue(item, `${path}[${index}]`));
	for (const [index, item] of result.entries())
	{
		if (!schema.options.some((option) => option.value === item))
		{
			fail(`${path}[${index}]`, 'value is not an allowed option');
		}

		if (result.slice(0, index).includes(item))
		{
			fail(`${path}[${index}]`, 'duplicate value');
		}
	}

	return result;
}

function parseObjectValue(
	value: unknown,
	schema: Extract<SettingSchema, { type: 'object' }>,
	path: string,
): SettingObjectValue
{
	const object = readRecord(value, path);
	const fieldsByCode = new Map(schema.fields.map((field) => [field.code, field]));
	for (const code of Object.keys(object))
	{
		if (!fieldsByCode.has(code))
		{
			fail(`${path}.${code}`, 'unknown object field');
		}
	}

	const result: Record<string, SettingValue> = {};
	for (const field of schema.fields)
	{
		if (!Object.hasOwn(object, field.code))
		{
			if (field.required)
			{
				fail(`${path}.${field.code}`, 'required object field is missing');
			}

			continue;
		}

		result[field.code] = parseValue(object[field.code], field.schema, `${path}.${field.code}`);
	}

	return result;
}

function parseValue(value: unknown, schema: SettingSchema, path: string): SettingValue
{
	switch (schema.type)
	{
		case 'boolean':
			return readBoolean(value, path);
		case 'integer':
			return parseIntegerValue(value, schema, path);
		case 'string':
			return parseStringValue(value, schema, path);
		case 'select':
			return parseSelectValue(value, schema, path);
		case 'multiSelect':
			return parseMultiSelectValue(value, schema, path);
		case 'object':
			return parseObjectValue(value, schema, path);
		default:
			return fail(path, 'unknown schema type');
	}
}

function parseSettingPresentation(value: unknown, path: string): SettingPresentation
{
	const setting = readRecord(value, path);
	assertExactKeys(setting, ['code', 'value', 'visible', 'canEdit', 'meta'], path);
	if (setting.visible !== true)
	{
		fail(`${path}.visible`, 'literal true expected');
	}

	const meta = readRecord(setting.meta, `${path}.meta`);
	assertExactKeys(meta, ['title', 'hint', 'schema'], `${path}.meta`);
	const schema = parseSettingSchema(meta.schema, `${path}.meta.schema`);

	return {
		code: readNonEmptyString(setting.code, `${path}.code`),
		value: parseValue(setting.value, schema, `${path}.value`),
		visible: true,
		canEdit: readBoolean(setting.canEdit, `${path}.canEdit`),
		meta: {
			title: readString(meta.title, `${path}.meta.title`),
			hint: readNullableString(meta.hint, `${path}.meta.hint`),
			schema,
		},
	};
}

export function parseSettingsPresentation(value: unknown): SettingsPresentation
{
	const presentation = readRecord(value, 'root');
	assertExactKeys(presentation, ['settings'], 'root');
	if (!Array.isArray(presentation.settings))
	{
		fail('root.settings', 'list expected');
	}
	const settings = presentation.settings.map((setting, index) => (
		parseSettingPresentation(setting, `root.settings[${index}]`)
	));
	const codes = new Set<string>();
	for (const setting of settings)
	{
		if (codes.has(setting.code))
		{
			fail('root.settings', `duplicate setting code "${setting.code}"`);
		}

		codes.add(setting.code);
	}

	return { settings };
}

function getProjectedSetting(
	setting: SettingPresentation,
	valuePath: SettingValuePath | undefined,
): Readonly<{
	value: SettingValue,
	title: string,
	hint: string | null,
	schema: SettingSchema,
}>
{
	if (valuePath === undefined)
	{
		return {
			value: setting.value,
			title: setting.meta.title,
			hint: setting.meta.hint,
			schema: setting.meta.schema,
		};
	}

	if (setting.meta.schema.type !== 'object' || !isPlainRecord(setting.value))
	{
		return fail(setting.code, `object schema expected for value path "${valuePath}"`);
	}

	const field = setting.meta.schema.fields.find((item) => item.code === valuePath);
	if (field === undefined || !Object.hasOwn(setting.value, valuePath))
	{
		return fail(setting.code, `value path "${valuePath}" is missing`);
	}

	return {
		value: setting.value[valuePath] as SettingValue,
		title: field.title,
		hint: field.hint,
		schema: field.schema,
	};
}

function createHydratedState(
	setting: SettingPresentation,
	binding: Extract<SettingBinding, { kind: 'v2' }>,
): HydratedSettingState
{
	const projected = getProjectedSetting(setting, binding.valuePath);
	const commonState = {
		state: 'explicit' as const,
		raw: projected.value,
		code: setting.code,
		valuePath: binding.valuePath,
		canEdit: setting.canEdit,
		title: projected.title,
		hint: projected.hint,
		schema: projected.schema,
		setting,
	};

	if (projected.schema.type === 'select')
	{
		return {
			...commonState,
			label: projected.schema.options.find((option) => option.value === projected.value)?.title,
		};
	}

	if (projected.schema.type === 'string' || projected.schema.type === 'integer')
	{
		return { ...commonState, label: String(projected.value) };
	}

	if (projected.schema.type === 'multiSelect' && Array.isArray(projected.value))
	{
		const selectedValues: readonly SettingScalarValue[] = projected.value;

		return {
			...commonState,
			matrix: {
				types: projected.schema.options.map((option) => ({
					id: String(option.value),
					name: option.title,
					checked: selectedValues.includes(option.value),
				})),
			},
		};
	}

	return commonState;
}

export function hydrateSettingsPresentation(value: unknown): HydratedSettingsPresentation
{
	const presentation = parseSettingsPresentation(value);
	const settingsByCode = new Map<string, SettingPresentation>(
		presentation.settings.map((setting) => [setting.code, setting]),
	);
	const settingsState: Record<string, HydratedSettingState> = {};
	const visibleSettingIds = new Set<string>();

	for (const [id, binding] of settingBindingRegistry)
	{
		if (binding.kind === 'navigation')
		{
			visibleSettingIds.add(id);
			continue;
		}

		if (binding.kind === 'unsupported')
		{
			continue;
		}

		const setting = settingsByCode.get(binding.code);
		if (setting === undefined)
		{
			continue;
		}

		settingsState[id] = createHydratedState(setting, binding);
		visibleSettingIds.add(id);
	}

	return {
		presentation,
		settingsByCode,
		settingsState,
		visibleSettingIds,
	};
}
