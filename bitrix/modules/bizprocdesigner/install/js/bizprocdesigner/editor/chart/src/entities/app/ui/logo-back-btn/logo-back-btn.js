import { Button as UiButton, AirButtonStyle } from 'ui.vue3.components.button';
import { Outline } from 'ui.icon-set.api.core';

const DEFAULT_BACK_URL = '/bizproc/templateprocesses/';

// @vue/component
export const LogoBackBtn = {
	name: 'LogoBackBtn',
	components: {
		UiButton,
	},
	props: {
		backUrl: {
			type: String,
			default: DEFAULT_BACK_URL,
		},
	},
	setup(): Object
	{
		return {
			AirButtonStyle,
			Outline,
		};
	},
	template: `
		<UiButton
			:leftIcon="Outline.HOME"
			:style="AirButtonStyle.PLAIN"
			:link="backUrl"
		/>
	`,
};
