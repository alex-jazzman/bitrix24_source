import { ChatTitle } from 'im.v2.component.elements.chat-title';
import { BaseRecentItem } from 'im.v2.component.list.items.base';
import { type ImModelRecentItem } from 'im.v2.model';

// @vue/component
export const ChannelItem = {
	name: 'ChannelItem',
	components: { BaseRecentItem, ChatTitle },
	props: {
		item: {
			type: Object,
			required: true,
		},
	},
	computed: {
		recentItem(): ImModelRecentItem
		{
			return this.item;
		},
	},
	template: `
		<BaseRecentItem
			:item="item"
			:withCounters="false"
			:withMessageStatus="false"
			:withInputIndicator="false"
			:withDraft="false"
		>
			<template #title>
				<ChatTitle :dialogId="recentItem.dialogId" />
			</template>
		</BaseRecentItem>
	`,
};
