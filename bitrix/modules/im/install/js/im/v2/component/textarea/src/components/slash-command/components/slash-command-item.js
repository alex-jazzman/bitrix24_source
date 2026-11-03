import { MentionItem } from '../../mention/components/mention-item/components/mention-item';

import '../css/slash-command-item.css';

// @vue/component
export const SlashCommandItem = {
	name: 'SlashCommandItem',
	components: { MentionItem },
	props: {
		item: {
			/** @type ImModelCommand */
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
			default: '',
		},
		isParticipant: {
			type: Boolean,
			default: false,
		},
	},
	computed: {
		botId(): string
		{
			return String(this.item.botId);
		},
		title(): string
		{
			return this.item.params ? `${this.item.command} ${this.item.params}` : this.item.command;
		},
		subtitle(): string
		{
			return this.item.title ?? '';
		},
	},
	template: `
		<div :class="{'--selected': selected}" class="bx-im-slash-command-item__container bx-im-mention-item__scope" data-testid="im-textarea-slash-command-item">
			<MentionItem :id="botId">
				<template #title>
					<div class="bx-im-slash-command-item__command" :title="title">{{ title }}</div>
				</template>
				<template #subtitle>
					<div v-if="subtitle" class="bx-im-mention-item__subtitle" :title="subtitle">{{ subtitle }}</div>
				</template>
			</MentionItem>
		</div>
	`,
};
