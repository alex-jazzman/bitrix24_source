import Type from '../type';

export class Registry
{
	registry: WeakMap<EventTarget, Record<string, Set<EventListenerOrEventListenerObject>>> = new WeakMap();

	set(target: EventTarget, event: string, listener: EventListenerOrEventListenerObject): void
	{
		if (!Type.isEventTargetLike(target))
		{
			return;
		}

		const events: Record<string, Set<EventListenerOrEventListenerObject>> = this.get(target);

		if (!Type.isSet(events[event]))
		{
			events[event] = new Set();
		}

		events[event].add(listener);

		this.registry.set(target, events);
	}

	get(target: EventTarget): Record<string, Set<EventListenerOrEventListenerObject>>
	{
		return this.registry.get(target) || {};
	}

	has(target: EventTarget, event?: string, listener?: EventListenerOrEventListenerObject): boolean
	{
		if (event && listener)
		{
			const events = this.registry.get(target);

			return this.registry.has(target) && Boolean(events && events[event]?.has(listener));
		}

		return this.registry.has(target);
	}

	delete(target: EventTarget, event?: string, listener?: EventListenerOrEventListenerObject): void
	{
		if (!Type.isEventTargetLike(target))
		{
			return;
		}

		if (Type.isString(event) && Type.isFunction(listener))
		{
			const events = this.registry.get(target);

			if (Type.isPlainObject(events) && Type.isSet((events as Record<string, any>)[event]))
			{
				(events as Record<string, any>)[event].delete(listener);
			}

			return;
		}

		if (Type.isString(event))
		{
			const events = this.registry.get(target);

			if (Type.isPlainObject(events) && Type.isSet((events as Record<string, any>)[event]))
			{
				(events as Record<string, any>)[event] = new Set();
			}

			return;
		}

		this.registry.delete(target);
	}
}

export default new Registry();
