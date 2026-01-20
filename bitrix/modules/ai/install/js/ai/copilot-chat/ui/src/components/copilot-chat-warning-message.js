import { Reflection, Tag, Event, Dom } from 'main.core';

export const CopilotChatWarningMessage = {
	name: 'CopilotWarningMessage',
	props: {
		articleCode: {
			type: String,
			required: true,
		},
	},
	methods: {
		showArticle(): void {
			const Helper = Reflection.getClass('top.BX.Helper');
			const articleCode: string = this.articleCode;

			Helper?.show(`redirect=detail&code=${articleCode}`);
		},
	},
	mounted() {
		const warningMessage = Tag.render`<span>${this.$Bitrix.Loc.getMessage('AI_COPILOT_CHAT_ANSWER_WARNING_1', {
			'#LINK_START#': '<a ref="link" href="#">',
			'#LINK_END#': '</a>',
		})}</span>`;

		Event.bind(warningMessage.link, 'click', this.showArticle);

		Dom.append(warningMessage.root, this.$refs.container);
	},
	template: `
		<div
			ref="container"
			class="ai__copilot-chat-warning-message"
		></div>
	`,
};
