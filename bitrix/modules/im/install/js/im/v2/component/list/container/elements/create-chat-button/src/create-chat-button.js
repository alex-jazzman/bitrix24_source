import { defineComponent } from 'ui.vue3';

import 'im.v2.css.classes';

import './css/create-chat-button.css';

// @vue/component
export const CreateChatButton = defineComponent({
	name: 'CreateChatButton',
	props: {
		isLoading: {
			type: Boolean,
			default: false,
		},
	},
	methods: {
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
		handleActivationKeydown(event: KeyboardEvent): void
		{
			// Only the button itself reacts; keydowns bubbling up from nested controls stay with them.
			if (event.target !== event.currentTarget)
			{
				return;
			}

			if (event.key === 'Enter' || event.key === ' ')
			{
				// Synthesize the native click the mouse path uses: consumers bind @click, which falls
				// through to this root element, so keyboard and mouse share one handler.
				event.preventDefault();
				this.$el.click();
			}
		},
	},
	template: `
		<div
			class="bx-im-list-container-create-chat__container --focus-visible"
			data-testid="im-create-chat-button"
			role="button"
			tabindex="0"
			:aria-label="loc('IM_LIST_CONTAINER_CREATE_CHAT_BUTTON_ARIA')"
			@keydown="handleActivationKeydown"
		>
			<div v-if="isLoading" class="bx-im-list-container-create-chat__spinner"></div>
			<div v-else class="bx-im-list-container-create-chat__icon"></div>
		</div>
	`,
});
