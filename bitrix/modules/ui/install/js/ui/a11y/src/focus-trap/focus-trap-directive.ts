/* eslint-disable no-underscore-dangle,@bitrix24/bitrix24-rules/no-pseudo-private */
import { Type } from 'main.core';
import { FocusTrap } from './focus-trap';
import { type FocusTrapOptions } from './types';

type FocusTrapDirectiveOptions = {
	active?: boolean;
	options?: FocusTrapOptions
};

interface HTMLElementWithFocusTrap extends HTMLElement {
	__focusTrap?: FocusTrap;
}

export const FocusTrapDirective = {
	mounted(el: HTMLElementWithFocusTrap, binding: any)
	{
		const { active, options } = normalizeValue(binding.value);

		// eslint-disable-next-line no-param-reassign
		el.__focusTrap = new FocusTrap(el, options);

		if (active)
		{
			el.__focusTrap.activate();
		}
	},

	updated(el: HTMLElementWithFocusTrap, binding: any)
	{
		const { active, options } = normalizeValue(binding.value);
		const { active: prevActive, options: prevOptions } = normalizeValue(binding.oldValue);

		if (options !== prevOptions && options)
		{
			el.__focusTrap?.destroy();

			// eslint-disable-next-line no-param-reassign
			el.__focusTrap = new FocusTrap(el, options);
		}

		const trap: FocusTrap | undefined = el.__focusTrap;
		if (!trap)
		{
			return;
		}

		if (active)
		{
			trap.activate();
		}
		else
		{
			trap.deactivate();
		}
	},

	unmounted(el: HTMLElementWithFocusTrap)
	{
		el.__focusTrap?.destroy();

		// eslint-disable-next-line no-param-reassign
		delete el.__focusTrap;
	},
};

function normalizeValue(value: boolean | FocusTrapDirectiveOptions): FocusTrapDirectiveOptions
{
	if (Type.isBoolean(value))
	{
		return { active: value as boolean };
	}

	if (Type.isPlainObject(value))
	{
		return {
			active: (value as FocusTrapDirectiveOptions).active !== false,
			options: (value as FocusTrapDirectiveOptions).options,
		};
	}

	return { active: false };
}
