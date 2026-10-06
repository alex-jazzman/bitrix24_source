import { Loc } from 'main.core';

import { RecentType } from 'im.v2.const';
import { CopilotManager } from 'im.v2.lib.copilot';
import { RecentEmptyState } from 'im.v2.component.list.items.elements.empty-state';

const TitleByTypeHandler = {
	[RecentType.taskComments]: () => Loc.getMessage('IM_LIST_COLLAB_V2_EMPTY_TASK_TITLE'),
	[RecentType.collabChat]: () => Loc.getMessage('IM_LIST_COLLAB_V2_EMPTY_CHAT_TITLE'),
	[RecentType.calendar]: () => Loc.getMessage('IM_LIST_COLLAB_V2_EMPTY_CALENDAR_TITLE'),
	[RecentType.copilot]: () => Loc.getMessage('IM_LIST_COLLAB_V2_EMPTY_COPILOT_TITLE', {
		'#COPILOT_NAME#': (new CopilotManager()).getName(),
	}),
};

const SubtitleByTypeHandler = {
	[RecentType.taskComments]: () => Loc.getMessage('IM_LIST_COLLAB_V2_EMPTY_TASK_SUBTITLE'),
	[RecentType.collabChat]: () => Loc.getMessage('IM_LIST_COLLAB_V2_EMPTY_CHAT_SUBTITLE'),
	[RecentType.calendar]: () => Loc.getMessage('IM_LIST_COLLAB_V2_EMPTY_CALENDAR_SUBTITLE'),
	[RecentType.copilot]: () => Loc.getMessage('IM_LIST_COLLAB_V2_EMPTY_COPILOT_SUBTITLE'),
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
			return TitleByTypeHandler[this.type]();
		},
		subtitle(): string
		{
			return SubtitleByTypeHandler[this.type]();
		},
	},
	template: `
		<RecentEmptyState :title="title" :subtitle="subtitle" :recentSection="type" />
	`,
};
