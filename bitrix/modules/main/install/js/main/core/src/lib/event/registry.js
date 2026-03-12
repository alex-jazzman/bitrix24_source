import Type from '../type';

export class Registry
{
	registry: WeakMap = new WeakMap();

	set(target: EventTarget, event: string, listener: Function)
	{
		if (!Type.isEventTargetLike(target))
		{
			return;
		}

		const events = this.get(target);

		if (!Type.isSet(events[event]))
		{
			events[event] = new Set();
		}

		events[event].add(listener);

		this.registry.set(target, events);
	}

	get(target: EventTarget): {[event: string]: Set<Function>}
	{
		return this.registry.get(target) || {};
	}

	has(target: EventTarget, event?: string, listener?: Function): boolean
	{
		if (event && listener)
		{
			return (
				this.registry.has(target)
				&& this.registry.get(target)[event].has(listener)
			);
		}

		return this.registry.has(target);
	}

	delete(target: EventTarget, event?: string, listener?: Function)
	{
		if (!Type.isEventTargetLike(target))
		{
			return;
		}

		if (Type.isString(event) && Type.isFunction(listener))
		{
			const events = this.registry.get(target);

			if (Type.isPlainObject(events) && Type.isSet(events[event]))
			{
				events[event].delete(listener);
			}

			return;
		}

		if (Type.isString(event))
		{
			const events = this.registry.get(target);

			if (Type.isPlainObject(events) && Type.isSet(events[event]))
			{
				events[event] = new Set();
			}

			return;
		}

		this.registry.delete(target);
	}
}

export default new Registry();
