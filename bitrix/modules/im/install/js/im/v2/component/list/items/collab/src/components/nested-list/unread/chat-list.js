import { RecentType } from 'im.v2.const';

import { BaseCollabNestedUnreadList } from './base-list.js';

// @vue/component
export const CollabNestedChatUnreadList = {
	name: 'CollabNestedChatUnreadList',
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
		<BaseCollabNestedUnreadList :type="RecentType.collabChat" :parentChatId="parentChatId" />
	`,
};
