import { RecentType } from 'im.v2.const';

import { BaseCollabNestedUnreadList } from './base';

// @vue/component
export const CollabNestedCopilotUnreadList = {
	name: 'CollabNestedCopilotUnreadList',
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
		<BaseCollabNestedUnreadList :type="RecentType.copilot" :parentChatId="parentChatId" />
	`,
};
