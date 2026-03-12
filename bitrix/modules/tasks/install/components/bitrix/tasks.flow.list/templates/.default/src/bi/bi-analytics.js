import { MenuManager } from 'main.popup';
import type { MenuItemOptions } from 'main.popup';

export type Data = {
	dashboards: JSON,
	target: HTMLElement,
	flowId: number,
}

export type Dashboard = {
	id: string,
	title: string,
	url: string,
	isLocked: boolean,
}

export class BIAnalytics
{
	#id: string;
	#flowId: number;
	#dashboards: Dashboard[];
	#target: HTMLElement;

	constructor(data: Data)
	{
		this.#dashboards = Object.values(data.dashboards);
		this.#target = data.target;
		this.#flowId = Number(data.flowId);

		this.#id = `tasks-flow-bi-analytics-menu_${this.#flowId}`;
	}

	static create(data: Data): BIAnalytics
	{
		return new BIAnalytics(data);
	}

	openMenu(): void
	{
		const popupMenu = MenuManager.create({
			id: this.#id,
			bindElement: this.#target,
			items: this.#getMenuItems(),
			cacheable: false,
		});

		popupMenu.show();
	}

	openFirstDashboard(): void
	{
		const dashboard = this.#dashboards[0];

		if (dashboard)
		{
			this.#openDashboard(dashboard);
		}
	}

	#getMenuItems(): MenuItemOptions[]
	{
		const menuItems = [];

		this.#dashboards.forEach((dashboard: Dashboard) => {
			menuItems.push({
				tabId: dashboard.id,
				text: dashboard.title,
				onclick: () => {
					this.#openDashboard(dashboard);
				},
			});
		});

		return menuItems;
	}

	#openDashboard(dashboard: Dashboard): void
	{
		if (dashboard.isLocked)
		{
			this.#showTariffSlider();
		}
		else
		{
			window.open(dashboard.url, '_blank');
		}
	}

	#showTariffSlider(): void
	{
		if (top.BX && top.BX.UI && top.BX.UI.InfoHelper)
		{
			top.BX.UI.InfoHelper.show('limit_crm_BI_constructor');
		}
	}
}
