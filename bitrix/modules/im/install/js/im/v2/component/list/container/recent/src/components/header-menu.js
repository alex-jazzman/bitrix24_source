import { FeatureManager, Feature } from 'im.v2.lib.feature';
import { ChatService } from 'im.v2.provider.service.chat';
import { MenuItem } from 'im.v2.component.elements.menu';
import { BaseHeaderMenu } from 'im.v2.component.list.container.elements.base-header-menu';

// @vue/component
export const HeaderMenu = {
	components: { BaseHeaderMenu, MenuItem },
	props:
	{
		unreadOnlyMode: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['toggleUnreadMode'],
	computed:
	{
		unreadCounter(): number
		{
			const counter = this.$store.getters['counters/getTotalChatCounter'];

			return this.unreadOnlyMode ? 0 : counter;
		},
		isUnreadRecentModeAvailable(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.unreadRecentModeAvailable);
		},
	},
	methods:
	{
		async onReadAllClick(closeCallback: () => void)
		{
			(new ChatService()).readAll();

			closeCallback();
		},
		onToggleUnreadMode(closeCallback: () => void)
		{
			this.$emit('toggleUnreadMode');

			closeCallback();
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<BaseHeaderMenu>
			<template #menu-items="{ closeCallback }">
				<MenuItem
					:title="loc('IM_RECENT_HEADER_MENU_READ_ALL_MSGVER_1')"
					@click="onReadAllClick(closeCallback)"
				/>
				<MenuItem
					v-if="isUnreadRecentModeAvailable"
					:title="loc('IM_RECENT_HEADER_MENU_SHOW_UNREAD_ONLY_MSGVER_2')"
					:counter="unreadCounter"
					@click="onToggleUnreadMode(closeCallback)"
				/>
				<MenuItem
					v-if="false"
					:title="loc('IM_RECENT_HEADER_MENU_CHAT_GROUPS_TITLE')"
					:subtitle="loc('IM_RECENT_HEADER_MENU_CHAT_GROUPS_SUBTITLE')"
					:disabled="true"
				/>
			</template>
		</BaseHeaderMenu>
	`,
};
