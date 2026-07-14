import { EventEmitter } from 'main.core.events';

import { RecentType, EventType } from 'im.v2.const';
import { CreatableChatType } from 'im.v2.lib.create-chat';
import { Utils } from 'im.v2.lib.utils';
import { type ImModelLayout, type ImModelChat } from 'im.v2.model';

import { BaseCollabNestedList } from './base';
import { FixedParentItem } from './components/fixed-parent-item';

import '../../css/fixed-items.css';

// @vue/component
export const CollabNestedDefaultList = {
	name: 'CollabNestedDefaultList',
	components: { BaseCollabNestedList, FixedParentItem },
	props: {
		parentChatId: {
			type: Number,
			required: true,
		},
	},
	emits: ['selectChat'],
	computed: {
		RecentType: () => RecentType,
		CreatableChatType: () => CreatableChatType,
		layout(): ImModelLayout
		{
			return this.$store.getters['application/getLayout'];
		},
		parentDialogId(): string
		{
			return Utils.dialog.buildChatDialogId(this.parentChatId);
		},
	},
	mounted()
	{
		if (this.shouldSelectParentChat())
		{
			this.selectParentChat();
		}

		EventEmitter.emit(EventType.collab.onFirstOpen, { parentChatId: this.parentChatId });
	},
	methods: {
		selectParentChat()
		{
			this.$emit('selectChat', this.parentDialogId);
		},
		shouldSelectParentChat(): boolean
		{
			const currentDialogId = this.layout.entityId;
			if (!currentDialogId)
			{
				return true;
			}

			const currentChat: ImModelChat = this.$store.getters['chats/get'](currentDialogId, true);
			const isNestedChatOpen = currentChat.parentChatId === this.parentChatId;
			// eslint-disable-next-line sonarjs/prefer-single-boolean-return
			if (isNestedChatOpen)
			{
				return false;
			}

			return true;
		},
		onParentItemClick()
		{
			this.selectParentChat();
		},
	},
	template: `
		<BaseCollabNestedList
			:type="RecentType.collabDefault"
			:parentChatId="parentChatId"
			:creatableChatType="CreatableChatType.collabChat"
			:withEmptyState="false"
			@selectChat="$emit('selectChat', $event)"
		>
			<template #fixed-chats>
				<FixedParentItem :parentChatId="parentChatId" @click="onParentItemClick" />
			</template>
		</BaseCollabNestedList>
	`,
};
