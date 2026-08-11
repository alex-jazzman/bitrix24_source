import { BIcon } from 'ui.icon-set.api.vue';
import { mapActions } from 'ui.vue3.pinia';

import { useNodeSettingsStore } from '../../../../entities/node-settings';

import './style.css';

// @vue/component
export const DeleteRuleCard = {
	name: 'DeleteRuleCard',
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
			class="editor-chart-node-settings-delete-rule-card"
			name="cross-m"
			:size="20"
			:data-test-id="$testId('complexNodeRuleSettingsDeleteRuleCard', ruleCard.id)"
			color="#a8adb4"
			@click="deleteRuleCard(ruleCard)"
		/>
	`,
};
