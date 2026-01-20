import { FeatureManager, Feature } from 'im.v2.lib.feature';
import { ChatService } from 'im.v2.provider.service.chat';
import { MenuItem } from 'im.v2.component.elements.menu';
import { showReadMessagesConfirm } from 'im.v2.lib.confirm';
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
		unreadToggleTitle(): string
		{
			return this.unreadOnlyMode
				? this.loc('IM_RECENT_HEADER_MENU_SHOW_ALL')
				: this.loc('IM_RECENT_HEADER_MENU_SHOW_UNREAD_ONLY_MSGVER_1');
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
			const confirmResult = await showReadMessagesConfirm(this.loc('IM_RECENT_HEADER_MENU_READ_ALL_CONFIRM_TEXT'));

			if (!confirmResult)
			{
				return;
			}

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
					:title="unreadToggleTitle"
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
