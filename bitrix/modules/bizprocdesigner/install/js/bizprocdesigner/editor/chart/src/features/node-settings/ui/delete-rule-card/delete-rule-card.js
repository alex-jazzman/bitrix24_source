import './style.css';

import { BIcon } from 'ui.icon-set.api.vue';

import { mapActions } from 'ui.vue3.pinia';

// eslint-disable-next-line no-unused-vars
import { useNodeSettingsStore, type TRuleCard } from '../../../../entities/node-settings';

// @vue/component
export const DeleteRuleCard = {
	name: 'delete-rule-card',
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
	methods:
	{
		...mapActions(useNodeSettingsStore, ['deleteRuleCard']),
	},
	template: `
		<BIcon
			class="delete-rule-card"
			name="cross-m"
			:size="20"
			:data-test-id="$testId('complexNodeRuleSettingsDeleteRuleCard', ruleCard.id)"
			color="#a8adb4"
			@click="deleteRuleCard(ruleCard)"
		/>
	`,
};
