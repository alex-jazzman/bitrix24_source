import { RecentType } from 'im.v2.const';

import { BaseCollabNestedList } from './base';

// @vue/component
export const CollabNestedCalendarList = {
	name: 'CollabNestedCalendarList',
	components: { BaseCollabNestedList },
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
		<BaseCollabNestedList :type="RecentType.calendar" :parentChatId="parentChatId" />
	`,
};
