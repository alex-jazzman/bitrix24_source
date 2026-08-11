import { Notifier as ImNotifier } from 'im.v2.lib.notifier';

const callMethods = {
	onBackgroundFileSizeError(...args: unknown[])
	{
		// @ts-expect-error [call-ts] wait ImNotifier to ts
		return ImNotifier.call.onBackgroundFileSizeError(...args);
	},
	onBackgroundUnsupportedError(...args: unknown[])
	{
		// @ts-expect-error [call-ts] wait ImNotifier to ts
		return ImNotifier.call.onBackgroundUnsupportedError(...args);
	},
};

const notifierMethods = {
	subscribe(...args: unknown[])
	{
		// @ts-expect-error [call-ts] wait ImNotifier to ts
		return ImNotifier.subscribe(...args);
	},
	notify(...args: unknown[])
	{
		// @ts-expect-error [call-ts] wait ImNotifier to ts
		return ImNotifier.notify(...args);
	},
	call: new Proxy(callMethods, {
		get(target, property)
		{
			if (Reflect.has(target, property))
			{
				return Reflect.get(target, property);
			}

			throw new Error(
				`Notifier.call: method "${String(property)}" is not defined in the adapter. Register it explicitly.`,
			);
		},
	}),
};

export const Notifier = new Proxy(notifierMethods, {
	get(target, property)
	{
		if (Reflect.has(target, property))
		{
			return Reflect.get(target, property);
		}

		throw new Error(`Notifier: method "${String(property)}" is not defined in the adapter. Register it explicitly.`);
	},
});
