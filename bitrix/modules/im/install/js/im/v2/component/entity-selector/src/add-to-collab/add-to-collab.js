import { type JsonObject } from 'main.core';
import { type PopupOptions } from 'main.popup';
import { FeaturePromoter } from 'ui.info-helper';
import { InvitationInput } from 'intranet.invitation-input';

import { SliderCode, TabId, ActionByRole } from 'im.v2.const';
import { Core } from 'im.v2.application.core';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { PermissionManager } from 'im.v2.lib.permission';
import { Notifier } from 'im.v2.lib.notifier';
import { Utils } from 'im.v2.lib.utils';
import { CollabManager } from 'im.v2.lib.collab';
import { MessengerPopup } from 'im.v2.component.elements.popup';
import { type ImModelChat, type ImModelCollabInfo } from 'im.v2.model';
import { CollabInvitationService } from 'im.v2.provider.service.collab-invitation';

import { TabsWrapper } from '../elements/tabs-wrapper/tabs-wrapper';
import { AddGuestContent } from '../elements/add-guest-content/add-guest-content';
import { CopyInviteLink } from '../elements/copy-invite-link/copy-invite-link';
import { AddEmployeesTab } from './components/add-employees-tab';

import './css/add-to-collab.css';

const POPUP_ID = 'im-add-to-collab-popup';

// @vue/component
export const AddToCollab = {
	name: 'AddToCollab',
	components: { MessengerPopup, AddGuestContent, AddEmployeesTab, TabsWrapper, CopyInviteLink },
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
			activeTabId: TabId.employees,
			isCopyingInviteLink: false,
			isUpdatingInviteLink: false,
			isAddButtonDisabled: true,
			isInvitingGuests: false,
			invitationLangCode: '',
		};
	},
	computed: {
		POPUP_ID: () => POPUP_ID,
		config(): PopupOptions
		{
			return {
				titleBar: CollabManager.getInviteHeaderText(),
				closeIcon: true,
				bindElement: this.bindElement,
				offsetTop: this.popupConfig.offsetTop,
				offsetLeft: this.popupConfig.offsetLeft,
				padding: 0,
				contentPadding: 0,
				contentBackground: '#fff',
				className: 'bx-im-add-to-collab__scope',
			};
		},
		defaultLanguageCode(): string
		{
			return Core.getLanguageId();
		},
		isGuestTab(): boolean
		{
			return this.activeTabId === TabId.guests;
		},
		isEnabledCollabersInvitation(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.enabledCollabersInvitation);
		},
		isCollabV2Available(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isCollabV2Available);
		},
		chatId(): number
		{
			const chat: ImModelChat = this.$store.getters['chats/get'](this.dialogId, true);

			return chat.chatId;
		},
		collabChatId(): number
		{
			const collab: ImModelCollabInfo = this.$store.getters['chats/collabs/getByChatId'](this.chatId);

			return collab.collabId;
		},
		guestDescription(): string
		{
			return CollabManager.getInviteDescriptionText();
		},
		guestDescriptionTitle(): string
		{
			return CollabManager.getInviteTitleText();
		},
		helpdeskArticleCode(): string
		{
			return CollabManager.getInviteArticleCode();
		},
		canUpdateLink(): boolean
		{
			return PermissionManager.getInstance().canPerformActionByRole(ActionByRole.updateInviteLink, this.dialogId);
		},
	},
	watch: {
		activeTabId()
		{
			this.initInvitationInput();
		},
	},
	created()
	{
		this.setInitialActiveTab();
	},
	mounted()
	{
		this.initInvitationInput();
	},
	beforeUnmount()
	{
		this.destroyInvitationInput();
	},
	methods: {
		setInitialActiveTab()
		{
			if (this.isEnabledCollabersInvitation && !this.isCollabV2Available)
			{
				this.activeTabId = TabId.guests;
			}
		},
		onTabSwitch(tabId: string)
		{
			this.activeTabId = tabId;
		},
		onInvitationGuest()
		{
			if (!this.isEnabledCollabersInvitation)
			{
				this.showHelper();
			}
		},
		showHelper()
		{
			new FeaturePromoter({ code: SliderCode.collabInviteOff }).show();
		},
		async copyInviteLink()
		{
			if (!this.isEnabledCollabersInvitation)
			{
				this.showHelper();

				return;
			}

			try
			{
				this.isCopyingInviteLink = true;
				const link = await new CollabInvitationService().copyLink(this.collabChatId, this.invitationLangCode);
				await Utils.text.copyToClipboard(link);
				Notifier.onCopyLinkComplete();
			}
			catch
			{
				Notifier.collab.onCopyLinkError();
			}
			finally
			{
				this.isCopyingInviteLink = false;
			}
		},
		async updateLink()
		{
			if (!this.isEnabledCollabersInvitation)
			{
				this.showHelper();

				return;
			}

			try
			{
				this.isUpdatingInviteLink = true;
				await new CollabInvitationService().updateLink(this.collabChatId);
				Notifier.collab.onUpdateLinkComplete();
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
		onReadySaveInputHandler()
		{
			this.isAddButtonDisabled = false;
		},
		onUnreadySaveInputHandler()
		{
			this.isAddButtonDisabled = true;
			this.isInvitingGuests = false;
		},
		initInvitationInput()
		{
			if (this.invitationGuests || this.activeTabId !== TabId.guests)
			{
				return;
			}

			this.invitationGuests = new InvitationInput();
			this.invitationGuests.subscribe('onReadySave', this.onReadySaveInputHandler);
			this.invitationGuests.subscribe('onUnreadySave', this.onUnreadySaveInputHandler);

			void this.renderInvitationInput();
		},
		destroyInvitationInput()
		{
			if (!this.invitationGuests)
			{
				return;
			}

			this.invitationGuests.unsubscribe('onReadySave', this.onReadySaveInputHandler);
			this.invitationGuests.unsubscribe('onUnreadySave', this.onUnreadySaveInputHandler);
		},
		async renderInvitationInput()
		{
			await this.$nextTick();
			this.invitationGuests.renderTo(this.$refs['collab-invitation-input']);
			this.invitationLangCode = this.defaultLanguageCode;
		},
		async addGuest()
		{
			this.isInvitingGuests = true;
			await this.invitationGuests.inviteToGroup(this.collabChatId);
			this.isInvitingGuests = false;
			this.$emit('close');
		},
		onInviteLanguageSelected(langCode: string)
		{
			this.invitationLangCode = langCode;
			this.invitationGuests.changeLanguage(langCode);
		},
	},
	template: `
		<MessengerPopup
			:config="config"
			:id="POPUP_ID"
			@close="$emit('close')"
		>
			<TabsWrapper
				:activeTabId="activeTabId"
				@onTabSwitch="onTabSwitch"
			/>
			<KeepAlive>
				<AddGuestContent
					v-if="isGuestTab"
					:chatId="chatId"
					:articleCode="helpdeskArticleCode"
					:guestTitle="guestDescriptionTitle"
					:guestDescription="guestDescription"
					:isAddButtonDisabled="isAddButtonDisabled"
					:isInvitingGuests="isInvitingGuests"
					class="bx-im-add-to-collab-guest-tab__scope"
					@addGuest="addGuest"
					@inviteLanguageSelected="onInviteLanguageSelected"
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
						<div
							ref="collab-invitation-input"
							class="bx-im-add-to-collab__invite-block-input"
							@click="onInvitationGuest"
						/>
					</template>
				</AddGuestContent>
				<AddEmployeesTab v-else :dialogId="dialogId" @close="$emit('close')"/>
			</KeepAlive>
		</MessengerPopup>
	`,
};
