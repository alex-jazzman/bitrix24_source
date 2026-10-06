import { Type } from 'main.core';

export class NativeBridge
{
	static isAvailable(): boolean
	{
		return Type.isFunction(window.BXNativeBridge && window.BXNativeBridge.sendEvent);
	}

	static sendEvent(eventType, data = {}): boolean
	{
		if (!eventType || !this.isAvailable())
		{
			return false;
		}

		try
		{
			window.BXNativeBridge.sendEvent(eventType, data);

			return true;
		}
		catch (error)
		{
			console.error(error);

			return false;
		}
	}

	static subscribe(handler): boolean
	{
		if (!Type.isFunction(handler) || !Type.isFunction(window.BXNativeBridge && window.BXNativeBridge.onReceiveEvent))
		{
			return false;
		}

		window.BXNativeBridge.onReceiveEvent((event) => {
			handler(Type.isPlainObject(event) ? event : {});
		});

		return true;
	}
}
