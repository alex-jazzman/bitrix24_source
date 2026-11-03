/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports, ui_iconSet_api_core, ui_iconSet_api_vue) {
	'use strict';

	// @vue/component
	const FieldHoverButton = {
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			icon: {
				type: String,
				required: true
			},
			isVisible: {
				type: Boolean,
				default: true
			},
			isLocked: {
				type: Boolean,
				default: false
			},
			ariaLabel: {
				type: String,
				default: ''
			},
			ariaHaspopup: {
				type: String,
				default: ''
			},
			ariaExpanded: {
				type: Boolean,
				default: null
			}
		},
		setup() {
			return {
				Outline: ui_iconSet_api_core.Outline
			};
		},
		template: `
		<component
			:is="ariaLabel ? 'button' : 'div'"
			:type="ariaLabel ? 'button' : null"
			:class="['b24-field-hover-button', { '--visible': isVisible, '--locked': isLocked }]"
			:aria-label="ariaLabel || null"
			:aria-haspopup="ariaLabel && ariaHaspopup ? ariaHaspopup : null"
			:aria-expanded="ariaLabel ? ariaExpanded : null"
		>
			<BIcon :name="isLocked ? Outline.LOCK_L : icon" hoverable aria-hidden="true"/>
		</component>
	`
	};

	exports.FieldHoverButton = FieldHoverButton;

})(this.BX.Tasks.V2.Component.Elements = this.BX.Tasks.V2.Component.Elements || {}, BX.UI.IconSet, BX.UI.IconSet);
//# sourceMappingURL=field-hover-button.bundle.js.map
