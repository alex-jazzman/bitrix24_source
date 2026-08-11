import { Event } from 'main.core';

const formInputTrackerHandlers: WeakMap<HTMLElement, () => void> = new WeakMap();

export const FormInputTracker = {
	mounted(el: HTMLElement, binding: { value: () => void }): void
	{
		const handler = () => binding.value();
		formInputTrackerHandlers.set(el, handler);
		Event.bind(el, 'input', handler);
		Event.bind(el, 'change', handler);
	},
	beforeUnmount(el: HTMLElement): void
	{
		const handler = formInputTrackerHandlers.get(el);
		if (handler)
		{
			Event.unbind(el, 'input', handler);
			Event.unbind(el, 'change', handler);
			formInputTrackerHandlers.delete(el);
		}
	},
};
