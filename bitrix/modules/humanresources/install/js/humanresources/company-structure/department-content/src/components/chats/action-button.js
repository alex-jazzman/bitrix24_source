import { useChartStore } from 'humanresources.company-structure.chart-store';
import { ChatListActionMenu, MenuActions } from 'humanresources.company-structure.org-chart';
import { ConfirmationPopup, RouteActionMenu } from 'humanresources.company-structure.structure-components';
import { ChatTypes, EntityTypes } from 'humanresources.company-structure.utils';
import { UI } from 'ui.notification';
import { mapState } from 'ui.vue3.pinia';
import { DepartmentContentActions } from '../../actions';
import { DepartmentAPI } from '../../api';
import { Messenger } from 'im.public.iframe';

// @vue/component
export const ChatListItemActionButton = {
	name: 'chatListItemActionButton',

	components: {
		RouteActionMenu,
		ConfirmationPopup,
	},

	props: {
		/** @type ChatOrChannelDetailed */
		chat: {
			type: Object,
			required: true,
		},
		nodeId: {
			type: Number,
			required: true,
		},
	},

	data(): Object
	{
		return {
			menuVisible: false,
			showUnbindChatConfirmationPopup: false,
			unbindChatLoader: false,
		};
	},

	computed: {
		getUnbindChatTitle(): string
		{
			const entityType = this.isTeamEntity ? 'TEAM' : 'DEPARTMENT';
			const chatType = this.isChat ? 'CHAT' : 'CHANNEL';

			return this.loc(`HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_UNBIND_POPUP_${chatType}_FROM_${entityType}_TITLE`);
		},
		getUnbindChatDescription(): string
		{
			const entityType = this.isTeamEntity ? 'TEAM' : 'DEPARTMENT';
			const chatType = this.isChat ? 'CHAT' : 'CHANNEL';

			return this.loc(`HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_UNBIND_POPUP_${chatType}_FROM_${entityType}_DESCRIPTION`);
		},
		isTeamEntity(): boolean
		{
			return this.departments.get(this.nodeId)?.entityType === EntityTypes.team;
		},
		isChat(): boolean
		{
			return this.chat.type === ChatTypes.chat;
		},
		menu(): ChatListActionMenu
		{
			const entityType = this.departments.get(this.nodeId)?.entityType;

			return new ChatListActionMenu(entityType, this.chat, this.nodeId);
		},
		...mapState(useChartStore, ['departments']),
	},

	methods:
	{
		toggleMenu(): void
		{
			this.menuVisible = !this.menuVisible;
		},
		loc(phraseCode: string, replacements: { [p: string]: string } = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
		onActionMenuItemClick(actionId: string): void
		{
			if (actionId === MenuActions.openChat)
			{
				Messenger.openChat(this.chat.dialogId);
			}
			else if (actionId === MenuActions.unbindChat)
			{
				this.showUnbindChatConfirmationPopup = true;
			}
		},
		cancelUnbindChat(): void
		{
			this.showUnbindChatConfirmationPopup = false;
		},
		async unbindChat(): Promise<void>
		{
			this.unbindChatLoader = true;
			const entityType = this.isTeamEntity ? 'TEAM' : 'DEPARTMENT';
			const chatType = this.isChat ? 'CHAT' : 'CHANNEL';

			try
			{
				await DepartmentAPI.updateChats(this.nodeId, [], [this.chat.id]);
			}
			catch (error)
			{
				if (error.code !== 'STRUCTURE_ACCESS_DENIED')
				{
					UI.Notification.Center.notify({
						content: this.loc(`HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_UNBIND_POPUP_${chatType}_FROM_${entityType}_ERROR`),
						autoHideDelay: 2000,
					});
				}

				return;
			}
			finally
			{
				this.unbindChatLoader = false;
				this.showUnbindChatConfirmationPopup = false;
			}

			DepartmentContentActions.unbindChatFromNode(this.nodeId, this.chat.id);

			const isOwnChat = !this.chat.originalNodeId || this.chat.originalNodeId === this.nodeId;

			if (isOwnChat)
			{
				DepartmentContentActions.updateChatsInChildrenNodes(
					this.nodeId,
				);
			}

			UI.Notification.Center.notify({
				content: this.loc(`HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_UNBIND_POPUP_${chatType}_FROM_${entityType}_SUCCESS`),
				autoHideDelay: 2000,
			});
		},
	},

	template: `
		<button
			v-if="menu.items.length"
			class="ui-icon-set --more hr-department-detail-content__tab-list_item-action-btn --chat-item-action-btn ui-icon-set"
			:class="{ '--focused': menuVisible }"
			@click.stop="toggleMenu()"
			ref="actionChatButton"
			:data-id="'hr-department-detail-content__'+ chat.type.toLowerCase() + '-list_chat-' + chat.id + '-action-btn'"
		/>
		<RouteActionMenu
			v-if="menuVisible"
			:id="'tree-node-department-menu-chat_' + this.nodeId + '_' + chat.id"
			:items="menu.items"
			:width="302"
			:bindElement="$refs.actionChatButton"
			@action="onActionMenuItemClick"
			@close="menuVisible = false"
		/>
		<ConfirmationPopup
			ref="unbindChatConfirmationPopup"
			v-if="showUnbindChatConfirmationPopup"
			:showActionButtonLoader="unbindChatLoader"
			:title="getUnbindChatTitle"
			:confirmBtnText="loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_UNBIND_POPUP_CONFIRM_BUTTON')"
			confirmButtonClass="ui-btn-danger"
			@action="unbindChat"
			@close="cancelUnbindChat"
			:width="364"
		>
			<template v-slot:content>
				<div class="hr-department-detail-content__user-action-text-container">
					<div
						v-html="getUnbindChatDescription"
					/>
				</div>
			</template>
		</ConfirmationPopup>
	`,
};
