import { openHelpdeskArticle } from 'im.v2.lib.helpdesk';

import '../css/create-chat-help.css';

export const HELP_ARTICLE_CODE = '17412872';

// @vue/component
export const CreateChatHelp = {
	emits: ['articleOpen'],
	data()
	{
		return {};
	},
	methods:
	{
		openHelpArticle()
		{
			openHelpdeskArticle(HELP_ARTICLE_CODE);
			this.$emit('articleOpen');
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-create-chat-help__container">
			<div
				class="bx-im-create-chat-help__content --focus-visible"
				data-testid="im-create-chat-help"
				role="button"
				tabindex="0"
				@click="openHelpArticle"
				@keydown.enter.prevent="openHelpArticle"
				@keydown.space.prevent="openHelpArticle"
			>
				<div class="bx-im-create-chat-help__icon"></div>
				<div class="bx-im-create-chat-help__text">{{ loc('IM_RECENT_CREATE_CHAT_WHAT_TO_CHOOSE') }}</div>
			</div>
		</div>
	`,
};
