import { Text } from 'main.core';
import { Button as UiButton, AirButtonStyle, ButtonColor, ButtonSize } from 'ui.vue3.components.button';

import './css/item-confirm-buttons.css';

// @vue/component
export const ItemConfirmButtons = {
	name: 'ItemConfirmButtons',
	components: { UiButton },
	props: {
		buttons: {
			type: Array,
			required: true,
		},
	},
	emits: ['confirmButtonsClick'],
	computed: {
		ButtonSize: () => ButtonSize,
		ButtonColor: () => ButtonColor,
		preparedButtons(): Array
		{
			return this.buttons.map((button) => {
				const [id, value] = button.COMMAND_PARAMS.split('|');

				// we need to decode it, because legacy chat does htmlspecialcharsbx on the server side
				// @see \CIMMessenger::Add
				const text = Text.decode(button.TEXT);

				return { id, value, text };
			});
		},
	},
	methods:
	{
		click(button)
		{
			this.$emit('confirmButtonsClick', button);
		},
		getButtonStyle(button): string
		{
			return button.value === 'Y' ? AirButtonStyle.FILLED : AirButtonStyle.OUTLINE_NO_ACCENT;
		},
	},
	template: `
		<div class="bx-im-content-notification-item-confirm-buttons__container">
			<UiButton
				v-for="(button, index) in preparedButtons" :key="index"
				:text="button.text"
				class="--air"
				:style="getButtonStyle(button)"
				:size="ButtonSize.SMALL"
				@click="click(button)"
			/>
		</div>
	`,
};
