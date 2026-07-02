/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core) {
	'use strict';

	const RatingStarsInput = {
	  props: {
	    modelValue: {
	      type: [Number, String],
	      required: false,
	      default: 0
	    },
	    hoverable: {
	      type: Boolean,
	      required: false,
	      default: false
	    },
	    clickable: {
	      type: Boolean,
	      required: false,
	      default: false
	    },
	    allowClear: {
	      type: Boolean,
	      required: false,
	      default: true
	    },
	    disabled: {
	      type: Boolean,
	      required: false,
	      default: false
	    },
	    error: {
	      type: Boolean,
	      required: false,
	      default: false
	    },
	    size: {
	      type: Number,
	      required: false,
	      default: 33
	    },
	    className: {
	      type: String,
	      required: false,
	      default: ''
	    },
	    emptyStrokeColor: {
	      type: String,
	      required: false,
	      default: ''
	    },
	    emptyHoverStrokeColor: {
	      type: String,
	      required: false,
	      default: ''
	    }
	  },
	  emits: ['update:modelValue', 'change'],
	  data() {
	    return {
	      hoverRating: 0
	    };
	  },
	  computed: {
	    isDisabled() {
	      return this.disabled === true;
	    },
	    value() {
	      const valueNumber = main_core.Text.toNumber(this.modelValue);
	      return Math.max(0, Math.min(5, valueNumber));
	    },
	    displayRating() {
	      if (this.hoverRating > 0) {
	        return this.hoverRating;
	      }
	      return this.value;
	    },
	    isHoverEnabled() {
	      return this.hoverable === true && !this.isDisabled;
	    },
	    isClickEnabled() {
	      return this.clickable === true && !this.isDisabled;
	    },
	    isPointer() {
	      return (this.isHoverEnabled || this.isClickEnabled) && !this.isDisabled;
	    }
	  },
	  methods: {
	    isActiveStar(currentStar) {
	      return currentStar <= parseInt(this.displayRating, 10);
	    },
	    onLeave() {
	      this.hoverRating = 0;
	    },
	    onStarEnter(star) {
	      if (!this.isHoverEnabled) {
	        return;
	      }
	      const starNumber = main_core.Text.toNumber(star);
	      if (starNumber > 0) {
	        this.hoverRating = Math.max(1, Math.min(5, starNumber));
	      }
	    },
	    onStarClick(star) {
	      if (!this.isClickEnabled) {
	        return;
	      }
	      const starNumber = Math.max(1, Math.min(5, main_core.Text.toNumber(star)));
	      let nextValue = starNumber;
	      if (this.allowClear && starNumber === this.value) {
	        nextValue = 0;
	      }
	      this.$emit('update:modelValue', nextValue);
	      this.$emit('change', nextValue);
	    },
	    getStarClass(currentStar) {
	      return {
	        '--active': this.isActiveStar(currentStar),
	        '--pointer': this.isPointer,
	        '--error': this.error === true
	      };
	    },
	    getSizeValue() {
	      const size = main_core.Text.toNumber(this.size);
	      return size > 0 ? size : 33;
	    },
	    getRootClass() {
	      if (!main_core.Type.isStringFilled(this.className)) {
	        return {};
	      }
	      return {
	        [this.className]: true
	      };
	    },
	    getRootStyle() {
	      const style = {};
	      if (main_core.Type.isStringFilled(this.emptyStrokeColor)) {
	        style['--market-rating-stars-input-empty-stroke'] = this.emptyStrokeColor;
	      }
	      if (main_core.Type.isStringFilled(this.emptyHoverStrokeColor)) {
	        style['--market-rating-stars-input-empty-hover-stroke'] = this.emptyHoverStrokeColor;
	      }
	      return style;
	    }
	  },
	  template: `
		<div class="market-rating-stars-input" :class="getRootClass()" :style="getRootStyle()" @mouseleave="onLeave">
			<svg class="market-rating-stars-input__star"
				 v-for="star in 5"
				 :key="star"
				 :class="getStarClass(star)"
				 :width="getSizeValue()" :height="getSizeValue()"
				 viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg"
				 @mouseenter="onStarEnter(star)"
				 @click.stop="onStarClick(star)"
			>
				<path
					d="M15.8607 5.74116C16.0899 5.16168 16.9101 5.16168 17.1393 5.74116L19.7849 12.4292C19.8809 12.6721 20.1062 12.8395 20.3664 12.8614L27.2929 13.4453C27.8928 13.4959 28.1426 14.2383 27.6953 14.6412L22.3683 19.4392C22.1833 19.6058 22.1029 19.8594 22.1579 20.1021L23.7765 27.2365C23.9126 27.8366 23.2522 28.2996 22.7345 27.9671L16.8715 24.2017C16.6452 24.0564 16.3548 24.0564 16.1285 24.2017L10.2655 27.9671C9.74776 28.2996 9.0874 27.8366 9.22354 27.2365L10.8421 20.1021C10.8971 19.8594 10.8167 19.6058 10.6317 19.4392L5.30471 14.6412C4.85741 14.2383 5.10721 13.4959 5.70707 13.4453L12.6336 12.8614C12.8938 12.8395 13.1191 12.6721 13.2151 12.4292L15.8607 5.74116Z"
				/>
			</svg>
		</div>
	`
	};

	exports.RatingStarsInput = RatingStarsInput;

})(this.BX.Market = this.BX.Market || {}, BX);
