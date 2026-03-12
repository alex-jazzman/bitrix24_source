import './style.css';

import { BIcon } from 'ui.icon-set.api.vue';

import { useLoc } from '../../../../shared/composables';
import { PORT_TYPES } from '../../../../shared/constants';

import { useNodeSettingsStore, generateNextInputPortId } from '../../../../entities/node-settings';

type AddSettingsItemSetup = {
	getMessage: () => string;
	actions: {
		rule: () => void;
	},
};

// @vue/component
export const AddSettingsItem = {
	name: 'add-settings-item',
	components: { BIcon },
	props:
	{
		itemType:
		{
			type: String,
			required: true,
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
			connection: () => {
				const connectionId = generateNextInputPortId(
					store.ports.filter((port) => port.type === PORT_TYPES.input),
				);
				store.addConnectionPort(connectionId, PORT_TYPES.input);
			},
		};

		return {
			getMessage,
			actions,
		};
	},
	template: `
		<div
			class="node-settings-add-item-button"
			:data-test-id="$testId('complexNodeSettingsAdd', itemType)"
			@click="actions[this.itemType]()"
		>
			<BIcon
				class="node-settings-add-item-button__plus"
				name="plus-m"
				:size="20"
				color="#828b95"
			/>
			<span>
				{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ADD_SETTINGS_ITEM') }}
				<slot />
			</span>
		</div>
	`,
};
