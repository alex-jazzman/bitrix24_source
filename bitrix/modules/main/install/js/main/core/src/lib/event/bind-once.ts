import bind from './bind';
import unbind from './unbind';
import Type from '../type';

import { type GlobalEventMap } from './global-event-map';

function bindOnce<K extends keyof GlobalEventMap>(
	target: EventTarget,
	eventName: K,
	listener: (event: GlobalEventMap[K]) => void,
	options?: boolean | AddEventListenerOptions
): void

function bindOnce(
	target: EventTarget,
	eventName: string,
	handler: EventListenerOrEventListenerObject | null,
	options?: AddEventListenerOptions | boolean,
): void

function bindOnce(
	target: EventTarget,
	eventName: string,
	handler: EventListenerOrEventListenerObject | null,
	options?: AddEventListenerOptions | boolean,
): void
{
	if (handler === null)
	{
		return;
	}

	const once = function once(event: globalThis.Event): void
	{
		unbind(target, eventName, once, options);

		if (Type.isFunction(handler))
		{
			handler(event);
		}
		else if (Type.isObject(handler) && Type.isFunction(handler.handleEvent))
		{
			handler.handleEvent(event);
		}
	};

	bind(target, eventName, once, options);
}

export default bindOnce;

