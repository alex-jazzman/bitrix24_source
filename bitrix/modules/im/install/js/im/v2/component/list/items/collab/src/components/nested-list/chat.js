import { RecentType } from 'im.v2.const';
import { CreatableChatType } from 'im.v2.lib.create-chat';

import { BaseCollabNestedList } from './base';

// @vue/component
export const CollabNestedChatList = {
	name: 'CollabNestedChatList',
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
	},
	template: `
		<BaseCollabNestedList
			:type="RecentType.collabChat"
			:parentChatId="parentChatId"
			:creatableChatType="CreatableChatType.collabChat"
		/>
	`,
};
