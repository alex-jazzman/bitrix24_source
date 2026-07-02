import { CounterPanel } from 'ui.counterpanel';
import { NavigationPanel } from 'ui.navigationpanel';

import { RightButtons as RightButtonsClass } from '../right-buttons';
import { LeftButtons } from './left-buttons';
import { type Collapsible, type LayoutTarget, type PanelState, type RightButtons } from './types';

const Selector = {
	Counter: '.ui-counter-panel__scope',
	Nav: '.ui-nav-panel__scope',
	Buttons: '.ui-actions-bar__buttons',
} as const;

export class Panels
{
	#container: HTMLElement;

	counter: Collapsible | null = null;
	nav: Collapsible | null = null;
	buttons: RightButtons | null = null;
	leftButtons: LeftButtons | null = null;

	constructor(container: HTMLElement)
	{
		this.#container = container;
	}

	discover(): void
	{
		const counterNode = this.getCounterNode();
		this.counter = counterNode ? CounterPanel.getInstanceByNode(counterNode) : null;

		const navNode = this.getNavNode();
		this.nav = navNode ? NavigationPanel.getInstanceByNode(navNode) : null;

		const buttonsNode = this.getButtonsNode();
		const newButtons = buttonsNode ? RightButtonsClass.getInstanceByNode(buttonsNode) : null;
		if (newButtons !== this.buttons)
		{
			this.buttons = newButtons;
			// Take over collapse logic — disable RightButtons' own ResizeObserver
			// so the manager's priority order isn't overridden.
			this.buttons?.disableAutoCollapse();
		}

		this.leftButtons = LeftButtons.collect(this.#container, [counterNode, navNode, buttonsNode]);
	}

	getCounterNode(): HTMLElement | null
	{
		return this.#container.querySelector(Selector.Counter);
	}

	getNavNode(): HTMLElement | null
	{
		return this.#container.querySelector(Selector.Nav);
	}

	getButtonsNode(): HTMLElement | null
	{
		return this.#container.querySelector(Selector.Buttons);
	}

	apply(target: LayoutTarget): void
	{
		this.buttons?.setCollapsedCount(target.buttons);
		this.leftButtons?.setCollapsedCount(target.leftButtons);
		this.#applyPanelState(this.nav, target.nav);
		this.#applyPanelState(this.counter, target.counter);
	}

	isManagedSlot(slot: Element): boolean
	{
		const counter = this.getCounterNode();
		const nav = this.getNavNode();
		const buttons = this.getButtonsNode();

		return Boolean(
			(counter && slot.contains(counter))
			|| (nav && slot.contains(nav))
			|| (buttons && slot.contains(buttons))
			|| this.leftButtons?.isHostSlot(slot),
		);
	}

	#applyPanelState(panel: Collapsible | null, state: PanelState): void
	{
		if (!panel)
		{
			return;
		}

		const isCollapsed = panel.isCollapsed();
		if (state === 'collapsed' && !isCollapsed)
		{
			panel.collapse();
		}
		else if (state === 'expanded' && isCollapsed)
		{
			panel.expand();
		}
	}
}
