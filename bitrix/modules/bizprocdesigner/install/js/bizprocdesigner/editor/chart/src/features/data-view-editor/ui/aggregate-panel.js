import { Loc } from 'main.core';
import { AGGREGATE_FUNCTION, OPERATION, generateColumnCode } from 'bizproc.dataview';

import { focusFirstAvailable } from '../../../shared/utils';
import { useDataViewDefinitionStore } from '../stores/definition-store';
import { findColumnSchemaField, sourceKey, useDataViewMetaStore } from '../stores/meta-store';

const AGGREGATE_FUNCTIONS = Object.freeze(Object.values(AGGREGATE_FUNCTION));

/** Functions computed over a number only, and the field types that are one (FieldType::INT/DOUBLE). */
const NUMERIC_FUNCTIONS = Object.freeze([AGGREGATE_FUNCTION.SUM, AGGREGATE_FUNCTION.AVG]);
const NUMERIC_COLUMN_TYPES = Object.freeze(['int', 'double']);

/**
 * The aggregate side of the editor: the columns a row is grouped by and the functions computed over
 * the rest. It only shows while the definition aggregates — the switch that says so is picked in
 * {@see AddParameterDialog}, next to the sources the operation decides the count of.
 */
// @vue/component
export const AggregatePanel = {
	name: 'BizprocDataViewAggregatePanel',
	props: {
		/** Localized validation message the backend addressed to `aggregate`, or '' when there is none. */
		aggregateError: {
			type: String,
			default: '',
		},
	},
	setup(): Object
	{
		return {
			definitionStore: useDataViewDefinitionStore(),
			metaStore: useDataViewMetaStore(),
		};
	},
	data(): Object
	{
		return {
			functions: AGGREGATE_FUNCTIONS,
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
		columns(): Array<Object>
		{
			return this.definitionStore.columns;
		},
		sourceColumns(): Array<Object>
		{
			return this.columns.filter((column) => column.kind !== 'constant' && Boolean(column.source));
		},
		/** Codes of the columns still in the projection — the only ones an aggregate may refer to. */
		columnCodes(): Array<string>
		{
			return this.sourceColumns.map((column) => column.code);
		},
		allColumnCodes(): Array<string>
		{
			return this.columns.map((column) => column.code);
		},
		groupBy(): Array<string>
		{
			return this.definitionStore.aggregate.groupBy;
		},
		aggregateFunctions(): Array<Object>
		{
			return this.definitionStore.aggregate.functions;
		},
		/** Changes whenever the definition replaces a source — the schemas behind it then catch up. */
		sourcesKey(): string
		{
			return this.definitionStore.sources.map((source) => sourceKey(source)).join('|');
		},
		/** Schema field every projected column reads, by code; null while its schema is on its way. */
		schemaFieldByCode(): Map<string, ?Object>
		{
			return new Map(this.sourceColumns.map((column) => [
				column.code,
				findColumnSchemaField(this.metaStore, this.definitionStore.sources, column.source),
			]));
		},
	},
	watch: {
		columnCodes: {
			immediate: true,
			handler(): void
			{
				this.pruneAggregate();
			},
		},
		sourcesKey: {
			immediate: true,
			handler(): void
			{
				this.loadSchemas();
			},
		},
	},
	methods: {
		/**
		 * The types the totals are offered by come from the schema of each source. A definition opened
		 * for editing carries sources nobody picked in this session, so the panel asks for their schemas
		 * itself; the store answers a cached one without a request ({@see loadSchema}).
		 */
		loadSchemas(): void
		{
			const { sources, templateId } = this.definitionStore;
			sources.forEach((source) => {
				void this.metaStore.loadSchema(source, templateId);
			});
		},
		columnTitle(code: string): string
		{
			return this.columns.find((column) => column.code === code)?.title ?? code;
		},
		functionLabel(fn: string): string
		{
			return Loc.getMessage(`BIZPROC_JS_DATAVIEW_AGGREGATE_FN_${fn}`);
		},
		isGrouped(code: string): boolean
		{
			return this.groupBy.includes(code);
		},
		toggleGroupBy(code: string): void
		{
			const groupBy = this.isGrouped(code)
				? this.groupBy.filter((item) => item !== code)
				: [...this.groupBy, code];

			this.definitionStore.setAggregate({ groupBy, functions: this.aggregateFunctions });
		},
		/** Result codes share one namespace with the projected columns — {@see ColumnResolver}. */
		usedCodes(): Array<string>
		{
			return [...this.allColumnCodes, ...this.aggregateFunctions.map((fn) => fn.code)];
		},
		/**
		 * Whether the backend would compute the function over that column — the client side of
		 * {@see ColumnResolver::assertFunctionApplicable}: a sum and an average read a numeric field,
		 * every other function a joinable one. A column whose schema has not arrived yet is offered as
		 * it is; refusing it here would hide a valid pair, and the backend stays the check either way.
		 */
		isFunctionApplicable(fn: string, code: string): boolean
		{
			const field = this.schemaFieldByCode.get(code) ?? null;
			if (field === null)
			{
				return true;
			}

			return NUMERIC_FUNCTIONS.includes(fn)
				? NUMERIC_COLUMN_TYPES.includes(field.type)
				: field.joinable !== false;
		},
		/** Columns a total may be computed over: the ones its function takes, plus the one it reads now. */
		columnOptions(item: Object): Array<Object>
		{
			return this.sourceColumns.filter(
				(column) => column.code === item.column || this.isFunctionApplicable(item.fn, column.code),
			);
		},
		/**
		 * What a new total starts as. A sum over a number is what the section is asked for most, and a
		 * count — which any joinable column takes — is what is left when the projection holds no number.
		 * Grouped columns come last: a total over one repeats the value its group is already keyed by.
		 */
		defaultFunctionTarget(): Object
		{
			const codes = [
				...this.columnCodes.filter((code) => !this.isGrouped(code)),
				...this.columnCodes.filter((code) => this.isGrouped(code)),
			];
			const summable = codes.find((code) => this.isFunctionApplicable(AGGREGATE_FUNCTION.SUM, code));
			if (summable !== undefined)
			{
				return { fn: AGGREGATE_FUNCTION.SUM, column: summable };
			}

			const countable = codes.find((code) => this.isFunctionApplicable(AGGREGATE_FUNCTION.COUNT, code));

			return { fn: AGGREGATE_FUNCTION.COUNT, column: countable ?? codes[0] ?? '' };
		},
		addFunction(): void
		{
			const { fn, column } = this.defaultFunctionTarget();
			const code = generateColumnCode(`${fn}_${column}`, this.usedCodes());

			this.setFunctions([
				...this.aggregateFunctions,
				{ column, fn, code, title: this.defaultFunctionTitle(fn, column) },
			]);
		},
		/**
		 * The row goes away with the button that removed it: the focus moves to the row that took its
		 * place, and to the button that adds a new one when the last row is gone.
		 */
		removeFunction(index: number): void
		{
			this.setFunctions(this.aggregateFunctions.filter((item, itemIndex) => itemIndex !== index));
			this.$nextTick(() => {
				const buttons = this.$refs.functionRemoveButtons ?? [];
				focusFirstAvailable(buttons[index], buttons.at(-1), this.$refs.addFunctionButton);
			});
		},
		defaultFunctionTitle(fn: string, column: string): string
		{
			return `${fn}(${this.columnTitle(column)})`;
		},
		updateFunction(index: number, patch: Object): void
		{
			this.setFunctions(this.aggregateFunctions.map((item, itemIndex) => (
				itemIndex === index ? { ...item, ...patch } : item
			)));
		},
		onFunctionColumnChange(index: number, column: string): void
		{
			const item = this.aggregateFunctions[index];
			const patch: Object = { column };
			if (item.title === this.defaultFunctionTitle(item.fn, item.column))
			{
				patch.title = this.defaultFunctionTitle(item.fn, column);
			}

			this.updateFunction(index, patch);
		},
		/** A function the current column is out of reach for takes the first column it does reach. */
		onFunctionKindChange(index: number, fn: string): void
		{
			const item = this.aggregateFunctions[index];
			const column = this.isFunctionApplicable(fn, item.column)
				? item.column
				: (this.sourceColumns.find((source) => this.isFunctionApplicable(fn, source.code))?.code ?? item.column);
			const patch: Object = { fn, column };
			if (item.title === this.defaultFunctionTitle(item.fn, item.column))
			{
				patch.title = this.defaultFunctionTitle(fn, column);
			}

			this.updateFunction(index, patch);
		},
		onFunctionTitleChange(index: number, title: string): void
		{
			this.updateFunction(index, { title });
		},
		setFunctions(functions: Array<Object>): void
		{
			this.definitionStore.setAggregate({ groupBy: this.groupBy, functions });
		},
		/**
		 * Holds the grouping and the totals within the columns the projection still has: a reference to
		 * a column that is gone is serialized as it stands and resolves to nothing ({@see buildDefinition}).
		 */
		pruneAggregate(): void
		{
			const known = new Set(this.columnCodes);
			const groupBy = this.groupBy.filter((code) => known.has(code));
			const functions = this.aggregateFunctions.filter((fn) => known.has(fn.column));
			if (groupBy.length === this.groupBy.length && functions.length === this.aggregateFunctions.length)
			{
				return;
			}

			this.definitionStore.setAggregate({ groupBy, functions });
		},
	},
	template: `
		<div class="bizproc-dataview-aggregate" data-test-id="bizproc-dataview__aggregate">
			<template v-if="isAggregate">
				<div class="bizproc-dataview-section">
					<div class="bizproc-dataview-section__title" data-test-id="bizproc-dataview__aggregate-title">
						{{ $Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_AGGREGATE_SECTION') }}
					</div>
				</div>
				<p class="bizproc-dataview__intro">
					{{ $Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_AGGREGATE_SECTION_HINT') }}
				</p>

				<div class="bizproc-dataview__field">
					<label class="bizproc-dataview__field-label">
						{{ $Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_AGGREGATE_GROUP_BY_LABEL') }}
					</label>
					<p
						v-if="sourceColumns.length === 0"
						class="bizproc-dataview__intro"
						data-test-id="bizproc-dataview__aggregate-empty"
					>{{ $Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_AGGREGATE_NEEDS_COLUMNS') }}</p>
					<div
						v-else
						class="bizproc-dataview-aggregate__group"
						role="group"
						:aria-label="$Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_AGGREGATE_GROUP_BY_LABEL')"
					>
						<label
							v-for="column in sourceColumns"
							:key="column.code"
							class="bizproc-dataview-aggregate__group-item"
							:class="{ '--checked': isGrouped(column.code) }"
						>
							<input
								type="checkbox"
								:checked="isGrouped(column.code)"
								:data-test-id="'bizproc-dataview__aggregate-group-' + column.code"
								@change="toggleGroupBy(column.code)"
							>
							<span>{{ column.title }}</span>
						</label>
					</div>
				</div>

				<div class="bizproc-dataview__field">
					<label class="bizproc-dataview__field-label">
						{{ $Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_AGGREGATE_FUNCTIONS_LABEL') }}
					</label>
					<div
						v-for="(item, index) in aggregateFunctions"
						:key="item.code"
						class="bizproc-dataview-aggregate__fn"
						:data-test-id="'bizproc-dataview__aggregate-fn-' + item.code"
					>
						<select
							class="bizproc-dataview__select"
							:value="item.fn"
							:aria-label="$Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_AGGREGATE_FUNCTIONS_LABEL')"
							:data-test-id="'bizproc-dataview__aggregate-fn-kind-' + item.code"
							@change="onFunctionKindChange(index, $event.target.value)"
						>
							<option v-for="fn in functions" :key="fn" :value="fn">{{ functionLabel(fn) }}</option>
						</select>
						<select
							class="bizproc-dataview__select"
							:value="item.column"
							:aria-label="$Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_AGGREGATE_COLUMN_LABEL')"
							:data-test-id="'bizproc-dataview__aggregate-fn-column-' + item.code"
							@change="onFunctionColumnChange(index, $event.target.value)"
						>
							<option v-for="column in columnOptions(item)" :key="column.code" :value="column.code">
								{{ column.title }}
							</option>
						</select>
						<input
							type="text"
							class="bizproc-dataview__input"
							:value="item.title"
							:aria-label="$Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_AGGREGATE_TITLE_LABEL')"
							:placeholder="$Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_AGGREGATE_TITLE_LABEL')"
							:data-test-id="'bizproc-dataview__aggregate-fn-title-' + item.code"
							@input="onFunctionTitleChange(index, $event.target.value)"
						>
						<button
							ref="functionRemoveButtons"
							type="button"
							class="bizproc-dataview-aggregate__fn-remove"
							:aria-label="$Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_AGGREGATE_FN_REMOVE')"
							:data-test-id="'bizproc-dataview__aggregate-fn-remove-' + item.code"
							@click="removeFunction(index)"
						><span aria-hidden="true">&times;</span></button>
					</div>
					<button
						ref="addFunctionButton"
						type="button"
						class="bizproc-dataview-btn --ghost"
						:disabled="sourceColumns.length === 0"
						data-test-id="bizproc-dataview__aggregate-fn-add"
						@click="addFunction"
					>
						<span aria-hidden="true">＋</span>
						{{ $Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_AGGREGATE_FN_ADD') }}
					</button>
				</div>

				<p
					v-if="aggregateError !== ''"
					class="bizproc-dataview__error"
					role="alert"
					data-test-id="bizproc-dataview__aggregate-error"
				>{{ aggregateError }}</p>
			</template>
		</div>
	`,
};
