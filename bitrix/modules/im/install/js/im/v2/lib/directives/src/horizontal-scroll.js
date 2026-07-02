import { Event } from 'main.core';

export const horizontalScroll = {
	mounted(el: HTMLElement, binding: { value: boolean })
	{
		if (binding.value === false)
		{
			return;
		}

		Event.bind(el, 'wheel', handleWheelEvent, { passive: false });
	},
	beforeUnmount(el: HTMLElement)
	{
		Event.unbind(el, 'wheel', handleWheelEvent);
	},
};

const handleWheelEvent = (event: WheelEvent) => {
	const { deltaX, deltaY, shiftKey } = event;
	const currentTarget = (event.currentTarget: HTMLElement);

	const hasHorizontalDelta = Math.abs(deltaX) > Math.abs(deltaY);
	const isHorizontalScroll = hasHorizontalDelta || shiftKey;
	if (isHorizontalScroll)
	{
		return;
	}

	event.preventDefault();
	currentTarget.scrollLeft += Math.round(deltaY);
};
