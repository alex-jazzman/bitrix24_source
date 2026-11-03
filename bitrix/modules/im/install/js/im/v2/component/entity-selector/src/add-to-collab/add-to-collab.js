import { Tag, type JsonObject } from 'main.core';
import { FeaturePromoter } from 'ui.info-helper';
import { InvitationInput } from 'intranet.invitation-input';

import { SliderCode, TabId, ActionByRole } from 'im.v2.const';
import { Core } from 'im.v2.application.core';
import { Analytics } from 'im.v2.lib.analytics';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { PermissionManager } from 'im.v2.lib.permission';
import { Notifier } from 'im.v2.lib.notifier';
import { Utils } from 'im.v2.lib.utils';
import { CollabManager } from 'im.v2.lib.collab';
import { StructureTarget } from 'im.v2.lib.entity-selector-config';
import { type ImModelChat, type ImModelCollabInfo } from 'im.v2.model';
import { CollabInvitationService } from 'im.v2.provider.service.collab-invitation';

import { AddToChatWindow, type SelectedUserParams } from '../add-to-chat/classes/window';
import { AddToChatHeader } from '../add-to-chat/components/header';
import { AddGuestContent } from '../elements/add-guest-content/add-guest-content';
import { CopyInviteLink } from '../elements/copy-invite-link/copy-invite-link';
import { AddEmployeesTab } from './components/add-employees-tab';

import './css/add-to-collab.css';

// @vue/component
export const AddToCollab = {
	name: 'AddToCollab',
	components: { AddGuestContent, AddEmployeesTab, AddToChatHeader, CopyInviteLink },
	provide(): JsonObject
	{
		return {
			disableAutoHide: this.disableAutoHide,
			enableAutoHide: this.enableAutoHide,
		};
	},
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
			selectedMembers: [],
			selectedStructureNodes: [],
			isCopyingInviteLink: false,
			isUpdatingInviteLink: false,
			isAddButtonDisabled: true,
			isInvitingGuests: false,
			invitationLangCode: '',
		};
	},
	computed: {
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
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
			return this.dialog.chatId;
		},
		collabChatId(): number
		{
			const collab: ImModelCollabInfo = this.$store.getters['chats/collabs/getByChatId'](this.chatId);

			return collab.collabId;
		},
		windowTitle(): string
		{
			return CollabManager.getInviteHeaderText();
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
		structureTarget(): string
		{
			return StructureTarget.collabProject;
		},
		canUpdateLink(): boolean
		{
			return PermissionManager.getInstance().canPerformActionByRole(ActionByRole.updateInviteLink, this.dialogId);
		},
		headerContainer(): HTMLElement
		{
			return Tag.render`<div></div>`;
		},
		footerContainer(): HTMLElement
		{
			return Tag.render`<div></div>`;
		},
		guestsContainer(): HTMLElement
		{
			return Tag.render`<div></div>`;
		},
	},
	watch: {
		activeTabId()
		{
			this.selectorWindow.toggleGuestTab(this.isGuestTab);
			this.initInvitationInput();
		},
	},
	created()
	{
		this.setInitialActiveTab();
		this.selectorWindow = this.createSelectorWindow();
	},
	mounted()
	{
		this.selectorWindow.show();
		this.selectorWindow.toggleGuestTab(this.isGuestTab);
		this.initInvitationInput();
	},
	beforeUnmount()
	{
		Analytics.getInstance().userAdd.onClosePopup();
		this.destroyInvitationInput();
		this.selectorWindow.destroy();
	},
	methods: {
		createSelectorWindow(): AddToChatWindow
		{
			return new AddToChatWindow({
				bindElement: this.bindElement,
				dialogId: this.dialogId,
				chatType: this.dialog.type,
				structureTarget: this.structureTarget,
				title: this.windowTitle,
				offsetTop: this.popupConfig.offsetTop,
				offsetLeft: this.popupConfig.offsetLeft,
				headerContainer: this.headerContainer,
				footerContainer: this.footerContainer,
				guestsContainer: this.guestsContainer,
				onHide: () => this.$emit('close'),
				onSelectionChange: () => {
					this.selectedMembers = this.selectorWindow.getSelectedUserIds();
					this.selectedStructureNodes = this.selectorWindow.getSelectedStructureNodes();
				},
				onUserSelect: (params: SelectedUserParams) => this.sendUserSelectAnalytics(params),
				onSearchInput: () => {
					Analytics.getInstance().userAdd.onStartSearch({ dialogId: this.dialogId });
				},
			});
		},
		sendUserSelectAnalytics({ fromRecentTab, position }: SelectedUserParams): void
		{
			const { userAdd } = Analytics.getInstance();
			const params = { dialogId: this.dialogId, position };

			if (fromRecentTab)
			{
				userAdd.onSelectUserFromRecent(params);

				return;
			}

			userAdd.onSelectUserFromSearchResult(params);
		},
		setInitialActiveTab()
		{
			if (this.isEnabledCollabersInvitation && !this.isCollabV2Available)
			{
				this.activeTabId = TabId.guests;
			}
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
			catch (error)
			{
				Notifier.collab.onCopyLinkError(error);
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
			catch (error)
			{
				Notifier.collab.onUpdateLinkError(error);
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
			if (this.isInvitingGuests)
			{
				return;
			}

			this.isInvitingGuests = true;
			try
			{
				await this.invitationGuests.inviteToGroup(this.collabChatId);
				this.$emit('close');
			}
			catch
			{
				this.isAddButtonDisabled = this.invitationGuests.isEmptyTags() || this.invitationGuests.hasErrorTags();
			}
			finally
			{
				this.isInvitingGuests = false;
			}
		},
		onInviteLanguageSelected(langCode: string)
		{
			this.invitationLangCode = langCode;
			this.invitationGuests.changeLanguage(langCode);
		},
		enableAutoHide()
		{
			this.selectorWindow.setAutoHide(true);
		},
		disableAutoHide()
		{
			this.selectorWindow.setAutoHide(false);
		},
	},
	template: `
		<Teleport :to="headerContainer">
			<AddToChatHeader
				v-model:activeTabId="activeTabId"
				:dialogId="dialogId"
				:title="windowTitle"
				:tagSelector="selectorWindow.getTagSelector()"
				:structureTarget="structureTarget"
				canInviteGuests
				@close="$emit('close')"
			/>
		</Teleport>
		<Teleport :to="guestsContainer">
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
					data-testid="im-add-to-collab-guests"
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
							data-testid="im-add-to-collab-invite-input"
							@click="onInvitationGuest"
						/>
					</template>
				</AddGuestContent>
			</KeepAlive>
		</Teleport>
		<Teleport :to="footerContainer">
			<AddEmployeesTab
				v-if="!isGuestTab"
				:dialogId="dialogId"
				:members="selectedMembers"
				:structureNodes="selectedStructureNodes"
				@close="$emit('close')"
			/>
		</Teleport>
	`,
};
