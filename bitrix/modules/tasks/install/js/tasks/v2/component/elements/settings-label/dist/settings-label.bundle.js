/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports, ui_iconSet_api_vue) {
	'use strict';

	// @vue/component
	const SettingsLabel = {
		name: 'UiSettingsLabel',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			ariaLabel: {
				type: String,
				default: ''
			}
		},
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		computed: {
			label() {
				return this.ariaLabel || this.loc('TASKS_V2_SETTINGS_ARIA_LABEL');
			}
		},
		template: `
		<button type="button" class="b24-settings-label" :aria-label="label">
			<BIcon :name="Outline.FILTER_2_LINES" hoverable aria-hidden="true"/>
		</button>
	`
	};

	exports.SettingsLabel = SettingsLabel;

})(this.BX.Tasks.V2.Component.Elements = this.BX.Tasks.V2.Component.Elements || {}, BX.UI.IconSet);
//# sourceMappingURL=settings-label.bundle.js.map
