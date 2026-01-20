/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports) {
	'use strict';

	// @vue/component
	const Checkbox = {
	  props: {
	    important: {
	      type: Boolean,
	      default: false
	    },
	    disabled: {
	      type: Boolean,
	      default: false
	    },
	    checked: {
	      type: Boolean,
	      default: false
	    },
	    highlight: {
	      type: Boolean,
	      default: false
	    },
	    tag: {
	      type: String,
	      default: 'label'
	    }
	  },
	  emits: ['click'],
	  methods: {
	    handleClick(event) {
	      event.stopPropagation();
	      this.$emit('click', event);
	    }
	  },
	  template: `
		<component
			:is="tag"
			class="tasks-card-checkbox"
			:class="{
				'--important': important,
				'--disabled': disabled,
				'--highlight': highlight,
			}"
			@click.stop
		>
			<input
				type="checkbox"
				:checked="checked"
				:disabled="disabled"
				@click="handleClick"
			>
			<span></span>
		</component>
	`
	};

	exports.Checkbox = Checkbox;

}((this.BX.Tasks.V2.Component.Elements = this.BX.Tasks.V2.Component.Elements || {})));
//# sourceMappingURL=checkbox.bundle.js.map
