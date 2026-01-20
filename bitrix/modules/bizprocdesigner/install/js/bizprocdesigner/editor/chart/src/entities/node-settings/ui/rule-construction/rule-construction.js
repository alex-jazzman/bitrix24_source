import './style.css';

import { BIcon } from 'ui.icon-set.api.vue';

import { useLoc } from '../../../../shared/composables';

import { CONSTRUCTION_LABELS, GENERAL_CONSTRUCTION_TYPES, CONSTRUCTION_TYPES } from '../../constants/index';

// eslint-disable-next-line no-unused-vars
import type { СonstructionLabels, Construction, GeneralConstructionTypes, OrderParams } from '../types';

type RuleConstructionSetup = {
	getMessage: () => string;
	сonstructionModes: { standard: string; expert: string; };
};

const RULE_CONSTRUCTION_MODES = {
	standard: 'standard',
	expert: 'expert',
};

const ICON_COLORS = {
	condition: '#b7d7ff',
	action: '#4de39e',
	output: '#d5d7db',
};

// @vue/component
export const RuleConstruction = {
	name: 'rule-construction',
	components: { BIcon },
	props:
	{
		/** @type Construction */
		construction:
		{
			type: Object,
			required: true,
		},
		position:
		{
			type: Number,
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
		const сonstructionModes = Object.freeze({
			standard: getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_EXPRESSION_STANDARD_MODE'),
			expert: getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_EXPRESSION_EXPERT_MODE'),
		});

		return {
			getMessage,
			сonstructionModes,
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
		constractionClassName(): { [key: string]: string; }
		{
			return {
				'--condition': GENERAL_CONSTRUCTION_TYPES[this.construction.type] === GENERAL_CONSTRUCTION_TYPES['condition:if'],
				'--action': GENERAL_CONSTRUCTION_TYPES[this.construction.type] === GENERAL_CONSTRUCTION_TYPES.action,
				'--first': this.position === 0,
				'--output': GENERAL_CONSTRUCTION_TYPES[this.construction.type] === GENERAL_CONSTRUCTION_TYPES.output,
			};
		},
		generalConstructionTypes(): GeneralConstructionTypes
		{
			return GENERAL_CONSTRUCTION_TYPES;
		},
		isBooleanType(): boolean
		{
			return this.booleanTypes.includes(this.construction.type);
		},
		booleanTypes(): Array<$Values<typeof CONSTRUCTION_TYPES>>
		{
			return [
				CONSTRUCTION_TYPES.AND_CONDITION,
				CONSTRUCTION_TYPES.OR_CONDITION,
			];
		},
		iconColor(): string
		{
			if (GENERAL_CONSTRUCTION_TYPES.action === this.generalConstructionTypes[this.construction.type])
			{
				return ICON_COLORS.action;
			}

			if (GENERAL_CONSTRUCTION_TYPES.output === this.generalConstructionTypes[this.construction.type])
			{
				return ICON_COLORS.output;
			}

			return ICON_COLORS.condition;
		},
		isExpertMode(): boolean
		{
			return this.selectedMode === RULE_CONSTRUCTION_MODES.expert;
		},
		parsedMessage(): string
		{
			return this.construction.type === GENERAL_CONSTRUCTION_TYPES.action
				? this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ACTION_THEN')
				: this.getMessage(CONSTRUCTION_LABELS[this.construction.type])
			;
		},
	},
	template: `
		<div
			data-name="rule-construction"
			class="rule-construction"
			:class="constractionClassName"
			:data-id="construction.id"
			:data-rule-card-id="ruleCardId"
		>
			<div class="rule-construction__operator">
				<slot
					v-if="isBooleanType"
					name="booleanTypeSwitcher"
				/>
				<span
					v-else
					class="rule-construction__operator_label"
				>
					{{ parsedMessage }}
				</span>
				<slot
					v-if="position > 0"
					name="addConstructionButton"
				/>
			</div>
			<div class="rule-construction__content">
				<div class="rule-construction__content_top">
					<BIcon
						:size="20"
						:color="iconColor"
						class="rule-construction__dnd-icon"
						name="drag-s"
						draggable="true"
					/>
					<!--
					<div
						v-if="generalConstructionTypes[construction.type] === generalConstructionTypes.action"
						class="rule-construction__content_mode"
					>
						<span
							v-for="(label, mode) in сonstructionModes"
							class="rule-construction__content_mode-text"
							:class="{ '--selected': selectedMode === mode }"
							@click="selectedMode = mode"
						>
							{{ label }}
						</span>
					</div>
					-->
					<slot
						name="deleteConstructionButton"
						:iconColor="iconColor"
					/>
				</div>
				<div class="rule-construction__expression-form">
					<slot
						:name="generalConstructionTypes[construction.type]"
						:isExpertMode="isExpertMode"
					/>
				</div>
			</div>
		</div>
	`,
};
