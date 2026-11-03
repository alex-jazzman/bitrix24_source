import { Event } from 'main.core';
import { FocusNavigator } from 'ui.a11y';

import { ChatAvatar, ChatAvatarType, AvatarSize } from 'im.v2.component.elements.avatar';
import { ActionByRole, ChatType } from 'im.v2.const';
import { CHAT_DETAIL_FOCUS_CONTEXT, type ChatDetailFocusContext } from 'im.v2.lib.a11y';
import { PermissionManager } from 'im.v2.lib.permission';
import { Utils } from 'im.v2.lib.utils';
import { ChatService } from 'im.v2.provider.service.chat';

import { HeaderAction, HeaderActionShape, HeaderControlKey } from './header-action/header-action';

import type { ImModelChat } from 'im.v2.model';

// @vue/component
export const HeaderAvatar = {
	name: 'HeaderAvatar',
	components: { ChatAvatar, HeaderAction },
	inject:
	{
		chatDetailFocusContext: {
			from: CHAT_DETAIL_FOCUS_CONTEXT,
			default: null,
		},
	},
	props:
	{
		dialogId: {
			type: String,
			required: true,
		},
	},
	emits: ['avatarClick'],
	computed:
	{
		AvatarSize: () => AvatarSize,
		HeaderActionShape: () => HeaderActionShape,
		HeaderControlKey: () => HeaderControlKey,
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		isUser(): boolean
		{
			return this.dialog.type === ChatType.user;
		},
		canChangeAvatar(): boolean
		{
			return PermissionManager.getInstance().canPerformActionByRole(ActionByRole.avatar, this.dialogId);
		},
		isSelfChat(): boolean
		{
			return this.$store.getters['chats/isSelfChat'](this.dialogId);
		},
		userLink(): string
		{
			return Utils.user.getProfileLink(this.dialogId);
		},
		avatarType(): string
		{
			return this.isSelfChat ? ChatAvatarType.selfChat : '';
		},
		// The very same pair of conditions the file dialog itself is opened under: with no right to
		// change the picture, and in any chat with a person, the avatar carries no action at all.
		isAvatarButton(): boolean
		{
			return !this.isUser && this.canChangeAvatar;
		},
		needProfileLink(): boolean
		{
			return this.isUser && !this.isSelfChat;
		},
		/**
		 * The name beside the avatar opens the same profile, and one result deserves one announcement, so
		 * the picture leaves the walk - the walk, and nothing else. The link keeps its place in the
		 * accessibility tree: a control hidden from assistive technology still takes the focus on a click,
		 * and that leaves the reader standing on a node nothing can announce.
		 * The exception is the support chat, where the title is not a control of its own: there the
		 * picture is the only informational stop left.
		 */
		isProfileTabStop(): boolean
		{
			return this.$store.getters['users/bots/isSupport'](this.dialogId);
		},
		profileLabel(): string
		{
			return this.loc('IM_CONTENT_CHAT_HEADER_PROFILE_ARIA', { '#NAME#': this.userName });
		},
		userName(): string
		{
			return this.$store.getters['users/get'](this.dialogId, true).name;
		},
	},
	watch:
	{
		// The initiator of a system dialog belongs to the chat it was opened from, and nothing of the
		// previous chat is restored in the next one.
		dialogId()
		{
			this.disarmSystemSelectReturn();
		},
	},
	created()
	{
		// Not in data(): the pending system dialog is no part of the template.
		this.isSystemSelectArmed = false;
	},
	beforeUnmount()
	{
		this.disarmSystemSelectReturn();
	},
	methods:
	{
		openAvatarSelect()
		{
			this.armSystemSelectReturn();
			this.$refs.avatarInput.click();
		},
		/**
		 * The system dialog is not the page: choosing a file reports back through `change`, cancelling it
		 * reports nothing at all. Both end with the document taking the focus again, so the window
		 * regaining it is what the one-shot return waits for - and `change`, when it comes first, spends
		 * the very same shot. `visibilitychange` answers neither: the page stays visible all along.
		 */
		armSystemSelectReturn(): void
		{
			if (this.isSystemSelectArmed)
			{
				return;
			}

			this.isSystemSelectArmed = true;
			Event.bind(window, 'focus', this.onSystemSelectReturn);
		},
		disarmSystemSelectReturn(): void
		{
			if (!this.isSystemSelectArmed)
			{
				return;
			}

			this.isSystemSelectArmed = false;
			Event.unbind(window, 'focus', this.onSystemSelectReturn);
		},
		onSystemSelectReturn(): void
		{
			this.disarmSystemSelectReturn();
			this.returnFocusToInitiator();
		},
		returnFocusToInitiator(): void
		{
			const initiator = this.$refs.avatarButton?.$el ?? null;
			if (!this.canReturnFocusTo(initiator))
			{
				return;
			}

			FocusNavigator.focusTarget(initiator, { preventScroll: true });
		},
		/**
		 * All four conditions, and none of them alone: the chat this header shows is still the active one,
		 * the button is still in the document, the right to change the picture is still there, and the
		 * focus is not somebody else's.
		 */
		canReturnFocusTo(initiator: HTMLElement | null): boolean
		{
			if (initiator === null || !initiator.isConnected || !this.canChangeAvatar)
			{
				return false;
			}

			const context = this.getFocusContext();
			if (context !== null && context.getActiveDialogId() !== this.dialogId)
			{
				return false;
			}

			// Back from the system dialog the focus is either lost or still on the control that opened it.
			// Anything else is another surface, and the focus of another surface stays its own.
			return initiator.contains(FocusNavigator.getActiveElement()) || FocusNavigator.isFocusLost();
		},
		async onAvatarSelect(input: HTMLInputElement)
		{
			this.onSystemSelectReturn();

			const file: File = input.files[0];
			if (!file)
			{
				return;
			}

			const preparedAvatar = await this.getChatService().prepareAvatar(file);
			if (!preparedAvatar)
			{
				return;
			}
			void this.getChatService().changeAvatar(this.dialog.chatId, preparedAvatar);
		},
		getChatService(): ChatService
		{
			if (!this.chatService)
			{
				this.chatService = new ChatService();
			}

			return this.chatService;
		},
		getFocusContext(): ChatDetailFocusContext | null
		{
			return this.chatDetailFocusContext;
		},
		loc(phraseCode: string, replacements: { [key: string]: string } = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
	},
	// The control itself carries the geometry class of the avatar: as a flex item of the header it is
	// blockified, so a native button or link takes exactly the box the plain container used to take.
	// The ring of the stop is the `avatar` shape: the picture is drawn round, square with rounded corners
	// or hexagonal, and the shape it took is known to the picture alone.
	// The file input stays hidden by its own class and is therefore no stop of the walk.
	// language=Vue
	template: `
		<HeaderAction
			v-if="isAvatarButton"
			ref="avatarButton"
			:controlKey="HeaderControlKey.avatar"
			:label="loc('IM_CONTENT_CHAT_HEADER_AVATAR_ARIA')"
			:shape="HeaderActionShape.avatar"
			class="bx-im-chat-header__avatar --can-change"
			data-testid="im-chat-header-avatar"
			@click="openAvatarSelect"
		>
			<ChatAvatar :avatarDialogId="dialogId" :contextDialogId="dialogId" :size="AvatarSize.L" />
		</HeaderAction>
		<HeaderAction
			v-else-if="needProfileLink"
			:controlKey="HeaderControlKey.avatar"
			:label="profileLabel"
			:href="userLink"
			:shape="HeaderActionShape.avatar"
			:tabStop="isProfileTabStop"
			target="_blank"
			class="bx-im-chat-header__avatar"
			data-testid="im-chat-header-avatar"
		>
			<ChatAvatar :avatarDialogId="dialogId" :contextDialogId="dialogId" :size="AvatarSize.L" />
		</HeaderAction>
		<div v-else class="bx-im-chat-header__avatar" data-testid="im-chat-header-avatar">
			<ChatAvatar
				:avatarDialogId="dialogId"
				:contextDialogId="dialogId"
				:size="AvatarSize.L"
				:customType="avatarType"
			/>
		</div>
		<input
			type="file"
			accept="image/*"
			class="bx-im-chat-header__avatar_input"
			data-testid="im-chat-header-avatar-input"
			ref="avatarInput"
			@change="onAvatarSelect($event.target)"
		>
	`,
};
