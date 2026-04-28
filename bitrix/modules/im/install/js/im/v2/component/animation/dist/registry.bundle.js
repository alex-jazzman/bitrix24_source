/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports,main_core) {
	'use strict';

	// @vue/component
	const ExpandAnimation = {
	  props: {
	    duration: {
	      type: Number,
	      default: 300
	    }
	  },
	  methods: {
	    onBeforeEnter(element) {
	      main_core.Dom.style(element, 'overflow', 'hidden');
	      main_core.Dom.style(element, 'transition', `height ${this.duration}ms, opacity ${this.duration}ms`);
	    },
	    onBeforeLeave(element) {
	      this.onBeforeEnter(element);
	    },
	    onEnter(element) {
	      main_core.Dom.style(element, 'height', 0);
	      main_core.Dom.style(element, 'opacity', 0);
	      requestAnimationFrame(() => {
	        requestAnimationFrame(() => {
	          main_core.Dom.style(element, 'opacity', 1);
	          main_core.Dom.style(element, 'height', `${element.scrollHeight}px`);
	        });
	      });
	    },
	    onAfterEnter(element) {
	      main_core.Dom.style(element, 'height', 'auto');
	    },
	    onLeave(element) {
	      main_core.Dom.style(element, 'height', `${element.scrollHeight}px`);
	      requestAnimationFrame(() => {
	        main_core.Dom.style(element, 'height', 0);
	        main_core.Dom.style(element, 'opacity', 0);
	      });
	    }
	  },
	  template: `
		<Transition
			@before-enter="onBeforeEnter"
			@enter="onEnter"
			@after-enter="onAfterEnter"
			@before-leave="onBeforeLeave"
			@leave="onLeave"
		>
			<slot></slot>
		</Transition>
	`
	};

	// @vue/component
	const FadeAnimation = {
	  name: 'FadeAnimation',
	  props: {
	    duration: {
	      type: Number,
	      default: 100
	    }
	  },
	  emits: ['afterEnter'],
	  computed: {
	    formattedDuration() {
	      return `${this.duration}ms`;
	    }
	  },
	  methods: {
	    setDuration(element) {
	      main_core.Dom.style(element, 'transition-duration', this.formattedDuration);
	    },
	    clearDuration(element) {
	      main_core.Dom.style(element, 'transition-duration', '');
	    },
	    onAfterEnter(element) {
	      this.$emit('afterEnter');
	      this.clearDuration(element);
	    }
	  },
	  template: `
		<Transition
			name="im-animation-fade"
			@beforeEnter="setDuration"
			@afterEnter="onAfterEnter"
			@beforeLeave="setDuration"
			@afterLeave="clearDuration"
		>
			<slot></slot>
		</Transition>
	`
	};

	const EntrySide = {
	  left: 'left',
	  right: 'right'
	};

	// @vue/component
	const SlideAnimation = {
	  name: 'SlideAnimation',
	  props: {
	    duration: {
	      type: Number,
	      default: 300
	    },
	    entrySide: {
	      type: String,
	      default: EntrySide.left,
	      validator: value => Object.values(EntrySide).includes(value)
	    }
	  },
	  computed: {
	    direction() {
	      return this.entrySide === EntrySide.left ? '-100%' : '100%';
	    }
	  },
	  methods: {
	    onBeforeEnter(element) {
	      main_core.Dom.style(element, 'transform', `translateX(${this.direction})`);
	      main_core.Dom.style(element, 'transition', `all ${this.duration}ms`);
	    },
	    onEnter(element) {
	      requestAnimationFrame(() => {
	        main_core.Dom.style(element, 'transform', 'translateX(0)');
	      });
	    },
	    onBeforeLeave(element) {
	      main_core.Dom.style(element, 'transform', 'translateX(0)');
	      main_core.Dom.style(element, 'transition', `all ${this.duration}ms`);
	    },
	    onLeave(element) {
	      requestAnimationFrame(() => {
	        main_core.Dom.style(element, 'transform', `translateX(${this.direction})`);
	      });
	    }
	  },
	  template: `
		<Transition
			@before-enter="onBeforeEnter"
			@enter="onEnter"
			@before-leave="onBeforeLeave"
			@leave="onLeave"
		>
			<slot></slot>
		</Transition>
	`
	};

	// @vue/component
	const SidebarAnimation = {
	  name: 'SidebarAnimation',
	  props: {
	    width: {
	      type: Number,
	      required: true
	    },
	    duration: {
	      type: Number,
	      default: 300
	    }
	  },
	  methods: {
	    onBeforeEnter(element) {
	      main_core.Dom.style(element, 'width', '0');
	      main_core.Dom.style(element, 'min-width', '0');
	      main_core.Dom.style(element, 'transition', `all ${this.duration}ms`);
	    },
	    onEnter(element) {
	      requestAnimationFrame(() => {
	        main_core.Dom.style(element, 'width', `${this.width}px`);
	        main_core.Dom.style(element, 'min-width', `${this.width}px`);
	      });
	    },
	    onBeforeLeave(element) {
	      main_core.Dom.style(element, 'width', `${this.width}px`);
	      main_core.Dom.style(element, 'min-width', `${this.width}px`);
	      main_core.Dom.style(element, 'transition', `all ${this.duration}ms`);
	    },
	    onLeave(element) {
	      requestAnimationFrame(() => {
	        main_core.Dom.style(element, 'width', '0');
	        main_core.Dom.style(element, 'min-width', '0');
	      });
	    }
	  },
	  template: `
		<Transition
			@before-enter="onBeforeEnter"
			@enter="onEnter"
			@before-leave="onBeforeLeave"
			@leave="onLeave"
		>
			<slot></slot>
		</Transition>
	`
	};

	exports.ExpandAnimation = ExpandAnimation;
	exports.FadeAnimation = FadeAnimation;
	exports.SlideAnimation = SlideAnimation;
	exports.SidebarAnimation = SidebarAnimation;

}((this.BX.Messenger.v2.Component.Animation = this.BX.Messenger.v2.Component.Animation || {}),BX));
//# sourceMappingURL=registry.bundle.js.map
