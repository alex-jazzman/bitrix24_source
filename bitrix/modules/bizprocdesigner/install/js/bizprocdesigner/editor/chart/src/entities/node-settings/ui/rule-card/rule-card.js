import { BIcon, Outline } from 'ui.icon-set.api.vue';

import { useLoc } from '../../../../shared/composables';

import { CONSTRUCTION_TYPES, CONSTRUCTION_GROUPS } from '../../constants/index';
import { type Construction } from '../../types';

import './style.css';

type GroupedConstructions = {
	conditions: Array<Construction>,
	actions: Array<Construction>,
	filters: Array<Construction>,
	outputs: Array<Construction>,
};

// @vue/component
export const RuleCard = {
	name: 'RuleCard',
	components: { BIcon },
	props:
	{
		/** @type TRuleCard */
		ruleCard:
		{
			type: Object,
			required: true,
		},
	},
	emits: ['addConstruction'],
	setup(): {...}
	{
		const { getMessage } = useLoc();

		return {
			getMessage,
			iconColor: 'var(--ui-color-palette-gray-50)',
			iconSet: Outline,
		};
	},
	computed:
	{
		conditionSet(): Set<string>
		{
			return new Set(Object.values(CONSTRUCTION_TYPES.CONDITION));
		},
		groupedConstructions(): GroupedConstructions
		{
			return this.ruleCard.constructions.reduce((acc, construction) => {
				if (this.conditionSet.has(construction.type))
				{
					return {
						...acc,
						conditions: [...(acc.conditions ?? []), construction],
					};
				}

				if (construction.type === CONSTRUCTION_TYPES.ACTION)
				{
					return {
						...acc,
						actions: [...(acc.actions ?? []), construction],
					};
				}

				if (construction.type === CONSTRUCTION_TYPES.FILTER)
				{
					return {
						...acc,
						filters: [...(acc.filters ?? []), construction],
					};
				}

				if (construction.type === CONSTRUCTION_TYPES.OUTPUT)
				{
					return {
						...acc,
						outputs: [...(acc.outputs ?? []), construction],
					};
				}

				return acc;
			}, {});
		},
	},
	methods:
	{
		onAddConstruction(groupName: string): void
		{
			this.$emit('addConstruction', groupName);
		},
		getAddConstructionBtnTitle(groupName: string): string
		{
			return groupName === CONSTRUCTION_GROUPS.conditions
				? this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_TOOLBAR_ITEM')
				: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ACTION_TOOLBAR_ITEM')
			;
		},
		isNotOutputsGroup(groupName: string): boolean
		{
			return groupName !== CONSTRUCTION_GROUPS.outputs && groupName !== CONSTRUCTION_GROUPS.filters;
		},
	},
	template: `
		<div
			data-name="rule-card"
			class="editor-chart-node-settings-rule-card"
			:data-id="ruleCard.id"
		>
			<div class="editor-chart-node-settings-rule-card__top">
				<BIcon
					:name="iconSet.DRAG_M"
					class="editor-chart-node-settings-rule-card__dnd-icon"
					draggable="true"
					:color="iconColor"
					:size="20"
				/>
				<span class="editor-chart-node-settings-rule-card__top_title">
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RULE_CARD_TITLE') }}
				</span>
				<slot name="deleteRuleCard" />
			</div>
			<div
				v-for="(group, groupName) in groupedConstructions"
				:key="groupName"
				:class="'--' + groupName"
				class="editor-chart-node-settings-rule-card__group"
			>
				<slot
					v-for="construction in group"
					name="construction"
					:key="construction.id"
					:construction="construction"
				/>
				<div
					v-if="isNotOutputsGroup(groupName)"
					@click="onAddConstruction(groupName)"
					class="editor-chart-node-settings-rule-card__group_add-construction-btn"
				>
					<BIcon
						:name="iconSet.PLUS_L"
						:size="18"
					/>
					<span>
						{{ getAddConstructionBtnTitle(groupName) }}
					</span>
				</div>
			</div>
			<slot name="addConstructionButton" />
		</div>
	`,
};
