import { Runtime, Loc } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { Button, ButtonManager } from 'ui.buttons';
import { Menu, type MenuItemOptions } from 'ui.system.menu';
import type { AnalyticsSender } from 'tasks.v2.lib.analytics';
import type { AnalyticsParams } from 'tasks.v2.application.task-card';

export type Params = {
	button: HTMLElement,
	items: { [roleId: string]: RoleDto },
	selectedRoleId: string,
	analytics: AnalyticsParams,
};

type RoleDto = {
	TEXT: string,
};

type Role = {
	title: string,
};

const defaultRole = 'view_all';

export class Roles
{
	#selectedRoleId: string;
	#roles: { [roleId: string]: Role };
	#analytics: AnalyticsParams;

	#button: Button;
	#menu: Menu;

	constructor(params: Params)
	{
		if (!params.button)
		{
			return;
		}

		this.#selectedRoleId = params.selectedRoleId || defaultRole;
		this.#roles = {
			[defaultRole]: {
				title: Loc.getMessage('TASKS_ALL_ROLES'),
			},
			...Object.fromEntries(Object.entries(params.items).map(([roleId, item]) => [roleId, {
				title: item.TEXT,
			}])),
		};
		this.#analytics = params.analytics;

		this.#initButton(params.button);
		this.#bindEvents();
	}

	#initButton(button: HTMLElement): void
	{
		this.#menu = new Menu({
			items: this.#menuItems,
			offsetTop: 6,
		});

		this.#button = ButtonManager.createFromNode(button);
		this.#button.bindEvent('click', (): void => {
			this.#menu.show(this.#button.getContainer());

			void this.#sendAnalyticsClick();
		});
	}

	#bindEvents(): void
	{
		EventEmitter.subscribe('BX.Main.Filter:beforeApply', this.#handleFilterBeforeApply);
	}

	#handleFilterBeforeApply = (event: BaseEvent): void => {
		const previousRoleId = this.#selectedRoleId;
		this.#selectedRoleId = event.getData()[2].getFilterFieldsValues().ROLEID || defaultRole;
		this.#update();

		if (previousRoleId !== this.#selectedRoleId)
		{
			void this.#sendAnalyticsApply(this.#selectedRoleId);
		}
	};

	#update(): void
	{
		this.#button.setText(this.#roleName);
		this.#menu.updateItems(this.#menuItems);
	}

	get #menuItems(): MenuItemOptions[]
	{
		return Object.entries(this.#roles).map(([roleId, role: Role]) => ({
			title: role.title,
			isSelected: roleId === this.#selectedRoleId,
			onClick: (): void => EventEmitter.emit('Tasks.TopMenu:onItem', new BaseEvent({
				data: [roleId],
				compatData: [roleId],
			})),
		}));
	}

	get #roleName(): string
	{
		return this.#roles[this.#selectedRoleId].title;
	}

	async #sendAnalyticsClick(): Promise<void>
	{
		const analytics = await this.#getAnalyticsSender();

		analytics.sendRoleClick(this.#analytics);
	}

	async #sendAnalyticsApply(role: string): Promise<void>
	{
		const analytics = await this.#getAnalyticsSender();

		analytics.sendRoleClickType(this.#analytics, {
			role,
			isFilterEnabled: role !== defaultRole,
		});
	}

	async #getAnalyticsSender(): Promise<AnalyticsSender>
	{
		return (await Runtime.loadExtension('tasks.v2.lib.analytics')).analytics;
	}
}
