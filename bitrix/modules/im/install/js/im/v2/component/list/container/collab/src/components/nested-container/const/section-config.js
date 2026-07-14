import { Loc } from 'main.core';
import { type ComponentOptions } from 'ui.vue3';

import {
	CollabNestedTaskList,
	CollabNestedDefaultList,
	CollabNestedCalendarList,
	CollabNestedChatList,
	CollabNestedTaskUnreadList,
	CollabNestedDefaultUnreadList,
	CollabNestedCalendarUnreadList,
	CollabNestedChatUnreadList,
} from 'im.v2.component.list.items.collab';
import { RecentType, type RecentTypeItem } from 'im.v2.const';

export type CollabSectionItem = {
	type: RecentTypeItem,
	title: string,
	component: ComponentOptions,
	unreadComponent: ComponentOptions,
};

export const CollabSectionConfig: Record<RecentTypeItem, CollabSectionItem> = {
	[RecentType.collabDefault]: {
		type: RecentType.collabDefault,
		title: Loc.getMessage('IM_LIST_CONTAINER_COLLAB_SECTION_DEFAULT'),
		component: CollabNestedDefaultList,
		unreadComponent: CollabNestedDefaultUnreadList,
	},
	[RecentType.taskComments]: {
		type: RecentType.taskComments,
		title: Loc.getMessage('IM_LIST_CONTAINER_COLLAB_SECTION_TASK_COMMENTS'),
		component: CollabNestedTaskList,
		unreadComponent: CollabNestedTaskUnreadList,
	},
	[RecentType.collabChat]: {
		type: RecentType.collabChat,
		title: Loc.getMessage('IM_LIST_CONTAINER_COLLAB_SECTION_CHATS_MSGVER_2'),
		component: CollabNestedChatList,
		unreadComponent: CollabNestedChatUnreadList,
	},
	[RecentType.calendar]: {
		type: RecentType.calendar,
		title: Loc.getMessage('IM_LIST_CONTAINER_COLLAB_SECTION_CALENDAR'),
		component: CollabNestedCalendarList,
		unreadComponent: CollabNestedCalendarUnreadList,
	},
};
