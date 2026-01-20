import { Extension } from 'main.core';
import { CallManager as CallManagerOriginal } from 'call.lib.call-manager';


const { callInstalled = false } = Extension.getSettings('im.v2.lib.call');
const isCallManagerInstalled = Boolean(CallManagerOriginal);

class CallManagerStub {
	static viewContainerClass = 'bx-im-messenger__call_container';
	static instance = null;

	static getInstance()
	{
		console.warn('module call is not installed');
		if (!this.instance) {
			this.instance = new Proxy(new CallManagerStub(), {
				get(target, prop, receiver) {
					if (prop in CallManagerStub) {
						return CallManagerStub[prop];
					}

					if (typeof prop === 'string') {
						return () => null;
					}

					return Reflect.get(target, prop, receiver);
				}
			});
		}
		return this.instance;
	}
}

const CallManager = callInstalled && isCallManagerInstalled ? CallManagerOriginal : CallManagerStub;

export { CallManager };
