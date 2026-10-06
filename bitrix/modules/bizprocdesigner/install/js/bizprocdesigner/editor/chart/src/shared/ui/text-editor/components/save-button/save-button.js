import { Button } from 'ui.vue3.components.button';
import { ButtonSize, AirButtonStyle } from 'ui.buttons';

// @vue/component
export const SaveButton = {
	name: 'SaveButton',
	components: {
		Button,
	},
	props: {
		editor: {
			type: Object,
			required: true,
		}
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
			return this.$bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_FRAME_BLOCK_BUTTON_SAVE');
		},
	},
	methods: {
		onSave(): void
		{
			this.editor.onSave();
		},
	},
	template: `
		<Button
			:text="buttonText"
			:style="buttonStyle.OUTLINE_ACCENT_2"
			:size="buttonSize.SMALL"
			@click="onSave"
		/>
	`,
};
