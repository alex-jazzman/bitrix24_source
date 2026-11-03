import { BX } from './internal/global';
import { eventTypes } from './const';
import { data } from './data-storage';
import { util } from './util';

/**
 * Events: firing, interception, denial and the small helpers around an event object (MOD-01).
 *
 * Two pieces of shared state keep this group together. `deniedEvents` is what makes `denyEvent`
 * and `allowEvent` inseparable, and the pair `captured_events`/`_bind` is the one place where the
 * legacy layer *writes* into a symbol of the modern kernel. That write goes through the global
 * `BX` deliberately (ADR 3.4): importing `Event.bind` and replacing the import would leave every
 * other caller on the original function and the interception would collect nothing.
 *
 * `False` and `DoNothing` live here rather than in `misc` because `denyEvent` installs `DoNothing`
 * and `allowEvent` compares against what it recorded - the identity of those two functions is
 * part of the contract.
 */

/* List of denied event handlers */
const deniedEvents: any[] = [];

export function getEventButton(e: any): number
{
	e = e || window.event;

	let flags = 0;

	if (typeof e.which != 'undefined')
	{
		switch (e.which)
		{
			case 1: flags |= BX.MSLEFT; break;
			case 2: flags |= BX.MSMIDDLE; break;
			case 3: flags |= BX.MSRIGHT; break;
			// no default
		}
	}
	else if (typeof e.button != 'undefined')
	{
		// Q-1, carried verbatim: the window event object is read here, not the argument `e`
		flags = (window as any).event.button;
	}

	return flags || BX.MSLEFT;
}

let captured_events: any[] | null = null;
let _bind: any = null;

export function CaptureEvents(el_c: any, evname_c: any): void
{
	if (_bind)
	{
		return;
	}

	_bind = BX.bind;
	captured_events = [];

	BX.bind = function(this: any, el: any, evname: any, func: any) {
		if (el === el_c && evname === evname_c)
		{
			(captured_events as any[]).push(func);
		}

		_bind.apply(this, arguments);
	};
}

export function CaptureEventsGet(): any[] | null
{
	if (_bind)
	{
		BX.bind = _bind;

		const captured = captured_events;

		_bind = null;
		captured_events = null;

		return captured;
	}

	return null;
}

// Don't even try to use it for submit event!
export function fireEvent(ob: any, ev: any): any
{
	let result: any = false;
	let e: any = null;

	if (BX.type.isDomNode(ob))
	{
		result = true;
		if ((document as any).createEventObject)
		{
			// IE
			if (eventTypes[ev] != 'MouseEvent')
			{
				e = (document as any).createEventObject();
				e.type = ev;
				result = ob.fireEvent(`on${ev}`, e);
			}

			if (ob[ev])
			{
				ob[ev]();
			}
		}
		else
		{
			// non-IE
			e = null;

			switch (eventTypes[ev])
			{
				case 'MouseEvent':
					e = document.createEvent('MouseEvent');
					try
					{
						e.initMouseEvent(ev, true, true, top, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, null);
					}
					catch (initException)
					{
						e.initMouseEvent(ev, true, true, window, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, null);
					}

					break;
				default:
					e = document.createEvent('Event');
					e.initEvent(ev, true, true);
			}

			result = ob.dispatchEvent(e);
		}
	}

	return result;
}

export function getWheelData(e: any): any
{
	e = e || window.event;
	// mutates the event and hands back the value it wrote
	e.wheelData = e.detail ? e.detail * -1 : e.wheelDelta / 40;

	return e.wheelData;
}

export function False(): boolean
{
	return false;
}

export function DoNothing(): void
{}

// TODO: also check event handlers set via BX.bind()
export function denyEvent(el: any, ev: any): void
{
	deniedEvents.push([el, ev, el[`on${ev}`]]);
	el[`on${ev}`] = DoNothing;
}

export function allowEvent(el: any, ev: any): void
{
	for (let i = 0, len = deniedEvents.length; i < len; i++)
	{
		if (deniedEvents[i][0] == el && deniedEvents[i][1] == ev)
		{
			el[`on${ev}`] = deniedEvents[i][2];
			// Q-2, carried verbatim: the result is not assigned back, so the entry never leaves
			util.deleteFromArray(deniedEvents, i);

			return;
		}
	}
}

export function fixEventPageXY(event: any): any
{
	BX.fixEventPageX(event);
	BX.fixEventPageY(event);

	return event;
}

export function fixEventPageX(event: any): any
{
	if (event.pageX == null && event.clientX != null)
	{
		event.pageX = event.clientX
			+ ((document.documentElement && document.documentElement.scrollLeft) || (document.body && document.body.scrollLeft) || 0)
			- (document.documentElement.clientLeft || 0);
	}

	return event;
}

export function fixEventPageY(event: any): any
{
	if (event.pageY == null && event.clientY != null)
	{
		event.pageY = event.clientY
			+ ((document.documentElement && document.documentElement.scrollTop) || (document.body && document.body.scrollTop) || 0)
			- (document.documentElement.clientTop || 0);
	}

	return event;
}

/**
 * @deprecated
 * @see e.preventDefault()
 */
export function PreventDefault(e: any): boolean
{
	if (!e)
	{
		e = window.event;
	}

	if (e.stopPropagation)
	{
		e.preventDefault();
		e.stopPropagation();
	}
	else
	{
		e.cancelBubble = true;
		e.returnValue = false;
	}

	return false;
}

/**
 * @deprecated
 * @see e.preventDefault();
 *
 * @param e
 * @return {boolean}
 */
export function eventReturnFalse(e: any): boolean
{
	e = e || window.event;
	if (e && e.preventDefault)
	{
		e.preventDefault();
	}
	else
	{
		e.returnValue = false;
	}

	return false;
}

/**
 * @deprecated
 * @see e.stopPropagation()
 * @param e
 */
export function eventCancelBubble(e: any): void
{
	e = e || window.event;
	if (e && e.stopPropagation)
	{
		e.stopPropagation();
	}
	else
	{
		e.cancelBubble = true;
	}
}

export function bindDebouncedChange(node: any, fn: any, fnInstant?: any, timeout?: any, ctx?: any): void
{
	ctx = ctx || window;
	timeout = timeout || 300;

	const dataTag = 'bx-dc-previous-value';
	data(node, dataTag, node.value);

	const act = function(handler: any, val: any) {
		const pVal = data(node, dataTag);

		if (typeof pVal == 'undefined' || pVal != val)
		{
			if (typeof ctx != 'object')
			{
				handler(val);
			}
			else
			{
				handler.apply(ctx, [val]);
			}
		}
	};

	const actD = BX.debounce(function() {
		const val = node.value;
		act(fn, val);
		data(node, dataTag, val);
	}, timeout);

	BX.bind(node, 'keyup', actD);
	BX.bind(node, 'change', actD);
	BX.bind(node, 'input', actD);

	if (BX.type.isFunction(fnInstant))
	{
		const actI = function() {
			act(fnInstant, node.value);
		};

		BX.bind(node, 'keyup', actI);
		BX.bind(node, 'change', actI);
		BX.bind(node, 'input', actI);
	}
}

export function getEventTarget(e: any): any
{
	if (e.target)
	{
		return e.target;
	}

	if (e.srcElement)
	{
		return e.srcElement;
	}

	return null;
}
