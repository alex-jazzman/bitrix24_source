import { Loc } from 'main.core';

import { RecentType } from 'im.v2.const';
import { RecentEmptyState } from 'im.v2.component.list.items.elements.empty-state';

const TitleByType = {
	[RecentType.taskComments]: Loc.getMessage('IM_LIST_COLLAB_V2_EMPTY_TASK_TITLE'),
	[RecentType.collabChat]: Loc.getMessage('IM_LIST_COLLAB_V2_EMPTY_CHAT_TITLE'),
	[RecentType.calendar]: Loc.getMessage('IM_LIST_COLLAB_V2_EMPTY_CALENDAR_TITLE'),
};

const SubtitleByType = {
	[RecentType.taskComments]: Loc.getMessage('IM_LIST_COLLAB_V2_EMPTY_TASK_SUBTITLE'),
	[RecentType.collabChat]: Loc.getMessage('IM_LIST_COLLAB_V2_EMPTY_CHAT_SUBTITLE'),
	[RecentType.calendar]: Loc.getMessage('IM_LIST_COLLAB_V2_EMPTY_CALENDAR_SUBTITLE'),
};

// @vue/component
export const CollabNestedEmptyState = {
	name: 'CollabNestedEmptyState',
	components: { RecentEmptyState },
	props: {
		type: {
			type: String,
			required: true,
		},
	},
	computed: {
		title(): string
		{
			return TitleByType[this.type];
		},
		subtitle(): string
		{
			return SubtitleByType[this.type];
		},
	},
	template: `
		<RecentEmptyState :title="title" :subtitle="subtitle" :recentSection="type" />
	`,
};
