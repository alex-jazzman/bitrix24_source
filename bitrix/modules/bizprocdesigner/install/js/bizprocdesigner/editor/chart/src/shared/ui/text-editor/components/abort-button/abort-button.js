import { Button } from 'ui.vue3.components.button';
import { ButtonSize, AirButtonStyle } from 'ui.buttons';

// @vue/component
export const AbortButton = {
	name: 'AbortButton',
	components: {
		Button,
	},
	props: {
		editor: {
			type: Object,
			required: true,
		},
	},
	setup(): Object
	{
		return {
			buttonStyle: AirButtonStyle,
			buttonSize: ButtonSize,
		};
	},
	computed: {
		buttonText(): string
		{
			return this.$bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_FRAME_BLOCK_BUTTON_ABORT');
		},
	},
	methods: {
		onAbort(): void
		{
			this.editor.onAbort();
		},
	},
	template: `
		<Button
			:text="buttonText"
			:style="buttonStyle.OUTLINE"
			:size="buttonSize.SMALL"
			@click="onAbort"
		/>
	`,
};
