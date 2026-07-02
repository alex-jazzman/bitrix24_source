import { RecentType } from 'im.v2.const';

import { BaseCollabNestedList } from './base';

// @vue/component
export const CollabNestedTaskList = {
	name: 'CollabNestedTaskList',
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
		<BaseCollabNestedList :type="RecentType.taskComments" :parentChatId="parentChatId" />
	`,
};
