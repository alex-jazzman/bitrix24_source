import {
	type SettingId,
	type SettingState,
	type SettingValuePath,
} from '../../../model/types';

export type SettingScalarValue = boolean | number | string;

export type SettingValue =
	| SettingScalarValue
	| readonly SettingScalarValue[]
	| SettingObjectValue;

export interface SettingObjectValue
{
	readonly [code: string]: SettingValue;
}

export type SettingOption = Readonly<{
	value: SettingScalarValue,
	title: string,
	hint: string | null,
}>;

export type BooleanSettingSchema = Readonly<{
	type: 'boolean',
}>;

export type IntegerSettingSchema = Readonly<{
	type: 'integer',
	min: number | null,
	max: number | null,
	step: number,
}>;

export type StringSettingSchema = Readonly<{
	type: 'string',
	minLength: number | null,
	maxLength: number | null,
}>;

export type SelectSettingSchema = Readonly<{
	type: 'select',
	options: readonly SettingOption[],
}>;

export type MultiSelectSettingSchema = Readonly<{
	type: 'multiSelect',
	options: readonly SettingOption[],
}>;

export type ObjectSettingField = Readonly<{
	code: string,
	title: string,
	hint: string | null,
	required: boolean,
	schema: SettingSchema,
}>;

export type ObjectSettingSchema = Readonly<{
	type: 'object',
	fields: readonly ObjectSettingField[],
}>;

export type SettingSchema =
	| BooleanSettingSchema
	| IntegerSettingSchema
	| StringSettingSchema
	| SelectSettingSchema
	| MultiSelectSettingSchema
	| ObjectSettingSchema;

export type SettingPresentation = Readonly<{
	code: string,
	value: SettingValue,
	visible: true,
	canEdit: boolean,
	meta: Readonly<{
		title: string,
		hint: string | null,
		schema: SettingSchema,
	}>,
}>;

export type SettingsPresentation = Readonly<{
	settings: readonly SettingPresentation[],
}>;

export type HydratedSettingState = SettingState & Readonly<{
	code: string,
	valuePath?: SettingValuePath,
	canEdit: boolean,
	title: string,
	hint: string | null,
	schema: SettingSchema,
	setting: SettingPresentation,
}>;

export type HydratedSettingsPresentation = Readonly<{
	presentation: SettingsPresentation,
	settingsByCode: ReadonlyMap<string, SettingPresentation>,
	settingsState: Readonly<Record<SettingId, HydratedSettingState>>,
	visibleSettingIds: ReadonlySet<SettingId>,
}>;
