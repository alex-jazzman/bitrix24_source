import { Dom, Event } from 'main.core';

import './content-resizer.css';

// @vue/component
export const ContentResizer = {
	name: 'ContentResizer',
	emits: ['endResize'],
	data(): Object
	{
		return {
			startMouseX: 0,
			startWidth: 0,
		};
	},
	methods: {
		startResize(event: MouseEvent): void
		{
			Event.bind(window, 'pointermove', this.resize);
			Event.bind(window, 'mouseup', this.endResize);
			Dom.style(document.body, 'userSelect', 'none');

			this.startMouseX = event.clientX;
			this.startWidth = this.$el.parentElement.offsetWidth;
		},
		resize(event: PointerEvent): void
		{
			event.preventDefault();

			const width = this.startWidth + event.clientX - this.startMouseX;

			Dom.style(this.$el.parentElement, 'width', `${width}px`);
		},
		endResize(): void
		{
			Event.unbind(window, 'pointermove', this.resize);
			Event.unbind(window, 'mouseup', this.endResize);
			Dom.style(document.body, 'userSelect', null);

			this.$emit('endResize', this.$el.parentElement.offsetWidth);
		},
	},
	template: `
		<div class="b24-content-resizer" @mousedown.left="startResize"/>
	`,
};
