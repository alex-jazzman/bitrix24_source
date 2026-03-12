import Type from '../type';
import aliases from './aliases';
import registry from './registry';
import fetchSupportedListenerOptions from './fetch-supported-listener-options';

export default function unbind(
	target: EventTarget,
	eventName: string,
	handler: Function,
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
			target.removeEventListener(key, handler, listenerOptions);
			registry.delete(target, key, handler);
		});

		return;
	}

	// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-events-binding
	target.removeEventListener(eventName, handler, listenerOptions);
	registry.delete(target, eventName, handler);
}
