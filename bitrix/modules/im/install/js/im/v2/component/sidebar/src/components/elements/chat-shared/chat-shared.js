import { SidebarDetailBlock, EventType } from 'im.v2.const';

import './chat-shared.css';

import type { EventEmitter } from 'main.core.events';

// @vue/component
export const ChatShared = {
	name: 'ChatShared',
	props:
	{
		dialogId: {
			type: String,
			required: true,
		},
	},
	methods:
	{
		async onLinkClick()
		{
			this.getEmitter().emit(EventType.sidebar.open, {
				panel: SidebarDetailBlock.chatsWithUser,
				standalone: true,
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
	template: `
		<div 
			class="bx-im-sidebar-chat-shared__container" 
			@click="onLinkClick"
		>
			<div class="bx-im-sidebar-chat-shared__title-container">
				<div class="bx-im-sidebar-chat-shared__icon"></div>
				<div class="bx-im-sidebar-chat-shared__title-text">
					{{ loc('IM_SIDEBAR_SHARED_CHATS_TITLE') }}
				</div>
			</div>
			<div class="bx-im-sidebar-chat-shared__arrow"></div>
		</div>
	`,
};
