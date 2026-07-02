import { Dom, Event, Type } from 'main.core';

import { Manager } from './manager/index';
import { RightButtons, type RightButtonsOptions as rbo } from './right-buttons';

import './css/actions-bar.css';

export type RightButtonsOptions = rbo;

const managedBars: WeakSet<HTMLElement> = new WeakSet();

function initManagerForContainer(container: HTMLElement): void
{
	if (managedBars.has(container))
	{
		return;
	}

	managedBars.add(container);

	new Manager({ container }).init();
}

function resolveContainer(target: HTMLElement | string): HTMLElement | null
{
	if (Type.isStringFilled(target))
	{
		return document.getElementById(target);
	}

	if (Type.isDomNode(target) && Dom.hasClass(target, 'ui-actions-bar'))
	{
		return target;
	}

	return null;
}

function init(target: HTMLElement | string): void
{
	const container = resolveContainer(target);
	if (container)
	{
		initManagerForContainer(container);
	}
}

function initAllBars(): void
{
	const bars = document.querySelectorAll<HTMLElement>('.ui-actions-bar');
	bars.forEach((bar) => {
		initManagerForContainer(bar);
	});
}

function observeNewBars(): void
{
	const observer = new MutationObserver((mutations) => {
		for (const mutation of mutations)
		{
			for (const node of mutation.addedNodes)
			{
				if (node.nodeType !== Node.ELEMENT_NODE)
				{
					continue;
				}

				const element = node as HTMLElement;
				if (Dom.hasClass(element, 'ui-actions-bar'))
				{
					initManagerForContainer(element);
				}

				const nestedBars = element.querySelectorAll?.<HTMLElement>('.ui-actions-bar');
				nestedBars?.forEach((bar) => {
					initManagerForContainer(bar);
				});
			}
		}
	});

	observer.observe(document.body, {
		childList: true,
		subtree: true,
	});
}

Event.ready(() => {
	initAllBars();
	observeNewBars();
});

export const ActionsBar = {
	RightButtons,
	init,
};
