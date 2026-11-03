import { defineComponent, provide, type PropType } from 'ui.vue3';

import { Attach } from 'im.v2.component.elements.attach';
import { ChatType } from 'im.v2.const';
import { type ImModelChat, type ImModelMessage, type ImModelUser } from 'im.v2.model';

import './attach.css';

// @vue/component
export const MessageAttach = defineComponent({
	name: 'MessageAttach',
	components: { Attach } as { Attach: typeof Attach },
	props: {
		item: {
			type: Object as PropType<ImModelMessage>,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
	},
	computed: {
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		user(): ImModelUser
		{
			return this.$store.getters['users/get'](this.dialogId, true);
		},
		dialogColor(): string
		{
			return this.dialog.type === ChatType.user ? this.user.color : this.dialog.color;
		},
	},
	created()
	{
		provide('message', this.item);
	},
	template: `
		<div v-for="config in item.attach" :key="config.id" class="bx-im-message-attach__container">
			<Attach :baseColor="dialogColor" :config="config" />
		</div>
	`,
});
