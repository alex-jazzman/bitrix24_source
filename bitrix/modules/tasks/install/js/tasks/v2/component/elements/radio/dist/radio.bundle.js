/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports) {
	'use strict';

	const UiRadio = {
	  name: 'UiRadio',
	  props: {
	    modelValue: {
	      type: [Number, String],
	      default: undefined
	    },
	    value: {
	      type: [Number, String],
	      required: true
	    },
	    disabled: {
	      type: Boolean,
	      default: false
	    },
	    inputId: {
	      type: String,
	      default: ''
	    },
	    inputClassName: {
	      type: [Array, Object, String],
	      default: ''
	    },
	    inputName: {
	      type: String,
	      default: ''
	    },
	    tag: {
	      type: String,
	      default: 'span'
	    }
	  },
	  emits: ['update:modelValue', 'change', 'focus', 'blur'],
	  computed: {
	    model: {
	      get() {
	        return this.modelValue;
	      },
	      set(value) {
	        this.$emit('update:modelValue', value);
	      }
	    }
	  },
	  template: `
		<Component
			:is="tag"
		>
			<input
				v-model="model"
				:id="inputId"
				type="radio"
				:disabled
				:value
				:name="inputName"
				:class="[
					'tasks-elements-radio',
					inputClassName
				].flat(1)"
				@focus="$emit('focus', $event)"
				@blur="$emit('focus', $event)"
				@change="$emit('focus', $event)"
			/>
		</Component>
	`
	};

	exports.UiRadio = UiRadio;

}((this.BX.Tasks.V2.Component.Elements = this.BX.Tasks.V2.Component.Elements || {})));
//# sourceMappingURL=radio.bundle.js.map
