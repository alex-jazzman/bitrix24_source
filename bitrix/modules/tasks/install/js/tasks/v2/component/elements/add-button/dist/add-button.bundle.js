/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,ui_iconSet_api_vue) {
	'use strict';

	// @vue/component
	const AddButton = {
	  name: 'AddButton',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon
	  },
	  props: {
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
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  computed: {
	    icon() {
	      return this.isLocked ? ui_iconSet_api_vue.Outline.LOCK_L : ui_iconSet_api_vue.Outline.PLUS_L;
	    }
	  },
	  template: `
		<div 
			class="b24-add-button" 
			:class="{
				'--visible' : isVisible,
				'--locked' : isLocked,
			}"
		>
			<BIcon :name="icon" hoverable/>
		</div>
	`
	};

	exports.AddButton = AddButton;

}((this.BX.Tasks.V2.Component.Elements = this.BX.Tasks.V2.Component.Elements || {}),BX.UI.IconSet));
//# sourceMappingURL=add-button.bundle.js.map
