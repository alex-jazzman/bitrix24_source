import { Type } from 'main.core';
import { Menu } from 'ui.system.menu';

export class SystemMenu
{
	#menu: ?Menu = null;
	#vueComponent: Object;
	#onAction: ?Function;

	constructor(vueComponent: Object, menu: Object, menuOptions: ?Object, onAction: ?Function)
	{
		this.#vueComponent = vueComponent;
		this.#onAction = onAction;

		const { items: mappedItems, sections: mappedSections } = this.#normalizeMenu(
			menu.items ?? [],
			menu.sections ?? [],
		);

		this.#menu = new Menu({
			...menuOptions,
			items: mappedItems,
			sections: mappedSections,
			animation: menuOptions?.animation ?? 'fading-slide',
			autoHide: menuOptions?.autoHide ?? true,
			cacheable: menuOptions?.cacheable ?? false,
		});
	}

	show(): void
	{
		this.#menu?.show();
	}

	isShown(): boolean
	{
		return this.#menu?.getPopup()?.isShown() ?? false;
	}

	destroy(): void
	{
		this.#menu?.destroy();
		this.#menu = null;
	}

	static showMenu(vueComponent: Object, menu: Object, menuOptions: ?Object, onAction: ?Function): SystemMenu
	{
		const instance = new SystemMenu(vueComponent, menu, menuOptions, onAction);
		instance.show();

		return instance;
	}

	#normalizeMenu(items: Array, sections: Array): { items: Array, sections: Array }
	{
		if (Type.isArrayFilled(sections))
		{
			return {
				items: items
					.filter((item) => !item.delimiter)
					.map((item) => this.#createMenuItem(item)),
				sections: sections,
			};
		}

		return this.#normalizeWithDelimiters(items);
	}

	#createMenuItem(item: Object): Object
	{
		const menuItem: Object = {
			title: item.title ?? '',
		};

		if (Type.isStringFilled(item.subtitle))
		{
			menuItem.subtitle = item.subtitle;
		}

		if (Type.isStringFilled(item.icon))
		{
			menuItem.icon = item.icon;
		}

		if (Type.isStringFilled(item.design))
		{
			menuItem.design = item.design;
		}

		if (Type.isBoolean(item.isSelected))
		{
			menuItem.isSelected = item.isSelected;
		}

		if (Type.isBoolean(item.isLocked))
		{
			menuItem.isLocked = item.isLocked;
		}

		if (Type.isObject(item.badgeText))
		{
			menuItem.badgeText = item.badgeText;
		}

		if (Type.isStringFilled(item.sectionCode))
		{
			menuItem.sectionCode = item.sectionCode;
		}

		if (Type.isObject(item.action) && Type.isFunction(this.#onAction))
		{
			menuItem.onClick = (): void => {
				this.#menu?.close();
				this.#onAction(item.action);
			};
		}

		if (Type.isObject(item.menu))
		{
			const { items: subItems, sections: subSections } = this.#normalizeMenu(
				Object.values(item.menu.items ?? {}),
				item.menu.sections ?? [],
			);

			menuItem.subMenu = {
				items: subItems
			};

			if (Type.isArrayFilled(subSections))
			{
				menuItem.subMenu.sections = subSections;
			}
		}

		return menuItem;
	}

	#normalizeWithDelimiters(items: Array): { items: Array, sections: Array }
	{
		const groups = [[]];
		const sectionTitles = [null];

		for (const item of items)
		{
			if (item.delimiter)
			{
				groups.push([]);
				sectionTitles.push(item.title || null);

				continue;
			}

			groups[groups.length - 1].push(item);
		}

		if (groups.length === 1)
		{
			return {
				items: groups[0].map((item) => this.#createMenuItem(item)),
				sections: [],
			};
		}

		const sections = [];
		const mappedItems = [];

		groups.forEach((group, index) => {
			if (group.length === 0)
			{
				return;
			}

			const code = `generated-section-${index}`;
			const section = { code };
			if (sectionTitles[index])
			{
				section.title = sectionTitles[index];
			}
			sections.push(section);

			for (const item of group)
			{
				const mapped = this.#createMenuItem(item);
				mapped.sectionCode = code;
				mappedItems.push(mapped);
			}
		});

		return {
			items: mappedItems,
			sections,
		};
	}
}
