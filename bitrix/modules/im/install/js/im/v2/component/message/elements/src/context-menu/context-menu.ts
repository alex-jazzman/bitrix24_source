import { type EventEmitter } from 'main.core.events';
import { defineComponent, type PropType } from 'ui.vue3';

import { EventType } from 'im.v2.const';
import { messageHasError } from 'im.v2.lib.message';
import { Utils } from 'im.v2.lib.utils';
import { type ImModelMessage } from 'im.v2.model';

import './context-menu.css';

// @vue/component
export const ContextMenu = defineComponent({
	name: 'ContextMenu',
	props: {
		dialogId: {
			type: String,
			required: true,
		},
		message: {
			type: Object as PropType<ImModelMessage>,
			required: true,
		},
		showContextMenu: {
			type: Boolean,
			default: true,
		},
	},
	computed: {
		menuTitle(): string
		{
			return this.$Bitrix.Loc.getMessage('IM_MESSENGER_MESSAGE_MENU_TITLE', {
				'#SHORTCUT#': Utils.platform.isMac() ? 'CMD' : 'CTRL',
			});
		},
		messageItem(): ImModelMessage
		{
			return this.message;
		},
		canShowContextMenu(): boolean
		{
			return this.showContextMenu && !messageHasError(this.messageItem);
		},
		isBulkActionsMode(): boolean
		{
			return this.$store.getters['messages/select/isBulkActionsModeActive'](this.dialogId);
		},
	},
	methods: {
		onMenuClick(event: PointerEvent)
		{
			this.getEmitter().emit(EventType.dialog.onClickMessageContextMenu, {
				message: this.message,
				dialogId: this.dialogId,
				bindElement: event.currentTarget,
				event,
			});
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
	},
	template: `
		<template v-if="!isBulkActionsMode">
			<div v-if="canShowContextMenu" class="bx-im-message-context-menu__container bx-im-message-context-menu__scope">
				<button
					:title="menuTitle"
					@click="onMenuClick"
					@contextmenu.prevent
					class="bx-im-message-context-menu__button"
				></button>
			</div>
			<div v-else class="bx-im-message-base__context-menu-placeholder"></div>
		</template>
	`,
});
