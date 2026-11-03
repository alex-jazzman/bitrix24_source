import { defineComponent, markRaw, type PropType } from 'ui.vue3';
import { Switcher } from 'ui.vue3.components.switcher';
import { TextSm } from 'ui.system.typography.vue';
import { TagSelector } from 'ui.entity-selector';
import { Dom } from 'main.core';

import { type RelationRecord } from 'crm.settings-hub';
import { destroyTagSelectors } from '../lib/destroy-tag-selectors/destroy-tag-selectors';
import {
	type HubBaseline,
	type RelationCatalogEntry,
	readRelationCatalog,
	readRelationEntries,
} from '../lib/hub-baseline/hub-baseline';

type RelationEntry = {
	entityTypeId: number;
	isChildrenListEnabled: boolean;
};

type SelectorItem = {
	id: number;
	entityId: string;
	title: string;
	tabs: string;
};

// Form control for one relation direction (parent / child): RelationsController semantics 1:1
// with it: a switcher, a type TagSelector, a "list in card" checkbox and a tabs TagSelector with
// cascading visibility and reconciliation. Imperative: TagSelectors are markRaw'd and restored on
// revert via applySnapshot(baseline); getData() returns [] when the switcher is off.
export const CrmTypeHubRelationControl = defineComponent({
	name: 'CrmTypeHubRelationControl',
	components: { Switcher, TextSm },
	inject: {
		hubControlRegistry: { default: null },
	},
	props: {
		descriptor: {
			type: Object as PropType<RelationRecord>,
			required: true,
		},
		snapshot: {
			type: Object as PropType<Record<string, unknown>>,
			required: true,
		},
		readOnly: {
			type: Boolean,
			default: false,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update'],
	setup(): Object
	{
		return { switcherOptions: { size: 'small', showStateTitle: false } };
	},
	data()
	{
		return {
			enabled: false,
			showChildrenList: false,
			typeSelector: null as any,
			tabsSelector: null as any,
		};
	},
	computed: {
		direction(): string
		{
			return this.descriptor.direction ?? 'parent';
		},
		switcherLabelId(): string
		{
			return `crm-type-hub-relation-${this.descriptor.id}-label`;
		},
		ariaChecked(): 'true' | 'false'
		{
			return this.enabled ? 'true' : 'false';
		},
	},
	mounted(): void
	{
		this.applySnapshot(this.snapshot);
		this.registerInRegistry();
	},
	beforeUnmount(): void
	{
		this.destroySelectors();
		this.unregisterFromRegistry();
	},
	methods: {
		buildSelectors(catalog: RelationCatalogEntry[], selectedEntries: RelationEntry[]): void
		{
			this.destroySelectors();
			const selectedById = new Map<number, RelationEntry>();
			selectedEntries.forEach((entry) => selectedById.set(Number(entry.entityTypeId), entry));

			const unselectedTypes: SelectorItem[] = [];
			const selectedTypes: SelectorItem[] = [];
			const unselectedTabs: SelectorItem[] = [];
			const selectedTabs: SelectorItem[] = [];

			catalog.forEach((relation: RelationCatalogEntry) => {
				const item: SelectorItem = {
					id: relation.entityTypeId,
					entityId: 'crmType',
					title: relation.title,
					tabs: 'recents',
				};
				const entry = selectedById.get(Number(relation.entityTypeId));
				const isChecked = entry ? true : relation.isChecked;
				const withList = entry ? entry.isChildrenListEnabled : relation.isChildrenListEnabled;

				if (isChecked)
				{
					selectedTypes.push(item);
					(withList ? selectedTabs : unselectedTabs).push(item);
				}
				else
				{
					unselectedTypes.push(item);
				}
			});

			this.typeSelector = markRaw(new TagSelector({
				dialogOptions: {
					enableSearch: false,
					multiple: false,
					items: unselectedTypes,
					selectedItems: selectedTypes,
					dropdownMode: true,
					height: 200,
					showAvatars: false,
				},
				events: {
					onAfterTagAdd: this.handleSelectorChange.bind(this),
					onAfterTagRemove: this.handleSelectorChange.bind(this),
				},
			} as any));
			this.typeSelector.renderTo(this.$refs.typeSelector as HTMLElement);

			this.tabsSelector = markRaw(new TagSelector({
				dialogOptions: {
					enableSearch: false,
					multiple: false,
					items: unselectedTabs,
					selectedItems: selectedTabs,
					dropdownMode: true,
					height: 200,
					showAvatars: false,
				},
			} as any));
			this.tabsSelector.renderTo(this.$refs.tabsSelector as HTMLElement);

			this.enabled = selectedTypes.length > 0;
			this.showChildrenList = selectedTabs.length > 0;
		},
		handleSwitcherCheck(): void
		{
			this.enabled = true;
			this.emitUpdate();
		},
		handleSwitcherUncheck(): void
		{
			this.enabled = false;
			this.emitUpdate();
		},
		handleSwitcherKeydown(event: KeyboardEvent): void
		{
			if (this.disabled || this.readOnly || !['Enter', ' '].includes(event.key))
			{
				return;
			}

			event.preventDefault();
			if (this.enabled)
			{
				this.handleSwitcherUncheck();
			}
			else
			{
				this.handleSwitcherCheck();
			}
		},
		handleChildrenListToggle(event: Event): void
		{
			this.showChildrenList = (event.target as HTMLInputElement).checked;
			this.reconcileTabs();
			this.emitUpdate();
		},
		handleSelectorChange(): void
		{
			this.reconcileTabs();
			this.emitUpdate();
		},
		// Reconciliation: drop from the tabs selector any type deselected in the main
		// selector; newly selected types are auto-added to the tabs selector already selected.
		reconcileTabs(): void
		{
			if (!this.typeSelector || !this.tabsSelector)
			{
				return;
			}

			const selectedTypes = this.typeSelector.getDialog().getSelectedItems();

			this.tabsSelector.getDialog().getItems().forEach((item: any) => {
				const stillSelected = selectedTypes.some((type: any) => type.getId() === item.getId());
				if (!stillSelected)
				{
					item.deselect();
					this.tabsSelector.getDialog().removeItem(item);
					this.tabsSelector.removeTag({ id: item.getId(), entityId: item.getEntityId() });
				}
			});

			selectedTypes.forEach((type: any) => {
				const itemData = {
					id: type.getId(),
					entityId: type.getEntityId(),
					title: type.getTitle(),
					tabs: 'recents',
				};
				const existing = this.tabsSelector.getDialog().getItem(itemData);
				if (!existing)
				{
					this.tabsSelector.getDialog().addItem(itemData).select();
				}
			});
		},
		getData(): RelationEntry[]
		{
			if (!this.enabled || !this.typeSelector)
			{
				return [];
			}

			const selectedTabIds = new Set(
				this.tabsSelector.getDialog().getSelectedItems().map((item: any) => item.getId()),
			);

			return this.typeSelector.getDialog().getSelectedItems().map((type: any) => ({
				entityTypeId: type.getId(),
				isChildrenListEnabled: this.showChildrenList && selectedTabIds.has(type.getId()),
			}));
		},
		emitUpdate(): void
		{
			this.$emit('update', this.getData());
		},
		// Rebuild the selectors for this direction from the given baseline: the `snapshot` prop on mount,
		// the post-revert store values passed by the app on cancel (the prop is still the old render).
		applySnapshot(baseline: HubBaseline): void
		{
			this.buildSelectors(
				readRelationCatalog(baseline, this.direction),
				readRelationEntries(baseline, this.direction),
			);
		},
		destroySelectors(): void
		{
			destroyTagSelectors([this.typeSelector, this.tabsSelector]);
			Dom.clean(this.$refs.typeSelector as HTMLElement);
			Dom.clean(this.$refs.tabsSelector as HTMLElement);
			this.typeSelector = null;
			this.tabsSelector = null;
		},
		reset(baseline: HubBaseline): void
		{
			this.applySnapshot(baseline);
		},
		registerInRegistry(): void
		{
			const registry = this.hubControlRegistry as Record<string, any> | null;
			if (registry)
			{
				registry[this.descriptor.id] = {
					applySnapshot: (baseline: HubBaseline) => this.applySnapshot(baseline),
					reset: (baseline: HubBaseline) => this.reset(baseline),
				};
			}
		},
		unregisterFromRegistry(): void
		{
			const registry = this.hubControlRegistry as Record<string, any> | null;
			if (registry)
			{
				delete registry[this.descriptor.id];
			}
		},
	},
	template: `
		<div class="crm-type-hub-relation" :class="{ '--disabled': disabled }">
			<div class="crm-type-hub-relation__switch">
				<div
					class="crm-type-hub-relation__switch-toggle"
					:tabindex="(disabled || readOnly) ? -1 : 0"
					role="switch"
					:aria-checked="ariaChecked"
					:aria-labelledby="switcherLabelId"
					:data-testid="'crm-type-detail-relation-' + direction + '-switch'"
					@keydown="handleSwitcherKeydown"
				>
					<Switcher
						:is-checked="enabled"
						:is-disabled="disabled || readOnly"
						:options="switcherOptions"
						:data-switcher-id="descriptor.legacyBinding && descriptor.legacyBinding.switcherId"
						aria-hidden="true"
						@check="handleSwitcherCheck"
						@uncheck="handleSwitcherUncheck"
					/>
				</div>
				<TextSm :id="switcherLabelId" class="crm-type-hub-relation__switch-label">{{ loc(descriptor.title) }}</TextSm>
			</div>
			<div v-show="enabled" class="crm-type-hub-relation__items">
				<div ref="typeSelector" class="crm-type-hub-relation__selector"></div>
				<label class="crm-type-hub-relation__children">
					<input
						type="checkbox"
						:data-name="descriptor.legacyBinding && descriptor.legacyBinding.dataName"
						:checked="showChildrenList"
						:disabled="disabled || readOnly"
						@change="handleChildrenListToggle"
					/>
					<span>{{ loc('CRM_TYPE_DETAIL_RELATION_CHILDREN_LIST') }}</span>
				</label>
				<div v-show="showChildrenList" ref="tabsSelector" class="crm-type-hub-relation__tabs-selector"></div>
			</div>
		</div>
	`,
});
