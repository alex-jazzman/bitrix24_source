import './style.css';

import { BIcon } from 'ui.icon-set.api.vue';

import { useLoc } from '../../../../shared/composables';
// eslint-disable-next-line no-unused-vars
import { Port, Block } from '../../../../shared/types';

import { CONSTRUCTION_LABELS, GENERAL_CONSTRUCTION_TYPES, CONSTRUCTION_OPERATORS } from '../../constants';
import { evaluateConditionExpressionFieldTitle } from '../../utils';

import type {
	Rule,
	// eslint-disable-next-line no-unused-vars
	NodeSettings,
	GeneralConstructionTypes,
	СonstructionOperators,
	СonstructionLabels,
	Construction,
} from '../types';

// @vue/component
export const NodeSettingsRule = {
	name: 'node-settings-rule',
	components: { BIcon },
	props:
	{
		/** @type Port */
		port:
		{
			type: Object,
			required: true,
		},
		/** @type NodeSettings */
		nodeSettings:
		{
			type: Object,
			required: true,
		},
		/** @type Block */
		connectedBlocks:
		{
			type: Object,
			required: true,
		},
	},
	emits: ['showRuleConstructions', 'deleteRule'],
	setup(): { getMessage: () => string; }
	{
		const { getMessage } = useLoc();

		return { getMessage };
	},
	computed:
	{
		ruleId(): string
		{
			return this.port.id;
		},
		rule(): Rule
		{
			return this.nodeSettings.rules.get(this.ruleId);
		},
		isRuleFilled(): boolean
		{
			return this.rule?.isFilled;
		},
		constructionLabels(): СonstructionLabels
		{
			return CONSTRUCTION_LABELS;
		},
		constructionOperators(): СonstructionOperators
		{
			return CONSTRUCTION_OPERATORS;
		},
		generalConstructionTypes(): GeneralConstructionTypes
		{
			return GENERAL_CONSTRUCTION_TYPES;
		},
	},
	methods:
	{
		onRuleClick(): void
		{
			this.$emit('showRuleConstructions', this.ruleId);
		},
		onDeleteRule(): void
		{
			this.$emit('deleteRule', this.ruleId);
		},
		getExpressionTitle({ expression, type }: Construction): string
		{
			const { actions } = this.nodeSettings;
			if (type === GENERAL_CONSTRUCTION_TYPES.action)
			{
				if (!expression.actionId)
				{
					return '';
				}

				return actions.get(expression.actionId).title;
			}

			if (type === GENERAL_CONSTRUCTION_TYPES.output || !expression.field)
			{
				return '';
			}

			return evaluateConditionExpressionFieldTitle(this.connectedBlocks, expression.field);
		},
		getExpressionValue({ expression: { value, title }, type }: Construction): string
		{
			if (type === GENERAL_CONSTRUCTION_TYPES.output)
			{
				return title;
			}

			return value;
		},
	},
	template: `
		<div
			class="node-settings-rule"
			:data-test-id="$testId('complexNodeSettingsRulePreview', ruleId)"
			@click="onRuleClick"
		>
			<BIcon
				class="node-settings-rule__dnd-icon"
				name="drag-s"
				color="#828b95"
			/>
			<span class="node-settings-rule__title">
				{{ port.title }}
			</span>
			<div
				v-if="isRuleFilled"
				class="node-settings-rule__card-container"
			>
				<div
					v-for="ruleCard in rule.ruleCards"
					:key="ruleCard.id"
					class="node-settings-rule__card"
				>
					<div
						v-for="construction in ruleCard.constructions"
						:key="construction.id"
						class="node-settings-rule__construction"
						:class="['--' + generalConstructionTypes[construction.type]]"
					>
						<span class="node-settings-rule__construction_type">
							{{ getMessage(constructionLabels[construction.type]) }}
						</span>
						<span class="node-settings-rule__expression-part">
							{{ getExpressionTitle(construction) }}
						</span>
						<span
							v-if="construction.expression.operator"
							class="node-settings-rule__expression-part"
						>
							{{ constructionOperators[construction.expression.operator] }}
						</span>
						<span
							v-if="generalConstructionTypes[construction.type] !== generalConstructionTypes.action"
							class="node-settings-rule__expression-part"
						>
							{{ getExpressionValue(construction) }}
						</span>
					</div>
				</div>
			</div>
			<span
				class="node-settings-rule__construction --empty"
				v-else
			>
				{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RULE_EMPTY') }}
			</span>
			<div class="node-settings-rule__actions">
				<BIcon
					:size="20"
					class="node-settings-rule__edit-icon"
					name="pencil-40"
					color="#c9ccd0"
				/>
				<BIcon
					class="node-settings-rule__close-icon"
					name="cross-m"
					:size="20"
					:data-test-id="$testId('complexNodeSettingsRulePreview', ruleId, 'delete')"
					color="#c9ccd0"
					@click.stop="onDeleteRule"
				/>
			</div>
		</div>
	`,
};
