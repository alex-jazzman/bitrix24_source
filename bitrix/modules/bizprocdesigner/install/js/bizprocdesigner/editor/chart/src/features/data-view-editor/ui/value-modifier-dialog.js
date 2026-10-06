import { Event, Type } from 'main.core';
import { ZIndexManager } from 'main.core.z-index-manager';
import { FocusTrap } from 'ui.a11y';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { OPERATION } from 'bizproc.dataview';

import {
	ExpressionBuilderBody,
	EXPRESSION_BUILDER_MODES,
	resolveExpressionMode,
} from '../../node-settings/ui/expression-builder/expression-builder-body';
import { getAllowedFormulaFunctions } from '../api';
import { useDataViewDefinitionStore } from '../stores/definition-store';
import { findColumnSchemaField, useDataViewMetaStore } from '../stores/meta-store';

let dialogUidSeq = 0;

const TAB_MESSAGES = Object.freeze({
	[EXPRESSION_BUILDER_MODES.functions]: 'FUNCTIONS',
	[EXPRESSION_BUILDER_MODES.modification]: 'MODIFICATION',
	[EXPRESSION_BUILDER_MODES.calculator]: 'CALCULATOR',
});

const TABS = Object.freeze([
	{ id: EXPRESSION_BUILDER_MODES.functions, icon: Outline.TEXT },
	{ id: EXPRESSION_BUILDER_MODES.modification, icon: Outline.EDIT_M },
	{ id: EXPRESSION_BUILDER_MODES.calculator, icon: Outline.PLUS_M },
]);

/**
 * The "modify value" dialog, entered from the ⋯ menu of a column: the formula
 * ({@see ExpressionBuilderBody}) that replaces the value the column takes from its source. References
 * in it mean columns of the same row, so the source list is the column list of this very table. The
 * formula is written to the definition on Apply, and leaving the dialog any other way changes nothing.
 *
 * The grouping and the totals are no formula and belong to the table rather than to a column, so they
 * live in the body of the panel ({@see AggregatePanel}), not here.
 *
 * Teleported to `body` so the overlay dims the whole editor.
 */
// @vue/component
export const ValueModifierDialog = {
	name: 'BizprocDataViewValueModifierDialog',
	components: {
		ExpressionBuilderBody,
		BIcon,
	},
	props: {
		/** Code of the column the menu was opened on — the column a formula binds to. */
		columnCode: {
			type: String,
			default: '',
		},
	},
	emits: ['close'],
	setup(): Object
	{
		return {
			definitionStore: useDataViewDefinitionStore(),
			metaStore: useDataViewMetaStore(),
			tabs: TABS,
		};
	},
	data(): Object
	{
		dialogUidSeq += 1;

		return {
			uid: `bizproc-dataview-modify-${dialogUidSeq}`,
			activeTab: EXPRESSION_BUILDER_MODES.functions,
			formula: '',
		};
	},
	computed: {
		/** The column a formula may bind to: a stamp holds a constant instead of a source value. */
		formulaColumn(): ?Object
		{
			return this.definitionStore.columns.find(
				(column) => column.code === this.columnCode && column.kind !== 'constant',
			) ?? null;
		},
		activeTabHintCode(): string
		{
			return this.hintCode(this.activeTab);
		},
		/** The column the formula belongs to, as a reference: what every mode of the builder starts from. */
		boundColumnSource(): string
		{
			return this.formulaColumn ? this.columnReference(this.columnCode) : '';
		},
		/**
		 * What the modifiers offered for that column depend on: its field type and whether the source
		 * provider has a printable form for it. Read from the schema the editor has already loaded for
		 * the source; until it arrives the type is unknown, and the builder falls back to offering
		 * every modifier. A schema from before the flag carries no `presentable`, which reads as false.
		 */
		boundColumnTypes(): Object
		{
			const schemaField = findColumnSchemaField(
				this.metaStore,
				this.definitionStore.sources,
				this.formulaColumn?.source,
			);
			const type = Type.isStringFilled(schemaField?.type) ? schemaField.type : null;

			return { type, baseType: type, presentable: schemaField?.presentable === true };
		},
		/**
		 * The table computes a formula outside any workflow, so it takes a narrower set of functions
		 * than the rest of the designer. Offering the others would only lead to the save being refused.
		 */
		allowedFormulaFunctions(): ?Array<string>
		{
			return getAllowedFormulaFunctions();
		},
		/**
		 * Row columns a formula may reference: every column but the computed ones, itself included.
		 * A grouping leaves a different row than the projection describes — the grouped fields, the
		 * results of its functions and the stamps — so under it the references follow that row instead.
		 */
		referenceColumns(): Array<Object>
		{
			const columns = this.definitionStore.columns
				.filter((column) => column.code === this.columnCode || !Type.isStringFilled(column.formula))
			;

			if (this.definitionStore.operation !== OPERATION.AGGREGATE)
			{
				return columns;
			}

			const { groupBy, functions } = this.definitionStore.aggregate;

			return [
				...columns.filter((column) => (
					column.kind === 'constant'
					|| column.code === this.columnCode
					|| groupBy.includes(column.code)
				)),
				...functions.filter((fn) => Type.isStringFilled(fn.code) && fn.code !== this.columnCode),
			];
		},
		columnSourceSections(): Array<Object>
		{
			const items = this.referenceColumns
				.map((column) => ({
					id: column.code,
					title: Type.isStringFilled(column.title) ? column.title : column.code,
					subtitle: column.code,
					value: this.columnReference(column.code),
					type: null,
					baseType: null,
				}))
			;

			return [{
				id: 'columns',
				title: this.$Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_MODIFY_SOURCE_SECTION'),
				items,
			}];
		},
	},
	created(): void
	{
		this.formula = this.formulaColumn?.formula ?? '';
		if (Type.isStringFilled(this.formula))
		{
			this.activeTab = resolveExpressionMode(this.formula);
		}
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
		/** References in a data view formula mean columns of the same row. */
		columnReference(code: string): string
		{
			return `{=Column:${code}}`;
		},
		titleCode(tabId: string): string
		{
			return `BIZPROC_JS_DATAVIEW_MODIFY_TAB_${TAB_MESSAGES[tabId]}`;
		},
		hintCode(tabId: string): string
		{
			return `${this.titleCode(tabId)}_HINT`;
		},
		selectTab(tabId: string): void
		{
			this.activeTab = tabId;
		},
		onKeydown(event: KeyboardEvent): void
		{
			if (event.key === 'Escape')
			{
				this.onCancel();
			}
		},
		/** The builder assembles into the formula field, which is what the dialog applies. */
		onFormulaAssembled(formula: string): void
		{
			this.formula = formula;
		},
		onApply(): void
		{
			const formula = this.formula.trim();
			if (this.formulaColumn !== null && formula !== (this.formulaColumn.formula ?? ''))
			{
				this.definitionStore.setColumnFormula(this.columnCode, formula);
			}

			this.$emit('close');
		},
		/** Nothing the dialog holds has reached the definition yet, so leaving it is enough. */
		onCancel(): void
		{
			this.$emit('close');
		},
	},
	template: `
		<Teleport to="body">
			<div ref="overlay" class="bizproc-dataview-modal" @click.self="onCancel">
				<div
					ref="window"
					class="bizproc-dataview-modal__window"
					role="dialog"
					aria-modal="true"
					:aria-labelledby="uid + '-title'"
					data-test-id="bizproc-dataview__modify-dialog"
				>
					<div class="bizproc-dataview-modal__header">
						<div class="bizproc-dataview-modal__title" :id="uid + '-title'">
							{{ $Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_MODIFY_DIALOG_TITLE') }}
						</div>
						<button
							type="button"
							class="bizproc-dataview-modal__close"
							:aria-label="$Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_CANCEL')"
							data-test-id="bizproc-dataview__modify-close"
							@click="onCancel"
						><span aria-hidden="true">&times;</span></button>
					</div>
					<div class="bizproc-dataview-modal__body">
						<span class="bizproc-dataview__caption">
							{{ $Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_MODIFY_TRANSFORM_CAPTION') }}
						</span>
						<div class="bizproc-dataview-tabs" role="tablist">
							<button
								v-for="tab in tabs"
								:key="tab.id"
								:id="uid + '-tab-' + tab.id"
								type="button"
								class="bizproc-dataview-tabs__item"
								:class="{ '--active': activeTab === tab.id }"
								role="tab"
								:aria-selected="activeTab === tab.id"
								:aria-controls="uid + '-panel'"
								:data-test-id="'bizproc-dataview__modify-tab-' + tab.id"
								@click="selectTab(tab.id)"
							>
								<BIcon :name="tab.icon" :size="16" aria-hidden="true" />
								<span>{{ $Bitrix.Loc.getMessage(titleCode(tab.id)) }}</span>
							</button>
						</div>
						<p
							class="bizproc-dataview__intro --tight"
							data-test-id="bizproc-dataview__modify-tab-hint"
						>{{ $Bitrix.Loc.getMessage(activeTabHintCode) }}</p>
						<div
							:id="uid + '-panel'"
							role="tabpanel"
							:aria-labelledby="uid + '-tab-' + activeTab"
						>
							<ExpressionBuilderBody
								:mode="activeTab"
								:initialValue="formula"
								:sourceSections="columnSourceSections"
								:boundSource="boundColumnSource"
								:boundSourceTypes="boundColumnTypes"
								:allowedFunctions="allowedFormulaFunctions"
								applyOnChange
								@apply="onFormulaAssembled"
							/>
							<label class="bizproc-dataview__field bizproc-dataview__formula">
								<span class="bizproc-dataview__field-label">
									{{ $Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_MODIFY_FORMULA') }}
								</span>
								<input
									v-model="formula"
									type="text"
									class="bizproc-dataview__input"
									:placeholder="$Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_MODIFY_FORMULA_PLACEHOLDER')"
									data-test-id="bizproc-dataview__modify-formula"
								>
							</label>
						</div>
					</div>
					<div class="bizproc-dataview-modal__footer">
						<button
							type="button"
							class="bizproc-dataview-btn --ghost"
							data-test-id="bizproc-dataview__modify-cancel"
							@click="onCancel"
						>{{ $Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_CANCEL') }}</button>
						<button
							type="button"
							class="bizproc-dataview-btn --primary"
							data-test-id="bizproc-dataview__modify-apply"
							@click="onApply"
						>{{ $Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_MODIFY_APPLY') }}</button>
					</div>
				</div>
			</div>
		</Teleport>
	`,
};
