import { RecentType } from 'im.v2.const';
import { CreatableChatType } from 'im.v2.lib.create-chat';
import { type ImModelChat } from 'im.v2.model';

import { BaseCollabNestedList } from './base';

// @vue/component
export const CollabNestedDefaultList = {
	name: 'CollabNestedDefaultList',
	components: { BaseCollabNestedList },
	props: {
		parentChatId: {
			type: Number,
			required: true,
		},
	},
	computed: {
		RecentType: () => RecentType,
		CreatableChatType: () => CreatableChatType,
		parentChat(): ImModelChat
		{
			return this.$store.getters['chats/getByChatId'](this.parentChatId);
		},
	},
	methods: {
		onLoadComplete()
		{
			this.selectParentChat();
		},
		selectParentChat()
		{
			this.$emit('selectChat', this.parentChat.dialogId);
		},
	},
	template: `
		<BaseCollabNestedList
			:type="RecentType.collabDefault"
			:parentChatId="parentChatId"
			:creatableChatType="CreatableChatType.collabChat"
			@loadComplete="onLoadComplete"
		/>
	`,
};
