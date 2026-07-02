import './css/create-chat-button.css';

// @vue/component
export const CreateChatButton = {
	name: 'CreateChatButton',
	props: {
		isLoading: {
			type: Boolean,
			default: false,
		},
	},
	template: `
		<div class="bx-im-list-container-create-chat__container">
			<div v-if="isLoading" class="bx-im-list-container-create-chat__spinner"></div>
			<div v-else class="bx-im-list-container-create-chat__icon"></div>
		</div>
	`,
};
