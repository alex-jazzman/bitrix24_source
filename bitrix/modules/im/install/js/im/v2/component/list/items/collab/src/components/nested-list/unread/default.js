import { RecentType } from 'im.v2.const';
import { Utils } from 'im.v2.lib.utils';

import { BaseCollabNestedUnreadList } from './base';
import { FixedParentItem } from '../components/fixed-parent-item.js';

// @vue/component
export const CollabNestedDefaultUnreadList = {
	name: 'CollabNestedDefaultUnreadList',
	components: { BaseCollabNestedUnreadList, FixedParentItem },
	props: {
		parentChatId: {
			type: Number,
			required: true,
		},
	},
	emits: ['selectChat'],
	computed: {
		RecentType: () => RecentType,
		parentDialogId(): string
		{
			return Utils.dialog.buildChatDialogId(this.parentChatId);
		},
	},
	methods: {
		onParentItemClick()
		{
			this.$emit('selectChat', this.parentDialogId);
		},
	},
	template: `
		<BaseCollabNestedUnreadList 
			:type="RecentType.collabDefault" 
			:parentChatId="parentChatId"
			:withEmptyState="false"
			@selectChat="$emit('selectChat', $event)"
		>
			<template #fixed-chats>
				<FixedParentItem :parentChatId="parentChatId" @click="onParentItemClick" />
			</template>
		</BaseCollabNestedUnreadList>
	`,
};
