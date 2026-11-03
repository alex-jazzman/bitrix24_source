import { Loc } from 'main.core';
import { type EventEmitter } from 'main.core.events';

import { ChatType, EventType, SidebarDetailBlock } from 'im.v2.const';
import { type ImModelChat } from 'im.v2.model';

import { HeaderAction, HeaderActionShape, HeaderControlKey } from '../header-action/header-action';

const UserCounterPhraseCodeByChatType = {
	[ChatType.openChannel]: 'IM_CONTENT_CHAT_HEADER_CHANNEL_USER_COUNT',
	[ChatType.channel]: 'IM_CONTENT_CHAT_HEADER_CHANNEL_USER_COUNT',
	[ChatType.generalChannel]: 'IM_CONTENT_CHAT_HEADER_CHANNEL_USER_COUNT',
	default: 'IM_CONTENT_CHAT_HEADER_USER_COUNT',
};

const MembersLabelPhraseCodeByChatType = {
	[ChatType.openChannel]: 'IM_CONTENT_CHAT_HEADER_SUBSCRIBERS_ARIA',
	[ChatType.channel]: 'IM_CONTENT_CHAT_HEADER_SUBSCRIBERS_ARIA',
	[ChatType.generalChannel]: 'IM_CONTENT_CHAT_HEADER_SUBSCRIBERS_ARIA',
	default: 'IM_CONTENT_CHAT_HEADER_MEMBERS_ARIA',
};

// @vue/component
export const UserCounter = {
	name: 'UserCounter',
	components: { HeaderAction },
	inject:
	{
		currentSidebarPanel: 'currentSidebarPanel',
		withSidebar: 'withSidebar',
		sidebarAreaId: { default: '' },
	},
	props:
	{
		dialogId: {
			type: String,
			required: true,
		},
	},
	computed:
	{
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		isMembersPanelActive(): boolean
		{
			return this.currentSidebarPanel === SidebarDetailBlock.members;
		},
		userCounterPhraseCode(): string
		{
			return UserCounterPhraseCodeByChatType[this.dialog.type] ?? UserCounterPhraseCodeByChatType.default;
		},
		userCounterText(): string
		{
			return Loc.getMessagePlural(this.userCounterPhraseCode, this.dialog.userCounter, {
				'#COUNT#': this.dialog.userCounter,
			});
		},
		// SC 2.5.3: the visible text of the counter opens the name of the button, and the purpose of the
		// panel it opens closes it - otherwise the count reaches nobody but the sighted user.
		membersLabel(): string
		{
			const purpose = this.loc(
				MembersLabelPhraseCodeByChatType[this.dialog.type] ?? MembersLabelPhraseCodeByChatType.default,
			);

			return `${this.visibleCounterText}, ${purpose}`;
		},
		visibleCounterText(): string
		{
			return this.isShowGuestCount
				? `${this.userCounterText} ${this.guestCounterText}`
				: this.userCounterText;
		},
		isShowGuestCount(): boolean
		{
			return this.dialog.guestCount > 0 && [ChatType.chat, ChatType.calendar].includes(this.dialog.type);
		},
		guestCounterText(): string
		{
			return Loc.getMessagePlural('IM_CONTENT_CHAT_HEADER_GUEST_COUNT', this.dialog.guestCount, {
				'#COUNT#': this.dialog.guestCount,
			});
		},
		// Everything that turns the row into a control of the header. Without the sidebar there is no
		// control, so the row takes nothing at all and stays the plain text it draws.
		controlProps(): Object
		{
			if (!this.withSidebar)
			{
				return {};
			}

			return {
				controlKey: HeaderControlKey.members,
				label: this.membersLabel,
				expanded: this.isMembersPanelActive,
				controls: this.sidebarAreaId,
				shape: HeaderActionShape.text,
				truncate: true,
				title: this.loc('IM_CONTENT_CHAT_HEADER_OPEN_MEMBERS'),
				class: '--click',
				onClick: this.onMembersClick,
			};
		},
	},
	methods:
	{
		onMembersClick()
		{
			if (this.isMembersPanelActive)
			{
				this.getEmitter().emit(EventType.sidebar.close, { panel: SidebarDetailBlock.members });

				return;
			}

			this.getEmitter().emit(EventType.sidebar.open, {
				panel: SidebarDetailBlock.members,
				dialogId: this.dialogId,
			});
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
	// The members panel is the only thing the counter opens: without the sidebar it stays plain text and
	// creates no Tab stop. Only the root of the row knows about that difference - the text it shows is
	// the same one either way, and the guest count belongs to that text instead of being a stop of its own.
	template: `
		<component
			:is="withSidebar ? 'HeaderAction' : 'div'"
			v-bind="controlProps"
			class="bx-im-chat-header__subtitle_content"
			data-testid="im-chat-header-user-counter"
		>
			{{ userCounterText }}
			<span v-if="isShowGuestCount" class="bx-im-chat-header__guest-counter" data-testid="im-chat-header-guest-counter">
				{{ guestCounterText }}
			</span>
		</component>
	`,
};
