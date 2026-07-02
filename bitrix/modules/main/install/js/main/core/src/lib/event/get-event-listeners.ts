import Type from '../type';
import registry from './registry';

import { type RegistryEventListener } from '../types';

export function getEventListeners(target: EventTarget, eventName: string): Array<RegistryEventListener>
{
	const listeners: RegistryEventListener[] = [];
	if (Type.isEventTargetLike(target))
	{
		const events = registry.get(target);
		if (events[eventName])
		{
			events[eventName].forEach((listener) => {
				listeners.push({
					type: eventName,
					listener,
				});
			});
		}
	}

	return listeners;
}
