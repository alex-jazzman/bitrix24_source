import { MentionItem } from './mention-item';

import type { MentionItemType } from '../../../mention-content';

export const AllParticipantsItem = {
	name: 'AllParticipantsItem',
	components: { MentionItem },
	// Provided by the composer that owns the field: one set of ids per composer, see `createMentionGridIds`.
	inject: ['mentionGridIds'],
	props: {
		item: {
			type: Object,
			required: true,
		},
		selected: {
			type: Boolean,
			default: false,
		},
		index: {
			type: Number,
			required: true,
		},
		activeColumn: {
			type: Number,
			default: 0,
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
		nameCellId(): string
		{
			return this.mentionGridIds.getCellId(this.index, 0);
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
			role="row"
			:data-testid="'im-textarea-mention-item-' + currentItem.id"
		>
			<div :id="nameCellId" role="gridcell" class="bx-im-mention-item__name-cell">
				<MentionItem
					:id="currentItem.id"
					:title="currentItem.title"
					:subtitle="currentItem.subtitle"
				>
					<template #avatar>
						<div
							class="bx-im-mention-item__all-avatar-container"
							:title="loc('IM_TEXTAREA_MENTION_ALL_PARTICIPANTS_AVATAR_TITLE')"
							aria-hidden="true"
						/>
					</template>
				</MentionItem>
			</div>
		</div>
	`,
};
