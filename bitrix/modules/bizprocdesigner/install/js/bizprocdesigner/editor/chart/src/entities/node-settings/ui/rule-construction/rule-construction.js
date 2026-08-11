import { BIcon } from 'ui.icon-set.api.vue';

import { useLoc } from '../../../../shared/composables';

import { CONSTRUCTION_LABELS, CONSTRUCTION_TYPES } from '../../constants/index';

import './style.css';

type RuleConstructionSetup = {
	getMessage: () => string;
	constructionModes: { standard: string; expert: string; };
};

const RULE_CONSTRUCTION_MODES = {
	standard: 'standard',
	expert: 'expert',
};

// @vue/component
export const RuleConstruction = {
	name: 'RuleConstruction',
	components: { BIcon },
	props:
	{
		/** @type Construction */
		construction:
		{
			type: Object,
			required: true,
		},
		ruleCardId:
		{
			type: String,
			required: true,
		},
	},
	setup(): RuleConstructionSetup
	{
		const { getMessage } = useLoc();
		const constructionModes = Object.freeze({
			standard: getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_EXPRESSION_STANDARD_MODE'),
			expert: getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_EXPRESSION_EXPERT_MODE'),
		});

		return {
			getMessage,
			constructionModes,
		};
	},
	data(): { selectedMode: string; }
	{
		return {
			selectedMode: RULE_CONSTRUCTION_MODES.expert,
		};
	},
	computed:
	{
		conditionSet(): Set<string>
		{
			return new Set(Object.values(CONSTRUCTION_TYPES.CONDITION));
		},
		constructionClassName(): { [key: string]: string; }
		{
			return {
				'--condition': this.conditionSet.has(this.construction.type),
				'--action': CONSTRUCTION_TYPES.ACTION === this.construction.type,
				'--filter': CONSTRUCTION_TYPES.FILTER === this.construction.type,
				'--output': CONSTRUCTION_TYPES.OUTPUT === this.construction.type,
			};
		},
		expressionName(): string
		{
			return this.conditionSet.has(this.construction.type)
				? 'condition'
				: this.construction.type
			;
		},
		isBooleanType(): boolean
		{
			return this.booleanTypes.includes(this.construction.type);
		},
		booleanTypes(): Array<$Values<typeof CONSTRUCTION_TYPES>>
		{
			return [
				CONSTRUCTION_TYPES.CONDITION.AND_CONDITION,
				CONSTRUCTION_TYPES.CONDITION.OR_CONDITION,
			];
		},
		isExpertMode(): boolean
		{
			return this.selectedMode === RULE_CONSTRUCTION_MODES.expert;
		},
		parsedMessage(): string
		{
			return this.construction.type === CONSTRUCTION_TYPES.action
				? this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ACTION_THEN')
				: this.getMessage(CONSTRUCTION_LABELS[this.construction.type])
			;
		},
		description(): string
		{
			if (this.conditionSet.has(this.construction.type))
			{
				return this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_DESCRIPTION');
			}

			const descriptions = {
				[CONSTRUCTION_TYPES.ACTION]: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ACTION_DESCRIPTION'),
				[CONSTRUCTION_TYPES.OUTPUT]: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_OUTPUT_DESCRIPTION'),
			};

			return descriptions[this.construction.type];
		},
	},
	template: `
		<div
			data-name="rule-construction"
			class="editor-chart-node-settings-rule-construction"
			:class="constructionClassName"
			:data-id="construction.id"
			:data-rule-card-id="ruleCardId"
		>
			<div class="editor-chart-node-settings-rule-construction__top">
				<BIcon
					:size="20"
					color="#a8adb4"
					class="editor-chart-node-settings-rule-construction__dnd-icon"
					name="drag-m"
					draggable="true"
				/>
				<slot
					v-if="isBooleanType"
					name="booleanTypeSwitcher"
				/>
				<span
					v-else
					class="editor-chart-node-settings-rule-construction__operator_label"
				>
					{{ parsedMessage }}
				</span>
				<span class="editor-chart-node-settings-rule-construction__description">
					{{ description }}
				</span>
				<slot
					name="deleteConstructionButton"
				/>
			</div>
			<div class="editor-chart-node-settings-rule-construction__expression-form">
				<slot
					:name="expressionName"
					:isExpertMode="isExpertMode"
				/>
			</div>
		</div>
	`,
};
