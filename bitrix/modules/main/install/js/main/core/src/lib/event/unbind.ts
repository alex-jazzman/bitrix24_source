import Type from '../type';
import aliases from './aliases';
import registry from './registry';
import fetchSupportedListenerOptions from './fetch-supported-listener-options';

import { type GlobalEventMap } from './global-event-map';

function unbind<K extends keyof GlobalEventMap>(
	target: EventTarget,
	eventName: K,
	listener: (event: GlobalEventMap[K]) => void,
	options?: boolean | AddEventListenerOptions
): void

function unbind(
	target: EventTarget,
	eventName: string,
	handler: EventListenerOrEventListenerObject | null,
	options?: AddEventListenerOptions | boolean,
): void

function unbind(
	target: EventTarget,
	eventName: string,
	handler: EventListenerOrEventListenerObject | null,
	options?: AddEventListenerOptions | boolean,
): void
{
	if (!Type.isEventTargetLike(target) || handler === null)
	{
		return;
	}

	const listenerOptions = fetchSupportedListenerOptions(options);

	if (eventName in aliases)
	{
		aliases[eventName].forEach((key) => {
			target.removeEventListener(key, handler as EventListener, listenerOptions);
			registry.delete(target, key, handler);
		});

		return;
	}

	target.removeEventListener(eventName, handler as EventListener, listenerOptions);
	registry.delete(target, eventName, handler);
}

export default unbind;
