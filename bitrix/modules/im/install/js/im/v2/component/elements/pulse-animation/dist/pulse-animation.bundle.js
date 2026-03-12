/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports) {
	'use strict';

	const RING_COUNT = 3;

	// @vue/component
	const PulseAnimation = {
	  name: 'PulseAnimation',
	  props: {
	    showPulse: {
	      type: Boolean,
	      default: true
	    },
	    color: {
	      type: String,
	      default: null
	    },
	    innerSize: {
	      type: Number,
	      default: null
	    },
	    outerSize: {
	      type: Number,
	      default: null
	    }
	  },
	  computed: {
	    rings() {
	      if (!this.showPulse) {
	        return [];
	      }
	      return Array.from({
	        length: RING_COUNT
	      });
	    },
	    inlineInnerSize() {
	      return this.innerSize ? `--im-pulse-animation__size_ring-inner: ${this.innerSize}px;` : '';
	    },
	    inlineOuterSize() {
	      return this.outerSize ? `--im-pulse-animation__size_ring-outer: ${this.outerSize}px;` : '';
	    },
	    inlineColor() {
	      return this.color ? `--im-pulse-animation__border-color_ring: ${this.color};` : '';
	    },
	    inlineStyle() {
	      return this.inlineInnerSize + this.inlineOuterSize + this.inlineColor;
	    }
	  },
	  template: `
		<div class="bx-im-pulse-animation__container" :style="inlineStyle">
			<slot />
			<div class="bx-im-pulse-animation__rings">
				<div
					v-for="ring in rings"
					:key="ring"
					class="bx-im-pulse-animation__ring"
				></div>
			</div>
		</div>
	`
	};

	exports.PulseAnimation = PulseAnimation;

}((this.BX.Messenger.v2.Component.Elements = this.BX.Messenger.v2.Component.Elements || {})));
//# sourceMappingURL=pulse-animation.bundle.js.map
