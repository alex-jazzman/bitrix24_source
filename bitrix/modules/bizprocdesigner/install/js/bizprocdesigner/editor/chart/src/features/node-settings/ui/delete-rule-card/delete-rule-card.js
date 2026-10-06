import { BIcon } from 'ui.icon-set.api.vue';
import { mapActions } from 'ui.vue3.pinia';

import { useNodeSettingsStore } from '../../../../entities/node-settings';
import { useLoc, type GetMessage } from '../../../../shared/composables';

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
	setup(): { getMessage: GetMessage }
	{
		const { getMessage } = useLoc();

		return { getMessage };
	},
	computed:
	{
		/** Names the group being deleted: every card carries a delete button of its own. */
		ariaLabel(): string
		{
			const groupTitle = this.ruleCard.groupTitle
				|| this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RULE_CARD_TITLE')
			;

			return this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_DELETE_GROUP_ARIA_LABEL', {
				'#GROUP#': groupTitle,
			});
		},
	},
	methods:
	{
		...mapActions(useNodeSettingsStore, ['deleteRuleCard']),
	},
	template: `
		<button
			type="button"
			class="editor-chart-node-settings-delete-rule-card"
			:data-test-id="$testId('complexNodeRuleSettingsDeleteRuleCard', ruleCard.id)"
			:aria-label="ariaLabel"
			@click="deleteRuleCard(ruleCard)"
		>
			<BIcon
				name="cross-m"
				:size="20"
				color="#a8adb4"
				aria-hidden="true"
			/>
		</button>
	`,
};
