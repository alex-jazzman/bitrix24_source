import { Dom, Type } from 'main.core';
import { ButtonIcon } from 'ui.vue3.components.button';
import { SplitButton as UiSplitButton } from 'ui.buttons';

import { Set, Outline } from 'ui.icon-set.api.core';
const allIcons = { ...ButtonIcon, ...Set, ...Outline };

// @vue/component
export const SplitButton = {
	name: 'split-button',
	props: {
		id: {
			type: String,
			default: '',
		},
		text: {
			type: String,
			default: '',
		},
		icon: {
			type: String,
			default: null,
		},
		loading: Boolean,
	},
	emits: ['click', 'mainClick', 'menuClick'],
	data(): Object
	{
		return {
			isMounted: false,
		};
	},
	watch: {
		icon(icon): void
		{
			const classes = this.button.getContainer().classList;
			classes.forEach((className) => {
				if (className.startsWith('ui-btn-icon-'))
				{
					Dom.removeClass(this.button.getContainer(), className);
				}
			});

			if (icon && !icon.startsWith('ui-btn-icon'))
			{
				Dom.addClass(this.button.getContainer(), '--with-icon');

				return;
			}

			this.button.setProperty('icon', icon, ButtonIcon);

			Dom.removeClass(this.button.getContainer(), '--with-icon');
			Dom.toggleClass(this.button.getContainer(), ['ui-icon-set__scope', icon], Boolean(icon));
		},
		loading: {
			handler(loading): void
			{
				if (loading !== this.button?.isWaiting())
				{
					this.button?.setWaiting(loading);
				}
			},
			immediate: true,
		},
	},
	created(): void
	{
		const button = new UiSplitButton({
			id: this.id,
			text: this.text,
			useAirDesign: true,
			onclick: () => {
				this.$emit('click');
			},
			mainButton: {
				onclick: () => {
					this.$emit('mainClick');
				},
			},
			menuButton: {
				onclick: () => {
					this.$emit('menuClick');
				},
			},
		});

		if (this.icon)
		{
			button.addClass(`${this.icon} ui-icon-set__scope --with-left-icon`);
		}

		this.button = button;
	},
	mounted(): void
	{
		const button = this.button?.render();

		this.$refs.button.after(button);

		this.isMounted = true;
	},
	unmounted(): void
	{
		this.button?.getContainer()?.remove();
	},
	template: `
		<button v-if="!isMounted" ref="button"></button>
	`,
};
