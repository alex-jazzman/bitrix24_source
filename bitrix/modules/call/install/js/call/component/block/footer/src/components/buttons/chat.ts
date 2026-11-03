import { defineComponent } from 'ui.vue3';

import { CallButton } from 'call.component.ui.button';
import { CallIcon } from 'call.component.ui.icon';
import { CallTooltip } from 'call.component.ui.tooltip';
import { CallBadge } from 'call.component.ui.badge';

import { useUiStore } from 'call.store';
import type { UiStoreInstance } from 'call.store';

import { hotkey } from 'call.helper.hotkey';
import type { Hotkey } from 'call.helper.hotkey';

import type { LocFunction } from 'call.plugin.loc';

export const CallFooterChatButton = defineComponent({
	name: 'CallFooterChatButton',
	components: {
		CallButton,
		CallIcon,
		CallTooltip,
		CallBadge,
	},
	inject: {
		loc: { default: (): LocFunction => (key: string): string => key },
	},
	setup(): { uiStore: UiStoreInstance }
	{
		return {
			uiStore: useUiStore(),
		};
	},
	props: {
		messagesCount: {
			type: Number,
			default: 0,
		},
		isDesktop: {
			type: Boolean,
			default: false,
		},
	},
	emits: [],
	computed: {
		disabled(): boolean
		{
			return this.uiStore.isButtonBlocked('chat');
		},
		hotkey(): Hotkey
		{
			return hotkey;
		},
		tooltip(): string
		{
			return `${this.hotkey.action} + Shift + C`;
		},
		badge(): string
		{
			if (!this.messagesCount)
			{
				return '';
			}

			return this.messagesCount > 99 ? '99+' : String(this.messagesCount);
		},
	},
	methods: {
		handleClick(): void
		{
			this.uiStore.toggleChat();
		},
	},
	template: /* HTML */`
		<CallTooltip :value="tooltip" :disabled="disabled || !isDesktop">
			<CallButton
				test-id="call-footer-chat-button"
				color="transparent"
				:size="38"
				:label="loc('CALL_FOOTER_CHAT_BUTTON')"
				label-position="bottom"
				square
				:disabled="disabled"
				@click="handleClick"
			>
				<CallIcon icon="chats" color="white" :size="28" />
				<template v-if="badge" #badge>
					<CallBadge test-id="call-footer-chat-button-badge" :label="badge" color="red" />
				</template>
			</CallButton>
		</CallTooltip>
	`,
});
