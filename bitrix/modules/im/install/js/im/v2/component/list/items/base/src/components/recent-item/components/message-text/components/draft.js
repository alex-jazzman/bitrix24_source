import { RichLoc } from 'ui.vue3.components.rich-loc';

import { Parser } from 'im.v2.lib.parser';

// @vue/component
export const MessageDraft = {
	name: 'MessageDraft',
	components: { RichLoc },
	props: {
		draftText: {
			type: String,
			required: true,
		},
	},
	computed: {
		preparedDraftText(): string
		{
			return this.loc('IM_LIST_ITEMS_MESSAGE_DRAFT_MSGVER_3', {
				'#TEXT#': this.purifiedDraftText,
			});
		},
		purifiedDraftText(): string
		{
			return Parser.purify({ text: this.draftText });
		},
	},
	methods: {
		loc(phraseCode: string, replacements: {[string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
	},
	template: `
		<RichLoc :text="preparedDraftText" tag="span" placeholder="[highlight]">
			<template #highlight="{ text }">
				<span class="bx-im-list-recent-item__message_draft-prefix">
					{{ text }}
				</span>
			</template>
		</RichLoc>
	`,
};
