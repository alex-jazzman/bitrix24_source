import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { defineComponent, type PropType } from 'ui.vue3';

import { type AnyButtonBlock } from 'im.v2.const';
import { type ImModelMessage } from 'im.v2.model';

import { handleClick } from './helpers/handle-click';

// @vue/component
export const ButtonBlock = defineComponent({
	name: 'ButtonBlock',
	components: { UiButton } as { UiButton: typeof UiButton },
	inheritAttrs: false, // workaround for the :style prop in UiButton
	props: {
		message: {
			type: Object as PropType<ImModelMessage>,
			required: true,
		},
		block: {
			type: Object as PropType<AnyButtonBlock>,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
		loading: {
			type: Boolean,
			default: false,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		wide: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['click'],
	computed: {
		ButtonSize: () => ButtonSize,
		AirButtonStyle: () => AirButtonStyle,
		button(): AnyButtonBlock
		{
			return this.block;
		},
		buttonStyle(): $Values<typeof AirButtonStyle>
		{
			return AirButtonStyle[this.button.design as keyof typeof AirButtonStyle] ?? AirButtonStyle.FILLED;
		},
	},
	methods: {
		onButtonClick(event: PointerEvent)
		{
			// Generic per-type routing (eventButton -> handlerRegistry, linkButton -> open url,
			// requestButton -> no-op). Kept for self-contained consumers like CardBlock.
			handleClick({
				event,
				message: this.message,
				dialogId: this.dialogId,
				button: this.button,
			});

			// Notify the parent so stateful containers (e.g. FormBlock) can own their own flow
			// (submit lock, REST call). Consumers that don't listen simply ignore it.
			this.$emit('click', event);
		},
	},
	template: `
		<UiButton
			:text="button.title"
			:style="buttonStyle"
			:size="ButtonSize.MEDIUM"
			:loading="loading"
			:disabled="disabled"
			:wide="wide"
			@click="onButtonClick"
		/>
	`,
});
