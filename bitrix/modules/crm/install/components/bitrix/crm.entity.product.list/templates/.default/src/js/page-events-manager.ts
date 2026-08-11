declare const BX: any;

type EventHandlersMap = { [eventName: string]: Function[] };

export class PageEventsManager
{
	private settings: Record<string, any>;
	private readonly eventHandlers: EventHandlersMap = {};

	constructor(settings: Record<string, any> | null | undefined)
	{
		this.settings = settings ?? {};
	}

	public registerEventHandler(eventName: string, eventHandler: Function): void
	{
		if (!this.eventHandlers[eventName])
		{
			this.eventHandlers[eventName] = [];
		}

		this.eventHandlers[eventName].push(eventHandler);
		BX.addCustomEvent(this, eventName, eventHandler);
	}

	public fireEvent(eventName: string, eventParams: any): void
	{
		BX.onCustomEvent(this, eventName, eventParams);
	}

	public unregisterEventHandlers(eventName: string): void
	{
		if (this.eventHandlers[eventName])
		{
			for (const handler of this.eventHandlers[eventName])
			{
				BX.removeCustomEvent(this, eventName, handler);
			}

			delete this.eventHandlers[eventName];
		}
	}
}
