/**
 * Hint Vue directive
 *
 * @package bitrix
 * @subpackage ui
 * @copyright 2001-2021 Bitrix
 */

import { hint } from 'ui.vue3.directives.hint';
import { BIcon, Main, Outline } from 'ui.icon-set.api.vue';
import { Type } from 'main.core';
import 'ui.icon-set.main';
import 'ui.icon-set.outline';

/*
	<Hint :text="$Bitrix.Loc.getMessage('HINT_PLAIN')"/>
	<Hint :html="$Bitrix.Loc.getMessage('HINT_PLAIN')"/>
	<Hint text="Custom position top and light mode" position="top" :popupOptions="{darkMode: false}"/>
*/

// @vue/component
export const Hint = {
	directives: {
		hint,
	},
	components: { BIcon },
	props:
	{
		text: { default: '' },
		html: { default: '' },
		position: { default: 'bottom' },
		size: { default: null },
		outline: { type: Boolean, default: false },
		icon: { type: Boolean, default: true },
		iconName: { type: [String, Object], default: null },
		popupOptions:
		{
			default() {
				return {};
			},
		},
	},
	computed: {
		set(): { Main: typeof Main, Outline: typeof Outline }
		{
			return { Main, Outline };
		},
		hintClasses(): string
		{
			const classes = [];
			if (this.size)
			{
				classes.push(`--ui-hint-size-${this.size.toLowerCase()}`);
			}

			return classes;
		},
		resolvedIcon()
		{
			if (this.iconName)
			{
				if (Type.isString(this.iconName))
				{
					return this.iconName;
				}

				if (Type.isObject(this.iconName) && Object.values(this.iconName).length > 0)
				{
					return Object.values(this.iconName)[0];
				}
			}

			return this.outline ? Outline.QUESTION : Main.HELP;
		},
		wrapperClasses(): string
		{
			return this.icon ? 'ui-hint' : '';
		},
	},
	template: `
			<span
				:class="[wrapperClasses, ...hintClasses]"
				v-hint="{text, html, position, popupOptions, size, outline}"
				data-hint-init="vue"
				>
			<BIcon
				v-if="icon"
				class="ui-hint-icon"
				:name="resolvedIcon"
			/>
			<slot v-else></slot>
		</span>
	`,
};
