import { RecentType } from 'im.v2.const';

import { BaseCollabNestedUnreadList } from './base';

// @vue/component
export const CollabNestedCalendarUnreadList = {
	name: 'CollabNestedCalendarUnreadList',
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
		<BaseCollabNestedUnreadList :type="RecentType.calendar" :parentChatId="parentChatId" />
	`,
};
