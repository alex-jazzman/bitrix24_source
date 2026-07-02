import { Loc, type JsonObject } from 'main.core';
import { type PopupOptions } from 'main.popup';

import { Messenger } from 'im.public';
import { Core } from 'im.v2.application.core';
import { ActionByRole, ChatType, TabId, LocalStorageKey } from 'im.v2.const';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { LocalStorageManager } from 'im.v2.lib.local-storage';
import { MessengerPopup } from 'im.v2.component.elements.popup';
import { Notifier } from 'im.v2.lib.notifier';
import { Utils } from 'im.v2.lib.utils';
import { PermissionManager } from 'im.v2.lib.permission';
import { ChatService } from 'im.v2.provider.service.chat';
import { type ImModelChat } from 'im.v2.model';

import { AddGuestContent } from '../elements/add-guest-content/add-guest-content';
import { TabsWrapper } from '../elements/tabs-wrapper/tabs-wrapper';
import { AddToChatContent } from '../elements/add-to-chat-content/add-to-chat-content';
import { CopyInviteLink } from '../elements/copy-invite-link/copy-invite-link';
import { GuestInvitationService } from './classes/guest-invitation-service';
import { ChatInvitationInput } from './components/invitation-input';

import './css/add-to-chat.css';

const POPUP_ID = 'im-add-to-chat-popup';
const ARTICLE_CODE = '28188420';

// @vue/component
export const AddToChat = {
	name: 'AddToChat',
	components: { MessengerPopup, AddToChatContent, TabsWrapper, AddGuestContent, CopyInviteLink, ChatInvitationInput },
	props: {
		bindElement: {
			type: Object,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
		popupConfig: {
			type: Object,
			required: true,
		},
	},
	emits: ['close'],
	data(): JsonObject
	{
		return {
			isLoading: false,
			activeTabId: TabId.guests,
			isCopyingInviteLink: false,
			isUpdatingInviteLink: false,
			inviteInputValue: '',
			isInvitingGuests: false,
		};
	},
	computed: {
		POPUP_ID: () => POPUP_ID,
		ARTICLE_CODE: () => ARTICLE_CODE,
		config(): PopupOptions
		{
			return {
				titleBar: Loc.getMessage('IM_ENTITY_SELECTOR_ADD_TO_CHAT_ADD_MEMBERS_TITLE_MSGVER_1'),
				closeIcon: true,
				bindElement: this.bindElement,
				offsetTop: this.popupConfig.offsetTop,
				offsetLeft: this.popupConfig.offsetLeft,
				padding: 0,
				contentPadding: 0,
				contentBackground: '#fff',
				className: 'bx-im-entity-selector-add-to-chat__scope',
			};
		},
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		isGuestTab(): boolean
		{
			return this.tabsEnabled && this.activeTabId === TabId.guests;
		},
		isChat(): boolean
		{
			return this.dialog.type !== ChatType.user;
		},
		chatId(): number
		{
			return this.dialog.chatId;
		},
		guestDescriptionTitle(): string
		{
			return Loc.getMessage('IM_ENTITY_SELECTOR_ADD_TO_CHAT_DESCRIPTION_TITLE_EMPLOYEE');
		},
		guestDescription(): string
		{
			return Loc.getMessage('IM_ENTITY_SELECTOR_ADD_TO_CHAT_DESCRIPTION_TEXT_GUEST');
		},
		isAddButtonDisabled(): boolean
		{
			return !this.inviteInputValue;
		},
		canUpdateLink(): boolean
		{
			return PermissionManager.getInstance().canPerformActionByRole(ActionByRole.updateGuestLink, this.dialogId);
		},
		isChatWithGuestsAvailable(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isChatWithGuestsAvailable);
		},
		tabsEnabled(): boolean
		{
			return this.dialog.type === ChatType.chat && this.isChatWithGuestsAvailable;
		},
	},
	created()
	{
		this.chatService = new ChatService();
	},
	mounted()
	{
		const savedTab = LocalStorageManager.getInstance().get(LocalStorageKey.invitePopupTab);
		if (this.tabsEnabled && savedTab)
		{
			this.activeTabId = savedTab;
		}
	},
	methods: {
		inviteMembers(event: { members: Array<string | number>, showHistory: boolean })
		{
			const { members, showHistory } = event;

			if (this.isChat)
			{
				this.extendChat(members, showHistory);
			}
			else
			{
				members.push(this.dialogId, Core.getUserId());
				void this.extendToGroupChat(members);
			}
		},
		extendChat(members: Array<string | number>, showHistory: boolean)
		{
			this.isLoading = true;
			this.chatService.addToChat({
				chatId: this.chatId,
				members,
				showHistory,
			}).then(() => {
				this.isLoading = false;
				this.$emit('close');
			}).catch(() => {
				this.isLoading = false;
				this.$emit('close');
			});
		},
		async extendToGroupChat(members: number[])
		{
			this.isLoading = true;
			const { newDialogId } = await this.chatService.extendToGroupChat({
				users: members,
				ownerId: Core.getUserId(),
			}).catch(() => {
				this.isLoading = false;
			});
			this.isLoading = false;
			this.$emit('close');
			void Messenger.openChat(newDialogId);
		},
		onTabSwitch(tabId: string)
		{
			this.activeTabId = tabId;
		},
		async copyInviteLink()
		{
			try
			{
				this.isCopyingInviteLink = true;
				const inviteLink = await new GuestInvitationService().generateInviteLink(this.chatId);
				await Utils.text.copyToClipboard(inviteLink.sharingLink.url);
				Notifier.onCopyLinkComplete();
			}
			catch
			{
				Notifier.onDefaultError();
			}
			finally
			{
				this.isCopyingInviteLink = false;
			}
		},
		async updateLink()
		{
			try
			{
				this.isUpdatingInviteLink = true;
				await new GuestInvitationService().updateLink(this.chatId);
				Notifier.onUpdateLinkComplete();
			}
			catch
			{
				Notifier.onDefaultError();
			}
			finally
			{
				this.isUpdatingInviteLink = false;
			}
		},
		async addGuest()
		{
			this.isInvitingGuests = true;
			this.isInvitingGuests = false;
			this.$emit('close');
		},
	},
	template: `
		<MessengerPopup
			:config="config"
			:id="POPUP_ID"
			@close="$emit('close')"
		>
			<TabsWrapper
				v-if="tabsEnabled"
				:activeTabId="activeTabId"
				@onTabSwitch="onTabSwitch"
			/>
			<KeepAlive>
				<AddGuestContent
					v-if="isGuestTab"
					:chatId="chatId"
					:articleCode="ARTICLE_CODE"
					:guestTitle="guestDescriptionTitle"
					:guestDescription="guestDescription"
					:isAddButtonDisabled="isAddButtonDisabled"
					:isInvitingGuests="isInvitingGuests"
					:isHideLangSelector="true"
					class="bx-im-add-to-chat-guest-tab__scope"
					@addGuest="addGuest"
					@close="$emit('close')"
				>
					<template #copy-link>
						<CopyInviteLink
							:dialogId="dialogId"
							:canUpdateLink="canUpdateLink"
							:isUpdatingInviteLink="isUpdatingInviteLink"
							:isCopyingInviteLink="isCopyingInviteLink"
							@onUpdateInviteLink="updateLink"
							@onCopyInviteLink="copyInviteLink"
						/>
					</template>
					<template #invitation-input>
						<ChatInvitationInput v-model="inviteInputValue"/>
					</template>
				</AddGuestContent>
				<AddToChatContent
					v-else
					:dialogId="dialogId"
					class="bx-im-add-to-chat-guest-tab__scope"
					@inviteMembers="inviteMembers"
					@close="$emit('close')"
				/>
			</KeepAlive>
		</MessengerPopup>
	`,
};
