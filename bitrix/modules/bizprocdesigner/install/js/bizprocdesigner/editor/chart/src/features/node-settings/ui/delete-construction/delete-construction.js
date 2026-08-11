import { BIcon } from 'ui.icon-set.api.vue';
import { mapActions } from 'ui.vue3.pinia';

import { useNodeSettingsStore } from '../../../../entities/node-settings';

import './style.css';

// @vue/component
export const DeleteConstruction = {
	name: 'DeleteConstruction',
	components: { BIcon },
	props:
	{
		/** @type TRuleCard */
		ruleCard:
		{
			type: Object,
			required: true,
		},
		/** @type Construction */
		construction:
		{
			type: Object,
			required: true,
		},
	},
	methods:
	{
		...mapActions(useNodeSettingsStore, ['deleteConstruction']),
	},
	template: `
		<BIcon
			:data-test-id="$testId('complexNodeRuleSettingsDeleteConstruction', construction.id)"
			:size="20"
			class="editor-chart-node-settings-delete-construction"
			name="cross-m"
			color="#a8adb4"
			@click="deleteConstruction(ruleCard, construction)"
		/>
	`,
};
