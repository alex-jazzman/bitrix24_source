import { Loc, Runtime, Type } from 'main.core';
import type { BaseEvent } from 'main.core.events';
import { Dialog, type DialogOptions, type Item, type ItemId, type ItemOptions } from 'ui.entity-selector';
import { EntitySelectorContext, EntitySelectorEntities } from '../../../../integration/entity-selector/dictionary';
import { Footer } from '../../../../integration/entity-selector/footer';
import { Header } from '../../../../integration/entity-selector/header';
import { ItemsMapper } from '../../../../integration/entity-selector/items-mapper';
import type { Variable, VariableCollection, VariablesSource } from '../../../../store/model/access-rights-model';
import { getSelectedVariables } from '../../../../utils';

export const Selector = {
	name: 'Selector',
	emits: ['apply', 'close'],
	props: {
		// value for selector is id of a selected variable
		initialValues: {
			type: Set,
			default: new Set(),
		},
	},
	inject: ['section', 'right'],
	data(): Object {
		return {
			// values modified during popup lifetime and not yet dispatched to store
			values: this.initialValues,
		};
	},
	dialog: null,
	computed: {
		hasVariablesSource(): boolean {
			return this.right.variablesSource !== null;
		},
		isAllSelected(): boolean {
			return this.values.has(this.right.allSelectedCode);
		},
		selectedVariables(): VariableCollection {
			return getSelectedVariables(this.right.variables, this.values, this.isAllSelected);
		},
		dialogModeOptions(): DialogOptions {
			return this.hasVariablesSource ? this.sourceModeOptions : this.staticModeOptions;
		},
		staticModeOptions(): DialogOptions {
			const items = ItemsMapper.mapVariables(this.right.variables);

			return {
				enableSearch: this.right.enableSearch,
				items,
				selectedItems: items.filter((item: ItemOptions) => this.selectedVariables.has(item.id)),
				entities: [
					{
						id: EntitySelectorEntities.VARIABLE,
					},
				],
			};
		},
		sourceModeOptions(): DialogOptions {
			const source: VariablesSource = this.right.variablesSource;

			return {
				// without search only the first page of the source is reachable
				enableSearch: true,
				items: this.allSelectedItems,
				preselectedItems: this.preselectedItems,
				entities: [
					{
						id: source.entityId,
						options: source.providerOptions,
						dynamicLoad: source.dynamicLoad,
						dynamicSearch: source.dynamicSearch,
						dynamicSearchMatchMode: source.dynamicSearchMatchMode,
						fillRecentItems: source.fillRecentItems,
					},
				],
				recentTabOptions: {
					stub: true,
					stubOptions: {
						title: Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_SELECTOR_EMPTY_STUB_TITLE'),
					},
				},
			};
		},
		allSelectedItems(): ItemOptions[] {
			if (!Type.isStringFilled(this.right.allSelectedCode))
			{
				return [];
			}

			return [ItemsMapper.mapAllSelectedVariable(this.right, this.isAllSelected)];
		},
		itemEntityId(): string | null {
			return this.hasVariablesSource ? this.right.variablesSource.itemEntityId : null;
		},
		stateCodes(): Set<string> {
			// "all" and "nothing" are states of the value set, not ids the source could ever resolve;
			// "nothing" falls back to emptyValue when nothingSelectedValue is not set, see getNothingSelectedValue
			return new Set([
				this.right.allSelectedCode,
				...(this.right.nothingSelectedValue ?? []),
				...(this.right.emptyValue ?? []),
			]);
		},
		concreteValues(): string[] {
			return [...this.values].filter((value: string) => !this.stateCodes.has(value));
		},
		preselectedItems(): ItemId[] {
			return this.concreteValues.map((value: string) => [this.itemEntityId, value]);
		},
	},
	mounted()
	{
		this.showSelector();
	},
	beforeUnmount()
	{
		this.dialog?.hide();
	},
	methods: {
		showSelector(): void {
			this.dialog = new Dialog({
				height: 400,
				context: EntitySelectorContext.VARIABLE,
				multiple: true,
				autoHide: true,
				hideByEsc: true,
				dropdownMode: true,
				compactView: this.right.compactView,
				showAvatars: this.right.showAvatars,
				searchOptions: {
					allowCreateItem: false,
				},
				cacheable: false,
				events: {
					'Item:onSelect': this.onItemSelect,
					'Item:onDeselect': this.onItemDeselect,
					onLoad: this.onDialogLoad,
					onHide: this.apply,
					onDestroy: () => {
						this.dialog = null;
					},
				},
				header: Header,
				headerOptions: {
					section: this.section,
					right: this.right,
				},
				footer: Footer,
				footerOptions: {
					hasVariablesSource: this.hasVariablesSource,
				},
				...this.dialogModeOptions,
			});

			this.dialog.show();
		},
		onItemSelect(event: BaseEvent): void {
			const addedItem: Item = event.getData().item;

			this.mergeVariable(addedItem);
			this.addValue(String(addedItem.getId()));
		},
		onItemDeselect(event: BaseEvent): void {
			const removedItem: Item = event.getData().item;

			this.removeValue(String(removedItem.getId()));
		},
		onDialogLoad(): void {
			if (!this.hasVariablesSource)
			{
				return;
			}

			const unloadedValues = this.concreteValues.filter((value: string) => {
				const item: ?Item = this.dialog.getItem([this.itemEntityId, value]);

				return item === null || item.isHidden();
			});

			unloadedValues.forEach((value: string) => {
				// a source-fed right may come with no dictionary at all, and a just picked value is not in it yet
				const variable: ?Variable = this.right.variables?.get(value) ?? null;
				const options: ItemOptions = ItemsMapper.mapUnloadedVariable(
					this.itemEntityId,
					value,
					variable,
					this.right.unloadedVariableTitlePattern,
				);

				this.revealUnloadedItem(options);
			});

			if (unloadedValues.length > 0)
			{
				// the footer counted the marks on its own load handler, when these items did not exist yet
				this.dialog.getFooter()?.updateSelectButtons();
			}

			// the response marks the values the dialog was opened with, and the set could have changed meanwhile
			this.syncDialogSelection();
		},
		// addItem() keeps the item it already holds and ignores the options passed with it, so the placeholder of
		// the dialog is brought to the same state by hand. The call itself is still needed for both cases: it
		// builds the item when there is none, and puts the placeholder into the tab it was created without.
		revealUnloadedItem(options: ItemOptions): void {
			const item: ?Item = this.dialog.getItem(options);
			if (item !== null)
			{
				item.setTitle(options.title);
				item.setHidden(options.hidden);
				item.setDeselectable(options.deselectable);
				item.setSearchable(options.searchable);
				item.setSaveable(options.saveable);
			}

			this.dialog.addItem(options);
		},
		// the only way to show the title of a just picked value before the matrix is saved
		mergeVariable(item: Item): void {
			if (!this.hasVariablesSource)
			{
				return;
			}

			void this.$store.dispatch('accessRights/mergeRightVariables', {
				sectionCode: this.section.sectionCode,
				rightId: this.right.id,
				variables: [
					{
						id: String(item.getId()),
						title: item.getTitle(),
					},
				],
			});
		},
		addValue(value: string): void {
			if (value === this.right.allSelectedCode)
			{
				this.setValues(new Set([this.right.allSelectedCode]));

				return;
			}

			const newValues = Runtime.clone(this.values);
			for (const stateCode of this.stateCodes)
			{
				newValues.delete(stateCode);
			}
			newValues.add(value);

			// a source gives no total to compare with, so the set never collapses on its own
			if (!this.hasVariablesSource && newValues.size >= this.right.variables.size)
			{
				this.setValues(new Set([this.right.allSelectedCode]));
			}
			else
			{
				this.setValues(newValues);
			}
		},
		removeValue(value: string): void {
			if (this.isAllSelected && !this.hasVariablesSource)
			{
				const allVariablesIds = [...this.right.variables.values()].map((variable: Variable) => variable.id);

				const allVariablesIdsWithoutRemoved = new Set(allVariablesIds);
				allVariablesIdsWithoutRemoved.delete(value);

				this.setValues(allVariablesIdsWithoutRemoved);

				return;
			}

			const newValues = Runtime.clone(this.values);
			newValues.delete(value);

			this.setValues(newValues);
		},
		setValues(newValues: Set<string>): void {
			this.values = newValues;
			this.syncDialogSelection();
		},
		// "all" and the concrete values exclude each other inside the value set only, while the dialog keeps its
		// own selection state: without this the marks would disagree with the set and the next click would be lost.
		// Static mode is left alone: there "all" is a state, not an item, and every value is already in the set.
		syncDialogSelection(): void {
			if (!this.hasVariablesSource || !this.dialog)
			{
				return;
			}

			let marksChanged = false;
			for (const item: Item of this.dialog.getItems())
			{
				const shouldBeSelected = this.values.has(String(item.getId()));
				if (shouldBeSelected === item.isSelected())
				{
					continue;
				}

				// silently: these very events are what brought us here
				if (shouldBeSelected)
				{
					item.select({ emitEvents: false });
				}
				else
				{
					item.deselect({ emitEvents: false });
				}

				marksChanged = true;
			}

			if (marksChanged)
			{
				// the marks changed without events, so the footer has nothing to recount its buttons on
				this.dialog.getFooter()?.updateSelectButtons();
			}
		},
		apply(): void {
			this.setNothingSelectedValueIfNeeded();

			this.$emit('apply', {
				values: this.values,
			});

			this.$emit('close');
		},
		setNothingSelectedValueIfNeeded(): void {
			if (this.values.size <= 0)
			{
				const nothingSelected = this.$store.getters['accessRights/getNothingSelectedValue'](
					this.section.sectionCode,
					this.right.id,
				);

				for (const nothing of nothingSelected)
				{
					this.addValue(nothing);
				}
			}
		},
	},
	template: `
		<div data-testid="ui-accessrights-multivariables-selector"></div>
	`,
};
