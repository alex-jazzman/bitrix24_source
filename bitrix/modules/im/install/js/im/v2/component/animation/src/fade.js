import { Dom, type JsonObject } from 'main.core';

import './css/fade.css';

// @vue/component
export const FadeAnimation = {
	name: 'FadeAnimation',
	props:
	{
		duration: {
			type: Number,
			default: 100,
		},
	},
	data(): JsonObject
	{
		return {};
	},
	computed:
	{
		formattedDuration(): string
		{
			return `${this.duration}ms`;
		},
	},
	methods:
	{
		setDuration(element: HTMLElement)
		{
			Dom.style(element, 'transition-duration', this.formattedDuration);
		},
		clearDuration(element: HTMLElement)
		{
			Dom.style(element, 'transition-duration', '');
		},
	},
	template: `
		<Transition
			name="im-animation-fade"
			@beforeEnter="setDuration"
			@afterEnter="clearDuration"
			@beforeLeave="setDuration"
			@afterLeave="clearDuration"
		>
			<slot></slot>
		</Transition>
	`,
};
