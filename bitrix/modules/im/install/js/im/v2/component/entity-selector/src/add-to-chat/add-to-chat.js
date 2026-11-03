import { Loc, Tag, type JsonObject } from 'main.core';

import { Messenger } from 'im.public';
import { Core } from 'im.v2.application.core';
import { ActionByRole, ActionByUserType, ChatType, type SelectorEntityItem, TabId } from 'im.v2.const';
import { ChatAccessManager } from 'im.v2.lib.access';
import { Analytics } from 'im.v2.lib.analytics';
import { offersStructureNodes } from 'im.v2.lib.entity-selector-config';
import { GuestManager } from 'im.v2.lib.guest';
import { PermissionManager } from 'im.v2.lib.permission';
import { type ImModelChat } from 'im.v2.model';
import { ChatService } from 'im.v2.provider.service.chat';

import { getRememberedTabId } from './classes/remembered-tab';
import { AddToChatWindow, type SelectedUserParams } from './classes/window';
import { AddToChatFooter } from './components/footer';
import { AddToChatGuests } from './components/guests';
import { AddToChatHeader } from './components/header';

import './css/add-to-chat.css';

// the invitation window of a chat offers cross functional teams; a collab links to its project instead
const WITH_TEAMS = true;

// @vue/component
export const AddToChat = {
	name: 'AddToChat',
	components: { AddToChatHeader, AddToChatFooter, AddToChatGuests },
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
			isLoading: false,
			activeTabId: TabId.employees,
			showHistory: true,
			selectedItemCount: 0,
		};
	},
	computed: {
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
		offersStructureNodes(): boolean
		{
			return offersStructureNodes({
				dialogId: this.dialogId,
				chatType: this.dialog.type,
				withTeams: WITH_TEAMS,
				invitationPopup: true,
			});
		},
		windowTitle(): string
		{
			return Loc.getMessage('IM_ENTITY_SELECTOR_ADD_TO_CHAT_ADD_MEMBERS_TITLE_MSGVER_1');
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
		isGuestTab(isGuestTab: boolean)
		{
			this.selectorWindow.toggleGuestTab(isGuestTab);
		},
	},
	created()
	{
		this.chatService = new ChatService();
		this.activeTabId = getRememberedTabId(this.canInviteGuests);
		this.selectorWindow = this.createSelectorWindow();
	},
	mounted()
	{
		this.selectorWindow.show();
		this.selectorWindow.toggleGuestTab(this.isGuestTab);
	},
	beforeUnmount()
	{
		Analytics.getInstance().userAdd.onClosePopup();
		this.selectorWindow.destroy();
	},
	methods: {
		createSelectorWindow(): AddToChatWindow
		{
			return new AddToChatWindow({
				bindElement: this.bindElement,
				dialogId: this.dialogId,
				chatType: this.dialog.type,
				withTeams: WITH_TEAMS,
				title: this.windowTitle,
				offsetTop: this.popupConfig.offsetTop,
				offsetLeft: this.popupConfig.offsetLeft,
				headerContainer: this.headerContainer,
				footerContainer: this.footerContainer,
				guestsContainer: this.guestsContainer,
				onHide: () => this.$emit('close'),
				onSelectionChange: () => {
					this.selectedItemCount = this.selectorWindow.getSelectedItemCount();
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
		async onConfirm(): Promise<void>
		{
			if (this.isLoading)
			{
				return;
			}

			const members = this.selectorWindow.getSelectedUserIds();
			const structureNodes = this.selectorWindow.getSelectedStructureNodes();
			if (members.length === 0 && structureNodes.length === 0)
			{
				return;
			}

			this.isLoading = true;
			// the parent chat is asked about the whole selection: a linked node reaches it as well,
			// since the server mirrors the link onto the parent and resolves the people behind the node there
			const canAdd = await ChatAccessManager.canAddSelection(this.dialogId, members, structureNodes);
			if (!canAdd)
			{
				this.isLoading = false;

				return;
			}

			await this.inviteMembers(members, structureNodes);
		},
		async inviteMembers(members: Array<string | number>, structureNodes: SelectorEntityItem[]): Promise<void>
		{
			if (this.isChat)
			{
				await this.extendChat(members, structureNodes);

				return;
			}

			members.push(this.dialogId, Core.getUserId());
			await this.extendToGroupChat(members);
		},
		async extendChat(members: Array<string | number>, structureNodes: SelectorEntityItem[]): Promise<void>
		{
			const isAdded = await this.chatService.addSelection({
				chatId: this.chatId,
				userIds: members,
				nodes: structureNodes,
				showHistory: this.showHistory,
			});
			this.isLoading = false;

			if (!isAdded)
			{
				return;
			}

			this.$emit('close');
		},
		async extendToGroupChat(members: number[])
		{
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
				v-model:showHistory="showHistory"
				:dialogId="dialogId"
				:title="windowTitle"
				:tagSelector="selectorWindow.getTagSelector()"
				:canInviteGuests="canInviteGuests"
				:offersStructureNodes="offersStructureNodes"
				@close="$emit('close')"
			/>
		</Teleport>
		<Teleport :to="guestsContainer">
			<KeepAlive>
				<AddToChatGuests
					v-if="isGuestTab"
					:dialogId="dialogId"
					:canUpdateLink="canManageGuestLinks"
					@close="$emit('close')"
				/>
			</KeepAlive>
		</Teleport>
		<Teleport :to="footerContainer">
			<AddToChatFooter
				v-if="!isGuestTab"
				:disabled="selectedItemCount === 0"
				:loading="isLoading"
				@confirm="onConfirm"
				@cancel="$emit('close')"
			/>
		</Teleport>
	`,
};
