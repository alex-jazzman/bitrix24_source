import { BIcon } from 'ui.icon-set.api.vue';
import { mapActions } from 'ui.vue3.pinia';

import { CONSTRUCTION_LABELS, useNodeSettingsStore } from '../../../../entities/node-settings';
import { useLoc, type GetMessage } from '../../../../shared/composables';

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
	setup(): { getMessage: GetMessage }
	{
		const { getMessage } = useLoc();

		return { getMessage };
	},
	computed:
	{
		/** Names the block being deleted so the buttons do not share one accessible name. */
		ariaLabel(): string
		{
			const labelKey = CONSTRUCTION_LABELS[this.construction.type];
			if (!labelKey)
			{
				return this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_DELETE_CONSTRUCTION_ARIA_LABEL');
			}

			return this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_DELETE_CONSTRUCTION_NAMED_ARIA_LABEL', {
				'#BLOCK#': this.getMessage(labelKey),
			});
		},
	},
	methods:
	{
		...mapActions(useNodeSettingsStore, ['deleteConstruction']),
	},
	template: `
		<button
			type="button"
			class="editor-chart-node-settings-delete-construction"
			:data-test-id="$testId('complexNodeRuleSettingsDeleteConstruction', construction.id)"
			:aria-label="ariaLabel"
			@click="deleteConstruction(ruleCard, construction)"
		>
			<BIcon
				:size="20"
				name="cross-m"
				color="#a8adb4"
				aria-hidden="true"
			/>
		</button>
	`,
};
