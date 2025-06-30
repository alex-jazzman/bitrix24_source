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

export const hint = {
	async mounted(element: HTMLElement, { value }: { value: HintParams | Function }): Promise<void>
	{
		if (!value)
		{
			return;
		}

		Event.bind(element, 'mouseenter', () => onMouseEnter(element, getParams(value)));
		const isInteractive = value.interactivity ?? false;
		Event.bind(element, 'mouseleave', () => hideTooltip(isInteractive));
		Event.bind(element, 'click', () => hideTooltip());
	},
};

let showTimeout = null;

function onMouseEnter(element: HTMLElement, params: HintParams): void
{
	clearTimeouts();
	showTimeout = setTimeout(() => showTooltip(element, params), params.timeout ?? 0);
}

function showTooltip(element: HTMLElement, params: HintParams): void
{
	clearTimeouts();
	tooltip.show(element, params);
}

function hideTooltip(isInteractive): void
{
	clearTimeouts();
	tooltip.hide(isInteractive);
}

function clearTimeouts(): void
{
	clearTimeout(showTimeout);
}

function getParams(value: HintParams | Function): HintParams
{
	return Type.isFunction(value) ? value() : value;
}
