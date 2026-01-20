import { MenuManager } from 'main.popup';
import { mapState, mapActions } from 'ui.vue3.pinia';
import { diagramStore } from '../../../../entities/blocks';
import { ValueSelector } from '../../../../entities/common-node-settings';
// eslint-disable-next-line no-unused-vars
import type { ConditionConstruction, ConditionExpressionField } from '../../../../entities/node-settings';
import { evaluateConditionExpressionFieldTitle } from '../../../../entities/node-settings/utils';
import { useLoc } from '../../../../shared/composables';

// eslint-disable-next-line no-unused-vars
import {
	useNodeSettingsStore,
	CONSTRUCTION_OPERATORS,
} from '../../../../entities/node-settings';
import { OperatorPhraseCodes, OperatorRequiresValue } from './const';
import { FieldSelector } from './field-selector';

import './style.css';

// @vue/component
export const EditConditionExpression = {
	name: 'edit-condition-expression',
	props:
	{
		/** @type ConditionConstruction */
		construction:
		{
			type: Object,
			required: true,
		},
	},
	setup(): { getMessage: () => string; }
	{
		const { getMessage } = useLoc();

		return { getMessage };
	},
	computed:
	{
		...mapState(useNodeSettingsStore, ['nodeSettings', 'block', 'currentRuleId']),
		availableOperators(): Array<{ id: string, title: string }>
		{
			return Object.values(CONSTRUCTION_OPERATORS).map((operator) => ({
				id: operator,
				title: this.getMessage(OperatorPhraseCodes[operator] ?? ''),
			}));
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

			const store = diagramStore();
			const connectedBlocks = store.getBlockAncestorsByInputPortId(this.block, this.currentRuleId);

			return evaluateConditionExpressionFieldTitle(connectedBlocks, this.selectedField);
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
			const fieldSelector = (new FieldSelector(this.block, this.currentRuleId));

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
				this.currentRuleId,
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
		<div class="edit-condition-expression-form">
			<div class="edit-condition-expression-form__item">
				<span class="edit-condition-expression-form__label">
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_EXPRESSION_FIELD') }}
				</span>
				<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown edit-condition-expression-form__dropdown">
					<div class="ui-ctl-after ui-ctl-icon-angle"></div>
					<div
						ref="fieldChooseMenu"
						class="ui-ctl-element"
						@click="onShowFieldChooseMenu"
					>
						{{ selectedFieldTitle }}
					</div>
				</div>
			</div>
			<div class="edit-condition-expression-form__item">
				<span class="edit-condition-expression-form__label">
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_EXPRESSION_OPERATOR') }}
				</span>
				<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown edit-condition-expression-form__dropdown"
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
			<div v-if="isShowValueEditor"
				class="edit-condition-expression-form__item"
			>
				<span class="edit-condition-expression-form__label">
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_EXPRESSION_VALUE') }}
				</span>
				<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown edit-condition-expression-form__dropdown">
					<div class="ui-ctl-after ui-ctl-icon-dots" style="pointer-events: all"
						 @click="onShowValueMenu"
					></div>
					<input
						class="ui-ctl-element"
						v-model="selectedValue"
					/>
				</div>
			</div>
		</div>
	`,
};
