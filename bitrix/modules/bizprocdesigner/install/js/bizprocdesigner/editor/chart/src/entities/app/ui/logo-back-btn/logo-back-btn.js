import { Button as UiButton, AirButtonStyle } from 'ui.vue3.components.button';
import { Outline } from 'ui.icon-set.api.core';

import { TEMPLATE_LIST_URL } from '../../../../shared/utils/url';

// @vue/component
export const LogoBackBtn = {
	name: 'LogoBackBtn',
	components: {
		UiButton,
	},
	props: {
		backUrl: {
			type: String,
			default: TEMPLATE_LIST_URL,
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
