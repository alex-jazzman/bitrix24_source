import Type from '../type';
import aliases from './aliases';
import registry from './registry';
import fetchSupportedListenerOptions from './fetch-supported-listener-options';

export default function bind(
	target: EventTarget,
	eventName: string,
	handler: (event: Event) => void,
	options?: {
		capture?: boolean,
		once?: boolean,
		passive?: boolean,
	},
): void
{
	if (!Type.isEventTargetLike(target))
	{
		return;
	}

	const listenerOptions = fetchSupportedListenerOptions(options);

	if (eventName in aliases)
	{
		aliases[eventName].forEach((key) => {
			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-events-binding
			target.addEventListener(key, handler, listenerOptions);
			registry.set(target, eventName, handler);
		});

		return;
	}

	// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-events-binding
	target.addEventListener(eventName, handler, listenerOptions);
	registry.set(target, eventName, handler);
}
