import { Dom } from 'main.core';
import { NavigationPanel } from 'ui.navigationpanel';

export type NavigationPanelItem = {
	id: string,
	title: string,
	active: boolean,
	events: {
		click: () => void,
	},
	link: Record<string, string>,
};

export class NavigationPanelAdapter
{
	#panel: NavigationPanel | null = null;
	#target: HTMLElement;

	constructor(target: HTMLElement)
	{
		this.#target = target;
	}

	render(items: NavigationPanelItem[], ariaLabel: string): void
	{
		if (this.#panel === null)
		{
			this.#panel = new NavigationPanel({
				target: this.#target,
				items,
				ariaLabel,
			});
			this.#panel.init();

			return;
		}

		const activeItem = items.find((item) => item.active);
		const panelItem = activeItem ? this.#panel.getItemById(activeItem.id) : null;
		if (panelItem && !panelItem.active)
		{
			panelItem.activate();
		}
	}

	destroy(): void
	{
		if (this.#panel === null)
		{
			return;
		}

		(this.#panel.items as Array<{ closeMenu?: () => void }>).forEach((item) => item.closeMenu?.());
		Dom.clean(this.#target);
		this.#panel = null;
	}
}
