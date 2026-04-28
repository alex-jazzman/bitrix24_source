import { RichLoc } from 'ui.vue3.components.rich-loc';

import { BaseMessage } from 'im.v2.component.message.base';
import { MessageStatus, AuthorTitle, DefaultMessageContent } from 'im.v2.component.message.elements';
import { openHelpdeskArticle } from 'im.v2.lib.helpdesk';

import './css/ai-bizproc.css';

import type { ImModelMessage } from 'im.v2.model';

// @vue/component
export const AiBizprocMessage = {
	name: 'AiBizprocMessage',
	components: { AuthorTitle, BaseMessage, MessageStatus, DefaultMessageContent, RichLoc },
	props: {
		item: {
			type: Object,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
		withTitle: {
			type: Boolean,
			default: true,
		},
	},
	computed: {
		message(): ImModelMessage
		{
			return this.item;
		},
	},
	methods: {
		onWarningDetailsClick(): void
		{
			const ARTICLE_CODE = '27777462';
			openHelpdeskArticle(ARTICLE_CODE);
		},
		loc(phraseCode: string, replacements: {[p: string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
	},
	template: `
		<BaseMessage :item="item" :dialogId="dialogId" class="bx-im-message-ai-bizproc__container">
			<div class="bx-im-message-default__container">
				<AuthorTitle v-if="withTitle" :item="message"/>
				<DefaultMessageContent :item="message" :dialogId="dialogId" :withMessageStatus="false" />
			</div>
			<div class="bx-im-message-ai-bizproc__bottom-panel">
				<span class="bx-im-message-ai-bizproc__warning">
					<RichLoc
						:text="loc('IM_MESSAGE_AI_BIZPROC_WARNING_FOOTNOTE')"
						placeholder="[url]"
					>
						<template #url="{ text }">
							<span class="bx-im-message-ai-bizproc__warning_link" @click="onWarningDetailsClick">
								{{ text }}
							</span>
						</template>
					</RichLoc>
				</span>
				<div class="bx-im-message-ai-bizproc__status-container">
					<MessageStatus :item="message"/>
				</div>
			</div>
		</BaseMessage>
	`,
};
