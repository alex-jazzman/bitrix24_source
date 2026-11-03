import { defineComponent, type PropType } from 'ui.vue3';

import { type ImModelMessage } from 'im.v2.model';

import { RetryContextMenu } from './classes/retry-context-menu';

import './retry-button.css';

// @vue/component
export const RetryButton = defineComponent({
	name: 'RetryButton',
	props: {
		message: {
			type: Object as PropType<ImModelMessage>,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
	},
	setup(): { contextMenu: RetryContextMenu | null }
	{
		return {
			contextMenu: null,
		};
	},
	computed: {
		messageItem(): ImModelMessage
		{
			return this.message;
		},
		menuTitle(): string
		{
			return this.$Bitrix.Loc.getMessage('IM_MESSENGER_MESSAGE_CONTEXT_MENU_RETRY');
		},
	},
	created()
	{
		this.contextMenu = new RetryContextMenu();
	},
	methods: {
		onClick(event: MouseEvent)
		{
			const context = { dialogId: this.dialogId, ...this.messageItem };
			this.contextMenu!.openMenu(context, event.currentTarget as HTMLElement);
		},
	},
	template: `
		<div class="bx-im-message-retry-button__container bx-im-message-retry-button__scope">
			<button
				:title="menuTitle"
				@click="onClick"
				class="bx-im-message-retry-button__arrow"
			></button>
		</div>
	`,
});
