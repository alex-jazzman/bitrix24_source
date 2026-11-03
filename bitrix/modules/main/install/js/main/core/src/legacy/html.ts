import { BX, resolve } from './internal/global';
import { findChildren } from './dom-traverse';
import extractAssets from '../lib/assets/extract-assets';

/**
 * Markup splitting, global evaluation, the template helper and JSON parsing (MOD-01).
 *
 * `processHTML` no longer scans the markup itself: it delegates to `Runtime.extractAssets` and
 * reshapes the answer into the `{ HTML, SCRIPT, STYLE }` its consumers were given. The table of
 * regular expressions that used to live here is gone with it, and so are the defects it carried -
 * a search position shared between calls, a value read from whichever attribute matched first,
 * a closing tag recognised only in its plainest form. Consumers see those fixed; the shape of
 * the answer, and the throw on a null input, are unchanged.
 */

/**
 * Takes the scripts and stylesheet links out of the markup.
 *
 * @deprecated
 * @use BX.Runtime.extractAssets
 *
 * A thin shape adapter over `extractAssets`: the work is done there, and this reshapes the
 * result into `{ HTML, SCRIPT, STYLE }` with `JS` carrying either the address or the body.
 * New code should call `extractAssets` and read named fields off a typed result instead.
 *
 * Nothing is scheduled for removal: the wrapper stays for the consumers that have not moved.
 */
export function processHTML(data: any, scriptsRunFirst?: any): any
{
	// Carried over: the legacy scan reached into `data.substr` without checking, so a null or
	// undefined input threw. Consumers may rely on that, and `extractAssets` answers an empty
	// result instead, so the throw is reproduced here rather than in the new function.
	if (data === null || data === undefined)
	{
		throw new TypeError('BX.processHTML: data is null or undefined');
	}

	// `Boolean`, not `=== true`: the legacy scan used `scriptsRunFirst || ...`, so any truthy
	// value switched the early-run flag on. `BX.ajax` passes this through from its config, which
	// is public, and a caller who has been sending `1` must keep the behaviour it had.
	const assets = extractAssets(data, { runFirst: Boolean(scriptsRunFirst) });

	return {
		HTML: assets.html,
		SCRIPT: assets.scripts.map((item) => ({
			bRunFirst: item.runFirst,
			isInternal: item.isInternal,
			JS: item.isInternal ? item.text : item.src,
		})),
		STYLE: assets.styles.map((item) => item.href),
	};
}

export function parseJSON(data: any, context?: any): any
{
	let result = null;
	if (BX.type.isNotEmptyString(data))
	{
		try
		{
			// not JSON.parse: the input is evaluated as JavaScript, so it accepts what a real
			// parser would refuse
			if (data.indexOf('\n') >= 0)
			{
				// eslint-disable-next-line no-eval
				eval(`result = ${data}`);
			}
			else
			{
				// eslint-disable-next-line no-new-func
				result = (new Function(`return ${data}`))();
			}
		}
		catch (e)
		{
			BX.onCustomEvent(context, 'onParseJSONFailure', [data, context]);
		}
	}
	else if (BX.type.isPlainObject(data))
	{
		return data;
	}

	return result;
}

export function evalPack(code: any): void
{
	while (code.length > 0)
	{
		// the array is consumed, and that mutation is how the continuation below resumes the walk
		const c = code.shift();

		if (c.TYPE == 'SCRIPT_EXT' || c.TYPE == 'SCRIPT_SRC')
		{
			// through the global on purpose: a consumer who replaces BX.loadScript replaces this too
			BX.loadScript(c.DATA, function() { evalPack(code); });

			return;
		}
		else if (c.TYPE == 'SCRIPT')
		{
			evalGlobal(c.DATA);
		}
	}
}

export function evalGlobal(data: any): void
{
	if (data)
	{
		const head = document.getElementsByTagName('head')[0] || document.documentElement;
		const script = document.createElement('script');

		script.type = 'text/javascript';

		if (!BX.browser.IsIE())
		{
			script.appendChild(document.createTextNode(data));
		}
		else
		{
			script.text = data;
		}

		head.insertBefore(script, head.firstChild);
		head.removeChild(script);
	}
}

export function template(tpl: any, callback: any, bKillTpl?: any): void
{
	BX.ready(function() {
		_processTpl(resolve(tpl), callback, bKillTpl);
	});
}

function _processTpl(tplNode: any, cb: any, bKillTpl?: any): void
{
	// a missing node means the callback is not called at all
	if (tplNode)
	{
		// the template leaves the document before the roles are read: the nodes still resolve,
		// they are simply detached by the time the callback sees them
		if (bKillTpl)
		{
			tplNode.parentNode.removeChild(tplNode);
		}

		const res: Record<string, any> = {};
		const nodes = findChildren(tplNode, { attribute: 'data-role' }, true);

		for (let i = 0, l = nodes.length; i < l; i++)
		{
			res[nodes[i].getAttribute('data-role')] = nodes[i];
		}

		cb.apply(tplNode, [res]);
	}
}
