export type RecordKind = 'scalar' | 'array' | 'relation' | 'navigation';

export type AvailableStep = 1 | 2;

export type RelationDirection = 'parent' | 'child';

export type LegacyBinding = {
	name?: string;
	dataName?: string;
	dataRole?: string;
	switcherId?: string;
};

export type DisabledDescriptor = {
	condition: string;
	reasonSource: string;
};

// min/max are part of the record contract, but BInput of ui.system.input.vue has no props for them,
// so the kit currently forwards inputType only.
export type FieldDescriptor = {
	inputType?: 'text' | 'number';
	min?: number;
	max?: number;
};

type BaseRecord = {
	id: string;
	sectionId: string;
	controlType: string;
	title: string;
	availableFromStep: AvailableStep;
	legacyBinding?: LegacyBinding;
	disabled?: DisabledDescriptor;
};

export type ScalarRecord = BaseRecord & {
	kind: 'scalar';
	valueKey: string;
	description?: string;
	field?: FieldDescriptor;
};

export type ArrayRecord = BaseRecord & {
	kind: 'array';
	itemsKey: string;
	itemIdKey: string;
	itemTitleKey: string;
	itemValueKey: string;
};

export type RelationSource = {
	availableItemsKey?: string;
	selectedItemsKey: string;
};

export type RelationSelector = {
	entityType: string;
	filterKey?: string;
	multiple: boolean;
};

export type RelationRecord = BaseRecord & {
	kind: 'relation';
	source: RelationSource;
	selector: RelationSelector;
	direction?: RelationDirection;
	adapterKey: string;
};

export type NavigationRecord = BaseRecord & {
	kind: 'navigation';
	actionKey: string;
};

export type SettingsRecord = ScalarRecord | ArrayRecord | RelationRecord | NavigationRecord;

export type HubSectionDescriptor = {
	id: string;
	title: string;
	// A section whose own layout carries the headings keeps the section title for screen
	// readers only (the shell still needs it as the region label).
	hideTitle?: boolean;
};
