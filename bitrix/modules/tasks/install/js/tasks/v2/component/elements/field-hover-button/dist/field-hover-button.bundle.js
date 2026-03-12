/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,ui_iconSet_api_core,ui_iconSet_api_vue) {
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
	    }
	  },
	  setup() {
	    return {
	      Outline: ui_iconSet_api_core.Outline
	    };
	  },
	  template: `
		<div :class="['b24-field-hover-button', { '--visible': isVisible, '--locked': isLocked }]">
			<BIcon :name="isLocked ? Outline.LOCK_L : icon" hoverable/>
		</div>
	`
	};

	exports.FieldHoverButton = FieldHoverButton;

}((this.BX.Tasks.V2.Component.Elements = this.BX.Tasks.V2.Component.Elements || {}),BX.UI.IconSet,BX.UI.IconSet));
//# sourceMappingURL=field-hover-button.bundle.js.map
