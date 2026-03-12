import { AdminChatDisplay } from 'bitrix24.message.admin';

// @vue/component
export const AdminMessage = {
	name: 'AdminMessage',
	components: {
		AdminChatDisplay,
	},
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
	computed: {},
	template: `
		<AdminChatDisplay :item="item" :dialogId="dialogId"/>
	`,
};
