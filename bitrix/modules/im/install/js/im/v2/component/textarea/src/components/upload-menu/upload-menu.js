import { Type, type JsonObject } from 'main.core';
import { type PopupOptions } from 'main.popup';
import { Outline as OutlineIcons } from 'ui.icon-set.api.vue';
import { Text2Xs } from 'ui.system.typography.vue';

import { GroupSharingController } from 'calendar.sharing.interface';
import { VoteApplication } from 'vote.application';

import { Core } from 'im.v2.application.core';
import { IconButton } from 'im.v2.component.elements.icon-button';
import { MessengerMenu, MenuItem, MenuItemIcon } from 'im.v2.component.elements.menu';
import { ActionByRole, ChatType, Color, type ChatTypeItem } from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';
import { EntityCreator } from 'im.v2.lib.entity-creator';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { Notifier } from 'im.v2.lib.notifier';
import { PermissionManager } from 'im.v2.lib.permission';
import { UploadManager } from 'im.v2.lib.uploading';
import { type ImModelChat, type ImModelCollabInfo } from 'im.v2.model';

import { getFileUploadPolicy, buildPolicyNote } from '../../classes/upload-policy';

import { DiskPopup } from './disk-popup';

import '../../css/upload-menu.css';

type UploadMenuItem = {
	icon: $Values<typeof MenuItemIcon>,
	title: string,
	testId: string,
	clickHandler: Function,
	showCondition?: boolean,
}

const ICON_SIZE = 24;
const DOCUMENT_SIGN_SLIDER_URL = '/sign/doc/0/?chat_id=';

// @vue/component
export const UploadMenu = {
	components: { IconButton, MessengerMenu, MenuItem, DiskPopup, Text2Xs },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['fileSelect', 'diskFileSelect'],
	data(): JsonObject
	{
		return {
			showMenu: false,
			showDiskPopup: false,
		};
	},
	computed: {
		OutlineIcons: () => OutlineIcons,
		ICON_SIZE: () => ICON_SIZE,
		menuItems(): UploadMenuItem[]
		{
			return [
				{
					icon: MenuItemIcon.file,
					title: this.loc('IM_TEXTAREA_SELECT_LOCAL_FILE'),
					testId: 'im-upload-menu-local-file-item',
					clickHandler: this.onSelectLocalFile,
				},
				{
					icon: MenuItemIcon.b24,
					title: this.loc('IM_TEXTAREA_SELECT_FILE_FROM_B24'),
					testId: 'im-upload-menu-b24-file-item',
					clickHandler: this.onSelectFromB24,
					showCondition: () => !this.isGuest,
				},
				{
					icon: MenuItemIcon.task,
					title: this.loc('IM_TEXTAREA_SELECT_TASK'),
					testId: 'im-upload-menu-task-item',
					clickHandler: this.onCreateTaskClick,
					showCondition: () => !this.isCopilotChat && !this.isGuest,
				},
				{
					icon: MenuItemIcon.meeting,
					title: this.loc('IM_TEXTAREA_SELECT_MEETING'),
					testId: 'im-upload-menu-meeting-item',
					clickHandler: this.onCreateMeetingClick,
					showCondition: () => !this.isCopilotChat && !this.isGuest,
				},
				{
					icon: MenuItemIcon.calendarSlot,
					title: this.loc('IM_TEXTAREA_SELECT_CALENDAR_SLOT'),
					testId: 'im-upload-menu-calendar-slot-item',
					clickHandler: this.onCreateCalendarSlotClick,
					showCondition: () => this.isCalendarSlotAvailable && !this.isGuest,
				},
				{
					icon: MenuItemIcon.documentSign,
					title: this.loc('IM_TEXTAREA_SELECT_DOCUMENT_SIGN'),
					testId: 'im-upload-menu-document-sign-item',
					clickHandler: this.onCreateDocumentSignClick,
					showCondition: () => this.isDocumentSignAvailable && !this.isGuest,
				},
				{
					icon: MenuItemIcon.vote,
					title: this.loc('IM_TEXTAREA_SELECT_VOTE'),
					testId: 'im-upload-menu-vote-item',
					clickHandler: this.onCreateVoteClick,
					showCondition: () => this.isVoteCreationAvailable && !this.isGuest,
				},
			];
		},
		availableMenuItems(): UploadMenuItem[]
		{
			return this.menuItems.filter((item) => {
				if (!Type.isFunction(item.showCondition))
				{
					return true;
				}

				return item.showCondition();
			});
		},
		menuConfig(): PopupOptions
		{
			return {
				width: 278,
				bindElement: this.$refs.upload || {},
				bindOptions: {
					position: 'top',
				},
				offsetTop: 30,
				offsetLeft: -10,
				padding: 0,
			};
		},
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		chatType(): ChatTypeItem
		{
			return this.dialog.type;
		},
		isCopilotChat(): boolean
		{
			return this.chatType === ChatType.copilot;
		},
		chatId(): number
		{
			return this.dialog.chatId;
		},
		isDocumentSignAvailable(): boolean
		{
			const isActiveFeature = FeatureManager.isFeatureAvailable(Feature.documentSignAvailable);
			if (!isActiveFeature)
			{
				return false;
			}

			return PermissionManager.getInstance().canPerformActionByRole(ActionByRole.createDocumentSign, this.dialogId);
		},
		isCalendarSlotAvailable(): boolean
		{
			return PermissionManager.getInstance().canPerformActionByRole(ActionByRole.createCalendarSlots, this.dialogId);
		},
		isVoteCreationAvailable(): boolean
		{
			if (!VoteApplication?.canCreateVoteInChat(this.chatType))
			{
				return false;
			}

			return FeatureManager.isFeatureAvailable(Feature.voteCreationAvailable);
		},
		iconColor(): string
		{
			if (this.showMenu)
			{
				return Color.accentBlue;
			}

			return Color.gray40;
		},
		isGuest(): boolean
		{
			return this.$store.getters['users/isGuest'](Core.getUserId());
		},
		acceptAttribute(): string | null
		{
			return this.uploadManager.getAcceptAttribute(this.dialogId);
		},
		uploadPolicyNote(): string | null
		{
			const policy = getFileUploadPolicy(this.chatType);
			if (policy === null)
			{
				return null;
			}

			return buildPolicyNote(policy);
		},
		attachLabel(): string
		{
			return this.loc('IM_TEXTAREA_ICON_UPLOAD_TITLE');
		},
	},
	created()
	{
		this.uploadManager = new UploadManager();
	},
	methods:
	{
		onSelectLocalFile()
		{
			this.$refs.fileInput.click();
			this.showMenu = false;
		},
		onSelectFromB24()
		{
			this.showDiskPopup = true;
			this.showMenu = false;
		},
		onFileSelect(event)
		{
			this.$emit('fileSelect', { event });
			this.showMenu = false;
		},
		onDiskFileSelect(event)
		{
			this.$emit('diskFileSelect', event);
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
		getEntityCreator(): EntityCreator
		{
			if (!this.entityCreator)
			{
				this.entityCreator = new EntityCreator(this.chatId);
			}

			return this.entityCreator;
		},
		onCreateTaskClick()
		{
			void this.getEntityCreator().createTaskForChat();
			Analytics.getInstance().chatEntities.onCreateTaskFromTextareaClick(this.dialogId);

			this.showMenu = false;
		},
		onCreateMeetingClick()
		{
			void this.getEntityCreator().createMeetingForChat();
			Analytics.getInstance().chatEntities.onCreateEventFromTextareaClick(this.dialogId);

			this.showMenu = false;
		},
		onUploadButtonClick()
		{
			if (this.showMenu !== true)
			{
				Analytics.getInstance().attachMenu.onOpenUploadMenu(this.dialogId);
			}

			this.showMenu = true;
		},
		async onCreateCalendarSlotClick(event: PointerEvent)
		{
			if (!GroupSharingController)
			{
				return;
			}

			const collabInfo: ImModelCollabInfo = Core.getStore().getters['chats/collabs/getByChatId'](this.chatId);
			if (!collabInfo || !collabInfo.collabId)
			{
				return;
			}

			try
			{
				const groupSharing = await GroupSharingController.getGroupSharing(collabInfo.collabId, event.target);
				groupSharing.openDialog();
				this.showMenu = false;
			}
			catch (errors)
			{
				Notifier.onDefaultError();
				console.error('ChatTextarea: UploadMenu: select slots error', errors);
			}
		},
		onCreateDocumentSignClick()
		{
			const preparedUrl = DOCUMENT_SIGN_SLIDER_URL + this.chatId;
			BX.SidePanel.Instance.open(preparedUrl, { cacheable: false });
		},
		onCreateVoteClick(): void
		{
			const analyticsInstance = Analytics.getInstance();
			const analyticsParams = analyticsInstance.vote.getSerializedParams(this.dialogId);
			const preparedUrl = `/bitrix/components/bitrix/voting.im.edit/slider.php?chatId=${this.chatId}&${analyticsParams}`;
			BX.SidePanel.Instance.open(preparedUrl, {
				cacheable: false,
				width: 600,
				allowChangeHistory: false,
			});
			Analytics.getInstance().chatEntities.onCreateVoteFromTextareaClick(this.dialogId);
			this.showMenu = false;
		},
	},
	template: `
		<div ref="upload" class="bx-im-textarea__icon-container">
			<IconButton
				:iconName="OutlineIcons.ATTACH"
				:label="attachLabel"
				:iconColor="iconColor"
				:iconSize="ICON_SIZE"
				:expanded="showMenu"
				:disabled="disabled"
				class="bx-im-textarea__icon"
				data-testid="im-upload-menu-attach-btn"
				@click="onUploadButtonClick"
			/>
		</div>
		<MessengerMenu v-if="showMenu" :config="menuConfig" @close="showMenu = false" className="bx-im-file-menu__scope">
			<MenuItem
				v-for="item in availableMenuItems"
				:icon="item.icon"
				:title="item.title"
				:data-testid="item.testId"
				@click="item.clickHandler"
			/>
			<input
				type="file"
				@change="onFileSelect"
				multiple
				class="bx-im-file-menu__file-input"
				ref="fileInput"
				:accept="acceptAttribute || undefined"
				data-testid="im-upload-menu-file-input"
			>
			<template #footer>
				<Text2Xs
					v-if="uploadPolicyNote"
					tag="div"
					wrap="break-words"
					role="note"
					className="bx-im-file-menu__policy-note"
					data-testid="im-upload-menu-policy-note"
				>
					{{ uploadPolicyNote }}
				</Text2Xs>
			</template>
		</MessengerMenu>
		<DiskPopup v-if="showDiskPopup" @diskFileSelect="onDiskFileSelect" @close="showDiskPopup = false"/>
	`,
};
