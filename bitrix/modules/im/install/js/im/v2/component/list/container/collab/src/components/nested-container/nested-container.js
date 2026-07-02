import { Loc, type JsonObject } from 'main.core';
import { type BitrixVueComponentProps } from 'ui.vue3';

import { RecentType, type RecentTypeItem } from 'im.v2.const';
import { RecentListSlider } from 'im.v2.component.list.container.elements.list-slider';
import { CollabNestedTaskList, CollabNestedDefaultList, CollabNestedCalendarList, CollabNestedChatList } from 'im.v2.component.list.items.collab';
import { LayoutManager } from 'im.v2.lib.layout';
import { type ImModelChat, type ImModelLayout } from 'im.v2.model';

import { NestedListNavigation } from './components/navigation';
import { NestedListToolbar } from './components/toolbar';
import { NestedListHeader } from './components/header';

import './css/nested-container.css';

export type CollabSectionItem = {
	type: RecentTypeItem,
	title: string,
	component: BitrixVueComponentProps,
};

const CollabSections: Record<RecentTypeItem, CollabSectionItem> = {
	[RecentType.collabDefault]: {
		type: RecentType.collabDefault,
		title: Loc.getMessage('IM_LIST_CONTAINER_COLLAB_SECTION_DEFAULT'),
		component: CollabNestedDefaultList,
	},
	[RecentType.taskComments]: {
		type: RecentType.taskComments,
		title: Loc.getMessage('IM_LIST_CONTAINER_COLLAB_SECTION_TASK_COMMENTS'),
		component: CollabNestedTaskList,
	},
	[RecentType.collabChat]: {
		type: RecentType.collabChat,
		title: Loc.getMessage('IM_LIST_CONTAINER_COLLAB_SECTION_CHATS_MSGVER_2'),
		component: CollabNestedChatList,
	},
	[RecentType.calendar]: {
		type: RecentType.calendar,
		title: Loc.getMessage('IM_LIST_CONTAINER_COLLAB_SECTION_CALENDAR'),
		component: CollabNestedCalendarList,
	},
};

// @vue/component
export const CollabNestedListContainer = {
	name: 'CollabNestedListContainer',
	components: { RecentListSlider, NestedListNavigation, NestedListHeader, NestedListToolbar },
	props: {
		parentChatId: {
			type: Number,
			required: true,
		},
	},
	emits: ['selectChat', 'close'],
	data(): JsonObject
	{
		return {
			currentSection: RecentType.collabDefault,
		};
	},
	computed: {
		layout(): ImModelLayout
		{
			return this.$store.getters['application/getLayout'];
		},
		parentChat(): ImModelChat
		{
			return this.$store.getters['chats/getByChatId'](this.parentChatId, true);
		},
		listComponent(): ?BitrixVueComponentProps
		{
			const matchingItem = CollabSections[this.currentSection];
			if (!matchingItem)
			{
				return null;
			}

			return matchingItem.component;
		},
		navigationSections(): CollabSectionItem[]
		{
			return Object.values(CollabSections);
		},
	},
	methods: {
		onBeforeClose()
		{
			if (LayoutManager.getInstance().isChatLayout(this.layout.name))
			{
				LayoutManager.getInstance().clearCurrentLayoutEntityId();
			}
		},
		onAfterClose()
		{
			this.$emit('close');
		},
		onSelectSection(selectedSection: RecentTypeItem)
		{
			this.currentSection = selectedSection;
		},
	},
	template: `
		<RecentListSlider @beforeClose="onBeforeClose" @afterClose="onAfterClose">
			<template #header>
				<NestedListHeader :title="parentChat.name" />
			</template>
			<template #subheader>
				<NestedListToolbar :parentChatId="parentChatId" />
				<NestedListNavigation
					:parentChatId="parentChatId"
					:sections="navigationSections"
					:currentSection="currentSection"
					@selectSection="onSelectSection"
				/>
			</template>
			<template #content>
				<KeepAlive>
					<component
						:is="listComponent"
						:parentChatId="parentChatId"
						@selectChat="$emit('selectChat', $event)"
						@loadError="$emit('close')"
					/>
				</KeepAlive>
			</template>
		</RecentListSlider>
	`,
};
