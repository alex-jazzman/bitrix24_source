/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,main_core) {
	'use strict';

	// @vue/component
	const BottomSheet = {
	  props: {
	    isShown: {
	      type: Boolean,
	      required: true
	    },
	    isExpanded: {
	      type: Boolean,
	      default: false
	    }
	  },
	  watch: {
	    async isShown() {
	      await this.$nextTick();
	      this.adjustPosition();
	    }
	  },
	  mounted() {
	    this.adjustPosition();
	  },
	  methods: {
	    adjustPosition() {
	      const container = this.$refs.container;
	      if (!container) {
	        return;
	      }
	      const previousElement = container.previousElementSibling;
	      main_core.Dom.style(container, '--bottom-sheet-top', `${previousElement.offsetTop + previousElement.offsetHeight}px`);
	    },
	    freeze() {},
	    unfreeze() {}
	  },
	  template: `
		<Transition name="b24-bottom-sheet">
			<div v-if="isShown" class="b24-bottom-sheet" :class="{ '--expanded': isExpanded }" ref="container">
				<slot></slot>
			</div>
		</Transition>
	`
	};

	exports.BottomSheet = BottomSheet;

}((this.BX.Tasks.V2.Component.Elements = this.BX.Tasks.V2.Component.Elements || {}),BX));
//# sourceMappingURL=bottom-sheet.bundle.js.map
