import { Dom } from 'main.core';

const EntrySide = {
	left: 'left',
	right: 'right',
};

// @vue/component
export const SlideAnimation = {
	name: 'SlideAnimation',
	props: {
		duration: {
			type: Number,
			default: 300,
		},
		entrySide: {
			type: String,
			default: EntrySide.left,
			validator: (value) => Object.values(EntrySide).includes(value),
		},
	},
	computed: {
		direction(): string
		{
			return this.entrySide === EntrySide.left ? '-100%' : '100%';
		},
	},
	methods: {
		onBeforeEnter(element: HTMLElement)
		{
			Dom.style(element, 'transform', `translateX(${this.direction})`);
			Dom.style(element, 'transition', `all ${this.duration}ms`);
		},
		onEnter(element: HTMLElement)
		{
			requestAnimationFrame(() => {
				Dom.style(element, 'transform', 'translateX(0)');
			});
		},
		onBeforeLeave(element: HTMLElement)
		{
			Dom.style(element, 'transform', 'translateX(0)');
			Dom.style(element, 'transition', `all ${this.duration}ms`);
		},
		onLeave(element: HTMLElement)
		{
			requestAnimationFrame(() => {
				Dom.style(element, 'transform', `translateX(${this.direction})`);
			});
		},
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
	`,
};
