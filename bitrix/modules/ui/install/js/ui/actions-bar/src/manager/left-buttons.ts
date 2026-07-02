import { type Button, ButtonManager } from 'ui.buttons';

import { type CollapsibleButtons } from './types';

const ButtonSelector = '.ui-btn, .ui-btn-split';

/**
 * Pool of arbitrary buttons living outside the three primary managed slots
 * (counter / nav / right-buttons). Manager treats them as a single
 * collapsible group with its own priority slot in the layout algorithm.
 *
 * No internal observers — Manager drives state.
 */
export class LeftButtons implements CollapsibleButtons
{
	#buttons: Button[];
	#hostSlots: Set<HTMLElement>;

	static collect(container: HTMLElement, excludedSlots: Array<HTMLElement | null>): LeftButtons | null
	{
		const excluded = excludedSlots.filter(Boolean) as HTMLElement[];
		const nodes = container.querySelectorAll<HTMLElement>(ButtonSelector);

		const buttons: Button[] = [];
		const hostSlots: Set<HTMLElement> = new Set();

		for (const node of nodes)
		{
			if (excluded.some((slot) => slot.contains(node)))
			{
				continue;
			}

			const btn = ButtonManager.createFromNode(node as HTMLButtonElement) as Button | null;
			if (!btn)
			{
				continue;
			}

			buttons.push(btn);

			const hostSlot = LeftButtons.#findHostSlot(node, container);
			if (hostSlot)
			{
				hostSlots.add(hostSlot);
			}
		}

		if (buttons.length === 0)
		{
			return null;
		}

		return new LeftButtons(buttons, hostSlots);
	}

	constructor(buttons: Button[], hostSlots: Set<HTMLElement>)
	{
		this.#buttons = buttons;
		this.#hostSlots = hostSlots;
	}

	getButtonCount(): number
	{
		return this.#buttons.length;
	}

	/** Collapse the last k buttons (DOM order), expand the rest. */
	setCollapsedCount(k: number): void
	{
		const total = this.#buttons.length;
		const clamped = Math.max(0, Math.min(k, total));
		const firstCollapsedIdx = total - clamped;

		for (let i = 0; i < total; i++)
		{
			const shouldCollapse = i >= firstCollapsedIdx;
			if (this.#buttons[i].isCollapsed() !== shouldCollapse)
			{
				this.#buttons[i].setCollapsed(shouldCollapse);
			}
		}
	}

	getContentWidth(): number
	{
		let width = 0;
		for (const button of this.#buttons)
		{
			width += button.getContainer().offsetWidth;
		}

		return width;
	}

	isHostSlot(slot: Element): boolean
	{
		return this.#hostSlots.has(slot as HTMLElement);
	}

	static #findHostSlot(node: HTMLElement, container: HTMLElement): HTMLElement | null
	{
		let current: HTMLElement | null = node;
		while (current && current.parentElement !== container)
		{
			current = current.parentElement;
		}

		return current;
	}
}
