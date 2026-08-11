import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { mapActions, mapState } from 'ui.vue3.pinia';

import { PORT_TYPES } from '../../../../shared/constants';
import { CONSTRUCTION_TYPES, useNodeSettingsStore } from '../../../../entities/node-settings';
import { useLoc } from '../../../../shared/composables';

import './style.css';

// @vue/component
export const AddConstruction = {
	name: 'AddConstruction',
	components: { BIcon },
	props:
	{
		/** @type TRuleCard */
		ruleCard:
		{
			type: [Object, null],
			default: null,
		},
	},
	setup(): { getMessage: () => string; iconSet: Outline }
	{
		const { getMessage } = useLoc();

		return {
			getMessage,
			iconSet: Outline,
		};
	},
	computed:
	{
		...mapState(useNodeSettingsStore, ['nodeSettings', 'currentRule', 'currentSettingsItems']),
		actions(): Array
		{
			return [
				{
					id: CONSTRUCTION_TYPES.CONDITION.IF_CONDITION,
					text: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_TOOLBAR_ITEM'),
					dataset: { testId: 'complexNodeRuleSettingsToolbarItemConstructionIf' },
					className: 'condition',
				},
				{
					id: CONSTRUCTION_TYPES.ACTION,
					text: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ACTION_TOOLBAR_ITEM'),
					dataset: { testId: 'complexNodeRuleSettingsToolbarItemConstructionAction' },
					className: 'action',
				},
				...(
					this.nodeSettings.filterSupported
					&& this.currentRule?.type === PORT_TYPES.input
						? [{
							id: CONSTRUCTION_TYPES.FILTER,
							text: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_FILTER_TOOLBAR_ITEM'),
							dataset: { testId: 'complexNodeRuleSettingsToolbarItemConstructionFilter' },
							className: 'filter',
						}]
						: []
				),
				{
					id: CONSTRUCTION_TYPES.OUTPUT,
					text: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_OUTPUT_TOOLBAR_ITEM'),
					dataset: { testId: 'complexNodeRuleSettingsToolbarItemConstructionOutput' },
					className: 'output',
				},
			];
		},
		conditionsTypes(): Set<string>
		{
			return new Set(Object.values(CONSTRUCTION_TYPES.CONDITION));
		},
	},
	methods:
	{
		...mapActions(useNodeSettingsStore, ['addConstruction', 'addRuleCard']),
		onAddConstruction(actionId: string): void
		{
			if (
				actionId === CONSTRUCTION_TYPES.CONDITION.IF_CONDITION
				|| actionId === CONSTRUCTION_TYPES.FILTER
			)
			{
				const ruleCard = this.addRuleCard();
				this.addConstruction(ruleCard, actionId);

				return;
			}

			const rule = this.currentSettingsItems.get(this.currentRule.id);
			const lastRuleCard = rule.ruleCards[rule.ruleCards.length - 1];
			let isNotExists = false;
			let isSiblingExists = false;
			if (actionId === CONSTRUCTION_TYPES.ACTION)
			{
				isSiblingExists = lastRuleCard?.constructions.some((c) => {
					return this.conditionsTypes.has(c.type);
				});
				isNotExists = lastRuleCard?.constructions.every((c) => {
					return c.type !== CONSTRUCTION_TYPES.ACTION;
				});
			}
			else
			{
				isSiblingExists = lastRuleCard?.constructions.some((c) => {
					return c.type === CONSTRUCTION_TYPES.ACTION;
				});
				isNotExists = lastRuleCard?.constructions.every((c) => {
					return c.type !== CONSTRUCTION_TYPES.OUTPUT;
				});
			}

			if (isSiblingExists && isNotExists)
			{
				this.addConstruction(lastRuleCard, actionId);

				return;
			}

			const ruleCard = this.addRuleCard();
			this.addConstruction(ruleCard, actionId);
		},
	},
	template: `
		<div
			class="editor-chart-node-settings-add-construction-toolbar"
			:data-test-id="$testId('complexNodeRuleSettingsAddConstructionToolbar')"
		>
			<div
				v-for="action in actions"
				class="editor-chart-node-settings-add-construction-toolbar__item"
				:class="'--' + action.className"
				:key="action.id"
				@click="onAddConstruction(action.id)"
			>
				<BIcon
					:name="iconSet.PLUS_M"
					:size="20"
				/>
				<span>{{ action.text }}</span>
			</div>
		</div>
	`,
};
