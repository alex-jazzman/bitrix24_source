import { Type } from 'main.core';
import { MenuManager } from 'main.popup';
import { mapState, mapActions } from 'ui.vue3.pinia';
import { diagramStore } from '../../../../entities/blocks';
import { ValueSelector } from '../../../../entities/common-node-settings';
import { BLOCK_TYPES } from '../../../../shared/constants';
import type { Block } from '../../../../shared/types';
// eslint-disable-next-line no-unused-vars
import type { ConditionConstruction, ConditionExpressionField } from '../../../../entities/node-settings';
import { useLoc } from '../../../../shared/composables';

import {
	useNodeSettingsStore,
	CONSTRUCTION_OPERATORS,
	UnresolvedFieldHint,
	evaluateConditionExpressionFieldTitle,
	getConditionFieldTitleSignature,
	getConnectedBlocksContextForConstruction,
	getFixedDocumentType,
	getVisibleConditionFieldUnresolvedReason,
} from '../../../../entities/node-settings';
import { ConditionValueControl } from './condition-value-control';
import { OperatorPhraseCodes, OperatorRequiresValue } from './const';
import { FieldSelector } from './field-selector';

import './style.css';

// @vue/component
export const EditConditionExpression = {
	name: 'EditConditionExpression',
	components: { ConditionValueControl, UnresolvedFieldHint },
	props:
	{
		/** @type ConditionConstruction */
		construction:
		{
			type: Object,
			required: true,
		},
		ruleCard:
		{
			type: [Object, null],
			required: false,
			default: null,
		},
	},
	setup(): { getMessage: () => string; }
	{
		const { getMessage } = useLoc();

		return { getMessage };
	},
	data(): Object
	{
		return {
			fieldTitle: '',
			fieldUnresolved: null,
			isUnmounted: false,
		};
	},
	computed:
	{
		...mapState(useNodeSettingsStore, ['nodeSettings', 'block', 'currentRule', 'currentSettingsItems']),
		...mapState(diagramStore, { workflowDocumentType: 'documentType' }),
		connectedBlocksContext(): Object
		{
			return getConnectedBlocksContextForConstruction(
				this.block,
				this.currentRule?.id ?? null,
				this.ruleCard,
				this.construction,
				this.currentSettingsItems,
			);
		},
		connectedBlocks(): Array<Block>
		{
			return this.connectedBlocksContext.allBlocks;
		},
		availableOperators(): Array<{ id: string, code: string, title: string }>
		{
			// `code` is the readable name of the operator (`equal`, `notEmpty`), kept apart from the
			// stored `id` (`=`, `!empty`) so a test label does not have to spell the symbols out.
			return Object.entries(CONSTRUCTION_OPERATORS).map(([code, operator]) => ({
				id: operator,
				code,
				title: this.getMessage(OperatorPhraseCodes[operator] ?? ''),
			}));
		},
		fixedDocumentType(): Array<string> | null
		{
			return getFixedDocumentType(this.nodeSettings);
		},
		effectiveDocumentType(): Array<string>
		{
			return this.fixedDocumentType ?? this.workflowDocumentType;
		},
		/**
		 * Document the `Document` object of this condition addresses at runtime, or null when the node
		 * addresses none and the source must not be offered.
		 * A trigger is the one node whose condition is decided before the process starts, on a stub
		 * workflow bound to the document of the event (ApplyRulesChecker::checkNodeCondition), so
		 * `Document` there means exactly the document type the node publishes. Every other node has its
		 * condition decided on the workflow itself (CBPWorkflow::isNodeConditionMet), where `Document` is
		 * the document of the template and not the fixed type of the node, so offering the fields of that
		 * type would build a condition read against another document.
		 */
		conditionDocumentType(): Array<string> | null
		{
			return this.block?.type === BLOCK_TYPES.TRIGGER ? this.fixedDocumentType : null;
		},
		fieldProperty(): Object | null
		{
			if (!this.selectedField)
			{
				return null;
			}

			const result = { Type: this.selectedField.type ?? 'string', Multiple: Boolean(this.selectedField.multiple) };
			if (this.selectedField.options)
			{
				result.Options = this.selectedField.options;
			}
			if (this.selectedField.settings)
			{
				result.Settings = this.selectedField.settings;
			}

			return result;
		},
		valueFieldName(): string
		{
			return `bp_cond_value_${this.construction.id}`;
		},
		valueControlKey(): string
		{
			return `${this.selectedField?.object ?? ''}:${this.selectedField?.fieldId ?? ''}`;
		},
		selectedField:
		{
			get(): ?ConditionExpressionField
			{
				return this.construction.expression.field;
			},
			set(field: ConditionExpressionField): void
			{
				this.changeRuleExpression(this.construction, {
					field,
					value: '',
					operator: '',
				});
			},
		},
		// A field picked but left without an object and an id of its own builds no caption at all, and an
		// empty control says even less than the phrase does.
		selectedFieldTitle(): string
		{
			return Type.isStringFilled(this.fieldTitle)
				? this.fieldTitle
				: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_EXPRESSION_ITEM_NOT_SELECTED')
			;
		},
		// Built inside a computed on purpose: this is where the record of the template data and the title
		// of the source block become tracked dependencies of the caption.
		fieldTitleSignature(): string
		{
			return getConditionFieldTitleSignature(this.connectedBlocks, [this.selectedField]);
		},
		selectedValue:
		{
			get(): string
			{
				return this.construction.expression.value;
			},
			set(value: string): void
			{
				this.changeRuleExpression(this.construction, {
					value,
				});
			},
		},
		selectedOperatorTitle(): string
		{
			return this.availableOperators.find(({ id }) => id === this.selectedOperator)?.title
				?? this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_EXPRESSION_ITEM_NOT_SELECTED')
			;
		},
		selectedOperator:
		{
			get(): string
			{
				return this.construction.expression.operator;
			},
			set(operator: string): void
			{
				this.changeRuleExpression(this.construction, {
					operator,
				});
			},
		},
		isShowValueEditor(): boolean
		{
			if (!this.selectedOperator)
			{
				return false;
			}

			return OperatorRequiresValue(this.selectedOperator);
		},
	},
	watch:
	{
		// Sources of the condition change while the node is open — an action added to the same card
		// brings its document along, a source gets renamed, a constant of the template is edited from
		// another surface. The caption follows all of that, and follows nothing else: the signature holds
		// the picked field and the names of its source, so a value being typed rebuilds nothing.
		fieldTitleSignature:
		{
			immediate: true,
			handler: 'rebuildFieldTitle',
		},
	},
	beforeUnmount(): void
	{
		this.isUnmounted = true;
	},
	methods:
	{
		...mapActions(useNodeSettingsStore, ['changeRuleExpression']),
		rebuildFieldTitle(): void
		{
			const field = this.selectedField;
			if (!field)
			{
				this.fieldTitle = '';
				this.fieldUnresolved = null;

				return;
			}

			const { title, pending, unresolved } = evaluateConditionExpressionFieldTitle(
				this.connectedBlocks,
				field,
				this.conditionDocumentType,
			);
			const signature = this.fieldTitleSignature;

			this.fieldTitle = title;
			this.fieldUnresolved = this.visibleUnresolvedReason(unresolved, field);
			pending?.then(() => this.applyResolvedFieldTitle(signature));
		},
		visibleUnresolvedReason(unresolved: ?string, field: ?ConditionExpressionField): string | null
		{
			return getVisibleConditionFieldUnresolvedReason(unresolved, {
				field,
				nodeSettings: this.nodeSettings,
				// The very type the caption was built against: a condition of a trigger reads the fields of the
				// document the node fixed, so a key absent from them names a field of that document that is gone.
				documentType: this.conditionDocumentType,
			});
		},
		// Fields of a document arrive after a request: a field replaced meanwhile and a component
		// already gone leave the state alone. The signature tells them apart rather than the object of
		// the field — the same field picked again is a new object, and its caption is the same. The
		// second pass is taken as is — waiting for its own promise would loop over a request that came
		// back without the fields.
		applyResolvedFieldTitle(signature: string): void
		{
			if (this.isUnmounted || this.fieldTitleSignature !== signature)
			{
				return;
			}

			const { title, unresolved } = evaluateConditionExpressionFieldTitle(
				this.connectedBlocks,
				this.selectedField,
				this.conditionDocumentType,
			);

			this.fieldTitle = title;
			this.fieldUnresolved = this.visibleUnresolvedReason(unresolved, this.selectedField);
		},
		onShowFieldChooseMenu(event: Event): void
		{
			const fieldSelector = new FieldSelector(
				this.block,
				this.currentRule?.id ?? null,
				this.connectedBlocks,
				this.conditionDocumentType,
			);

			void fieldSelector.show(event.target).then((field: ConditionExpressionField) => {
				this.selectedField = field;
			});
		},
		onShowValueMenu(event: Event): void
		{
			if (!this.block)
			{
				return;
			}

			const valueSelector = new ValueSelector(
				diagramStore(),
				this.block,
				this.currentRule?.id ?? null,
				this.connectedBlocks,
			);
			void valueSelector.show(event.target).then((value: string) => {
				this.selectedValue += value;
			});
		},
		onShowOperatorMenu(event: Event): void
		{
			const items = this.availableOperators.map(({ id, code, title }) => {
				return {
					id,
					text: title,
					// main.popup renders `dataset` onto the item element, which is the only stable
					// anchor a menu of a foreign component offers.
					dataset: { testid: `bizprocdesigner-condition-operator-item-${code}` },
					onclick: () => {
						this.selectedOperator = id;
						this.operatorMenu?.close();
					},
				};
			});
			this.operatorMenu = MenuManager.create({
				id: 'operator-menu',
				bindElement: event.target,
				items,
				closeByEsc: true,
				autoHide: true,
				cacheable: false,
				maxHeight: 200,
			});

			this.operatorMenu.show();
		},
	},
	template: `
		<div>
			<div class="editor-chart-node-settings-edit-condition-expression-form__item">
				<span class="editor-chart-node-settings-edit-condition-expression-form__label">
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_EXPRESSION_FIELD') }}
				</span>
				<div
					class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown editor-chart-node-settings-edit-condition-expression-form__dropdown"
					:class="{ '--unresolved': Boolean(fieldUnresolved) }"
				>
					<div class="ui-ctl-after ui-ctl-icon-angle"></div>
					<div
						ref="fieldChooseMenu"
						class="ui-ctl-element"
						data-testid="bizprocdesigner-condition-field-select"
						:title="selectedFieldTitle"
						:data-test-id="$testId('complexNodeSettingsConditionField')"
						@click="onShowFieldChooseMenu"
					>
						{{ selectedFieldTitle }}
					</div>
					<!-- After the caption: the warning belongs to it and has to be read after it. -->
					<UnresolvedFieldHint
						:unresolved="fieldUnresolved"
						:fieldTitle="fieldTitle"
						:testId="$testId('complexNodeSettingsConditionField', 'unresolved')"
					/>
				</div>
			</div>
			<div class="editor-chart-node-settings-edit-condition-expression-form__item">
				<span class="editor-chart-node-settings-edit-condition-expression-form__label">
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_EXPRESSION_OPERATOR') }}
				</span>
				<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown editor-chart-node-settings-edit-condition-expression-form__dropdown"
					 data-testid="bizprocdesigner-condition-operator-select"
					 :data-test-id="$testId('complexNodeSettingsConditionOperator')"
					 @click="onShowOperatorMenu"
				>
					<div class="ui-ctl-after ui-ctl-icon-angle"></div>
					<div
						class="ui-ctl-element"
					>
						{{ selectedOperatorTitle }}
					</div>
				</div>
			</div>
			<div v-if="isShowValueEditor && selectedField"
				class="editor-chart-node-settings-edit-condition-expression-form__item"
			>
				<span class="editor-chart-node-settings-edit-condition-expression-form__label">
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_EXPRESSION_VALUE') }}
				</span>
				<ConditionValueControl
					:key="valueControlKey"
					data-testid="bizprocdesigner-condition-value"
					:property="fieldProperty"
					:document-type="effectiveDocumentType"
					:model-value="selectedValue"
					:field-name="valueFieldName"
					@update:model-value="selectedValue = $event"
				/>
			</div>
		</div>
	`,
};
