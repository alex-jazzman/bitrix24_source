/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, im_v2_lib_directives) {
	'use strict';

	const ScrollDirection = {
		vertical: 'vertical',
		horizontal: 'horizontal'
	};
	const ScrollStrategy = {
		[ScrollDirection.vertical]: {
			startGradientClass: '--top',
			endGradientClass: '--bottom',
			containerClass: '',
			scrollContainerClass: '',
			getScrollPosition: el => el.scrollTop,
			getVisibleSize: el => el.clientHeight,
			getFullSize: el => el.scrollHeight,
			getGradientSizeStyle: size => ({
				maxHeight: `${size}px`
			})
		},
		[ScrollDirection.horizontal]: {
			startGradientClass: '--left',
			endGradientClass: '--right',
			containerClass: '--horizontal',
			scrollContainerClass: '--hidden-scroll',
			getScrollPosition: el => el.scrollLeft,
			getVisibleSize: el => el.clientWidth,
			getFullSize: el => el.scrollWidth,
			getGradientSizeStyle: size => ({
				maxWidth: `${size}px`
			})
		}
	};

	// @vue/component
	const ScrollWithGradient = {
		name: 'ScrollWithGradient',
		directives: {
			horizontalScroll: im_v2_lib_directives.horizontalScroll
		},
		expose: ['getContainer'],
		props: {
			gradientSize: {
				type: Number,
				default: 28
			},
			withShadow: {
				type: Boolean,
				default: false
			},
			direction: {
				type: String,
				default: ScrollDirection.vertical,
				validator: value => Object.values(ScrollDirection).includes(value)
			}
		},
		data() {
			return {
				showStartGradient: false,
				showEndGradient: false
			};
		},
		computed: {
			strategy() {
				return ScrollStrategy[this.direction];
			},
			isHorizontal() {
				return this.direction === ScrollDirection.horizontal;
			},
			startGradientClass() {
				return this.strategy.startGradientClass;
			},
			endGradientClass() {
				return this.strategy.endGradientClass;
			},
			containerClass() {
				return this.strategy.containerClass;
			},
			scrollContainerClass() {
				return this.strategy.scrollContainerClass;
			},
			gradientSizeStyle() {
				return this.strategy.getGradientSizeStyle(this.gradientSize);
			}
		},
		mounted() {
			this.updateGradientStatus();
		},
		methods: {
			getContainer() {
				return this.$refs['scroll-container'];
			},
			onScroll(event) {
				this.$emit('scroll', event);
				this.updateGradientStatus();
			},
			updateGradientStatus() {
				const element = this.getContainer();
				const {
					getScrollPosition,
					getVisibleSize,
					getFullSize
				} = this.strategy;
				const scrollPosition = getScrollPosition(element);
				const visibleSize = getVisibleSize(element);
				const fullSize = getFullSize(element);
				this.showStartGradient = scrollPosition > 0;
				this.showEndGradient = Math.floor(scrollPosition + visibleSize) < fullSize;
			}
		},
		template: `
		<div class="bx-im-scroll-with-gradient__container" :class="containerClass">
			<Transition name="gradient-fade">
				<div v-if="showStartGradient" class="bx-im-scroll-with-gradient__gradient" :class="startGradientClass" :style="gradientSizeStyle">
					<div v-if="withShadow" class="bx-im-scroll-with-gradient__gradient-inner"></div>
				</div>
			</Transition>
			<div
				v-horizontal-scroll="isHorizontal"
				class="bx-im-scroll-with-gradient__content"
				:class="scrollContainerClass"
				@scroll="onScroll"
				ref="scroll-container"
			>
				<slot></slot>
			</div>
			<Transition name="gradient-fade">
				<div v-if="showEndGradient" class="bx-im-scroll-with-gradient__gradient" :class="endGradientClass" :style="gradientSizeStyle">
					<div v-if="withShadow" class="bx-im-scroll-with-gradient__gradient-inner"></div>
				</div>
			</Transition>
		</div>
	`
	};

	exports.ScrollDirection = ScrollDirection;
	exports.ScrollWithGradient = ScrollWithGradient;

})(this.BX.Messenger.v2.Component.Elements = this.BX.Messenger.v2.Component.Elements || {}, BX.Messenger.v2.Lib);
//# sourceMappingURL=scroll-with-gradient.bundle.js.map
