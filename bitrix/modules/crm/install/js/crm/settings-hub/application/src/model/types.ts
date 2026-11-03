import { type Component } from 'ui.vue3';

export type SettingId = string;

export type SettingValuePath = 'format' | 'urlTemplate' | 'clickHandler' | 'normalizeNumber';

export type SettingBinding =
	| Readonly<{ kind: 'v2', code: string, valuePath?: SettingValuePath, mutationGroup?: string }>
	| Readonly<{ kind: 'navigation' }>
	| Readonly<{ kind: 'unsupported' }>;

export type SettingStateStatus = 'undefined' | 'none' | 'default' | 'explicit';

export type MatrixType = Readonly<{
	id: string,
	name: string,
	checked: boolean,
}>;

export type SettingMatrix = Readonly<{
	types: readonly MatrixType[],
}>;

export type SettingState = Readonly<{
	state: SettingStateStatus,
	raw?: unknown,
	label?: string,
	matrix?: SettingMatrix,
}>;

export type SettingsState = Readonly<Record<SettingId, SettingState>>;

export type SettingsStateContext = Readonly<{
	get: (id: SettingId) => SettingState,
}>;

export type Capability = Readonly<{
	id: string,
	title: string,
	task: string,
	component: Component,
	icon?: string,
}>;

export type CapabilityGroup = Readonly<{
	id: string,
	title: string,
	capabilities: readonly Capability[],
}>;

export type CapabilityCatalog = Readonly<{
	groups: readonly CapabilityGroup[],
}>;

export type SettingRegistration = Readonly<{
	id: SettingId,
	navigationId?: string,
	component: Component,
	searchText: readonly string[],
	parentId?: SettingId,
}>;

export type BlockRegistration = Readonly<{
	id: string,
	title: string,
	icon?: string,
	settings: readonly SettingRegistration[],
}>;

export type CatalogSectionRegistration = Readonly<{
	id: string,
	title: string,
	type: 'capabilities-catalog',
	catalog: CapabilityCatalog,
}>;

export type SettingsSectionRegistration = Readonly<{
	id: string,
	title: string,
	type: 'settings-group',
	blocks: readonly BlockRegistration[],
}>;

export type HubSectionRegistration = CatalogSectionRegistration | SettingsSectionRegistration;
