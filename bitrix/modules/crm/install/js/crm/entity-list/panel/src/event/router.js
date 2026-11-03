import { ProgressBarRepository } from 'crm.autorun';
import { Reflection, Type } from 'main.core';
import { SettingsCollection } from 'main.core.collections';
import { type BaseEvent, EventEmitter } from 'main.core.events';
import { BaseHandler } from './handlers/base-handler';

type BaseHandlerConstructor = typeof BaseHandler;
type SubscriptionHandler = (event: BaseEvent) => void;
type PanelCommandData = { gridId: string };

export class Router
{
	static #handlers: Set<BaseHandlerConstructor> = new Set([]);

	#gridId: string;
	#progressBarRepo: ProgressBarRepository;
	#extensionSettings: SettingsCollection;

	#subscriptions: Map<string, SubscriptionHandler> = new Map();

	constructor(gridId: string, progressBarRepo: ProgressBarRepository, extensionSettings: SettingsCollection)
	{
		if (!Type.isStringFilled(gridId))
		{
			throw new TypeError('expected gridId to be a non empty string');
		}
		this.#gridId = gridId;

		if (!(progressBarRepo instanceof ProgressBarRepository))
		{
			throw new TypeError('expected progressBarRepo to be instance of ProgressBarRepository');
		}
		this.#progressBarRepo = progressBarRepo;

		if (!(extensionSettings instanceof SettingsCollection))
		{
			throw new TypeError('expected extensionSettings to be instance of SettingsCollection');
		}
		this.#extensionSettings = extensionSettings;
	}

	static registerHandler(handler: BaseHandlerConstructor): void
	{
		this.#handlers.add(handler);
	}

	static unregisterHandler(handler: BaseHandlerConstructor): void
	{
		this.#handlers.delete(handler);
	}

	startListening(): void
	{
		for (const HandlerClass of this.constructor.#handlers)
		{
			const eventName = `BX.Crm.EntityList.Panel:${HandlerClass.getEventName()}`;

			const subscriptionHandler = this.#createSubscriptionHandler(HandlerClass);

			this.#subscriptions.set(eventName, subscriptionHandler);

			EventEmitter.subscribe(eventName, subscriptionHandler);
		}
	}

	#createSubscriptionHandler(HandlerClass: BaseHandlerConstructor): SubscriptionHandler
	{
		return (event: BaseEvent) => {
			const eventData = event.getData();

			if (!this.#isAddressedToOwnGrid(eventData, HandlerClass.getEventName()))
			{
				return;
			}

			// a card loads its tabs one by one and redraws them, so the instance behind the address
			// appears and changes after the panel was initialized
			const grid = this.#getGrid();
			if (!grid)
			{
				console.error(`entity list panel grid not found: ${this.#gridId}`);

				return;
			}

			const eventHandler: BaseHandler = new HandlerClass(eventData);

			eventHandler.injectDependencies(this.#progressBarRepo, this.#extensionSettings);

			eventHandler.execute(
				grid,
				grid.getRows().getSelectedIds(),
				grid.getActionsPanel()?.getForAllCheckbox()?.checked ?? false,
			);
		};
	}

	#getGrid(): ?BX.Main.grid
	{
		const gridManager = Reflection.getClass('BX.Main.gridManager');
		const gridClass = Reflection.getClass('BX.Main.grid');
		if (!Type.isFunction(gridManager?.getInstanceById) || !gridClass)
		{
			return null;
		}

		const grid = gridManager.getInstanceById(this.#gridId);

		return grid instanceof gridClass ? grid : null;
	}

	#isAddressedToOwnGrid(eventData: ?PanelCommandData, eventName: string): boolean
	{
		if (!Type.isPlainObject(eventData) || !Type.isStringFilled(eventData.gridId))
		{
			console.error(
				`entity list panel command without gridId: ${eventName}, own grid: ${this.#gridId}`,
			);

			return false;
		}

		return eventData.gridId === this.#gridId;
	}

	stopListening(): void
	{
		for (const [eventName, subscriptionHandler] of this.#subscriptions.entries())
		{
			EventEmitter.unsubscribe(eventName, subscriptionHandler);
		}
	}
}
