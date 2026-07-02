import Type from '../type';
import aliases from './aliases';
import registry from './registry';
import fetchSupportedListenerOptions from './fetch-supported-listener-options';

import { type GlobalEventMap } from './global-event-map';

function bind<K extends keyof GlobalEventMap>(
	target: EventTarget,
	eventName: K,
	listener: (event: GlobalEventMap[K]) => void,
	options?: boolean | AddEventListenerOptions
): void

function bind(
	target: EventTarget,
	eventName: string,
	handler: EventListenerOrEventListenerObject | null,
	options?: AddEventListenerOptions | boolean,
): void

function bind(
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
			target.addEventListener(key, handler, listenerOptions);
			registry.set(target, eventName, handler);
		});

		return;
	}

	target.addEventListener(eventName, handler, listenerOptions);
	registry.set(target, eventName, handler);
}

export default bind;
