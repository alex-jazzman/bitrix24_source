import { Outline } from 'ui.icon-set.api.vue';
import { Button } from 'ui.vue3.components.button';
import { ButtonSize, AirButtonStyle } from 'ui.buttons';

// @vue/component
export const AttachButton = {
	name: 'AttachButton',
	components: {
		Button,
	},
	props: {
		fileService: {
			type: Object,
			required: true,
		},
	},
	setup(): Object
	{
		return {
			outlineIcons: Outline,
			buttonStyle: AirButtonStyle,
			buttonSize: ButtonSize,
		};
	},
	methods: {
		onClick(): void
		{
			this.fileService.browse({
				bindElement: this.$refs.attachButton,
			});
		},
	},
	template: `
		<Button
			:leftIcon="outlineIcons.ATTACH"
			:style="buttonStyle.PLAIN"
			:size="buttonSize.SMALL"
			ref="attachButton"
			@click="onClick"
		/>
	`,
};
