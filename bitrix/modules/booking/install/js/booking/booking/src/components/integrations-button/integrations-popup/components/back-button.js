import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import './back-button.css';

// @vue/component
export const BackButton = {
	name: 'BackButton',
	components: {
		BIcon,
	},
	emits: ['click'],
	// eslint-disable-next-line flowtype/require-return-type
	setup()
	{
		return {
			Outline,
		};
	},
	template: `
		<BIcon
			:name="Outline.ARROW_LEFT_L"
			:size="20"
			class="booking--crm-forms-integration--back-button"
			color="rgb(var(--ui-color-text-primary-rgb))"
			@click="$emit('click')"
		/>
	`,
};
