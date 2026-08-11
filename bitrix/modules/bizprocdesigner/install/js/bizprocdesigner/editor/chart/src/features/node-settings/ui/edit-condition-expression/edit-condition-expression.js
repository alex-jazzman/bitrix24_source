import { MenuManager } from 'main.popup';
import { mapState, mapActions } from 'ui.vue3.pinia';
import { diagramStore } from '../../../../entities/blocks';
import { ValueSelector } from '../../../../entities/common-node-settings';
import type { Block } from '../../../../shared/types';
// eslint-disable-next-line no-unused-vars
import type { ConditionConstruction, ConditionExpressionField } from '../../../../entities/node-settings';
import { useLoc } from '../../../../shared/composables';

import {
	useNodeSettingsStore,
	CONSTRUCTION_OPERATORS,
	evaluateConditionExpressionFieldTitle,
	getConnectedBlocksContextForConstruction,
} from '../../../../entities/node-settings';
import { ConditionValueControl } from './condition-value-control';
import { OperatorPhraseCodes, OperatorRequiresValue } from './const';
import { FieldSelector } from './field-selector';

import './style.css';

// @vue/component
export const EditConditionExpression = {
	name: 'EditConditionExpression',
	components: { ConditionValueControl },
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
	computed:
	{
		...mapState(useNodeSettingsStore, ['nodeSettings', 'block', 'currentRule', 'currentSettingsItems']),
		...mapState(diagramStore, { workflowDocumentType: 'documentType' }),
		connectedBlocksContext(): Object
		{
			return getConnectedBlocksContextForConstruction(
				this.block,
				this.currentRule.id,
				this.ruleCard,
				this.construction,
				this.currentSettingsItems,
			);
		},
		connectedBlocks(): Array<Block>
		{
			return this.connectedBlocksContext.allBlocks;
		},
		availableOperators(): Array<{ id: string, title: string }>
		{
			return Object.values(CONSTRUCTION_OPERATORS).map((operator) => ({
				id: operator,
				title: this.getMessage(OperatorPhraseCodes[operator] ?? ''),
			}));
		},
		effectiveDocumentType(): Array<string>
		{
			const fixed = this.nodeSettings?.fixedDocumentType;
			if (Array.isArray(fixed) && fixed.length === 3)
			{
				return fixed;
			}

			return this.workflowDocumentType;
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
		selectedFieldTitle(): string
		{
			if (!this.selectedField)
			{
				return this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_EXPRESSION_ITEM_NOT_SELECTED');
			}

			return evaluateConditionExpressionFieldTitle(this.connectedBlocks, this.selectedField);
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
	methods:
	{
		...mapActions(useNodeSettingsStore, ['changeRuleExpression']),
		onShowFieldChooseMenu(event: Event): void
		{
			const fieldSelector = new FieldSelector(this.block, this.currentRule.id, this.connectedBlocks);

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
				this.currentRule.id,
				this.connectedBlocks,
			);
			void valueSelector.show(event.target).then((value: string) => {
				this.selectedValue += value;
			});
		},
		onShowOperatorMenu(event: Event): void
		{
			const items = this.availableOperators.map(({ id, title }) => {
				return {
					id,
					text: title,
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
				<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown editor-chart-node-settings-edit-condition-expression-form__dropdown">
					<div class="ui-ctl-after ui-ctl-icon-angle"></div>
					<div
						ref="fieldChooseMenu"
						class="ui-ctl-element"
						:title="selectedFieldTitle"
						@click="onShowFieldChooseMenu"
					>
						{{ selectedFieldTitle }}
					</div>
				</div>
			</div>
			<div class="editor-chart-node-settings-edit-condition-expression-form__item">
				<span class="editor-chart-node-settings-edit-condition-expression-form__label">
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_EXPRESSION_OPERATOR') }}
				</span>
				<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown editor-chart-node-settings-edit-condition-expression-form__dropdown"
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
