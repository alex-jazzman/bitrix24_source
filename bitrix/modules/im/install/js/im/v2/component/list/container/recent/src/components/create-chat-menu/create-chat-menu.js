import { type JsonObject } from 'main.core';
import { type MenuOptions } from 'main.popup';
import { FeaturePromoter } from 'ui.info-helper';

import { Messenger } from 'im.public';
import { CopilotRolesDialog } from 'im.v2.component.elements.copilot-roles-dialog';
import { MessengerMenu, MenuItem, MenuItemIcon } from 'im.v2.component.elements.menu';
import { CreateChatPromo } from 'im.v2.component.list.container.elements.create-chat-promo';
import { PromoId, ChatType, ActionByUserType, CopilotRole, SliderCode, type ChatTypeItem } from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';
import { CreateChatManager } from 'im.v2.lib.create-chat';
import { Feature, FeatureManager, TariffManager } from 'im.v2.lib.feature';
import { PermissionManager } from 'im.v2.lib.permission';
import { PromoManager } from 'im.v2.lib.promo';
import { CopilotChatService } from 'im.v2.provider.service.copilot';
import { CopilotManager } from 'im.v2.lib.copilot';
import { FolderManager } from 'im.v2.lib.folder';

import { DescriptionBanner } from './components/collab/description-banner';
import { CopilotRoleSelectionButton } from './components/copilot-role-selection-button';
import { CreateChatHelp } from './components/create-chat-help';
import { InvitePromo } from './components/invite-promo';

import './css/create-chat-menu.css';

const PromoByChatType = {
	[ChatType.chat]: PromoId.createGroupChat,
	[ChatType.videoconf]: PromoId.createConference,
	[ChatType.channel]: PromoId.createChannel,
};

// @vue/component
export const CreateChatMenu = {
	components: {
		MessengerMenu,
		MenuItem,
		CreateChatHelp,
		CreateChatPromo,
		CopilotRoleSelectionButton,
		CopilotRolesDialog,
		InvitePromo,
		DescriptionBanner,
	},
	data(): JsonObject
	{
		return {
			showMenu: false,
			chatTypeToCreate: '',
			showCreateChatPromo: false,
			showInvitePromo: false,
			showCopilotRolesDialog: false,
			showCollabPromo: false,
			isLoading: false,
		};
	},
	computed:
	{
		ChatType: () => ChatType,
		MenuItemIcon: () => MenuItemIcon,
		hasMenuAccess(): boolean
		{
			const actions = [
				this.canCreateChat,
				this.canCreateChannel,
				this.canCreateConference,
				this.isCollabAvailable,
				this.isFolderAvailable,
			];

			return actions.includes(true);
		},
		menuConfig(): MenuOptions
		{
			return {
				id: 'im-create-chat-menu',
				width: 275,
				bindElement: this.$refs.icon || {},
				offsetTop: 4,
				padding: 0,
			};
		},
		isCollabV2Available(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isCollabV2Available);
		},
		isFolderAvailable(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isChatFoldersWebAvailable);
		},
		isBitrixGptV2Available(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isBitrixGptV2Available);
		},
		copilotIcon(): $Values<typeof MenuItemIcon>
		{
			if (this.isBitrixGptV2Available)
			{
				return MenuItemIcon.aiAssistant;
			}

			return MenuItemIcon.copilot;
		},
		isCollabV2AvailableByTariff(): boolean
		{
			return TariffManager.collabV2.isAvailable();
		},
		isCollabAvailable(): boolean
		{
			const hasAccess = PermissionManager.getInstance().canPerformActionByUserType(ActionByUserType.createCollab);
			const creationAvailable = FeatureManager.isFeatureAvailable(Feature.collabCreationAvailable);
			const featureAvailable = FeatureManager.isFeatureAvailable(Feature.collabAvailable);

			return hasAccess && featureAvailable && creationAvailable;
		},
		isCopilotAvailable(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.copilotAvailable);
		},
		isCopilotActive(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.copilotActive);
		},
		isCopilotAvailableAndCreatable(): boolean
		{
			return this.isCopilotAvailable && this.canCreateCopilot;
		},
		canCreateChat(): boolean
		{
			return PermissionManager.getInstance().canPerformActionByUserType(ActionByUserType.createChat);
		},
		canCreateCopilot(): boolean
		{
			return PermissionManager.getInstance().canPerformActionByUserType(ActionByUserType.createCopilot);
		},
		canCreateChannel(): boolean
		{
			return PermissionManager.getInstance().canPerformActionByUserType(ActionByUserType.createChannel);
		},
		canCreateConference(): boolean
		{
			return PermissionManager.getInstance().canPerformActionByUserType(ActionByUserType.createConference);
		},
		iconStatusClasses(): { [key: string]: boolean }
		{
			return {
				'--default': !this.isLoading,
				'--loading': this.isLoading,
			};
		},
		createCopilotTitle(): string
		{
			return this.loc('IM_RECENT_CREATE_COPILOT_TITLE_MSGVER_1', {
				'#COPILOT_NAME#': this.copilotManager.getName(),
			});
		},
	},
	created()
	{
		this.showCollabPromo = PromoManager.getInstance().needToShow(PromoId.createCollabDescription);
		this.showInvitePromo = PromoManager.getInstance().needToShow(PromoId.recentCreateChatInviteUsers);
		this.copilotManager = new CopilotManager();
	},
	methods:
	{
		onChatCreateClick(type: ChatTypeItem)
		{
			Analytics.getInstance().chatCreate.onStartClick(type);
			this.chatTypeToCreate = type;

			const promoBannerIsNeeded = PromoManager.getInstance().needToShow(this.getPromoType());
			if (promoBannerIsNeeded)
			{
				this.showCreateChatPromo = true;
				this.showMenu = false;

				return;
			}

			this.startChatCreation();
			this.showMenu = false;
		},
		onFolderCreateClick()
		{
			FolderManager.startCreation();
			this.showMenu = false;
		},
		onCollabV2CreateClick()
		{
			if (!this.isCollabV2AvailableByTariff)
			{
				TariffManager.collabV2.openFeatureSlider();

				return;
			}

			this.onChatCreateClick(ChatType.collab);
		},
		showCopilotPromoter()
		{
			const promoter = new FeaturePromoter({ code: SliderCode.copilotDisabled });
			promoter.show();
		},
		checkCopilotActive(): boolean
		{
			if (!this.isCopilotActive)
			{
				this.showCopilotPromoter();

				return false;
			}

			return true;
		},
		async onDefaultCopilotCreateClick()
		{
			if (!this.checkCopilotActive())
			{
				return;
			}

			this.showMenu = false;

			if (FeatureManager.isFeatureAvailable(Feature.isCopilotDraftChatAvailable))
			{
				Analytics.getInstance().copilot.onCreateDefaultChatInRecent();
				void Messenger.openCopilot();

				return;
			}

			this.isLoading = true;
			try
			{
				const newDialogId = await this.getCopilotChatService().createDefaultChat();
				Analytics.getInstance().ignoreNextChatOpen(newDialogId);
				Analytics.getInstance().copilot.onCreateChat(newDialogId);
				Analytics.getInstance().copilot.onCreateDefaultChatInRecent();

				this.isLoading = false;
				void Messenger.openChat(newDialogId);
			}
			catch
			{
				this.isLoading = false;
			}
		},
		onCollabDescriptionClose(): void
		{
			void PromoManager.getInstance().markAsWatched(PromoId.createCollabDescription);
			this.showCollabPromo = false;
		},
		onCopilotRoleSelectClick()
		{
			if (!this.checkCopilotActive())
			{
				return;
			}

			Analytics.getInstance().copilot.onSelectRoleInRecent();
			this.showCopilotRolesDialog = true;
		},
		async onCopilotDialogSelectRole(role)
		{
			if (
				FeatureManager.isFeatureAvailable(Feature.isCopilotDraftChatAvailable)
				&& role.code === CopilotRole.universalCode
			)
			{
				this.showMenu = false;
				Analytics.getInstance().copilot.onCreateDefaultChatInRecent();
				void Messenger.openCopilot();

				return;
			}

			await this.createCopilotChat(role.code);
		},
		async createCopilotChat(roleCode: string)
		{
			this.showMenu = false;
			this.isLoading = true;
			try
			{
				const newDialogId = await this.getCopilotChatService().createChat({ roleCode });

				Analytics.getInstance().copilot.onCreateChat(newDialogId);
				Analytics.getInstance().ignoreNextChatOpen(newDialogId);

				this.isLoading = false;
				void Messenger.openChat(newDialogId);
			}
			catch
			{
				this.isLoading = false;
			}
		},
		onPromoContinueClick()
		{
			PromoManager.getInstance().markAsWatched(this.getPromoType());
			this.startChatCreation();
			this.showCreateChatPromo = false;
			this.showMenu = false;
			this.chatTypeToCreate = '';
		},
		startChatCreation()
		{
			if (CreateChatManager.getInstance().isCreationLayoutActive(this.chatTypeToCreate))
			{
				return;
			}

			void CreateChatManager.getInstance().startChatCreation(this.chatTypeToCreate);
		},
		getPromoType(): string
		{
			return PromoByChatType[this.chatTypeToCreate] ?? '';
		},
		loc(phraseCode: string, replacements: {[p: string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
		getCopilotChatService(): CopilotChatService
		{
			if (!this.copilotService)
			{
				this.copilotService = new CopilotChatService();
			}

			return this.copilotService;
		},
		handleShowPopup()
		{
			Analytics.getInstance().chatCreate.onMenuCreateClick();
			this.showMenu = true;
		},
	},
	template: `
		<div
			v-if="hasMenuAccess"
			class="bx-im-list-container-recent__create-chat_icon"
			:class="{'--active': showMenu}"
			@click="handleShowPopup"
			ref="icon"
		>
			<div
				class="bx-im-list-container-recent__create-chat_icon_status"
				:class="iconStatusClasses"
			></div>
		</div>
		<MessengerMenu v-if="showMenu" :config="menuConfig" @close="showMenu = false">
			<MenuItem
				v-if="canCreateChat"
				:icon="MenuItemIcon.chat"
				:title="loc('IM_RECENT_CREATE_GROUP_CHAT_TITLE_V2')"
				:subtitle="loc('IM_RECENT_CREATE_GROUP_CHAT_SUBTITLE_MSGVER_1')"
				@click="onChatCreateClick(ChatType.chat)"
			/>
			<MenuItem
				v-if="isCopilotAvailableAndCreatable"
				:icon="copilotIcon"
				:title="createCopilotTitle"
				:subtitle="loc('IM_RECENT_CREATE_COPILOT_SUBTITLE_MSGVER_1')"
				@click.stop="onDefaultCopilotCreateClick"
			>
				<template #after-content>
					<CopilotRoleSelectionButton @click.stop="onCopilotRoleSelectClick" />
				</template>
			</MenuItem>
			<MenuItem
				v-if="canCreateChannel"
				:icon="MenuItemIcon.channel"
				:title="loc('IM_RECENT_CREATE_CHANNEL_TITLE_V2')"
				:subtitle="loc('IM_RECENT_CREATE_CHANNEL_SUBTITLE_MSGVER_1')"
				@click="onChatCreateClick(ChatType.channel)"
			/>
			<template v-if="isCollabAvailable">
				<MenuItem
					v-if="isCollabV2Available"
					:disabled="!isCollabV2AvailableByTariff"
					:icon="MenuItemIcon.collabV2"
					:title="loc('IM_RECENT_CREATE_COLLAB_V2_TITLE')"
					:subtitle="loc('IM_RECENT_CREATE_COLLAB_V2_SUBTITLE')"
					@click="onCollabV2CreateClick"
				/>
				<MenuItem
					v-else
					:icon="MenuItemIcon.collab"
					:title="loc('IM_RECENT_CREATE_COLLAB_TITLE')"
					:subtitle="loc('IM_RECENT_CREATE_COLLAB_SUBTITLE_MSGVER_1')"
					@click="onChatCreateClick(ChatType.collab)"
				>
					<template #below-content>
						<DescriptionBanner v-if="showCollabPromo" @close="onCollabDescriptionClose"/>
					</template>
				</MenuItem>
			</template>
			<MenuItem
				v-if="canCreateConference"
				:icon="MenuItemIcon.conference"
				:title="loc('IM_RECENT_CREATE_CONFERENCE_TITLE')"
				:subtitle="loc('IM_RECENT_CREATE_CONFERENCE_SUBTITLE_MSGVER_1')"
				:withBottomBorder="showInvitePromo"
				@click="onChatCreateClick(ChatType.videoconf)"
			/>
			<MenuItem
				v-if="isFolderAvailable"
				:icon="MenuItemIcon.folder"
				:title="loc('IM_RECENT_CREATE_FOLDER_TITLE')"
				:subtitle="loc('IM_RECENT_CREATE_FOLDER_SUBTITLE')"
				@click="onFolderCreateClick"
			/>
			<InvitePromo v-if="showInvitePromo" @close="showInvitePromo = false" />
			<template #footer>
				<CreateChatHelp @articleOpen="showMenu = false" />
			</template>
		</MessengerMenu>
		<CreateChatPromo
			v-if="showCreateChatPromo"
			:chatType="chatTypeToCreate"
			@continue="onPromoContinueClick"
			@close="showCreateChatPromo = false"
		/>
		<CopilotRolesDialog
			v-if="showCopilotRolesDialog"
			@selectRole="onCopilotDialogSelectRole"
			@close="showCopilotRolesDialog = false"
		/>
	`,
};
