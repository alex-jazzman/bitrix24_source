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
		/** The accessible name of an icon-only button, which has no text to be named by. */
		ariaLabel: {
			type: String,
			default: null,
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
		buttonAttributes(): { [string]: ?string }
		{
			return {
				'aria-haspopup': 'menu',
				'aria-expanded': this.isMenuShown ? 'true' : 'false',
				'aria-label': this.ariaLabel,
			};
		},
	},
	watch: {
		buttonAttributes(): void
		{
			this.syncButtonAttributes();
		},
	},
	mounted(): void
	{
		this.syncButtonAttributes();
	},
	methods: {
		/**
		 * UiButton builds its native button imperatively, so attributes bound in the template never
		 * reach it and have to be written to the button element on every change.
		 */
		syncButtonAttributes(): void
		{
			this.$refs.button?.button?.setProps(this.buttonAttributes);
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
