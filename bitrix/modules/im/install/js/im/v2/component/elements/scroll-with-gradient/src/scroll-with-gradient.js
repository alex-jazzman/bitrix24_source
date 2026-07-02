import { type JsonObject } from 'main.core';

import { horizontalScroll } from 'im.v2.lib.directives';

import './css/scroll-with-gradient.css';

type ScrollStrategyItem = {
	startGradientClass: string,
	endGradientClass: string,
	containerClass: string,
	scrollContainerClass: string,
	getScrollPosition: (el: HTMLElement) => number,
	getVisibleSize: (el: HTMLElement) => number,
	getFullSize: (el: HTMLElement) => number,
	getGradientSizeStyle: (size: number) => Record<string, string>,
};

export const ScrollDirection = {
	vertical: 'vertical',
	horizontal: 'horizontal',
};

const ScrollStrategy = {
	[ScrollDirection.vertical]: {
		startGradientClass: '--top',
		endGradientClass: '--bottom',
		containerClass: '',
		scrollContainerClass: '',
		getScrollPosition: (el) => el.scrollTop,
		getVisibleSize: (el) => el.clientHeight,
		getFullSize: (el) => el.scrollHeight,
		getGradientSizeStyle: (size) => ({ maxHeight: `${size}px` }),
	},
	[ScrollDirection.horizontal]: {
		startGradientClass: '--left',
		endGradientClass: '--right',
		containerClass: '--horizontal',
		scrollContainerClass: '--hidden-scroll',
		getScrollPosition: (el) => el.scrollLeft,
		getVisibleSize: (el) => el.clientWidth,
		getFullSize: (el) => el.scrollWidth,
		getGradientSizeStyle: (size) => ({ maxWidth: `${size}px` }),
	},
};

// @vue/component
export const ScrollWithGradient = {
	name: 'ScrollWithGradient',
	directives: { horizontalScroll },
	expose: ['getContainer'],
	props: {
		gradientSize: {
			type: Number,
			default: 28,
		},
		withShadow: {
			type: Boolean,
			default: false,
		},
		direction: {
			type: String,
			default: ScrollDirection.vertical,
			validator: (value) => Object.values(ScrollDirection).includes(value),
		},
	},
	data(): JsonObject
	{
		return {
			showStartGradient: false,
			showEndGradient: false,
		};
	},
	computed: {
		strategy(): ScrollStrategyItem
		{
			return ScrollStrategy[this.direction];
		},
		isHorizontal(): boolean
		{
			return this.direction === ScrollDirection.horizontal;
		},
		startGradientClass(): string
		{
			return this.strategy.startGradientClass;
		},
		endGradientClass(): string
		{
			return this.strategy.endGradientClass;
		},
		containerClass(): string
		{
			return this.strategy.containerClass;
		},
		scrollContainerClass(): string
		{
			return this.strategy.scrollContainerClass;
		},
		gradientSizeStyle(): Record<string, string>
		{
			return this.strategy.getGradientSizeStyle(this.gradientSize);
		},
	},
	mounted()
	{
		this.updateGradientStatus();
	},
	methods: {
		getContainer(): HTMLElement
		{
			return this.$refs['scroll-container'];
		},
		onScroll(event: Event)
		{
			this.$emit('scroll', event);
			this.updateGradientStatus();
		},
		updateGradientStatus()
		{
			const element = this.getContainer();
			const { getScrollPosition, getVisibleSize, getFullSize } = this.strategy;

			const scrollPosition = getScrollPosition(element);
			const visibleSize = getVisibleSize(element);
			const fullSize = getFullSize(element);

			this.showStartGradient = scrollPosition > 0;
			this.showEndGradient = Math.floor(scrollPosition + visibleSize) < fullSize;
		},
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
	`,
};
