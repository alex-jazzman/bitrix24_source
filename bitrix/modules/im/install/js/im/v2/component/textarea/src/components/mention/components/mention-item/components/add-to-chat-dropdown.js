import { Loc } from 'main.core';
import { type JsonObject } from 'main.core';
import { type EventEmitter } from 'main.core.events';
import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { BaseMenu } from 'im.v2.lib.menu';
import { ChatType, EventType } from 'im.v2.const';
import { type ImModelChat } from 'im.v2.model';

import { AddToChatDropdownMenu } from '../classes/add-to-chat-dropdown-menu';

import '../css/add-to-chat-dropdown.css';

const DropdownTitleByChatType = {
	[ChatType.taskComments]: Loc.getMessage('IM_TEXTAREA_MENTION_ADD_TO_TASK_COMMENTS_DROPDOWN_TITLE'),
	default: Loc.getMessage('IM_TEXTAREA_MENTION_ADD_TO_CHAT_DROPDOWN_TITLE'),
};

// @vue/component
export const AddToChatDropdown = {
	name: 'AddToChatDropdown',
	components: { BIcon },
	props: {
		userId: {
			type: String,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
		searchQuery: {
			type: String,
			default: '',
		},
	},
	data(): JsonObject
	{
		return {
			showMenu: false,
		};
	},
	computed: {
		OutlineIcons: () => OutlineIcons,
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		title(): string
		{
			return DropdownTitleByChatType[this.dialog.type] ?? DropdownTitleByChatType.default;
		},
	},
	methods: {
		closeMenu()
		{
			this.showMenu = false;

			this.getEmitter().emit(EventType.mention.onNestedMenuClosed);
		},
		openMenu(event: PointerEvent)
		{
			if (!this.contextMenuManager)
			{
				this.contextMenuManager = new AddToChatDropdownMenu({ emitter: this.getEmitter() });
				this.contextMenuManager.subscribe(BaseMenu.events.close, this.closeMenu);
			}

			const context = {
				chatId: this.dialog.chatId,
				dialogId: this.dialogId,
				userId: this.userId,
				searchQuery: this.searchQuery,
			};

			this.contextMenuManager.openMenu(context, event.currentTarget);

			this.showMenu = true;
		},
		toggleMenu(event: PointerEvent)
		{
			if (this.showMenu)
			{
				this.closeMenu();

				return;
			}

			this.openMenu(event);
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
		<div class="bx-im-mention-chat-add-dropdown__container" @mousedown.prevent @click.stop="toggleMenu">
			<div class="bx-im-mention-chat-add-dropdown__separator"></div>
			<div :title="title" class="bx-im-mention-chat-add-dropdown__title">{{ title }}</div>
			<BIcon
				v-if="!showMenu"
				class="bx-im-mention-chat-add-dropdown__icon"
				:name="OutlineIcons.CHEVRON_DOWN_S"
			/>
			<BIcon
				v-else
				class="bx-im-mention-chat-add-dropdown__icon"
				:name="OutlineIcons.CHEVRON_TOP_S"
			/>
		</div>
	`,
};
