import { Loc } from 'main.core';
import { type ComponentOptions } from 'ui.vue3';

import {
	CollabNestedTaskList,
	CollabNestedDefaultList,
	CollabNestedCalendarList,
	CollabNestedChatList,
	CollabNestedCopilotList,
	CollabNestedTaskUnreadList,
	CollabNestedDefaultUnreadList,
	CollabNestedCalendarUnreadList,
	CollabNestedChatUnreadList,
	CollabNestedCopilotUnreadList,
} from 'im.v2.component.list.items.collab';
import { CopilotManager } from 'im.v2.lib.copilot';
import { FeatureManager, Feature } from 'im.v2.lib.feature';
import { RecentType, type RecentTypeItem } from 'im.v2.const';

export type CollabSectionItem = {
	type: RecentTypeItem,
	component: ComponentOptions,
	unreadComponent: ComponentOptions,
	getTitle: () => string,
	isAvailable: () => boolean,
};

const getCopilotTitle = () => Loc.getMessage('IM_LIST_CONTAINER_COLLAB_SECTION_COPILOT', {
	'#COPILOT_NAME#': (new CopilotManager()).getName(),
});

export const CollabSectionConfig: Record<RecentTypeItem, CollabSectionItem> = {
	[RecentType.collabDefault]: {
		type: RecentType.collabDefault,
		component: CollabNestedDefaultList,
		unreadComponent: CollabNestedDefaultUnreadList,
		getTitle: () => Loc.getMessage('IM_LIST_CONTAINER_COLLAB_SECTION_DEFAULT'),
		isAvailable: () => true,
	},
	[RecentType.taskComments]: {
		type: RecentType.taskComments,
		component: CollabNestedTaskList,
		unreadComponent: CollabNestedTaskUnreadList,
		getTitle: () => Loc.getMessage('IM_LIST_CONTAINER_COLLAB_SECTION_TASK_COMMENTS'),
		isAvailable: () => true,
	},
	[RecentType.collabChat]: {
		type: RecentType.collabChat,
		component: CollabNestedChatList,
		unreadComponent: CollabNestedChatUnreadList,
		getTitle: () => Loc.getMessage('IM_LIST_CONTAINER_COLLAB_SECTION_CHATS_MSGVER_2'),
		isAvailable: () => true,
	},
	[RecentType.copilot]: {
		type: RecentType.copilot,
		component: CollabNestedCopilotList,
		unreadComponent: CollabNestedCopilotUnreadList,
		getTitle: getCopilotTitle,
		isAvailable: () => FeatureManager.isFeatureAvailable(Feature.copilotAvailable),
	},
	[RecentType.calendar]: {
		type: RecentType.calendar,
		component: CollabNestedCalendarList,
		unreadComponent: CollabNestedCalendarUnreadList,
		getTitle: () => Loc.getMessage('IM_LIST_CONTAINER_COLLAB_SECTION_CALENDAR'),
		isAvailable: () => true,
	},
};
