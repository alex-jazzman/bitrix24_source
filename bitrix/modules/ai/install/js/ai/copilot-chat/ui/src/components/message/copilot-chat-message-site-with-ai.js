import { bind, Dom, Tag } from 'main.core';
import type { CopilotChatMessage } from '../../types';
import { CopilotChatMessageWelcome } from './copilot-chat-message-welcome';

export const CopilotChatMessageSiteWithAi = {
	components: {
		CopilotChatMessageWelcome,
	},
	props: {
		message: {
			type: Object,
			required: false,
		},
		avatar: {
			type: String,
			required: false,
		},
		disableAllActions: {
			type: Boolean,
			required: false,
			default: false,
		},
	},
	computed: {
		messageInfo(): CopilotChatMessage {
			return {
				...this.message,
				params: {
					...this.message.params,
					title: 'Привет! Я — Веб-дизайнер',
					subtitle: '',
					content: '',
				},
			};
		},
	},
	methods: {
		renderContent(): void {
			const paragraph2 = this.$Bitrix.Loc.getMessage('AI_COPILOT_CHAT_WELCOME_MESSAGE_SITE_WITH_AI_2', {
				'#LINK#': `<a href="#" class="${this.disableAllActions ? 'disabled' : ''}" ref="createSiteLink">`,
				'#/LINK#': '</a>',
			});

			const content = Tag.render`
				<div>
					<p>${this.$Bitrix.Loc.getMessage('AI_COPILOT_CHAT_WELCOME_MESSAGE_SITE_WITH_AI_1')}</p>
					<p>${paragraph2}</p>
				</div>
			`;

			bind(content.createSiteLink, 'click', () => {
				// TODO add some action here
			});

			this.$refs.content.innerHTML = '';
			Dom.append(content.root, this.$refs.content);
		},
	},
	watch: {
		disableAllActions() {
			this.renderContent();
		},
	},
	mounted() {
		this.renderContent();
	},
	template: `
		<CopilotChatMessageWelcome
			:avatar="avatar"
			:message="messageInfo"
		>
			<template #content>
				<div ref="content"></div>
			</template>
		</CopilotChatMessageWelcome>
	`,
};
