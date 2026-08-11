import { Loc, type JsonObject } from 'main.core';
import { type PopupOptions } from 'main.popup';

import { Messenger } from 'im.public';
import { Core } from 'im.v2.application.core';
import { MessengerPopup } from 'im.v2.component.elements.popup';
import { ActionByRole, ChatType, TabId, LocalStorageKey, ActionByUserType } from 'im.v2.const';
import { FeatureManager, Feature } from 'im.v2.lib.feature';
import { GuestManager } from 'im.v2.lib.guest';
import { LocalStorageManager } from 'im.v2.lib.local-storage';
import { Notifier } from 'im.v2.lib.notifier';
import { PermissionManager } from 'im.v2.lib.permission';
import { Utils } from 'im.v2.lib.utils';
import { type ImModelChat } from 'im.v2.model';
import { ChatService } from 'im.v2.provider.service.chat';
import { GuestInvitationService, InvitationType } from 'im.v2.provider.service.guest-invitation';

import { AddGuestContent } from '../elements/add-guest-content/add-guest-content';
import { AddToChatContent } from '../elements/add-to-chat-content/add-to-chat-content';
import { CopyInviteLink } from '../elements/copy-invite-link/copy-invite-link';
import { TabsWrapper } from '../elements/tabs-wrapper/tabs-wrapper';
import { ChatInvitationInput } from './components/invitation-input';
import { type Candidate } from './const/invitation.js';

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
			isInvitingGuests: false,
			isAddButtonDisabled: true,
			candidates: [],
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
			if (!this.canInviteGuests)
			{
				return false;
			}

			return this.activeTabId === TabId.guests;
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
		isPhoneInviteAvailable(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.inviteByPhoneAvailable);
		},
		canManageGuestLinks(): boolean
		{
			const permissionManager = PermissionManager.getInstance();
			const canPerformActionByRole = permissionManager.canPerformActionByRole(
				ActionByRole.manageGuestLink,
				this.dialogId,
			);
			const canPerformActionByUserType = permissionManager.canPerformActionByUserType(ActionByUserType.manageGuestLink);

			return canPerformActionByRole && canPerformActionByUserType;
		},
		isChatWithGuestsAvailable(): boolean
		{
			return GuestManager.getInstance().isGuestLinkAvailable(this.dialogId);
		},
		canInviteGuests(): boolean
		{
			if (!this.isChatWithGuestsAvailable)
			{
				return false;
			}

			return this.canManageGuestLinks;
		},
	},
	created()
	{
		this.chatService = new ChatService();
	},
	mounted()
	{
		const savedTab = LocalStorageManager.getInstance().get(LocalStorageKey.invitePopupTab);
		if (this.canInviteGuests && savedTab)
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
				const sharingLink = await new GuestInvitationService().generateInviteLink(this.chatId);
				await Utils.text.copyToClipboard(sharingLink.url);
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
		onInvitationInputValidityChange(isValid: boolean)
		{
			this.isAddButtonDisabled = !isValid;
		},
		onInvitationInputChange(candidates: Candidate[])
		{
			this.candidates = candidates;
		},
		async addGuest()
		{
			if (this.isAddButtonDisabled)
			{
				return;
			}

			this.isInvitingGuests = true;
			const result = await this.sendGuestInvitations();
			this.showGuestInvitationsResult(result);
			this.isInvitingGuests = false;
			this.$emit('close');
		},
		async sendGuestInvitations(): Promise<Array<{status: 'fulfilled' | 'rejected', ...}>>
		{
			const emails = this.candidates
				.filter((candidate) => candidate.type === InvitationType.email)
				.map((candidate) => ({ email: candidate.value }));
			const phones = this.candidates
				.filter((candidate) => candidate.type === InvitationType.phone)
				.map((candidate) => ({ phone: candidate.value }));

			const invitationService = new GuestInvitationService();
			const tasks = [];
			if (emails.length > 0)
			{
				tasks.push(invitationService.inviteByEmail(this.chatId, emails));
			}

			if (phones.length > 0)
			{
				tasks.push(invitationService.inviteByPhone(this.chatId, phones));
			}

			return Promise.allSettled(tasks);
		},
		showGuestInvitationsResult(results: Array<{status: 'fulfilled' | 'rejected', ...}>)
		{
			const failed = results.filter((result) => result.status === 'rejected').length;

			const isAllFailed = failed > 0 && failed === results.length;
			const isAnyFailed = failed > 0 && failed < results.length;
			if (isAllFailed)
			{
				Notifier.onDefaultError();
			}
			else if (isAnyFailed)
			{
				Notifier.invite.onPartialError();
			}
		},
	},
	template: `
		<MessengerPopup
			:config="config"
			:id="POPUP_ID"
			@close="$emit('close')"
		>
			<TabsWrapper
				v-if="canInviteGuests"
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
							:canUpdateLink="canManageGuestLinks"
							:isUpdatingInviteLink="isUpdatingInviteLink"
							:isCopyingInviteLink="isCopyingInviteLink"
							@onUpdateInviteLink="updateLink"
							@onCopyInviteLink="copyInviteLink"
						/>
					</template>
					<template #invitation-input>
						<ChatInvitationInput
							:isPhoneAllowed="isPhoneInviteAvailable"
							@change="onInvitationInputChange"
							@validityChange="onInvitationInputValidityChange"
						/>
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
