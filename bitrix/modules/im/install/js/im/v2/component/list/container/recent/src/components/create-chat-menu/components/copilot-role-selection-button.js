import { CopilotManager } from 'im.v2.lib.copilot';

import '../css/copilot-role-selection-button.css';

// @vue/component
export const CopilotRoleSelectionButton = {
	computed: {
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
		loc(phraseCode: string, replacements: {[p: string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
	},
	template: `
		<div class="bx-im-create-chat-menu-item__button --copilot" :title="title">
			<div class="bx-im-create-chat-menu-item__icon-more"></div>
		</div>
	`,
};
