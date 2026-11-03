import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';

import './footer.css';

// @vue/component
export const AddToChatFooter = {
	name: 'AddToChatFooter',
	components: { UiButton },
	props: {
		disabled: {
			type: Boolean,
			default: true,
		},
		loading: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['confirm', 'cancel'],
	computed: {
		ButtonSize: () => ButtonSize,
		ButtonStyle: () => AirButtonStyle,
	},
	methods: {
		onConfirm()
		{
			if (this.disabled || this.loading)
			{
				return;
			}

			this.$emit('confirm');
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-add-to-chat-footer__container" data-testid="im-add-to-chat-footer">
			<UiButton
				:size="ButtonSize.LARGE"
				:text="loc('IM_ENTITY_SELECTOR_ADD_TO_CHAT_INVITE_BUTTON_MSGVER_1')"
				:loading="loading"
				:disabled="disabled"
				:style="ButtonStyle.FILLED"
				:dataset="{ testid: 'im-add-to-chat-confirm' }"
				@click="onConfirm"
			/>
			<UiButton
				:size="ButtonSize.LARGE"
				:text="loc('IM_ENTITY_SELECTOR_ADD_TO_CHAT_CANCEL_BUTTON')"
				:style="ButtonStyle.PLAIN"
				:dataset="{ testid: 'im-add-to-chat-cancel' }"
				@click="$emit('cancel')"
			/>
		</div>
	`,
};
