import { defineStore } from 'ui.vue3.pinia';

import {
	HUB_VALUE_KEYS,
	defaultHubValues,
	formatDaysBeforeClose,
	pickHubValues,
	areHubValuesEqual,
} from '../lib/hub-values/hub-values';
import { resolveSavedDescriptionState } from '../lib/saved-description/saved-description';

export type RelationEntry = {
	entityTypeId: number;
	isChildrenListEnabled: boolean;
};

export type RelationsState = {
	parent: RelationEntry[];
	child: RelationEntry[];
};

export type CustomSectionEntry = {
	id: number | string;
	title: string;
	isSelected?: boolean;
};

// Editable form values: every section's state, kept independently of what is currently displayed
// (save must not miss hidden sections). The snapshot is a clone of exactly these keys.
export type TypeHubValues = {
	title: string;
	description: string;
	daysBeforeClose: string;
	linkedUserFields: Record<string, boolean>;
	relations: RelationsState;
	// A section created in the inline editor carries a temporary string id (`new_<random>`) until the
	// server resolves it, so the value is stored and sent exactly as the control reported it.
	customSectionId: number | string;
	customSections: CustomSectionEntry[];
	isExternal: boolean;
	// The 16 live booleans are stored under their own keys as well, spread in defaults().
	[fieldName: string]: unknown;
};

type TypeHubState = TypeHubValues & {
	snapshot: TypeHubValues;
	activeSectionId: string;
};

export const useTypeHubStore = defineStore('crmTypeHub', {
	state: (): TypeHubState => ({
		...(defaultHubValues() as TypeHubValues),
		snapshot: defaultHubValues() as TypeHubValues,
		activeSectionId: 'main',
	}),
	getters: {
		// Dirty when any editable value diverges from the last committed snapshot.
		isDirty(state): boolean
		{
			return !areHubValuesEqual(pickHubValues(state), state.snapshot);
		},
		values(state): TypeHubValues
		{
			return pickHubValues(state) as TypeHubValues;
		},
	},
	actions: {
		// Seed the store from arResult and take the initial snapshot as the saved baseline.
		init(values: Partial<TypeHubValues>, activeSectionId: string): void
		{
			const next = { ...defaultHubValues(), ...values };
			HUB_VALUE_KEYS.forEach((key) => {
				this[key] = next[key];
			});
			this.activeSectionId = activeSectionId;
			this.commitSnapshot();
		},
		setField(key: string, value: unknown): void
		{
			this[key] = value;
		},
		setLinkedUserFields(linkedUserFields: Record<string, boolean>): void
		{
			this.linkedUserFields = { ...linkedUserFields };
		},
		setRelations(relations: RelationsState): void
		{
			this.relations = {
				parent: [...relations.parent],
				child: [...relations.child],
			};
		},
		setRelationDirection(direction: 'parent' | 'child', items: RelationEntry[]): void
		{
			this.relations = { ...this.relations, [direction]: [...items] };
		},
		setCustomSectionState(state: { customSectionId: number | string, customSections: CustomSectionEntry[] }): void
		{
			this.customSectionId = state.customSectionId;
			this.customSections = [...state.customSections];
		},
		setActiveSection(sectionId: string): void
		{
			this.activeSectionId = sectionId;
		},
		// Applied right before the payload is built. Without it the server keeps the value clamped to the
		// CloseDate bounds while the field and the committed snapshot keep what was typed, so the form
		// would silently show a number that was never saved.
		normalizeDaysBeforeClose(): void
		{
			this.daysBeforeClose = formatDaysBeforeClose(this.daysBeforeClose);
		},
		// A save that keeps the screen open: the snapshot, committed from the typed value, takes the saved
		// description, and so does the field unless it was edited during the request.
		applySavedDescription(saved: string): void
		{
			const next = resolveSavedDescriptionState(this, saved);
			this.snapshot = next.snapshot;
			this.description = next.description;
		},
		// Snapshot is refreshed ONLY after a successful save.
		commitSnapshot(values?: TypeHubValues): void
		{
			this.snapshot = pickHubValues(values ?? this) as TypeHubValues;
		},
		// Client-only revert to the last saved state. Imperative controls are restored
		// separately by the app; the store does not drive their DOM.
		revertToSnapshot(): void
		{
			const snapshot = JSON.parse(JSON.stringify(this.snapshot)) as TypeHubValues;
			HUB_VALUE_KEYS.forEach((key) => {
				this[key] = snapshot[key];
			});
		},
	},
});
