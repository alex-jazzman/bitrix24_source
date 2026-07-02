/* eslint-disable */
(function (ui_vue, main_core, main_popup) {
	'use strict';

	/**
	 * Hint Vue directive
	 *
	 * @package bitrix
	 * @subpackage ui
	 * @copyright 2001-2021 Bitrix
	 */

	ui_vue.BitrixVue.directive('bx-hint', {
		bind(element, bindings) {
			main_core.Event.bind(element, 'mouseenter', () => TooltipManager.show(element, bindings));
			main_core.Event.bind(element, 'mouseleave', () => TooltipManager.hide());
		}
	});
	class Tooltip {
		constructor() {
			this.popup = null;
			this.elements;
		}
		show(element, bindings = {}) {
			if (this.popup) {
				this.popup.close();
			}
			let popupOptions = {};
			let text;
			if (main_core.Type.isObject(bindings.value)) {
				if (bindings.value.text) {
					text = main_core.Text.encode(bindings.value.text);
				} else if (bindings.value.html) {
					text = bindings.value.html;
				}
				if (main_core.Type.isObject(bindings.value.popupOptions)) {
					popupOptions = bindings.value.popupOptions;
				}
				if (bindings.value.position === 'top') {
					if (!main_core.Type.isObject(popupOptions.bindOptions)) {
						popupOptions.bindOptions = {};
					}
					popupOptions.bindOptions.position = 'top';
				}
			} else {
				text = bindings.value;
				if (main_core.Type.isUndefined(element.dataset.hintHtml)) {
					text = main_core.Text.encode(text);
				}
			}
			popupOptions.bindElement = element;
			if (main_core.Type.isUndefined(popupOptions.id)) {
				popupOptions.id = 'bx-vue-hint';
			}
			if (main_core.Type.isUndefined(popupOptions.darkMode)) {
				popupOptions.darkMode = true;
			}
			if (main_core.Type.isUndefined(popupOptions.content)) {
				const content = main_core.Tag.render`<span class='ui-hint-content'></span>`;
				content.innerHTML = text;
				popupOptions.content = content;
			}
			if (main_core.Type.isUndefined(popupOptions.autoHide)) {
				popupOptions.autoHide = true;
			}
			if (!main_core.Type.isObject(popupOptions.bindOptions)) {
				popupOptions.bindOptions = {};
			}
			if (main_core.Type.isUndefined(popupOptions.bindOptions.position)) {
				popupOptions.bindOptions.position = 'bottom';
			}
			popupOptions.cacheable = false;
			popupOptions.focusTrap = false;
			this.popup = new main_popup.Popup(popupOptions);
			this.popup.show();
		}
		hide() {
			if (this.popup) {
				this.popup.close();
			}
		}
	}
	const TooltipManager = new Tooltip();

	/**
	 * Hint Vue component
	 *
	 * @package bitrix
	 * @subpackage ui
	 * @copyright 2001-2021 Bitrix
	 */

	ui_vue.BitrixVue.component('bx-hint', {
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
			popupOptions: {
				default() {
					return {};
				}
			}
		},
		template: `
		<span class="ui-hint" v-bx-hint="{text, html, position, popupOptions}" data-hint-init="vue">
			<span class="ui-hint-icon"/>
		</span>
	`
	});

})(BX, BX, BX.Main);
//# sourceMappingURL=hint.bundle.js.map
