import './style.css';

import { BIcon } from 'ui.icon-set.api.vue';

import { mapActions } from 'ui.vue3.pinia';

// eslint-disable-next-line no-unused-vars
import { useNodeSettingsStore, type TRuleCard, type Construction } from '../../../../entities/node-settings';

// @vue/component
export const DeleteConstruction = {
	name: 'delete-construction',
	components: { BIcon },
	props:
	{
		iconColor:
		{
			type: String,
			required: true,
		},
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
			:color="iconColor"
			:data-test-id="$testId('complexNodeRuleSettingsDeleteConstruction', construction.id)"
			class="delete-construction"
			name="cross-s"
			@click="deleteConstruction(ruleCard, construction)"
		/>
	`,
};
