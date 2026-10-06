import { type JsonObject } from 'main.core';
import { type EventEmitter } from 'main.core.events';
import { type BitrixVueComponentProps } from 'ui.vue3';
import { BIcon, Outline } from 'ui.icon-set.api.vue';

import { AddToChat, AddToCollab, AttachToCollabV2 } from 'im.v2.component.entity-selector';
import { EventType, ChatType, ActionByRole, RecentType } from 'im.v2.const';
import { PermissionManager } from 'im.v2.lib.permission';
import { SidebarManager, type SidebarConfig } from 'im.v2.lib.sidebar';
import { type ImModelRecentItem, type ImModelChat } from 'im.v2.model';

import { DetachFromCollabV2Popup } from './classes/detach-from-collab-v2-popup.js';

import { MainMenu } from '../../../../classes/context-menu/main/main-menu';

import '../css/header.css';

const ICON_SIZE = 24;

// @vue/component
export const MainHeader = {
	name: 'MainHeader',
	components: { AddToChat, AddToCollab, AttachToCollabV2, BIcon },
	props:
	{
		dialogId: {
			type: String,
			required: true,
		},
	},
	data(): JsonObject
	{
		return {
			showAddToChatPopup: false,
			showAttachToCollabV2Popup: false,
		};
	},
	computed:
	{
		RecentType: () => RecentType,
		Outline: () => Outline,
		ICON_SIZE: () => ICON_SIZE,
		recentItem(): ?ImModelRecentItem
		{
			return this.$store.getters['recent/get'](this.dialogId);
		},
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		sidebarConfig(): SidebarConfig
		{
			return SidebarManager.getInstance().getConfig(this.dialogId);
		},
		headerTitle(): string
		{
			return this.sidebarConfig.getHeaderTitle();
		},
		showMenuIcon(): boolean
		{
			return this.canOpenMenu && this.isMenuEnabled;
		},
		canOpenMenu(): boolean
		{
			const canByRole = PermissionManager.getInstance().canPerformActionByRole(ActionByRole.openSidebarMenu, this.dialogId);

			// Phase 0 (task 718250): superadmin project chat access
			return canByRole || this.dialog.hasManageCapability;
		},
		isMenuEnabled(): boolean
		{
			return this.sidebarConfig.isHeaderMenuEnabled();
		},
		addMembersPopupComponent(): BitrixVueComponentProps
		{
			return this.dialog.type === ChatType.collab ? AddToCollab : AddToChat;
		},
	},
	created()
	{
		this.contextMenu = new MainMenu({ emitter: this.getEmitter() });
		this.contextMenu.subscribe(MainMenu.events.onAddToChatShow, this.onAddChatShow);
		this.contextMenu.subscribe(MainMenu.events.onAttachToCollabV2Show, this.onAttachToCollabV2Show);
		this.contextMenu.subscribe(MainMenu.events.onDetachFromCollabV2Show, this.onDetachFromCollabV2Show);
	},
	beforeUnmount()
	{
		this.contextMenu.destroy();
		this.contextMenu.unsubscribe(MainMenu.events.onAddToChatShow, this.onAddChatShow);
		this.contextMenu.unsubscribe(MainMenu.events.onAttachToCollabV2Show, this.onAttachToCollabV2Show);
		this.contextMenu.unsubscribe(MainMenu.events.onDetachFromCollabV2Show, this.onDetachFromCollabV2Show);
	},
	methods:
	{
		onDetachFromCollabV2Show()
		{
			const detachFromCollabV2pPopup = new DetachFromCollabV2Popup({ dialogId: this.dialogId });

			detachFromCollabV2pPopup.show();
		},
		onAttachToCollabV2Show()
		{
			this.showAttachToCollabV2Popup = true;
		},
		onAddChatShow()
		{
			this.showAddToChatPopup = true;
		},
		onContextMenuClick(event: PointerEvent)
		{
			const context = {
				dialogId: this.dialogId,
				recentItem: this.recentItem,
			};

			this.contextMenu.openMenu(context, event.target);
		},
		onSidebarCloseClick()
		{
			this.getEmitter().emit(EventType.sidebar.close);
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-sidebar-header__container bx-im-sidebar-header__scope">
			<div class="bx-im-sidebar-header__title-container">
				<button
					class="bx-im-sidebar-header__cross-icon"
					@click="onSidebarCloseClick"
					data-testid="im-sidebar-header-close-button"
				>
					<BIcon :name="Outline.CROSS_L" :size="ICON_SIZE" />
				</button>
				<div class="bx-im-sidebar-header__title">{{ headerTitle }}</div>
			</div>
			<button
				v-if="showMenuIcon"
				class="bx-im-sidebar-header__context-menu-icon bx-im-messenger__context-menu-icon"
				@click="onContextMenuClick"
				ref="context-menu"
			></button>
			<component
				v-if="showAddToChatPopup"
				:is="addMembersPopupComponent"
				:bindElement="$refs['context-menu'] || {}"
				:dialogId="dialogId"
				:popupConfig="{offsetTop: 0, offsetLeft: -420}"
				@close="showAddToChatPopup = false"
			/>
			<AttachToCollabV2
				v-if="showAttachToCollabV2Popup"
				:popupTitle="loc('IM_SIDEBAR_MENU_ATTACH_TO_COLLAB_V2_POPUP_TITLE')"
				:searchParams="{ onlyWithManageUsersAddRight: true }"
				:recentSectionType="RecentType.collab"
				:dialogId="dialogId"
				@close="showAttachToCollabV2Popup = false"
			/>
		</div>
	`,
};
