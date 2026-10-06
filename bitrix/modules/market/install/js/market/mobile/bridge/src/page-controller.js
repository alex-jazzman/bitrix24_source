import { Type } from 'main.core';

import { BridgeEvents } from './bridge-events';
import { NativeBridge } from './native-bridge';

export class PageController
{
	constructor(options = {})
	{
		this.onEvent = Type.isFunction(options.onEvent) ? options.onEvent : null;
		this.isSubscribed = false;
	}

	connect(force = false)
	{
		if (this.isSubscribed && force !== true)
		{
			return;
		}

		this.isSubscribed = NativeBridge.subscribe((event) => {
			if (this.onEvent)
			{
				this.onEvent(event || {});
			}
		});
	}

	emitReady(data = {}): boolean
	{
		return NativeBridge.sendEvent(BridgeEvents.PAGE_READY, data);
	}

	updateToolbar(data = {}): boolean
	{
		return NativeBridge.sendEvent(BridgeEvents.TOOLBAR_UPDATE, data);
	}
}
