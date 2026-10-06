import { Event, Loc, Runtime, Type } from 'main.core';
import { ZIndexManager } from 'main.core.z-index-manager';
import { FocusTrap } from 'ui.a11y';
// The Vue checkbox comes from the vanilla extension, which re-exports it and carries its styles:
// ui.system.checkbox.vue has no bundle of its own and crashes on load.
import { Vue as CheckboxVue, CheckboxSize } from 'ui.system.checkbox';
import {
	OPERATION,
	SOURCE_ALIAS,
	SOURCE_ALIASES,
	splitSource,
} from 'bizproc.dataview';

import { useDataViewDefinitionStore } from '../stores/definition-store';
import { sourceKey, useDataViewMetaStore } from '../stores/meta-store';
import { resolveSourceDescriptor, sourceDescriptorTitle, SourceSelector } from './source-selector';

let dialogUidSeq = 0;

/** Typing stays instant while the lists are rebuilt once the search settles. */
const SEARCH_DEBOUNCE_MS = 200;

/** A schema names every field it has, and an entity can have hundreds; a list renders them by the page. */
const FIELD_ROWS_PAGE = 100;

/**
 * Parameter kinds. Beyond saying what is being added, the kind is what the user says the whole table
 * does with its data: a merge joins two sources by a key, a grouping totals one source up. A plain
 * field and a constant fit either, so they are the kinds that leave the operation as it is.
 */
export const PARAMETER_TYPE = Object.freeze({
	SIMPLE: 'simple',
	MERGE: 'merge',
	AGGREGATE: 'aggregate',
	CONSTANT: 'constant',
});

/** The operation a parameter kind commits the definition to; the other kinds commit to none. */
const TYPE_OPERATION = Object.freeze({
	[PARAMETER_TYPE.MERGE]: OPERATION.JOIN,
	[PARAMETER_TYPE.AGGREGATE]: OPERATION.AGGREGATE,
});

/** The kind a table already committed to its operation opens on. */
const OPERATION_TYPE = Object.freeze({
	[OPERATION.JOIN]: PARAMETER_TYPE.MERGE,
	[OPERATION.AGGREGATE]: PARAMETER_TYPE.AGGREGATE,
});

function mapFields(schema: ?Object): Array<Object>
{
	return (schema?.fields ?? []).map((field) => ({
		code: String(field.code ?? ''),
		name: String(field.title ?? field.code ?? ''),
		type: String(field.type ?? ''),
		joinable: field.joinable !== false,
		indexed: field.indexed !== false,
	}));
}

function matchesSearch(field: Object, search: string): boolean
{
	if (search === '')
	{
		return true;
	}

	return `${field.name} ${field.code}`.toLowerCase().includes(search);
}

/**
 * The parameter dialog: everything a column is picked from lives here. The sources it reads and the
 * operation it commits to are properties of the whole definition, so they are read from and written to
 * {@see useDataViewDefinitionStore} — the dialog is only where they are picked. The operation has no
 * field of its own: the parameter kind is what expresses it, because a merge and a grouping are the two
 * operations under the names the user knows them by.
 *
 * A column is named after the field it reads, so the dialog checks fields rather than filling in a
 * name: the checked set opens as the projection currently is, and `add` carries the difference — the
 * fields checked since, and the codes of the columns unchecked since. Only fields the lists actually
 * show take part in that difference, so a column of a source that is not on screen is never dropped.
 *
 * A kind that would silently discard state the dialog has nowhere to keep — the second source and its
 * columns, the totals of a grouping — is offered locked, saying what to clear and where.
 *
 * Teleported to `body` so the overlay dims the whole editor.
 */
// @vue/component
export const AddParameterDialog = {
	name: 'BizprocDataViewAddParameterDialog',
	components: {
		SourceSelector,
		Checkbox: CheckboxVue.Checkbox,
	},
	emits: ['add', 'close'],
	setup(): Object
	{
		return {
			definitionStore: useDataViewDefinitionStore(),
			metaStore: useDataViewMetaStore(),
			checkboxSize: CheckboxSize.Sm,
		};
	},
	data(): Object
	{
		dialogUidSeq += 1;

		return {
			uid: `bizproc-dataview-add-${dialogUidSeq}`,
			mode: OPERATION_TYPE[this.definitionStore.operation] ?? PARAMETER_TYPE.SIMPLE,
			fieldsByAlias: {},
			isLoadingFields: false,
			search: '',
			appliedSearch: '',
			fieldsLimits: {},
			checked: {},
			constantRef: '',
		};
	},
	computed: {
		operation(): string
		{
			return this.definitionStore.operation;
		},
		isAggregate(): boolean
		{
			return this.operation === OPERATION.AGGREGATE;
		},
		isMergeBuilder(): boolean
		{
			return this.mode === PARAMETER_TYPE.MERGE;
		},
		isConstant(): boolean
		{
			return this.mode === PARAMETER_TYPE.CONSTANT;
		},
		/** The kind the dialog is on, which the table becomes only once the dialog is saved. */
		isAggregateBuilder(): boolean
		{
			return this.mode === PARAMETER_TYPE.AGGREGATE;
		},
		/** A plain field reads one source, so it is refused while the second one is still picked. */
		canSimple(): boolean
		{
			return this.sourceByAlias(SOURCE_ALIAS.SECOND) === null;
		},
		/**
		 * A merge is refused only while it would throw away a grouping the user has actually set up:
		 * on a table that groups nothing yet, picking it is how the operation is switched back.
		 */
		canMerge(): boolean
		{
			if (!this.isAggregate)
			{
				return true;
			}

			const { groupBy, functions } = this.definitionStore.aggregate;

			return groupBy.length === 0 && functions.length === 0;
		},
		/** A grouping reads one source, so it is refused while the second one is still picked. */
		canAggregate(): boolean
		{
			return this.isAggregate || this.sourceByAlias(SOURCE_ALIAS.SECOND) === null;
		},
		typeCards(): Array<Object>
		{
			return [
				{
					type: PARAMETER_TYPE.SIMPLE,
					title: Loc.getMessage('BIZPROC_JS_DATAVIEW_ADD_TYPE_SIMPLE_TITLE'),
					text: Loc.getMessage('BIZPROC_JS_DATAVIEW_ADD_TYPE_SIMPLE_TEXT'),
					locked: !this.canSimple,
					note: Loc.getMessage('BIZPROC_JS_DATAVIEW_ADD_TYPE_SIMPLE_LOCKED'),
				},
				{
					type: PARAMETER_TYPE.MERGE,
					title: Loc.getMessage('BIZPROC_JS_DATAVIEW_ADD_TYPE_MERGE_TITLE'),
					text: Loc.getMessage('BIZPROC_JS_DATAVIEW_ADD_TYPE_MERGE_TEXT'),
					locked: !this.canMerge,
					note: Loc.getMessage('BIZPROC_JS_DATAVIEW_ADD_TYPE_MERGE_LOCKED'),
				},
				{
					type: PARAMETER_TYPE.AGGREGATE,
					title: Loc.getMessage('BIZPROC_JS_DATAVIEW_ADD_TYPE_AGGREGATE_TITLE'),
					text: Loc.getMessage('BIZPROC_JS_DATAVIEW_ADD_TYPE_AGGREGATE_TEXT'),
					locked: !this.canAggregate,
					note: Loc.getMessage('BIZPROC_JS_DATAVIEW_ADD_TYPE_AGGREGATE_LOCKED'),
				},
				{
					type: PARAMETER_TYPE.CONSTANT,
					title: Loc.getMessage('BIZPROC_JS_DATAVIEW_ADD_TYPE_CONSTANT_TITLE'),
					text: Loc.getMessage('BIZPROC_JS_DATAVIEW_ADD_TYPE_CONSTANT_TEXT'),
					locked: false,
					note: '',
				},
			];
		},
		lockedCards(): Array<Object>
		{
			return this.typeCards.filter((card) => card.locked);
		},
		/** Ids of the locked-kind notes currently rendered — links the cards to their explanation. */
		typeDescribedBy(): string
		{
			return this.lockedCards.map((card) => `${this.uid}-type-${card.type}-locked`).join(' ');
		},
		leadingAlias(): string
		{
			return SOURCE_ALIAS.LEADING;
		},
		secondAlias(): string
		{
			return SOURCE_ALIAS.SECOND;
		},
		/** Aliases the picked kind asks for: a merge combines two sources, any other kind reads one. */
		aliases(): Array<string>
		{
			return this.isMergeBuilder ? [...SOURCE_ALIASES] : [SOURCE_ALIAS.LEADING];
		},
		/** The picked sources, in alias order — the field lists follow it. */
		pickedSources(): Array<Object>
		{
			return this.aliases
				.map((alias) => this.sourceByAlias(alias))
				.filter((source) => source !== null)
			;
		},
		/** Changes whenever a source is picked, replaced or removed — the field lists then catch up. */
		sourcesKey(): string
		{
			return JSON.stringify(this.pickedSources);
		},
		hasSources(): boolean
		{
			return this.pickedSources.length > 0;
		},
		bothChosen(): boolean
		{
			return this.sourceByAlias(SOURCE_ALIAS.LEADING) !== null
				&& this.sourceByAlias(SOURCE_ALIAS.SECOND) !== null;
		},
		/** A merge needs both sources before there is anything to check; any other kind needs one. */
		showFields(): boolean
		{
			return this.isMergeBuilder ? this.bothChosen : this.hasSources;
		},
		/** One list per picked source: the merge shows two side by side, any other kind shows one. */
		fieldGroups(): Array<Object>
		{
			return this.pickedSources.map((source) => ({
				alias: source.alias,
				title: this.sourceTitle(source.alias),
				fields: this.fieldsByAlias[source.alias] ?? [],
			}));
		},
		normalizedSearch(): string
		{
			return this.appliedSearch.trim().toLowerCase();
		},
		/** Rows of every list as the user sees them: the key on top, the rest filtered by the search. */
		visibleRowsByAlias(): Map<string, Array<Object>>
		{
			return new Map(this.fieldGroups.map((group) => [
				group.alias,
				group.fields
					.filter((field) => matchesSearch(field, this.normalizedSearch))
					.map((field) => ({
						field,
						ref: this.fieldRefOf(group.alias, field.code),
						isKey: this.isKeyField(group.alias, field.code),
					})),
			]));
		},
		/** Refs the group toggle owns: every row the search leaves but the join key, rendered or not. */
		checkableRefsByAlias(): Map<string, Array<string>>
		{
			return new Map(
				[...this.visibleRowsByAlias].map(([alias, rows]) => [
					alias,
					rows.filter((row) => !row.isKey).map((row) => row.ref),
				]),
			);
		},
		/** Every field the lists offer as a column, search aside: the model the difference is taken on. */
		listedRows(): Array<Object>
		{
			const rows = [];
			this.fieldGroups.forEach((group) => {
				group.fields.forEach((field) => {
					if (this.isKeyField(group.alias, field.code))
					{
						return;
					}

					rows.push({
						alias: group.alias,
						field,
						ref: this.fieldRefOf(group.alias, field.code),
					});
				});
			});

			return rows;
		},
		/** Code of every projected column, by the field it reads. */
		projectedCodes(): Map<string, string>
		{
			return new Map(
				this.definitionStore.columns
					.filter((column) => Type.isStringFilled(column.source))
					.map((column) => [column.source, column.code]),
			);
		},
		/** What saving would change: the fields checked since the dialog opened, and the ones unchecked. */
		diff(): Object
		{
			const columns = [];
			const removedCodes = [];

			this.listedRows.forEach((row) => {
				const code = this.projectedCodes.get(row.ref);
				if (this.isChecked(row.ref))
				{
					if (code === undefined)
					{
						columns.push({ alias: row.alias, field: row.field, title: row.field.name });
					}
				}
				else if (code !== undefined)
				{
					removedCodes.push(code);
				}
			});

			return { columns, removedCodes };
		},
		changesCount(): number
		{
			return this.diff.columns.length + this.diff.removedCodes.length;
		},
		leftFields(): Array<Object>
		{
			return this.fieldsByAlias[SOURCE_ALIAS.LEADING] ?? [];
		},
		rightFields(): Array<Object>
		{
			return this.fieldsByAlias[SOURCE_ALIAS.SECOND] ?? [];
		},
		/**
		 * Only fields the backend accepts as a join key are offered in the key selects: a non-joinable,
		 * multiple or non-indexed field would be rejected by KeyNotJoinableException/KeyNotIndexedException.
		 * The checkbox lists stay full — the restriction is on keys, not on projected columns.
		 */
		leftKeyFields(): Array<Object>
		{
			return this.leftFields.filter((field) => field.joinable && field.indexed);
		},
		rightKeyFields(): Array<Object>
		{
			return this.rightFields.filter((field) => field.joinable && field.indexed);
		},
		/**
		 * The join key of each side. It is a field of the definition, not of this dialog: the source
		 * picker above suggests it as soon as a linked pair is picked, and the selects below show and
		 * replace that very key.
		 */
		leftKey: {
			get(): string
			{
				return this.definitionStore.join.leftField;
			},
			set(leftField: string): void
			{
				this.definitionStore.setJoin({ ...this.definitionStore.join, leftField });
			},
		},
		rightKey: {
			get(): string
			{
				return this.definitionStore.join.rightField;
			},
			set(rightField: string): void
			{
				this.definitionStore.setJoin({ ...this.definitionStore.join, rightField });
			},
		},
		hasJoinKeys(): boolean
		{
			return Type.isStringFilled(this.leftKey) && Type.isStringFilled(this.rightKey);
		},
		selectedConstant(): ?Object
		{
			return this.metaStore.stampConstants.find((constant) => sourceKey(constant) === this.constantRef) ?? null;
		},
		usedStampKeys(): Set<string>
		{
			return new Set(
				this.definitionStore.columns
					.filter((column) => column.kind === 'constant')
					.map((column) => sourceKey(column.constant)),
			);
		},
		constantPlaceholder(): string
		{
			if (this.metaStore.isLoadingStampConstants)
			{
				return Loc.getMessage('BIZPROC_JS_DATAVIEW_ADD_CONSTANT_LOADING');
			}

			return Loc.getMessage(
				this.metaStore.hasStampConstants
					? 'BIZPROC_JS_DATAVIEW_ADD_CONSTANT_PLACEHOLDER'
					: 'BIZPROC_JS_DATAVIEW_ADD_CONSTANT_EMPTY',
			);
		},
		stubTitle(): string
		{
			return Loc.getMessage(
				this.isMergeBuilder
					? 'BIZPROC_JS_DATAVIEW_FIELDS_STUB_TITLE_MERGE'
					: 'BIZPROC_JS_DATAVIEW_FIELDS_STUB_TITLE_SIMPLE',
			);
		},
		canSubmit(): boolean
		{
			if (this.isConstant)
			{
				return this.selectedConstant !== null && !this.usedStampKeys.has(this.constantRef);
			}

			return this.isMergeBuilder ? this.bothChosen && this.hasJoinKeys : this.hasSources;
		},
		/** Says what saving would do, or what is still missing before it can do anything. */
		footerNote(): string
		{
			if (this.isConstant)
			{
				return '';
			}

			if (this.isMergeBuilder && !this.bothChosen)
			{
				return Loc.getMessage('BIZPROC_JS_DATAVIEW_MERGE_PICK_BOTH');
			}

			if (this.changesCount === 0)
			{
				return Loc.getMessage('BIZPROC_JS_DATAVIEW_CHANGES_NONE');
			}

			return Loc.getMessagePlural('BIZPROC_JS_DATAVIEW_CHANGES_COUNT', this.changesCount, {
				'#COUNT#': String(this.changesCount),
			});
		},
		sourcesError(): string
		{
			return this.definitionStore.validationErrors.sources?.message ?? '';
		},
		joinError(): string
		{
			return this.definitionStore.validationErrors.joinKeys?.message ?? '';
		},
	},
	watch: {
		operation(operation: string): void
		{
			if (operation !== OPERATION.JOIN && this.mode === PARAMETER_TYPE.MERGE)
			{
				this.mode = OPERATION_TYPE[operation] ?? PARAMETER_TYPE.SIMPLE;
			}
		},
		sourcesKey(): void
		{
			this.search = '';
			this.appliedSearch = '';
			this.fieldsLimits = {};
			this.syncChecked();
			this.reloadFields();
		},
		search(value: string): void
		{
			this.applySearch(value);
		},
	},
	created(): void
	{
		this.fieldsFetchId = 0;
		this.applySearch = Runtime.debounce((value: string) => {
			this.appliedSearch = value;
			this.fieldsLimits = {};
		}, SEARCH_DEBOUNCE_MS, this);

		this.syncChecked();
		this.reloadFields();
	},
	mounted(): void
	{
		Event.bind(document, 'keydown', this.onKeydown);

		this.zIndexComponent = ZIndexManager.register(this.$refs.overlay);

		this.focusTrap = new FocusTrap(this.$refs.window, {
			initialFocus: 'first-tabbable',
			restoreFocus: true,
		});
		this.focusTrap.activate();
	},
	beforeUnmount(): void
	{
		Event.unbind(document, 'keydown', this.onKeydown);

		if (this.zIndexComponent)
		{
			ZIndexManager.unregister(this.$refs.overlay);
			this.zIndexComponent = null;
		}

		if (this.focusTrap)
		{
			this.focusTrap.deactivate();
			this.focusTrap.destroy();
			this.focusTrap = null;
		}
	},
	methods: {
		onKeydown(event: KeyboardEvent): void
		{
			if (event.key === 'Escape')
			{
				this.cancel();
			}
		},
		sourceByAlias(alias: string): ?Object
		{
			return this.definitionStore.sources.find((source) => source.alias === alias) ?? null;
		},
		sourceTitle(alias: string): string
		{
			return sourceDescriptorTitle(resolveSourceDescriptor(this.metaStore, this.sourceByAlias(alias)));
		},
		/**
		 * Picking a kind says what the dialog is about to do — it is saving that commits the table to the
		 * operation behind it, so a kind picked by mistake costs nothing but a Cancel. A locked card is
		 * refused outright: it is offered as aria-disabled rather than disabled so its explanation stays
		 * reachable, which leaves the guard as the rule of the dialog.
		 */
		setType(type: string): void
		{
			if (type === PARAMETER_TYPE.SIMPLE && !this.canSimple)
			{
				return;
			}

			if (type === PARAMETER_TYPE.MERGE && !this.canMerge)
			{
				return;
			}

			if (type === PARAMETER_TYPE.AGGREGATE && !this.canAggregate)
			{
				return;
			}

			this.mode = type;

			if (
				type === PARAMETER_TYPE.CONSTANT
				&& !this.metaStore.isLoadingStampConstants
				&& !this.metaStore.hasLoadedStampConstants
			)
			{
				this.metaStore.loadStampConstants(this.definitionStore.templateId);
			}
		},
		/** The operation the picked kind stands for; a plain field and a constant name none of their own. */
		commitOperation(): void
		{
			const operation = TYPE_OPERATION[this.mode];
			if (Type.isStringFilled(operation))
			{
				this.setOperation(operation);
			}
		},
		/**
		 * An aggregate reads one source, so nothing of the second one survives the switch. {@see canAggregate}
		 * refuses the switch while that source is still picked, which leaves this to hold the invariant for
		 * the references a picked source no longer accounts for — the columns and keys of a stored
		 * definition that names an alias its sources never had.
		 */
		setOperation(operation: string): void
		{
			if (operation === this.operation)
			{
				return;
			}

			if (operation === OPERATION.AGGREGATE)
			{
				this.dropSecondSource();
			}

			this.definitionStore.setOperation(operation);
		},
		/**
		 * Everything the second source backs: the columns that read it and the keys picked against its
		 * fields. A stamp carries a constant rather than a source value, so it stays.
		 */
		dropSecondSource(): void
		{
			this.definitionStore.setSources(
				this.definitionStore.sources.filter((source) => source.alias === SOURCE_ALIAS.LEADING),
			);
			this.definitionStore.setColumns(
				this.definitionStore.columns.filter(
					(column) => (
						column.kind === 'constant'
						|| splitSource(column.source).alias === SOURCE_ALIAS.LEADING
					),
				),
			);
			this.definitionStore.setJoin({ leftField: '', rightField: '' });
		},
		/**
		 * Leaving the dialog takes back what only the dialog asked for. The second source is picked while
		 * the merge is being built, and a definition that never committed to a join has nowhere to keep it.
		 * It is left alone once the merge is saved, because by then the join owns it.
		 */
		releaseUncommittedSource(): void
		{
			if (this.operation !== OPERATION.JOIN && this.sourceByAlias(SOURCE_ALIAS.SECOND) !== null)
			{
				this.dropSecondSource();
			}
		},
		cancel(): void
		{
			this.releaseUncommittedSource();

			this.$emit('close');
		},
		/** Fields of every picked source, in the shape the lists render. */
		async reloadFields(): Promise<void>
		{
			const fetchId = ++this.fieldsFetchId;
			const sources = this.pickedSources;
			if (sources.length === 0)
			{
				this.fieldsByAlias = {};
				this.isLoadingFields = false;

				return;
			}

			this.isLoadingFields = true;
			// A source of the edited template describes itself only under that template (API-07); the
			// context is read from the definition rather than kept here, so it can never go stale.
			const { templateId } = this.definitionStore;
			const schemas = await Promise.all(
				sources.map((source) => this.metaStore.loadSchema(source, templateId)),
			);
			if (this.fieldsFetchId !== fetchId)
			{
				return;
			}

			this.fieldsByAlias = Object.fromEntries(
				sources.map((source, index) => [source.alias, mapFields(schemas[index])]),
			);
			this.isLoadingFields = false;
		},
		/** The dialog opens on the projection as it is: what the table already shows is checked. */
		syncChecked(): void
		{
			this.checked = Object.fromEntries(
				this.definitionStore.columns
					.filter((column) => Type.isStringFilled(column.source))
					.map((column) => [column.source, true]),
			);
		},
		fieldRefOf(alias: string, code: string): string
		{
			return `${alias}.${code}`;
		},
		fieldInputId(ref: string): string
		{
			return `${this.uid}-field-${ref}`;
		},
		stampKey(constant: Object): string
		{
			return sourceKey(constant);
		},
		joinKeyOf(alias: string): string
		{
			return alias === SOURCE_ALIAS.SECOND ? this.rightKey : this.leftKey;
		},
		/** The join key is what the sources are matched on, not a column: it is shown, never checked. */
		isKeyField(alias: string, code: string): boolean
		{
			return this.isMergeBuilder && code === this.joinKeyOf(alias);
		},
		isChecked(ref: string): boolean
		{
			return Boolean(this.checked[ref]);
		},
		toggleField(ref: string): void
		{
			this.checked = { ...this.checked, [ref]: !this.checked[ref] };
		},
		visibleRows(group: Object): Array<Object>
		{
			return this.visibleRowsByAlias.get(group.alias) ?? [];
		},
		rowsLimit(alias: string): number
		{
			return this.fieldsLimits[alias] ?? FIELD_ROWS_PAGE;
		},
		/** The rows on screen: a page of them at a time, so a schema of hundreds costs a page of rows. */
		renderedRows(group: Object): Array<Object>
		{
			return this.visibleRows(group).slice(0, this.rowsLimit(group.alias));
		},
		hiddenRowsCount(group: Object): number
		{
			return Math.max(this.visibleRows(group).length - this.rowsLimit(group.alias), 0);
		},
		moreRowsLabel(group: Object): string
		{
			const count = this.hiddenRowsCount(group);

			return Loc.getMessagePlural('BIZPROC_JS_DATAVIEW_FIELDS_MORE', count, {
				'#COUNT#': String(count),
			});
		},
		showMoreRows(group: Object): void
		{
			this.fieldsLimits = {
				...this.fieldsLimits,
				[group.alias]: this.rowsLimit(group.alias) + FIELD_ROWS_PAGE,
			};
		},
		checkableRefs(group: Object): Array<string>
		{
			return this.checkableRefsByAlias.get(group.alias) ?? [];
		},
		isGroupChecked(group: Object): boolean
		{
			const refs = this.checkableRefs(group);

			return refs.length > 0 && refs.every((ref) => this.isChecked(ref));
		},
		groupToggleLabel(group: Object): string
		{
			return Loc.getMessage(
				this.isGroupChecked(group)
					? 'BIZPROC_JS_DATAVIEW_FIELDS_CLEAR_ALL'
					: 'BIZPROC_JS_DATAVIEW_FIELDS_SELECT_ALL',
			);
		},
		toggleGroup(group: Object): void
		{
			const value = !this.isGroupChecked(group);
			const next = { ...this.checked };
			this.checkableRefs(group).forEach((ref) => {
				next[ref] = value;
			});
			this.checked = next;
		},
		onSubmit(): void
		{
			if (!this.canSubmit)
			{
				return;
			}

			this.commitOperation();
			this.releaseUncommittedSource();

			if (this.isConstant)
			{
				const constant = this.selectedConstant;
				if (constant === null)
				{
					return;
				}

				this.$emit('add', {
					columns: [{ kind: 'constant', constant, title: constant.title }],
					removedCodes: [],
				});

				return;
			}

			this.$emit('add', this.diff);
		},
	},
	template: `
		<Teleport to="body">
			<div ref="overlay" class="bizproc-dataview-modal" @click.self="cancel">
				<div
					ref="window"
					class="bizproc-dataview-modal__window"
					:class="{ '--wide': isMergeBuilder }"
					role="dialog"
					aria-modal="true"
					:aria-labelledby="uid + '-title'"
					data-test-id="bizproc-dataview__add-dialog"
				>
					<div class="bizproc-dataview-modal__header">
						<div class="bizproc-dataview-modal__title" :id="uid + '-title'">
							{{ $Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_ADD_DIALOG_TITLE') }}
						</div>
						<button
							type="button"
							class="bizproc-dataview-modal__close"
							:aria-label="$Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_CANCEL')"
							data-test-id="bizproc-dataview__add-dialog-close"
							@click="cancel"
						><span aria-hidden="true">&times;</span></button>
					</div>
					<div class="bizproc-dataview-modal__body">
						<p
							v-if="isAggregateBuilder"
							class="bizproc-dataview__intro --tight"
							data-test-id="bizproc-dataview__add-aggregate-hint"
						>{{ $Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_ADD_AGGREGATE_HINT') }}</p>
						<div class="bizproc-dataview-modal__block">
							<span class="bizproc-dataview__caption" :id="uid + '-type-caption'">
								{{ $Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_ADD_TYPE_CAPTION') }}
							</span>
							<div
								class="bizproc-dataview-types"
								role="group"
								:aria-labelledby="uid + '-type-caption'"
								:aria-describedby="typeDescribedBy || null"
								data-test-id="bizproc-dataview__add-type"
							>
								<button
									v-for="card in typeCards"
									:key="card.type"
									type="button"
									class="bizproc-dataview-type"
									:class="{ '--selected': mode === card.type, '--locked': card.locked }"
									:aria-pressed="mode === card.type ? 'true' : 'false'"
									:aria-disabled="card.locked ? 'true' : 'false'"
									:data-test-id="'bizproc-dataview__add-type-' + card.type"
									@click="setType(card.type)"
								>
									<span class="bizproc-dataview-type__title">{{ card.title }}</span>
									<span class="bizproc-dataview-type__text">{{ card.text }}</span>
								</button>
								<p
									v-for="card in lockedCards"
									:key="card.type"
									:id="uid + '-type-' + card.type + '-locked'"
									class="bizproc-dataview-type__locked-note"
									:data-test-id="'bizproc-dataview__add-type-' + card.type + '-locked'"
								>{{ card.note }}</p>
							</div>
						</div>

						<div v-if="!isConstant" class="bizproc-dataview-modal__block">
							<SourceSelector
								:sources-error="sourcesError"
								:join-error="joinError"
								:merging="isMergeBuilder"
							/>
						</div>

						<div v-if="isConstant" class="bizproc-dataview-modal__block">
							<label class="bizproc-dataview__caption" :for="uid + '-constant'">
								{{ $Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_ADD_CONSTANT_LABEL') }}
							</label>
							<select
								:id="uid + '-constant'"
								class="bizproc-dataview__select"
								v-model="constantRef"
								:disabled="metaStore.isLoadingStampConstants || !metaStore.hasStampConstants"
								data-test-id="bizproc-dataview__add-constant"
							>
								<option value="" disabled>{{ constantPlaceholder }}</option>
								<option
									v-for="constant in metaStore.stampConstants"
									:key="stampKey(constant)"
									:value="stampKey(constant)"
									:disabled="usedStampKeys.has(stampKey(constant))"
								>
									{{ constant.title }} · {{ constant.type }}
								</option>
							</select>
						</div>

						<template v-else>
							<div class="bizproc-dataview-modal__block">
								<div class="bizproc-dataview__caption-row">
									<span class="bizproc-dataview__caption">
										{{ $Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_FIELDS_CAPTION') }}
									</span>
									<input
										v-if="showFields"
										type="search"
										class="bizproc-dataview__input bizproc-dataview-search"
										v-model="search"
										:placeholder="$Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_FIELDS_SEARCH')"
										:aria-label="$Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_FIELDS_SEARCH')"
										data-test-id="bizproc-dataview__fields-search"
									>
								</div>
								<div v-if="showFields" class="bizproc-dataview-builder">
									<div
										v-for="group in fieldGroups"
										:key="group.alias"
										class="bizproc-dataview-builder__col"
									>
										<div class="bizproc-dataview-fields">
											<div class="bizproc-dataview-fields__head">
												<span
													class="bizproc-dataview-fields__title"
													:id="uid + '-fields-' + group.alias"
													:data-test-id="'bizproc-dataview__fields-title-' + group.alias"
												>{{ group.title }}</span>
												<button
													type="button"
													class="bizproc-dataview-fields__all"
													:data-test-id="'bizproc-dataview__fields-all-' + group.alias"
													@click="toggleGroup(group)"
												>{{ groupToggleLabel(group) }}</button>
											</div>
											<div
												class="bizproc-dataview-fields__list"
												role="group"
												:aria-labelledby="uid + '-fields-' + group.alias"
												:data-test-id="'bizproc-dataview__fields-' + group.alias"
											>
												<div
													v-for="row in renderedRows(group)"
													:key="row.field.code"
													class="bizproc-dataview-fields__row"
													:class="{ '--checked': isChecked(row.ref), '--key': row.isKey }"
												>
													<template v-if="row.isKey">
														<span class="bizproc-dataview-fields__key-tag">
															{{ $Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_MERGE_KEY_TAG') }}
														</span>
														<span class="bizproc-dataview-fields__row-name">{{ row.field.name }}</span>
													</template>
													<template v-else>
														<Checkbox
															:id="fieldInputId(row.ref)"
															:model-value="isChecked(row.ref)"
															:size="checkboxSize"
															:data-test-id="'bizproc-dataview__field-' + row.ref"
															@update:model-value="toggleField(row.ref)"
														/>
														<label
															class="bizproc-dataview-fields__row-name"
															:for="fieldInputId(row.ref)"
														>{{ row.field.name }}</label>
														<span class="bizproc-dataview-fields__row-type">{{ row.field.type }}</span>
													</template>
												</div>
												<button
													v-if="hiddenRowsCount(group) > 0"
													type="button"
													class="bizproc-dataview-fields__more"
													:data-test-id="'bizproc-dataview__fields-more-' + group.alias"
													@click="showMoreRows(group)"
												>{{ moreRowsLabel(group) }}</button>
												<div
													v-if="visibleRows(group).length === 0"
													class="bizproc-dataview-fields__empty"
												>
													{{ $Bitrix.Loc.getMessage(
														isLoadingFields
															? 'BIZPROC_JS_DATAVIEW_FIELDS_LOADING'
															: 'BIZPROC_JS_DATAVIEW_FIELDS_EMPTY'
													) }}
												</div>
											</div>
										</div>
									</div>
								</div>
								<div v-else class="bizproc-dataview-fields-stub" data-test-id="bizproc-dataview__fields-stub">
									<span class="bizproc-dataview-fields-stub__title">{{ stubTitle }}</span>
									<p class="bizproc-dataview-fields-stub__text">
										{{ $Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_FIELDS_STUB_TEXT') }}
									</p>
								</div>
							</div>

							<div v-if="isMergeBuilder" class="bizproc-dataview-modal__block">
								<div class="bizproc-dataview-keycard">
									<div class="bizproc-dataview-keycard__head">
										<span class="bizproc-dataview-keycard__title">
											{{ $Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_KEYCARD_TITLE') }}
										</span>
										<span v-if="!bothChosen" class="bizproc-dataview-keycard__badge">
											{{ $Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_KEYCARD_BADGE') }}
										</span>
									</div>
									<div class="bizproc-dataview-keycard__row">
										<select
											class="bizproc-dataview__select"
											v-model="leftKey"
											:disabled="!bothChosen"
											:aria-label="sourceTitle(leadingAlias) || $Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_SOURCE_LABEL_LEADING')"
											data-test-id="bizproc-dataview__merge-key-left"
										>
											<option value="" disabled>
												{{ $Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_MERGE_KEY_PLACEHOLDER') }}
											</option>
											<option v-for="field in leftKeyFields" :key="field.code" :value="field.code">
												{{ field.name }}
											</option>
										</select>
										<span class="bizproc-dataview-keycard__eq" aria-hidden="true">=</span>
										<select
											class="bizproc-dataview__select"
											v-model="rightKey"
											:disabled="!bothChosen"
											:aria-label="sourceTitle(secondAlias) || $Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_SOURCE_LABEL_SECOND')"
											data-test-id="bizproc-dataview__merge-key-right"
										>
											<option value="" disabled>
												{{ $Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_MERGE_KEY_PLACEHOLDER') }}
											</option>
											<option v-for="field in rightKeyFields" :key="field.code" :value="field.code">
												{{ field.name }}
											</option>
										</select>
									</div>
									<p class="bizproc-dataview-keycard__hint">
										{{ $Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_KEYCARD_HINT') }}
									</p>
								</div>
							</div>
						</template>
					</div>
					<div class="bizproc-dataview-modal__footer">
						<span class="bizproc-dataview-modal__footer-note" data-test-id="bizproc-dataview__changes-note">
							{{ footerNote }}
						</span>
						<button
							type="button"
							class="bizproc-dataview-btn --ghost"
							data-test-id="bizproc-dataview__add-cancel"
							@click="cancel"
						>
							{{ $Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_CANCEL') }}
						</button>
						<button
							type="button"
							class="bizproc-dataview-btn --primary"
							:disabled="!canSubmit"
							data-test-id="bizproc-dataview__add-submit"
							@click="onSubmit"
						>{{ $Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_SAVE_BUTTON') }}</button>
					</div>
				</div>
			</div>
		</Teleport>
	`,
};
