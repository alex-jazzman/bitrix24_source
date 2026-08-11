import { Dom } from 'main.core';

export const BxControl = {
	mounted(el: HTMLElement, binding: { value: HTMLElement | null }): void
	{
		if (binding.value)
		{
			Dom.append(binding.value, el);
		}
	},
};
