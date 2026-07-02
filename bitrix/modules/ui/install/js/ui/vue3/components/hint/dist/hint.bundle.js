/* eslint-disable */
this.BX = this.BX || {};
this.BX.Vue3 = this.BX.Vue3 || {};
(function (exports, ui_vue3_directives_hint, ui_iconSet_api_vue, main_core) {
	'use strict';

	/**
	 * Hint Vue directive
	 *
	 * @package bitrix
	 * @subpackage ui
	 * @copyright 2001-2021 Bitrix
	 */


	/*
		<Hint :text="$Bitrix.Loc.getMessage('HINT_PLAIN')"/>
		<Hint :html="$Bitrix.Loc.getMessage('HINT_PLAIN')"/>
		<Hint text="Custom position top and light mode" position="top" :popupOptions="{darkMode: false}"/>
	*/

	// @vue/component
	const Hint = {
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			text: {
				default: ''
			},
			html: {
				default: ''
			},
			position: {
				default: 'bottom'
			},
			size: {
				default: null
			},
			outline: {
				type: Boolean,
				default: false
			},
			icon: {
				type: Boolean,
				default: true
			},
			iconName: {
				type: [String, Object],
				default: null
			},
			popupOptions: {
				default() {
					return {};
				}
			}
		},
		computed: {
			set() {
				return {
					Main: ui_iconSet_api_vue.Main,
					Outline: ui_iconSet_api_vue.Outline
				};
			},
			hintClasses() {
				const classes = [];
				if (this.size) {
					classes.push(`--ui-hint-size-${this.size.toLowerCase()}`);
				}
				return classes;
			},
			resolvedIcon() {
				if (this.iconName) {
					if (main_core.Type.isString(this.iconName)) {
						return this.iconName;
					}
					if (main_core.Type.isObject(this.iconName) && Object.values(this.iconName).length > 0) {
						return Object.values(this.iconName)[0];
					}
				}
				return this.outline ? ui_iconSet_api_vue.Outline.QUESTION : ui_iconSet_api_vue.Main.HELP;
			},
			wrapperClasses() {
				return this.icon ? 'ui-hint' : '';
			}
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
	`
	};

	exports.Hint = Hint;

})(this.BX.Vue3.Components = this.BX.Vue3.Components || {}, BX.Vue3.Directives, BX.UI.IconSet, BX);
//# sourceMappingURL=hint.bundle.js.map
