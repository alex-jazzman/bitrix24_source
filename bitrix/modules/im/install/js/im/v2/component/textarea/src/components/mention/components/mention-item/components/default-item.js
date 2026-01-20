import { Text } from 'main.core';

import { ChatTitleWithHighlighting } from 'im.v2.component.elements.chat-title';
import { ChatType } from 'im.v2.const';
import { highlightText } from 'im.v2.lib.text-highlighter';

import { MentionItem } from './mention-item';

import type { ImModelChat } from 'im.v2.model';
import type { MentionItemType } from '../../../mention-content';

// @vue/component
export const DefaultItem = {
	name: 'DefaultMentionItem',
	components: { ChatTitleWithHighlighting, MentionItem },
	props: {
		item: {
			type: Object,
			required: true,
		},
		selected: {
			type: Boolean,
			default: false,
		},
		query: {
			type: String,
			default: '',
		},
		dialogId: {
			type: String,
			required: true,
		},
	},
	computed: {
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.item.id, true);
		},
		isUser(): boolean
		{
			return this.dialog.type === ChatType.user;
		},
		subtitleWithHighlighting(): string
		{
			return highlightText(Text.encode(this.item.subtitle), this.query);
		},
		currentItem(): MentionItemType
		{
			return this.item;
		},
	},
	template: `
		<div
			:class="{'--selected': selected}"
			class="bx-im-mention-item__container bx-im-mention-item__scope"
		>
			<MentionItem :id="currentItem.id">
				<template #title>
					<ChatTitleWithHighlighting
						:dialogId="currentItem.id"
						:textToHighlight="query"
						:text="currentItem.title"
						class="bx-im-mention-item__title"
					/>
				</template>
				<template #subtitle>
					<div v-if="isUser" class="bx-im-mention-item__subtitle" :title="currentItem.subtitle" v-html="subtitleWithHighlighting"></div>
					<div v-else class="bx-im-mention-item__subtitle" :title="currentItem.subtitle">{{ currentItem.subtitle }}</div>
				</template>
			</MentionItem>
		</div>
	`,
};
