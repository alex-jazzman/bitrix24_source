import { Button as UiButton } from 'ui.vue3.components.button';
import { BMenu, type MenuOptions } from 'ui.vue3.components.menu';

// @vue/component
export const MenuButton = {
	name: 'ui-top-panel-menu-button',
	components: {
		UiButton,
		BMenu,
	},
	props: {
		text: {
			type: String,
			default: null,
		},
		icon: {
			type: String,
			default: null,
		},
		buttonStyle: {
			type: String,
			default: null,
		},
		/** @type MenuOptions */
		options: {
			type: {},
			default: () => ({}),
		},
	},
	data(): Object
	{
		return {
			isMenuShown: false,
		};
	},
	computed: {
		menuOptions(): MenuOptions
		{
			return {
				bindElement: this.$refs.button.button.button,
				autoHide: true,
				offsetLeft: (this.$refs.button.button.button.offsetWidth / 2 - 120),
				width: 240,
				...this.options,
			};
		},
	},
	template: `
		<UiButton
			:text="text"
			:leftIcon="icon"
			:style="buttonStyle"
			ref="button"
			@click="isMenuShown = true"
		/>
		<BMenu
			v-if="isMenuShown"
			:options="menuOptions"
			@close="isMenuShown = false"
		/>
	`,
};
