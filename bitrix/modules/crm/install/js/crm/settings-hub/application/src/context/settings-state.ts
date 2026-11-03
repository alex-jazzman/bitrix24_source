import { Type } from 'main.core';
import { inject, provide, shallowRef, type InjectionKey } from 'ui.vue3';

import {
	type HydratedSettingState,
	type HydratedSettingsPresentation,
	type SettingPresentation,
	type SettingSchema,
	type SettingValue,
	type SettingsPresentation,
} from '../infrastructure/service/settings/types';
import { hydrateSettingsPresentation } from '../infrastructure/service/settings/mappers';
import {
	type SettingId,
	type SettingState,
	type SettingsState,
} from '../model/types';

export type RuntimeSettingState = SettingState & Partial<Pick<
	HydratedSettingState,
	'code' | 'valuePath' | 'canEdit' | 'title' | 'hint' | 'schema' | 'setting'
>>;

export type UpdateSettingHandler = (id: SettingId, value: SettingValue) => Promise<void>;

export type RuntimeSettingsStateContext = Readonly<{
	get: (id: SettingId) => RuntimeSettingState,
	update: (id: SettingId, value: SettingValue) => Promise<void>,
	isPending: (id: SettingId) => boolean,
}>;

export type SettingsStateController = RuntimeSettingsStateContext & Readonly<{
	applyOptimisticValue: (code: string, value: SettingValue) => void,
	getHydrated: (id: SettingId) => HydratedSettingState | null,
	getPresentation: () => SettingsPresentation | null,
	getSearchText: (id: SettingId) => readonly string[],
	isCodePending: (code: string) => boolean,
	isVisible: (id: SettingId) => boolean,
	replacePresentation: (presentation: SettingsPresentation) => void,
	restoreSnapshot: (snapshot: SettingPresentation) => void,
	setPending: (code: string, pending: boolean) => void,
	setUpdateHandler: (handler: UpdateSettingHandler) => void,
}>;

export type SettingsStateInput = SettingsState | SettingsPresentation | HydratedSettingsPresentation;

const settingsStateKey: InjectionKey<RuntimeSettingsStateContext> = Symbol('crm-settings-hub-settings-state');
const unknownSettingState: SettingState = { state: 'undefined' };
const ignoreUpdate: UpdateSettingHandler = async () => {};

function isHydratedPresentation(value: SettingsStateInput): value is HydratedSettingsPresentation
{
	return 'settingsByCode' in value && value.settingsByCode instanceof Map;
}

function isPresentation(value: SettingsStateInput): value is SettingsPresentation
{
	return 'settings' in value && Array.isArray(value.settings);
}

function isRuntimeContext(value: SettingsStateInput | RuntimeSettingsStateContext): value is RuntimeSettingsStateContext
{
	if (!('get' in value) || !('update' in value) || !('isPending' in value))
	{
		return false;
	}

	return (
		Type.isFunction(value.get)
		&& Type.isFunction(value.update)
		&& Type.isFunction(value.isPending)
	);
}

function collectSchemaSearchText(schema: SettingSchema): readonly string[]
{
	if (schema.type === 'select' || schema.type === 'multiSelect')
	{
		return schema.options.flatMap((option) => [option.title, option.hint ?? '']);
	}

	if (schema.type === 'object')
	{
		return schema.fields.flatMap((field) => [
			field.title,
			field.hint ?? '',
			...collectSchemaSearchText(field.schema),
		]);
	}

	return [];
}

function resolveHydratedPresentation(input: SettingsStateInput): HydratedSettingsPresentation | null
{
	if (isHydratedPresentation(input))
	{
		return input;
	}

	return isPresentation(input) ? hydrateSettingsPresentation(input) : null;
}

function replacePresentationSetting(
	presentation: SettingsPresentation,
	snapshot: SettingPresentation,
): SettingsPresentation
{
	const hasSetting = presentation.settings.some((setting) => setting.code === snapshot.code);
	const settings = presentation.settings.map((setting) => (
		setting.code === snapshot.code ? snapshot : setting
	));

	return { settings: hasSetting ? settings : [...settings, snapshot] };
}

function updatePendingCodes(
	pendingCodes: ReadonlySet<string>,
	code: string,
	pending: boolean,
): ReadonlySet<string>
{
	const nextPendingCodes = new Set(pendingCodes);
	if (pending)
	{
		nextPendingCodes.add(code);
	}
	else
	{
		nextPendingCodes.delete(code);
	}

	return nextPendingCodes;
}

export function createSettingsStateContext(input: SettingsStateInput): SettingsStateController
{
	const initialHydrated = resolveHydratedPresentation(input);
	const hydrated = shallowRef<HydratedSettingsPresentation | null>(initialHydrated);
	const legacyState = shallowRef<SettingsState>(initialHydrated === null ? input as SettingsState : {});
	const pendingCodes = shallowRef<ReadonlySet<string>>(new Set());
	let updateHandler = ignoreUpdate;

	function replacePresentation(presentation: SettingsPresentation): void
	{
		hydrated.value = hydrateSettingsPresentation(presentation);
		legacyState.value = {};
	}

	function replaceSetting(snapshot: SettingPresentation): void
	{
		const current = hydrated.value;
		if (current === null)
		{
			return;
		}

		replacePresentation(replacePresentationSetting(current.presentation, snapshot));
	}

	const controller: SettingsStateController = {
		get(id: SettingId): RuntimeSettingState
		{
			return hydrated.value?.settingsState[id] ?? legacyState.value[id] ?? unknownSettingState;
		},
		async update(id: SettingId, value: SettingValue): Promise<void>
		{
			await updateHandler(id, value);
		},
		isPending(id: SettingId): boolean
		{
			const code = hydrated.value?.settingsState[id]?.code;

			return code !== undefined && pendingCodes.value.has(code);
		},
		applyOptimisticValue(code: string, value: SettingValue): void
		{
			const setting = hydrated.value?.settingsByCode.get(code);
			if (setting === undefined)
			{
				throw new TypeError(`Unknown setting code: "${code}"`);
			}

			replaceSetting({ ...setting, value });
		},
		getHydrated(id: SettingId): HydratedSettingState | null
		{
			return hydrated.value?.settingsState[id] ?? null;
		},
		getPresentation(): SettingsPresentation | null
		{
			return hydrated.value?.presentation ?? null;
		},
		getSearchText(id: SettingId): readonly string[]
		{
			const state = hydrated.value?.settingsState[id];
			if (state === undefined)
			{
				return [];
			}

			return [state.title, state.hint ?? '', ...collectSchemaSearchText(state.schema)];
		},
		isCodePending(code: string): boolean
		{
			return pendingCodes.value.has(code);
		},
		isVisible(id: SettingId): boolean
		{
			return hydrated.value?.visibleSettingIds.has(id) ?? Object.hasOwn(legacyState.value, id);
		},
		replacePresentation,
		restoreSnapshot(snapshot: SettingPresentation): void
		{
			replaceSetting(snapshot);
		},
		setPending(code: string, pending: boolean): void
		{
			pendingCodes.value = updatePendingCodes(pendingCodes.value, code, pending);
		},
		setUpdateHandler(handler: UpdateSettingHandler): void
		{
			updateHandler = handler;
		},
	};

	return controller;
}

export function provideSettingsState(input: SettingsStateInput): SettingsStateController;
export function provideSettingsState(input: RuntimeSettingsStateContext): RuntimeSettingsStateContext;
export function provideSettingsState(
	input: SettingsStateInput | RuntimeSettingsStateContext,
): SettingsStateController | RuntimeSettingsStateContext
{
	const context = isRuntimeContext(input) ? input : createSettingsStateContext(input);
	provide(settingsStateKey, context);

	return context;
}

export function useSettingsStateContext(): RuntimeSettingsStateContext
{
	const context = inject(settingsStateKey, null);
	if (context === null)
	{
		throw new Error('CRM Settings Hub settings state provider is missing');
	}

	return context;
}

export function useSettingState(id: SettingId): RuntimeSettingState
{
	return useSettingsStateContext().get(id);
}
