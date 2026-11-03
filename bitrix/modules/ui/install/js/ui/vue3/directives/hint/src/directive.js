/**
 * Hint Vue directive
 *
 * @package bitrix
 * @subpackage ui
 * @copyright 2001-2025 Bitrix
 */

/*
	<span v-hint="$Bitrix.Loc.getMessage('HINT_HTML')" data-hint-html>Html code</span>
	<span v-hint="{text: 'Text node'}">Plain text</span>
	<span v-hint="{html: '<b>Html</b> code'}">Html code</span>
	<span v-hint="{text: 'Custom position top and light mode', position: 'top', popupOptions: {darkMode: false}}">
		Text top on light panel
	</span>
	<span v-hint="{text: 'Hint text <a>More</a>', interactivity: true}">Hint with clickable link</span>
*/

import { Event, Type } from 'main.core';
import 'ui.hint';

import { tooltip, type HintParams } from './tooltip';
export type { HintParams };

const handlersMap = new WeakMap();
let activeElement = null;
let showTimeout = null;
let pendingElement = null;

export const hint = {
	mounted(element: HTMLElement, { value }: { value: HintParams | Function }): void
	{
		updateEvents(element, value);
	},
	updated(element: HTMLElement, { value }: { value: HintParams | Function }): void
	{
		updateEvents(element, value);
	},
	beforeUnmount(element: HTMLElement): void
	{
		unbindEvents(element);
	},
};

function updateEvents(element: HTMLElement, params: HintParams | Function): void
{
	const binding = handlersMap.get(element);
	if (binding?.params === params)
	{
		return;
	}

	if (binding && params)
	{
		binding.params = params;
		binding.state.params = params;

		return;
	}

	if (binding)
	{
		unbindEvents(element);
	}

	if (params)
	{
		const state = { params, hovered: false, focused: false };
		const handlers = {
			mouseenter: () => {
				state.hovered = true;
				scheduleTooltip(element, getParams(state.params));
			},
			mouseleave: () => {
				state.hovered = false;
				if (!state.focused)
				{
					hideTooltip(element, getParams(state.params).interactivity ?? false);
				}
			},
			focus: () => {
				state.focused = true;
				scheduleTooltip(element, getParams(state.params));
			},
			blur: () => {
				state.focused = false;
				if (!state.hovered)
				{
					hideTooltip(element);
				}
			},
			click: () => hideTooltip(element),
		};
		handlersMap.set(element, { params, handlers, state });

		Object.entries(handlers).forEach(([event, handler]) => Event.bind(element, event, handler));
	}
}

function unbindEvents(element: HTMLElement): void
{
	if (pendingElement === element)
	{
		clearTimeouts();
	}

	if (activeElement === element)
	{
		hideTooltip(element);
	}

	Object.entries(handlersMap.get(element)?.handlers ?? {})
		.forEach(([event, handler]) => Event.unbind(element, event, handler));
	handlersMap.delete(element);
}

function scheduleTooltip(element: HTMLElement, params: HintParams): void
{
	if (activeElement === element || pendingElement === element)
	{
		return;
	}

	clearTimeouts();
	pendingElement = element;
	showTimeout = setTimeout(() => {
		if (pendingElement === element && handlersMap.has(element))
		{
			showTooltip(element, params);
		}
	}, params.timeout ?? 0);
}

function showTooltip(element: HTMLElement, params: HintParams): void
{
	clearTimeouts();
	activeElement = element;
	tooltip.show(element, params, () => {
		if (activeElement === element)
		{
			activeElement = null;
		}
	});
}

function hideTooltip(element: HTMLElement, isInteractive: boolean = false): void
{
	if (pendingElement === element)
	{
		clearTimeouts();
	}

	if (activeElement !== element)
	{
		return;
	}

	activeElement = null;
	tooltip.hide(isInteractive);
}

function clearTimeouts(): void
{
	clearTimeout(showTimeout);
	showTimeout = null;
	pendingElement = null;
}

function getParams(value: HintParams | Function): HintParams
{
	return Type.isFunction(value) ? value() : value;
}
