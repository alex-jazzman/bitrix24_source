import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';

import { type AnyButtonBlock } from 'im.v2.const';
import { handleClick } from './helpers/handle-click.js';

// @vue/component
export const ButtonBlock = {
	name: 'ButtonBlock',
	components: { UiButton },
	inheritAttrs: false, // workaround for the :style prop in UiButton
	props: {
		message: {
			type: Object,
			required: true,
		},
		block: {
			type: Object,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
	},
	computed: {
		ButtonSize: () => ButtonSize,
		AirButtonStyle: () => AirButtonStyle,
		button(): AnyButtonBlock
		{
			return this.block;
		},
		buttonStyle(): $Values<typeof AirButtonStyle>
		{
			return AirButtonStyle[this.button.design] ?? AirButtonStyle.FILLED;
		},
	},
	methods: {
		onButtonClick(event: PointerEvent)
		{
			handleClick({
				event,
				message: this.message,
				dialogId: this.dialogId,
				button: this.button,
			});
		},
	},
	template: `
		<UiButton
			:text="button.title"
			:style="buttonStyle"
			:size="ButtonSize.MEDIUM"
			@click="onButtonClick"
		/>
	`,
};
