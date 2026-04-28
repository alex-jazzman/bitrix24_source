import { Dom } from 'main.core';

// @vue/component
export const SidebarAnimation = {
	name: 'SidebarAnimation',
	props: {
		width: {
			type: Number,
			required: true,
		},
		duration: {
			type: Number,
			default: 300,
		},
	},
	methods: {
		onBeforeEnter(element: HTMLElement)
		{
			Dom.style(element, 'width', '0');
			Dom.style(element, 'min-width', '0');
			Dom.style(element, 'transition', `all ${this.duration}ms`);
		},
		onEnter(element: HTMLElement)
		{
			requestAnimationFrame(() => {
				Dom.style(element, 'width', `${this.width}px`);
				Dom.style(element, 'min-width', `${this.width}px`);
			});
		},
		onBeforeLeave(element: HTMLElement)
		{
			Dom.style(element, 'width', `${this.width}px`);
			Dom.style(element, 'min-width', `${this.width}px`);
			Dom.style(element, 'transition', `all ${this.duration}ms`);
		},
		onLeave(element: HTMLElement)
		{
			requestAnimationFrame(() => {
				Dom.style(element, 'width', '0');
				Dom.style(element, 'min-width', '0');
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
