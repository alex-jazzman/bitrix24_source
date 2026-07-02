/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
(function (exports, ui_iconSet_api_core) {
	'use strict';

	const BIcon = {
		props: {
			name: {
				type: String,
				required: true,
				validator(value) {
					return Object.values(ui_iconSet_api_core.Set).includes(value) || Object.values(ui_iconSet_api_core.Outline).includes(value) || Object.values(ui_iconSet_api_core.Solid).includes(value) || Object.values(ui_iconSet_api_core.SmallOutline).includes(value);
				}
			},
			color: {
				type: String,
				required: false,
				default: null
			},
			size: {
				type: Number,
				required: false,
				default: null
			},
			hoverable: {
				type: Boolean,
				default: false
			},
			hoverableAlt: {
				type: Boolean,
				default: false
			},
			responsive: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			className() {
				return ['ui-icon-set', `--${this.name}`, this.hoverableClassnameModifier, this.responsiveClassnameModifier];
			},
			hoverableClassnameModifier() {
				if (this.hoverable) {
					return '--hoverable-default';
				}
				if (this.hoverableAlt) {
					return '--hoverable-alt';
				}
				return '';
			},
			responsiveClassnameModifier() {
				return this.responsive ? '--responsive' : '';
			},
			inlineSize() {
				if (this.responsive) {
					return '';
				}
				return this.size ? `--ui-icon-set__icon-size: ${this.size}px;` : '';
			},
			inlineColor() {
				return this.color ? `--ui-icon-set__icon-color: ${this.color};` : '';
			},
			inlineStyle() {
				return this.inlineSize + this.inlineColor;
			}
		},
		template: `
		<div
			:class="className"
			:style="inlineStyle"
		></div>
	`
	};

	exports.BIcon = BIcon;
	Object.prototype.hasOwnProperty.call(ui_iconSet_api_core, '__proto__') &&
		!Object.prototype.hasOwnProperty.call(exports, '__proto__') &&
		Object.defineProperty(exports, '__proto__', {
			enumerable: true,
			value: ui_iconSet_api_core['__proto__']
		});

	Object.keys(ui_iconSet_api_core).forEach(function (k) {
		if (k !== 'default' && !Object.prototype.hasOwnProperty.call(exports, k)) exports[k] = ui_iconSet_api_core[k];
	});

})(this.BX.UI.IconSet = this.BX.UI.IconSet || {}, BX.UI.IconSet);
//# sourceMappingURL=ui.icon-set.vue.bundle.js.map
