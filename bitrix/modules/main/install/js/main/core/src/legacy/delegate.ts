import { BX } from './internal/global';
import { checkNode } from './dom-traverse';

/**
 * Delegation, deferral and garbage collectors (MOD-01).
 *
 * Everything that shares the two wrapper caches lives here, and it has to: a second instance of
 * `proxyList` or `deferList` does not throw, it just stops `BX.unbind` from matching the wrapper
 * it was given - handlers leak with nothing in the console to show for it (ADR 6). There is also
 * a ring inside the group, which is why it cannot be split further: `getObjectDelegate` calls
 * `BX.delegate`, and `defer_proxy` hands `BX.defer` back to it as a decorator.
 *
 * `garbage`, `garbageCollectors` and the `pagehide` subscription that drains them stay here as
 * well - they are one piece of state and MOD-01 forbids splitting them. The subscription cannot
 * be held anywhere else: it has no way to reach the registry from outside this module. It is one
 * of the six load-time side effects SFX-01 counts and is accounted for there.
 *
 * `delegateEvent` reaches `checkNode` by a plain import: there is no ring on that edge, so late
 * binding buys nothing (ADR 3.4).
 */

/* list of registered proxy functions */
const proxyList = new WeakMap<object, WeakMap<object, any>>();
const deferList = new WeakMap<object, WeakMap<object, any>>();

/* list of external garbage collectors */
const garbageCollectors: Array<{ callback: any, context?: any }> = [];

// Assigned rather than exported: this is live state, not a value. The wrappers below write the
// call-site `this` into it on every call and consumers read it back mid-call, so it has to be the
// one mutable slot on the global. An export would publish a single snapshot of the initial null.
BX.proxy_context = null;

export function delegate(func: any, thisObject: any): any
{
	if (!func || !thisObject)
	{
		return func;
	}

	return function(this: any) {
		const cur = BX.proxy_context;
		BX.proxy_context = this;
		const res = func.apply(thisObject, arguments);
		BX.proxy_context = cur;

		return res;
	};
}

export function delegateLater(func_name: any, thisObject: any, contextObject?: any): any
{
	return function(this: any) {
		if (thisObject[func_name])
		{
			const cur = BX.proxy_context;
			BX.proxy_context = this;
			const res = thisObject[func_name].apply(contextObject || thisObject, arguments);
			BX.proxy_context = cur;

			return res;
		}

		return null;
	};
}

export function proxy(func: any, thisObject: any): any
{
	return getObjectDelegate(func, thisObject, proxyList);
}

export function defer(func: any, thisObject?: any): any
{
	if (thisObject)
	{
		return defer_proxy(func, thisObject);
	}

	return function(this: any) {
		const arg = arguments;
		setTimeout(function(this: any) { func.apply(this, arg); }, 10);
	};
}

export function defer_proxy(func: any, thisObject: any): any
{
	return getObjectDelegate(func, thisObject, deferList, defer);
}

/**
 *
 * @private
 */
function getObjectDelegate(func: any, thisObject: any, collection: WeakMap<object, WeakMap<object, any>>, decorator?: any): any
{
	if (!BX.type.isFunction(func) || !BX.type.isMapKey(thisObject))
	{
		return func;
	}

	let objectDelegates = collection.get(thisObject);
	if (!objectDelegates)
	{
		objectDelegates = new WeakMap();
		collection.set(thisObject, objectDelegates);
	}

	let cached = objectDelegates.get(func);
	if (!cached)
	{
		cached = decorator ? decorator(delegate(func, thisObject)) : delegate(func, thisObject);
		objectDelegates.set(func, cached);
	}

	return cached;
}

export function once(el: any, evname: any, func: any): any
{
	const fn = function(this: any) {
		BX.unbind(el, evname, fn);
		func.apply(this, arguments);
	};

	return fn;
}

export function bindDelegate(elem: any, eventName: any, isTarget: any, handler: any): any
{
	const h = delegateEvent(isTarget, handler);
	BX.bind(elem, eventName, h);

	return h;
}

export function delegateEvent(isTarget: any, handler: any): any
{
	return function(this: any, e: any) {
		e = e || window.event;
		let target = e.target || e.srcElement;

		while (target != this)
		{
			if (checkNode(target, isTarget))
			{
				return handler.call(target, e);
			}

			if (target && target.parentNode)
			{
				target = target.parentNode;
			}
			else
			{
				break;
			}
		}

		return null;
	};
}

export function garbage(call: any, thisObject?: any): void
{
	garbageCollectors.push({ callback: call, context: thisObject });
}

window.addEventListener('pagehide', () => {
	garbageCollectors.forEach(({ callback, context = window }) => {
		try
		{
			callback.apply(context);
		}
		catch (err)
		{}
	});
});
