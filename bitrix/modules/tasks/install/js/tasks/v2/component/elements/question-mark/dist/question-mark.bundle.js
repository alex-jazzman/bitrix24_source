/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,ui_vue3_directives_hint,ui_iconSet_api_vue,ui_iconSet_outline,tasks_v2_component_elements_hint) {
	'use strict';

	// @vue/component
	const QuestionMark = {
	  name: 'UiQuestionMark',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon
	  },
	  directives: {
	    hint: ui_vue3_directives_hint.hint
	  },
	  props: {
	    size: {
	      type: Number,
	      default: 20
	    },
	    hintText: {
	      type: String,
	      default: ''
	    },
	    hintMaxWidth: {
	      type: Number,
	      default: undefined
	    }
	  },
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  computed: {
	    tooltip() {
	      if (!this.hintText) {
	        return null;
	      }
	      return () => tasks_v2_component_elements_hint.tooltip({
	        text: this.hintText,
	        popupOptions: {
	          offsetLeft: this.$el.offsetWidth / 2,
	          maxWidth: this.hintMaxWidth
	        },
	        timeout: 200
	      });
	    }
	  },
	  template: `
		<BIcon v-hint="tooltip" class="b24-question-mark" :name="Outline.QUESTION" :size/>
	`
	};

	exports.QuestionMark = QuestionMark;

}((this.BX.Tasks.V2.Component.Elements = this.BX.Tasks.V2.Component.Elements || {}),BX.Vue3.Directives,BX.UI.IconSet,BX,BX.Tasks.V2.Component.Elements));
//# sourceMappingURL=question-mark.bundle.js.map
