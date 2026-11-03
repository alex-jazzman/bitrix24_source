import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { CopilotManager } from 'im.v2.lib.copilot';

import '../css/copilot-role-selection-button.css';

// @vue/component
export const CopilotRoleSelectionButton = {
	name: 'CopilotRoleSelectionButton',
	components: { BIcon },
	computed: {
		OutlineIcons: () => OutlineIcons,
		title(): string
		{
			return this.loc('IM_RECENT_CREATE_COPILOT_ROLE_SELECTION_TITLE_MSGVER_1', {
				'#COPILOT_NAME#': this.copilotManager.getName(),
			});
		},
	},
	created()
	{
		this.copilotManager = new CopilotManager();
	},
	methods: {
		handleActivationKeydown(event: KeyboardEvent): void
		{
			if (event.key === 'Enter' || event.key === ' ')
			{
				// Synthesize the native click the mouse path uses: the parent binds @click.stop,
				// which falls through to this root element.
				event.preventDefault();
				this.$el.click();
			}
		},
		loc(phraseCode: string, replacements: {[p: string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
	},
	template: `
		<div
			class="bx-im-create-chat-menu-item__button --copilot --focus-visible"
			data-testid="im-copilot-role-selection-button"
			:title="title"
			role="button"
			tabindex="0"
			@keydown="handleActivationKeydown"
		>
			<BIcon
				:name="OutlineIcons.MORE_L"
				:hoverable="true"
				class="bx-im-create-chat-menu-item__icon-more"
			/>
		</div>
	`,
};
