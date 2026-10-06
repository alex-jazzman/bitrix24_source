import { RecentType } from 'im.v2.const';

import { BaseCollabNestedUnreadList } from './base';

// @vue/component
export const CollabNestedTaskUnreadList = {
	name: 'CollabNestedTaskUnreadList',
	components: { BaseCollabNestedUnreadList },
	props: {
		parentChatId: {
			type: Number,
			required: true,
		},
	},
	computed: {
		RecentType: () => RecentType,
	},
	template: `
		<BaseCollabNestedUnreadList :type="RecentType.taskComments" :parentChatId="parentChatId" />
	`,
};
