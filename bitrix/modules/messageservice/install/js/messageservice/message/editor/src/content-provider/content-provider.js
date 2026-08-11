import { type MenuItemOptions } from 'ui.system.menu';

import { type InsertContext } from './insert-context';

/**
 * @abstract
 */
export class ContentProvider<CustomData: Object = Object>
{
	#id: string;
	#customData: CustomData;

	constructor(serverData: { id: string, customData: CustomData })
	{
		this.#id = serverData.id;
		this.#customData = serverData.customData ?? {};
	}

	getId(): string
	{
		return this.#id;
	}

	getCustomData(): CustomData
	{
		return this.#customData;
	}

	/**
	 * Update server-controlled data (customData) without recreating the provider.
	 * Called by ContentProviderFactory.reconcile() for existing providers.
	 */
	updateServerData(serverData: { customData: CustomData }): void
	{
		this.#customData = serverData.customData ?? this.#customData;
	}

	/**
	 * Override in subclasses that hold resources (dialogs, subscriptions, etc.).
	 */
	destroy(): void
	{}

	/**
	 * @abstract
	 */
	getMenuItems(context: InsertContext): Array<MenuItemOptions>
	{
		throw new Error(`${this.constructor.name}.getMenuItems() must be implemented`);
	}
}
