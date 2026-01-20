/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,ui_iconSet_api_vue) {
	'use strict';

	// @vue/component
	const SettingsLabel = {
	  name: 'UiSettingsLabel',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon
	  },
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  template: `
		<div class="b24-settings-label">
			<BIcon :name="Outline.SETTINGS" hoverable/>
		</div>
	`
	};

	exports.SettingsLabel = SettingsLabel;

}((this.BX.Tasks.V2.Component.Elements = this.BX.Tasks.V2.Component.Elements || {}),BX.UI.IconSet));
//# sourceMappingURL=settings-label.bundle.js.map
