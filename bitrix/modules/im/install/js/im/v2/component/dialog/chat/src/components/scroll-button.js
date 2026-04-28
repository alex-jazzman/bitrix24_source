import { FloatButton, FloatButtonColor, FloatButtonIcon } from './float-button';

import type { ImModelChat } from 'im.v2.model';

// @vue/component
export const ScrollButton = {
	name: 'ScrollButton',
	components: { FloatButton },
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
		chatCounter(): number
		{
			return this.$store.getters['counters/getCounterByChatId'](this.dialog.chatId);
		},
		floatButtonProps(): { color: string, icon: string, counter: number }
		{
			return {
				color: FloatButtonColor.accent,
				icon: FloatButtonIcon.chevronDown,
				counter: this.chatCounter,
			};
		},
	},
	template: `
		<FloatButton v-bind="floatButtonProps" />
	`,
};
