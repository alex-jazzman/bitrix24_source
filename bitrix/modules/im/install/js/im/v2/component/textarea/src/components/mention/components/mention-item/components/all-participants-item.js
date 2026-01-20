import { MentionItem } from './mention-item';

import type { MentionItemType } from '../../../mention-content';

export const AllParticipantsItem = {
	name: 'AllParticipantsItem',
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
			>
				<template #avatar>
					<div 
						class="bx-im-mention-item__all-avatar-container" 
						:title="loc('IM_TEXTAREA_MENTION_ALL_PARTICIPANTS_AVATAR_TITLE')"
					/>
				</template>
			</MentionItem>
		</div>
	`,
};
