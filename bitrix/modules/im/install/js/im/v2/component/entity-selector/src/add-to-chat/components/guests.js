import { Loc, type JsonObject } from 'main.core';

import { Analytics } from 'im.v2.lib.analytics';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { Notifier } from 'im.v2.lib.notifier';
import { Utils } from 'im.v2.lib.utils';
import { type ImModelChat } from 'im.v2.model';
import { GuestInvitationService, InvitationType } from 'im.v2.provider.service.guest-invitation';

import { AddGuestContent } from '../../elements/add-guest-content/add-guest-content';
import { CopyInviteLink } from '../../elements/copy-invite-link/copy-invite-link';
import { type Candidate } from '../const/invitation.js';
import { ChatInvitationInput } from './invitation-input';

const ARTICLE_CODE = '28188420';

// @vue/component
export const AddToChatGuests = {
	name: 'AddToChatGuests',
	components: { AddGuestContent, CopyInviteLink, ChatInvitationInput },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
		canUpdateLink: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['close'],
	data(): JsonObject
	{
		return {
			isCopyingInviteLink: false,
			isUpdatingInviteLink: false,
			isInvitingGuests: false,
			isAddButtonDisabled: true,
			candidates: [],
		};
	},
	computed: {
		ARTICLE_CODE: () => ARTICLE_CODE,
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
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
	},
	methods: {
		async copyInviteLink()
		{
			try
			{
				this.isCopyingInviteLink = true;
				const sharingLink = await new GuestInvitationService().generateInviteLink(this.chatId);
				await Utils.text.copyToClipboard(sharingLink.url);
				Notifier.onCopyLinkComplete();
				Analytics.getInstance().guest.onCopyGuestInviteLink(this.dialogId);
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
				const sharingLink = await new GuestInvitationService().updateLink(this.chatId);

				try
				{
					await Utils.text.copyToClipboard(sharingLink.url);
					Notifier.onCopyLinkComplete();
				}
				catch
				{
					Notifier.onUpdateLinkComplete();
				}
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
		<AddGuestContent
			:chatId="chatId"
			:articleCode="ARTICLE_CODE"
			:guestTitle="guestDescriptionTitle"
			:guestDescription="guestDescription"
			:isAddButtonDisabled="isAddButtonDisabled"
			:isInvitingGuests="isInvitingGuests"
			:isHideLangSelector="true"
			class="bx-im-add-to-chat-guest-tab__scope"
			data-testid="im-add-to-chat-guests"
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
				<ChatInvitationInput
					:isPhoneAllowed="isPhoneInviteAvailable"
					data-testid="im-add-to-chat-invite-input"
					@change="onInvitationInputChange"
					@validityChange="onInvitationInputValidityChange"
				/>
			</template>
		</AddGuestContent>
	`,
};
