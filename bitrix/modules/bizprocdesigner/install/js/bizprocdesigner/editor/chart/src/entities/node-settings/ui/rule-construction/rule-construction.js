import { BIcon } from 'ui.icon-set.api.vue';

import { useLoc } from '../../../../shared/composables';

import { CONSTRUCTION_LABELS, CONSTRUCTION_TYPES } from '../../constants/index';
import { getGroupConstructionName, isHeadConstructionType } from '../../utils/rules-surface';

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
				'--base-settings': CONSTRUCTION_TYPES.BASE_SETTINGS === this.construction.type,
			};
		},
		expressionName(): string
		{
			if (this.conditionSet.has(this.construction.type))
			{
				return 'condition';
			}

			// base-settings maps to its own named slot
			if (this.construction.type === CONSTRUCTION_TYPES.BASE_SETTINGS)
			{
				return 'base-settings';
			}

			return this.construction.type;
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
			if (this.construction.type === CONSTRUCTION_TYPES.action)
			{
				return this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ACTION_THEN');
			}

			const labelKey = CONSTRUCTION_LABELS[this.construction.type];
			if (labelKey)
			{
				return this.getMessage(labelKey);
			}

			return this.construction.type;
		},
		/** Id of the label the construction is named by (see groupRole). */
		labelId(): string
		{
			return `editor-chart-node-settings-rule-construction-label-${this.construction.id}`;
		},
		/**
		 * Section the construction belongs to in the canonical order: a head block keeps its own
		 * type, a group construction takes its group name. The drag directive refuses a drop onto
		 * another section, because the card would put the block back on the position of its own
		 * section anyway (sortConstructionsCanonically).
		 */
		dragSection(): string
		{
			if (isHeadConstructionType(this.construction.type))
			{
				return this.construction.type;
			}

			return getGroupConstructionName(this.construction.type) ?? this.construction.type;
		},
		/**
		 * A construction is exposed as a named group so its label is announced together with
		 * the controls inside it. Boolean constructions carry a switcher instead of a label,
		 * so they get no group role rather than an unnamed one.
		 */
		groupRole(): ?string
		{
			return this.isBooleanType ? null : 'group';
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
				[CONSTRUCTION_TYPES.BASE_SETTINGS]: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_BASE_SETTINGS_HINT'),
				[CONSTRUCTION_TYPES.FILTER]: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_FILTER_HINT'),
			};

			return descriptions[this.construction.type] ?? '';
		},
	},
	template: `
		<div
			data-name="rule-construction"
			class="editor-chart-node-settings-rule-construction"
			:class="constructionClassName"
			:data-test-id="$testId('complexNodeRuleSettingsRuleConstruction', construction.id)"
			:data-id="construction.id"
			:data-rule-card-id="ruleCardId"
			:data-section="dragSection"
			:role="groupRole"
			:aria-labelledby="groupRole ? labelId : null"
		>
			<div class="editor-chart-node-settings-rule-construction__top">
				<BIcon
					:size="20"
					color="#a8adb4"
					class="editor-chart-node-settings-rule-construction__dnd-icon"
					data-testid="bizprocdesigner-rule-construction-drag-handle"
					name="drag-m"
					draggable="true"
				/>
				<slot
					v-if="isBooleanType"
					name="booleanTypeSwitcher"
				/>
				<span
					v-else
					:id="labelId"
					class="editor-chart-node-settings-rule-construction__operator_label"
					data-testid="bizprocdesigner-rule-construction-label"
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
			<div
				class="editor-chart-node-settings-rule-construction__expression-form"
				data-testid="bizprocdesigner-rule-construction-expression-form"
			>
				<slot
					:name="expressionName"
					:isExpertMode="isExpertMode"
				/>
			</div>
		</div>
	`,
};
