import { BX, resolve } from './internal/global';

/**
 * Display, geometry and scrolling (MOD-01).
 *
 * The private `_checkDisplay` and the trio `show`/`hide`/`toggle` share one piece of state, and it
 * lives on the DOM node itself: the original `display` is parked in a `BXDISPLAY` property. That
 * is observable and consumers read it, so it stays a plain property rather than becoming a
 * WeakMap.
 *
 * `toggle` carries FIX-01 #4: its array branch reads the loop counter and the length *after* the
 * loop has finished, which only works while both live in the function scope. Declaring them with
 * `let` inside the `for` would move them into the block and silently delete the branch that
 * handles "the current value is not in the list" - so they are declared before the loop, on
 * purpose. `test/old/core/dom-style.test.ts` pins that branch.
 */

/**
 * @deprecated
 * @use BX.style
 * @param element
 * @param opacity
 */
export function setOpacity(element: any, opacity: any): void
{
	let opacityValue = Number.parseFloat(opacity);

	if (!isNaN(opacityValue) && BX.type.isDomNode(element))
	{
		// carried verbatim: anything from 1 upwards is read as a percentage, so 1 means 0.01
		opacityValue = opacityValue < 1 ? opacityValue : opacityValue / 100;
		BX.style(element, 'opacity', opacityValue);
	}
}

export function show(ob: any, displayType?: any): void
{
	if (ob.BXDISPLAY || !_checkDisplay(ob, displayType))
	{
		ob.style.display = ob.BXDISPLAY;
	}
}

export function hide(ob: any, displayType?: any): void
{
	if (!ob.BXDISPLAY)
	{
		_checkDisplay(ob, displayType);
	}

	ob.style.display = 'none';
}

export function toggle(ob: any, values?: any): any
{
	if (!values && BX.type.isElementNode(ob))
	{
		let bShow = true;
		if (ob.BXDISPLAY)
		{
			bShow = !_checkDisplay(ob);
		}
		else
		{
			bShow = ob.style.display == 'none';
		}

		if (bShow)
		{
			BX.show(ob);
		}
		else
		{
			BX.hide(ob);
		}
	}
	else if (BX.type.isArray(values))
	{
		// FIX-01 #4: i and len are read after the loop, so they must not be scoped to it
		let i;
		let len;
		for (i = 0, len = values.length; i < len; i++)
		{
			if (ob == values[i])
			{
				ob = values[i == len - 1 ? 0 : i + 1];
				break;
			}
		}

		if (i == len)
		{
			ob = values[0];
		}
	}

	return ob;
}

function _checkDisplay(ob: any, displayType?: any): boolean
{
	if (typeof displayType != 'undefined')
	{
		ob.BXDISPLAY = displayType;
	}

	const d = ob.style.display || BX.style(ob, 'display');
	if (d != 'none')
	{
		ob.BXDISPLAY = ob.BXDISPLAY || d;

		return true;
	}

	// a node that is already hidden has no original to remember, so block is the default
	ob.BXDISPLAY = ob.BXDISPLAY || 'block';

	return false;
}

export function GetDocElement(pDoc?: any): any
{
	pDoc = pDoc || document;

	return BX.browser.IsDoctype(pDoc) ? pDoc.documentElement : pDoc.body;
}

export function scrollTop(node: any, val?: any): any
{
	if (typeof val != 'undefined')
	{
		if (node == window)
		{
			throw new Error('scrollTop() for window is not implemented');
		}

		node.scrollTop = Number.parseInt(val);

		return undefined;
	}

	if (node == window)
	{
		return BX.GetWindowScrollPos().scrollTop;
	}

	return node.scrollTop;
}

export function scrollLeft(node: any, val?: any): any
{
	if (typeof val != 'undefined')
	{
		if (node == window)
		{
			throw new Error('scrollLeft() for window is not implemented');
		}

		node.scrollLeft = Number.parseInt(val);

		return undefined;
	}

	if (node == window)
	{
		return BX.GetWindowScrollPos().scrollLeft;
	}

	return node.scrollLeft;
}

export function hide_object(ob: any): void
{
	ob = resolve(ob);
	ob.style.position = 'absolute';
	ob.style.top = '-1000px';
	ob.style.left = '-1000px';
	ob.style.height = '10px';
	ob.style.width = '10px';
}

export function is_relative(el: any): boolean
{
	const p = BX.style(el, 'position');

	return p == 'relative' || p == 'absolute';
}

export function is_float(el: any): boolean
{
	const p = BX.style(el, 'float');

	return p == 'right' || p == 'left';
}

export function is_fixed(el: any): boolean
{
	const p = BX.style(el, 'position');

	return p == 'fixed';
}

export function width(node: any, val?: any): any
{
	if (typeof val != 'undefined')
	{
		BX.style(node, 'width', `${Number.parseInt(val)}px`);

		return undefined;
	}

	if (node == window)
	{
		return window.innerWidth;
	}

	// return parseInt(BX.style(node, 'width'));
	return BX.pos(node).width;
}

export function height(node: any, val?: any): any
{
	if (typeof val != 'undefined')
	{
		BX.style(node, 'height', `${Number.parseInt(val)}px`);

		return undefined;
	}

	if (node == window)
	{
		return window.innerHeight;
	}

	// return parseInt(BX.style(node, 'height'));
	return BX.pos(node).height;
}

export function align(pos: any, w: any, h: any, type?: any): { left: any, top: any }
{
	if (type)
	{
		type = type.toLowerCase();
	}
	else
	{
		type = '';
	}

	let pDoc = document;
	if (BX.type.isElementNode(pos))
	{
		pDoc = pos.ownerDocument;
		pos = BX.pos(pos);
	}

	let x = pos.left;
	let y = pos.bottom;

	const scroll = BX.GetWindowScrollPos(pDoc);
	const size = BX.GetWindowInnerSize(pDoc);

	if ((size.innerWidth + scroll.scrollLeft) - (pos.left + w) < 0)
	{
		if (pos.right - w >= 0)
		{
			x = pos.right - w;
		}
		else
		{
			x = scroll.scrollLeft;
		}
	}

	if (((size.innerHeight + scroll.scrollTop) - (pos.bottom + h) < 0) || ~type.indexOf('top'))
	{
		if (pos.top - h >= 0 || ~type.indexOf('top'))
		{
			y = pos.top - h;
		}
		else
		{
			y = scroll.scrollTop;
		}
	}

	return { left: x, top: y };
}

export function scrollToNode(node: any): void
{
	const obNode = resolve(node);

	if (obNode.scrollIntoView)
	{
		obNode.scrollIntoView(true);
	}
	else
	{
		const arNodePos = BX.pos(obNode);
		window.scrollTo(arNodePos.left, arNodePos.top);
	}
}

export function styleIEPropertyName(name: any): any
{
	if (name == 'float')
	{
		name = BX.browser.IsIE() ? 'styleFloat' : 'cssFloat';
	}
	else
	{
		const res = BX.browser.isPropertySupported(name);
		if (res)
		{
			name = res;
		}
		else
		{
			// the literal is built per call on purpose: a module-level one would keep lastIndex
			const reg = /(-([a-z]){1})/g;
			if (reg.test(name))
			{
				name = name.replace(reg, function() { return arguments[2].toUpperCase(); });
			}
		}
	}

	return name;
}
