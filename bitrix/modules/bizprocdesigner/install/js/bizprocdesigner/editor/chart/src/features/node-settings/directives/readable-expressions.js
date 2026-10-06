import { Event, Type } from 'main.core';

import { hasFocusInside, mountFieldVeneer, unmountFieldVeneer } from '../utils/readable-expressions-veneer';

type VeneerBinding = {
	control: HTMLElement,
	value: string,
	syncHandler: () => void,
};

const bindings: WeakMap<HTMLElement, VeneerBinding> = new WeakMap();

/**
 * Put the readable layer over a Vue-rendered field. The element the directive sits on is either the
 * control itself or the root of a design-system wrapper — the control inside it is found here, so
 * the caller does not have to reach for it.
 *
 * The layer is rebuilt from the current value on re-render and on focus loss; a field or a token of
 * its layer holding the focus is left alone, because rebuilding would take the focus off it.
 */
export const ReadableExpressions = {
	mounted(el: HTMLElement): void
	{
		const control = findControl(el);
		if (!control)
		{
			return;
		}

		const syncHandler = () => syncVeneer(el);
		bindings.set(el, { control, value: control.value ?? '', syncHandler });
		Event.bind(control, 'blur', syncHandler);

		mountFieldVeneer(control);
	},
	updated(el: HTMLElement): void
	{
		syncVeneer(el);
	},
	beforeUnmount(el: HTMLElement): void
	{
		const binding = bindings.get(el);
		if (!binding)
		{
			return;
		}

		bindings.delete(el);
		Event.unbind(binding.control, 'blur', binding.syncHandler);
		unmountFieldVeneer(binding.control);
	},
};

function findControl(el: HTMLElement): ?HTMLElement
{
	if (!Type.isDomNode(el))
	{
		return null;
	}

	return ['INPUT', 'TEXTAREA'].includes(el.tagName) ? el : el.querySelector('input, textarea');
}

function syncVeneer(el: HTMLElement): void
{
	const binding = bindings.get(el);
	if (!binding)
	{
		return;
	}

	const value = binding.control.value ?? '';
	if (value === binding.value || hasFocusInside(binding.control))
	{
		return;
	}

	binding.value = value;
	unmountFieldVeneer(binding.control);
	mountFieldVeneer(binding.control);
}
