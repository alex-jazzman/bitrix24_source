import { MentionItem } from './mention-item';

import type { MentionItemType } from '../../../mention-content';

// @vue/component
export const CopilotItem = {
	name: 'CopilotMentionItem',
	components: { MentionItem },
	props: {
		item: {
			type: Object,
			required: true,
		},
		selected: {
			type: Boolean,
			default: false,
		},
		dialogId: {
			type: String,
			required: true,
		},
	},
	computed: {
		subtitle(): string
		{
			return this.loc('IM_TEXTAREA_MENTION_COPILOT_SUBTITLE');
		},
		currentItem(): MentionItemType
		{
			return this.item;
		},
	},
	methods: {
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div
			:class="{'--selected': selected}"
			class="bx-im-mention-item__container bx-im-mention-item__scope"
		>
			<MentionItem
				:id="currentItem.id"
				:title="currentItem.title"
				:subtitle="currentItem.subtitle"
			/>
		</div>
	`,
};
