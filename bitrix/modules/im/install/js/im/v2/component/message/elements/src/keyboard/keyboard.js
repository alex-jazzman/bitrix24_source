import { Keyboard } from 'im.v2.component.elements.keyboard';
import { type ImModelChat, type ImModelMessage, type ImModelUser } from 'im.v2.model';

import './keyboard.css';

// @vue/component
export const MessageKeyboard = {
	name: 'MessageKeyboard',
	components: { Keyboard },
	props: {
		item: {
			type: Object,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
	},
	emits: ['click'],
	computed: {
		message(): ImModelMessage
		{
			return this.item;
		},
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		user(): ImModelUser
		{
			return this.$store.getters['users/get'](this.dialogId, true);
		},
	},
	template: `
		<div class="bx-im-message-keyboard__container">
			<Keyboard
				:buttons="message.keyboard"
				:dialogId="dialogId"
				:messageId="message.id"
				@click="$emit('click', $event)"
			/>
		</div>
	`,
};
