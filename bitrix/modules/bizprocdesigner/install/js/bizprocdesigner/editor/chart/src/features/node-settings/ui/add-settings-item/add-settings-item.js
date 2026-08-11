import { BIcon } from 'ui.icon-set.api.vue';

import { useNodeSettingsStore } from '../../../../entities/node-settings';
import { useLoc } from '../../../../shared/composables';
import { PORT_TYPES } from '../../../../shared/constants';

import './style.css';

type AddSettingsItemSetup = {
	getMessage: () => string;
	actions: {
		rule: () => void;
	},
};

// @vue/component
export const AddSettingsItem = {
	name: 'AddSettingsItem',
	components: { BIcon },
	props:
	{
		itemType:
		{
			type: String,
			required: true,
		},
		iconName:
		{
			type: String,
			default: 'plus-m',
		},
	},
	emits: ['addItem'],
	setup(): AddSettingsItemSetup
	{
		const { getMessage } = useLoc();
		const store = useNodeSettingsStore();
		const actions = {
			rule: () => {
				const ruleId = store.addRule();
				store.addRulePort(ruleId, PORT_TYPES.input);
			},
			relation: () => {
				const relationId = store.addRelation();
				store.addRelationPort(relationId, PORT_TYPES.inputRelation);
			},
		};

		return {
			getMessage,
			actions,
		};
	},
	template: `
		<div
			class="editor-chart-node-settings-add-item-button"
			:data-test-id="$testId('complexNodeSettingsAdd', itemType)"
			@click="actions[this.itemType]()"
		>
			<BIcon
				class="editor-chart-node-settings-add-item-button__plus"
				:name="iconName"
				:size="22"
				color="#828b95"
			/>
			<span>
				<slot />
			</span>
		</div>
	`,
};
