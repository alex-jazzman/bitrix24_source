import { BIcon, Set } from 'ui.icon-set.api.vue';
import { Extension } from 'main.core';

import '../css/copilot-chat-status.css';

export const Status = Object.freeze({
	COPILOT_WRITING: 'copilot-writing',
	NONE: 'none',
});

export const CopilotChatStatus = {
	components: {
		BIcon,
	},
	props: {
		status: {
			type: String,
			required: false,
			default: Status.NONE,
		},
	},
	computed: {
		Status(): Status {
			return Status;
		},
		writingStatusIcon(): {name: string, size: number} {
			return {
				name: Set.PENCIL_60,
				size: 14,
				color: '#fff',
			};
		},
		containerClassname(): string[] {
			return [
				'ai__copilot-chat_status',
				`--${this.status}`,
			];
		},
		copilotName(): string
		{
			return Extension.getSettings('landing.copilot.chat').copilotName;
		},
	},
	template: `
		<div class="ai__copilot-chat_status-wrapper">
			<div class="ai__copilot-chat_status">
				<template v-if="status === Status.COPILOT_WRITING">
					<span class="ai__copilot-chat_status-icon --typing">
						<BIcon
							v-bind="writingStatusIcon"
						/>
					</span>
					<span>
						{{
							$Bitrix.Loc.getMessage(
								'AI_COPILOT_CHAT_STATUS_COPILOT_WRITING_MSGVER_1',
								{ '#COPILOT_NAME#': copilotName }
							)
						}}
					</span>
				</template>
			</div>
		</div>
	`,
};
