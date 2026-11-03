import { type JsonObject, Type } from 'main.core';

import { Core } from 'im.v2.application.core';
import { FadeAnimation } from 'im.v2.component.animation';
import { ChatAvatar } from 'im.v2.component.elements.avatar';
import { LineLoader } from 'im.v2.component.elements.loader';
import { ChatType, ActionByRole, UserType, ActionByUserType, UserRole } from 'im.v2.const';
import { CHAT_DETAIL_FOCUS_CONTEXT, type ChatDetailFocusContext } from 'im.v2.lib.a11y';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { PermissionManager } from 'im.v2.lib.permission';
import { type ImModelUser, type ImModelChat } from 'im.v2.model';
import { ChatService } from 'im.v2.provider.service.chat';

import { AddToChatButton } from './components/add-to-chat-button';
import { CallHeaderButton } from './components/call-button/call-header-button';
import { HeaderAvatar } from './components/header-avatar';
import { SearchButton } from './components/search-button';
import { SidebarButton } from './components/sidebar-button';
import { GroupChatTitle } from './components/title/group-chat';
import { UserTitle as UserChatTitle } from './components/title/user';

import './css/chat-header.css';

const HEADER_WIDTH_BREAKPOINT = 700;

// @vue/component
export const ChatHeader = {
	name: 'ChatHeader',
	components: {
		ChatAvatar,
		CallHeaderButton,
		GroupChatTitle,
		UserChatTitle,
		LineLoader,
		FadeAnimation,
		HeaderAvatar,
		AddToChatButton,
		SearchButton,
		SidebarButton,
	},
	inject:
	{
		withSidebar: 'withSidebar',
		chatDetailFocusContext: {
			from: CHAT_DETAIL_FOCUS_CONTEXT,
			default: null,
		},
	},
	props:
	{
		dialogId: {
			type: String,
			default: '',
		},
		withCallButton: {
			type: Boolean,
			default: true,
		},
		withSearchButton: {
			type: Boolean,
			default: true,
		},
		withAddToChatButton: {
			type: Boolean,
			default: true,
		},
		withEntityLink: {
			type: Boolean,
			default: true,
		},
	},
	emits: ['buttonPanelReady', 'compactModeChange'],
	data(): JsonObject
	{
		return {
			compactMode: false,
		};
	},
	computed:
	{
		user(): ImModelUser
		{
			return this.$store.getters['users/get'](this.dialogId, true);
		},
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		isInited(): boolean
		{
			return this.dialog.inited;
		},
		isUser(): boolean
		{
			return this.dialog.type === ChatType.user;
		},
		isBot(): boolean
		{
			if (!this.isUser)
			{
				return false;
			}

			return this.user.type === UserType.bot;
		},
		isCurrentUserGuest(): boolean
		{
			return this.$store.getters['users/isGuest'](Core.getUserId());
		},
		showCallButton(): boolean
		{
			if (this.isBot || !this.withCallButton)
			{
				return false;
			}

			if (this.isCurrentUserGuest || this.dialog.role === UserRole.guest)
			{
				return false;
			}

			return PermissionManager.getInstance().canPerformActionByRole(ActionByRole.call, this.dialogId);
		},
		showAddToChatButton(): boolean
		{
			if (this.isBot || !this.withAddToChatButton)
			{
				return false;
			}

			const permissionManager = PermissionManager.getInstance();

			const hasCreateChatAccess = permissionManager.canPerformActionByUserType(
				ActionByUserType.createChat,
			);
			if (this.isUser && !hasCreateChatAccess)
			{
				return false;
			}

			return permissionManager.canManageUsersAdd(this.dialogId);
		},
		showSearchButton(): boolean
		{
			return this.withSearchButton;
		},
		showSidebarButton(): boolean
		{
			if (!this.withSidebar)
			{
				return false;
			}

			return PermissionManager.getInstance().canPerformActionByRole(ActionByRole.openSidebar, this.dialogId);
		},
		chatTitleComponent(): string
		{
			return this.isUser ? UserChatTitle : GroupChatTitle;
		},
		isAirDesignEnabled(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isAirDesignEnabled);
		},
		showAirSkeleton(): boolean
		{
			return !this.isInited && this.isAirDesignEnabled;
		},
		containerClasses(): Record<string, boolean>
		{
			return {
				'--compact': this.compactMode,
				'--air': this.isAirDesignEnabled,
			};
		},
	},
	watch:
	{
		dialogId()
		{
			this.claimDetail();
			this.rebaseRegistrations();
		},
	},
	created()
	{
		// Not in data(): neither the displaced chat nor the chat this header claimed reaches the template.
		this.displacedDialogId = '';
		this.claimedDialogId = '';

		// The registry of a control is chosen by the header root that draws it, and the root of this
		// header is registered only on mount - so its controls, which register before that, are taken by
		// the chat this header claims here. A claim from `mounted()` would give them away to another chat.
		this.claimDetail();

		if (this.isInited)
		{
			this.emitButtonPanelReady();
		}
	},
	mounted()
	{
		this.initResizeObserver();
		this.getFocusContext()?.registerHeaderRoot(this.$refs.container);
	},
	beforeUnmount()
	{
		this.getResizeObserver().disconnect();
		this.releaseDetail();
		this.getFocusContext()?.unregisterHeaderRoot(this.$refs.container);
	},
	methods:
	{
		getFocusContext(): ChatDetailFocusContext | null
		{
			return this.chatDetailFocusContext;
		},
		/**
		 * ALG-01 compares the dialog of the header with the active one, so every header claims the detail
		 * for the chat it shows. One claim at a time is what the context holds, and a header drawn over a
		 * live one - the comments layer over its chat - takes it while it is there.
		 *
		 * A header reused for another chat claims a second time, and the detail it takes then is its own
		 * from the claim before: that chat has no header left - this very one took its controls along - so
		 * it is nobody to give the detail back to. Only a claim taken from another header displaces a chat,
		 * and the chat displaced by the first such claim is the one still drawn underneath.
		 */
		claimDetail(): void
		{
			const context = this.getFocusContext();
			if (context === null)
			{
				return;
			}

			const activeDialogId = context.getActiveDialogId();
			const displacesAnotherHeader = activeDialogId !== this.claimedDialogId;

			this.claimedDialogId = this.dialogId;

			if (activeDialogId === this.dialogId)
			{
				return;
			}

			if (displacesAnotherHeader)
			{
				this.displacedDialogId = activeDialogId;
			}

			context.setActiveDialogId(this.dialogId);
		},
		/**
		 * The layer gives the claim back when it goes: the header underneath is still on screen, and
		 * without the claim its own ALG-01 would stay silent for the rest of the session. Only a header
		 * that still holds the claim hands it over, so the one unmounted after the next has already
		 * claimed the detail - the order of the two is not guaranteed - takes nothing away from it.
		 */
		releaseDetail(): void
		{
			const context = this.getFocusContext();
			const isStillOurs = context !== null
				&& context.getActiveDialogId() === this.dialogId
				&& Type.isStringFilled(this.displacedDialogId);

			if (isStillOurs)
			{
				context.setActiveDialogId(this.displacedDialogId);
			}
		},
		/**
		 * A header reused for another chat brings the registry of its root along: registering the same root
		 * again moves it, together with every control it draws, to the chat just claimed - and leaves the
		 * chat it has left with no record of controls that are no longer its own.
		 */
		rebaseRegistrations(): void
		{
			const container = this.$refs.container;
			if (!container)
			{
				return;
			}

			this.getFocusContext()?.registerHeaderRoot(container);
		},
		initResizeObserver()
		{
			this.resizeObserver = new ResizeObserver(([entry]) => {
				this.onContainerResize(entry.contentRect.width);
			});
			this.resizeObserver.observe(this.$refs.container);
		},
		onContainerResize(newContainerWidth: number)
		{
			const newCompactMode = newContainerWidth <= HEADER_WIDTH_BREAKPOINT;
			if (newCompactMode !== this.compactMode)
			{
				this.$emit('compactModeChange', newCompactMode);
				this.compactMode = newCompactMode;
			}
		},
		onNewTitleSubmit(newTitle: string)
		{
			void this.getChatService().renameChat(this.dialogId, newTitle);
		},
		getChatService(): ChatService
		{
			if (!this.chatService)
			{
				this.chatService = new ChatService();
			}

			return this.chatService;
		},
		getResizeObserver(): ResizeObserver
		{
			return this.resizeObserver;
		},
		emitButtonPanelReady()
		{
			this.$emit('buttonPanelReady');
		},
		loc(phraseCode: string, replacements: {[string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
	},
	template: `
		<div
			class="bx-im-chat-header__scope bx-im-chat-header__container"
			:class="containerClasses"
			ref="container"
			tabindex="-1"
			data-testid="im-chat-header"
		>
			<div v-if="showAirSkeleton" class="bx-im-chat-header__skeleton-left">
				<div class="bx-im-chat-header__skeleton-avatar"></div>
				<div class="bx-im-chat-header__skeleton-info">
					<div class="bx-im-chat-header__skeleton-bar --title"></div>
					<div class="bx-im-chat-header__skeleton-bar --subtitle"></div>
				</div>
			</div>
			<div v-else class="bx-im-chat-header__left">
				<slot name="left">
					<HeaderAvatar :dialogId="dialogId" />
					<slot name="title" :onNewTitleHandler="onNewTitleSubmit">
						<component
							:is="chatTitleComponent"
							:dialogId="dialogId"
							:withEntityLink="withEntityLink"
							@newTitle="onNewTitleSubmit"
						/>
					</slot>
				</slot>
			</div>
			<div v-if="showAirSkeleton" class="bx-im-chat-header__skeleton-bar --action"></div>
			<LineLoader v-else-if="!isInited" :width="45" :height="22" />
			<FadeAnimation @afterEnter="emitButtonPanelReady" :duration="100">
				<div v-if="isInited" class="bx-im-chat-header__right">
					<slot name="before-actions"></slot>
					<CallHeaderButton v-if="showCallButton" :dialogId="dialogId" :compactMode="compactMode" />
					<div class="bx-im-chat-header__actions">
						<slot v-if="showAddToChatButton" name="add-to-chat-button">
							<AddToChatButton :dialogId="dialogId" />
						</slot>
						<SearchButton v-if="showSearchButton" :dialogId="dialogId" />
						<SidebarButton v-if="showSidebarButton" :dialogId="dialogId" />
					</div>
				</div>
			</FadeAnimation>
		</div>
	`,
};
