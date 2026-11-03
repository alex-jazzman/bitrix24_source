import { BX, resolve } from './internal/global';
import { proxy, delegate } from './delegate';
import { load } from './assets';

/**
 * The hint (MOD-01): a constructor, 20 members on the prototype, 5 static properties and the two
 * shortcut functions.
 *
 * **Written as a constructor function with explicit prototype assignments, not as a `class`, and
 * deliberately so.** `defaultSettings` has to stay a property *of the prototype*: the constructor
 * reads it through `this.defaultSettings` to merge the parameters, and consumers read it off
 * `BX.CHint.prototype`. Class syntax has no way to spell a data property on the prototype - the
 * obvious `defaultSettings = {...}` inside a `class` body is an instance field, which moves the
 * object off the prototype and onto every instance. Nothing throws when that happens; the
 * composition check simply loses a name, which is why AC-002 calls it out separately and why
 * `test/old/core/hint.test.ts` asserts both the presence on the prototype and the absence on the
 * instance.
 *
 * The two subscriptions to the menu events are **not** here. They are load-time side effects, and
 * SFX-01 collects them at the assembly point of the layer in `index.ts`; the handlers themselves
 * stay static members, because that is what they are on the public surface.
 *
 * Four lifecycle defects are carried over verbatim (Q-2). Each is marked where it lives. They are
 * real bugs and fixing any of them changes what a consumer observes, so they are carried and
 * listed as separate follow-up work rather than repaired here.
 *
 * **`CHint` is published by assignment, not by `export`, and that is the one exception in the
 * layer.** Everywhere else a symbol is exported and chef writes it into `BX` for us, but chef
 * emits those writes as an `exports.*` block at the very end of the bundle - after every
 * load-time side effect the layer runs. `index.ts` subscribes the menu handlers at load time and
 * reads them off `BX.CHint`, and the 35 statics and prototype members below are written onto
 * `BX.CHint` at load time too. Exporting the constructor moves its publication past both, and
 * the subscription picks up `undefined`. Measured on the built bundle: the subscription sits at
 * byte 63169 and `exports.CHint` at 63423. The two shortcut functions at the bottom of this file
 * have no such load-time reader and are exported normally.
 *
 * For the same reason every member below is written through `BX.CHint` rather than through a
 * module-local binding. The writes have to land on whichever object the global points at, so
 * that a later loader replacing `BX.CHint` still gets the prototype this file builds. A local
 * const would pin them to an object the global no longer references - measured: the prototype
 * members silently stop being the ones consumers call. Only the calls out to neighbouring
 * modules (`proxy`, `delegate`, `load`) are imported.
 */

BX.CHint = function(this: any, params: any): void
{
	if (BX.CHint.cssLoaded === false)
	{
		load(['/bitrix/js/main/core/css/core_hint.css']);
		BX.CHint.cssLoaded = true;
	}

	this.PARENT = resolve(params.parent);

	this.HINT = params.hint;
	this.HINT_TITLE = params.title;

	this.PARAMS = {};
	// `null ==` on purpose: an explicit null falls back to the default, a zero or a false does not
	for (const i in this.defaultSettings)
	{
		if (params[i] == null)
		{
			this.PARAMS[i] = this.defaultSettings[i];
		}
		else
		{
			this.PARAMS[i] = params[i];
		}
	}

	if (params.id != null)
	{
		this.ID = params.id;
	}

	this.timer = null;
	this.bInited = false;
	this.msover = true;

	if (this.PARAMS.showOnce)
	{
		this.__show();
		this.msover = false;
		this.timer = setTimeout(proxy(this.__hide, this), this.PARAMS.hide_timeout);
	}
	else if (this.PARENT)
	{
		BX.bind(this.PARENT, 'mouseover', proxy(this.Show, this));
		BX.bind(this.PARENT, 'mouseout', proxy(this.Hide, this));
	}
} as any;

BX.CHint.cssLoaded = false;

BX.CHint.openHints = new Set();

BX.CHint.globalDisabled = false;

BX.CHint.handleMenuOpen = function(): void {
	BX.CHint.globalDisabled = true;

	BX.CHint.openHints.forEach(function(openHint: any) {
		openHint.__hide_immediately();
	});
};

BX.CHint.handleMenuClose = function(): void {
	BX.CHint.globalDisabled = false;
};

/**
 * A property of the prototype, not a field of the instance (AC-002). See the note at the top of
 * the file for why the whole object is written this way.
 */
BX.CHint.prototype.defaultSettings = {
	show_timeout: 1000,
	hide_timeout: 500,
	dx: 2,
	showOnce: false,
	preventHide: true,
	min_width: 250,
};

BX.CHint.prototype.CreateParent = function(this: any, element?: any, params?: any): any
{
	if (this.PARENT)
	{
		// the wrapper cache works in our favour here: the same method is asked for on both sides,
		// so the unsubscribe really does find what the subscribe put there
		BX.unbind(this.PARENT, 'mouseover', proxy(this.Show, this));
		BX.unbind(this.PARENT, 'mouseout', proxy(this.Hide, this));
	}

	if (!params)
	{
		params = {};
	}
	let type = 'icon';

	if (params.type && (params.type == 'link' || params.type == 'icon'))
	{
		type = params.type;
	}

	if (element)
	{
		type = 'element';
	}

	if (type == 'icon')
	{
		element = BX.create('IMG', {
			props: {
				src: params.iconSrc
					? params.iconSrc
					: '/bitrix/js/main/core/images/hint.gif',
			},
		});
	}
	else if (type == 'link')
	{
		element = BX.create('A', {
			props: { href: 'javascript:void(0)' },
			html: '[?]',
		});
	}

	this.PARENT = element;

	BX.bind(this.PARENT, 'mouseover', proxy(this.Show, this));
	BX.bind(this.PARENT, 'mouseout', proxy(this.Hide, this));

	return this.PARENT;
};

BX.CHint.prototype.Show = function(this: any): void
{
	this.msover = true;

	if (this.timer != null)
	{
		clearTimeout(this.timer);
	}

	this.timer = setTimeout(proxy(this.__show, this), this.PARAMS.show_timeout);
};

BX.CHint.prototype.Hide = function(this: any): void
{
	this.msover = false;

	if (this.timer != null)
	{
		clearTimeout(this.timer);
	}

	this.timer = setTimeout(proxy(this.__hide, this), this.PARAMS.hide_timeout);
};

BX.CHint.prototype.__show = function(this: any): void
{
	if (!this.msover || this.disabled || BX.CHint.globalDisabled)
	{
		return;
	}

	if (!this.bInited)
	{
		this.Init();
	}

	if (this.prepareAdjustPos())
	{
		this.DIV.style.display = 'block';
		BX.ZIndexManager.bringToFront(this.DIV);

		this.adjustPos();

		BX.CHint.openHints.add(this);

		// Q-2 #1: subscribed as __onscroll, unsubscribed in __hide as Reopen. The wrapper cache
		// is keyed by the pair of function and context, so the unsubscribe never matches and this
		// handler stays on the window for good. Carried verbatim: removing the accumulated
		// handlers is an observable change.
		BX.bind(window, 'scroll', proxy(this.__onscroll, this));

		if (this.PARAMS.showOnce)
		{
			this.timer = setTimeout(proxy(this.__hide, this), this.PARAMS.hide_timeout);
		}
	}
};

BX.CHint.prototype.__onscroll = function(this: any): void
{
	if (!BX.admin || !BX.admin.panel || !BX.admin.panel.isFixed())
	{
		return;
	}

	if (this.scrollTimer)
	{
		clearTimeout(this.scrollTimer);
	}

	this.DIV.style.display = 'none';
	this.scrollTimer = setTimeout(proxy(this.Reopen, this), this.PARAMS.show_timeout);
};

BX.CHint.prototype.Reopen = function(this: any): void
{
	if (this.timer != null)
	{
		clearTimeout(this.timer);
	}
	this.timer = setTimeout(proxy(this.__show, this), 50);
};

BX.CHint.prototype.__hide = function(this: any): void
{
	if (this.msover)
	{
		return;
	}

	if (!this.bInited)
	{
		return;
	}

	// the other half of Q-2 #1: Reopen, not __onscroll
	BX.unbind(window, 'scroll', proxy(this.Reopen, this));

	BX.CHint.openHints.delete(this);

	if (this.PARAMS.showOnce)
	{
		this.Destroy();
	}
	else
	{
		this.DIV.style.display = 'none';
	}
};

BX.CHint.prototype.__hide_immediately = function(this: any): void
{
	this.msover = false;
	this.__hide();
};

BX.CHint.prototype.Init = function(this: any): void
{
	this.DIV = document.body.appendChild(BX.create('DIV', {
		props: { className: 'bx-panel-tooltip' },
		style: {
			display: 'none',
			position: 'absolute',
			visibility: 'hidden',
		},
		children: [
			(this.CONTENT = BX.create('DIV', {
				props: { className: 'bx-panel-tooltip-content' },
				children: [
					BX.create('DIV', {
						props: { className: 'bx-panel-tooltip-underlay' },
						children: [
							BX.create('DIV', { props: { className: 'bx-panel-tooltip-underlay-bg' } }),
						],
					}),
				],
			})),
		],
	}));

	BX.ZIndexManager.register(this.DIV);

	if (this.ID)
	{
		this.CONTENT.insertBefore(BX.create('A', {
			attrs: { href: 'javascript:void(0)' },
			props: { className: 'bx-panel-tooltip-close' },
			events: { click: delegate(this.Close, this) },
		}), this.CONTENT.firstChild);
	}

	if (this.HINT_TITLE)
	{
		this.CONTENT.appendChild(
			BX.create('DIV', {
				props: { className: 'bx-panel-tooltip-title' },
				text: this.HINT_TITLE,
			}),
		);
	}

	if (this.HINT)
	{
		// the content goes in as markup, not as text - see the comment above BX.hint below
		this.CONTENT_TEXT = this.CONTENT.appendChild(BX.create('DIV', { props: { className: 'bx-panel-tooltip-text' } })).appendChild(BX.create('SPAN', { html: this.HINT }));
	}

	if (this.PARAMS.preventHide)
	{
		BX.bind(this.DIV, 'mouseout', proxy(this.Hide, this));
		BX.bind(this.DIV, 'mouseover', proxy(this.Show, this));
	}

	this.bInited = true;
};

BX.CHint.prototype.setContent = function(this: any, content: any): void
{
	this.HINT = content;

	if (this.CONTENT_TEXT)
	{
		this.CONTENT_TEXT.innerHTML = this.HINT;
	}
	else
	{
		this.CONTENT_TEXT = this.CONTENT.appendChild(BX.create('DIV', { props: { className: 'bx-panel-tooltip-text' } })).appendChild(BX.create('SPAN', { html: this.HINT }));
	}
};

BX.CHint.prototype.prepareAdjustPos = function(this: any): boolean
{
	this._wnd = { scrollPos: BX.GetWindowScrollPos(), scrollSize: BX.GetWindowScrollSize() };

	return BX.style(this.PARENT, 'display') != 'none';
};

BX.CHint.prototype.getAdjustPos = function(this: any): any
{
	const res: any = {};
	const pos = BX.pos(this.PARENT);
	let min_top = 0;

	res.top = pos.bottom + this.PARAMS.dx;

	// Q-2 #4: `BX.admin.panel` itself is not checked, only `BX.admin` and `BX.admin.panel.DIV`.
	// An admin object without a panel gives a TypeError here. Carried verbatim.
	if (BX.admin && BX.admin.panel.DIV)
	{
		min_top = BX.admin.panel.DIV.offsetHeight + this.PARAMS.dx;

		if (BX.admin.panel.isFixed())
		{
			min_top += this._wnd.scrollPos.scrollTop;
		}
	}

	if (res.top < min_top)
	{
		res.top = min_top;
	}
	else if (res.top + this.DIV.offsetHeight > this._wnd.scrollSize.scrollHeight)
	{
		res.top = pos.top - this.PARAMS.dx - this.DIV.offsetHeight;
	}

	res.left = pos.left;

	// FIX-01 #9. The source has a branch here for a parent sitting closer to the edge than the
	// offset allows, and its whole body is `pos.left = this.PARAMS.dx` - an assignment to the
	// input, made after the result was already written to `res.left`, so nothing that leaves this
	// function depends on it. The branch is dropped and the clamp it was paired with kept, which
	// is what the remaining condition expresses: the answer is the untouched left edge unless the
	// hint would run past the right edge of the page.
	if (pos.left >= this.PARAMS.dx)
	{
		const floatWidth = this.DIV.offsetWidth;

		const max_left = this._wnd.scrollSize.scrollWidth - floatWidth - this.PARAMS.dx;

		if (res.left > max_left)
		{
			res.left = max_left;
		}
	}

	return res;
};

BX.CHint.prototype.adjustWidth = function(this: any): void
{
	// the guard is set once and never cleared: the width is not recomputed after setContent
	if (this.bWidthAdjusted)
	{
		return;
	}

	let w = this.DIV.offsetWidth;
	const h = this.DIV.offsetHeight;

	if (w > this.PARAMS.min_width)
	{
		w = Math.round(Math.sqrt(1.618 * w * h));
	}

	if (w < this.PARAMS.min_width)
	{
		w = this.PARAMS.min_width;
	}

	this.DIV.style.width = `${w}px`;

	if (this._adjustWidthInt)
	{
		clearInterval(this._adjustWidthInt);
	}
	this._adjustWidthInt = setInterval(delegate(this._adjustWidthInterval, this), 5);

	this.bWidthAdjusted = true;
};

BX.CHint.prototype._adjustWidthInterval = function(this: any): void
{
	// Q-2 #3: the interval is stopped and execution carries on into the next statement, which
	// reads a property of a node that may not exist - a hint with no content has no CONTENT_TEXT
	// and throws inside the timer, where nobody sees it. Carried verbatim: adding the return
	// changes when the hint stops widening.
	if (!this.DIV || this.DIV.style.display == 'none')
	{
		clearInterval(this._adjustWidthInt);
	}

	const dW = 20;
	const maxWidth = 1500;
	const w = this.DIV.offsetWidth;
	const w1 = this.CONTENT_TEXT.offsetWidth;

	if (w > 0 && w1 > 0 && w - w1 < dW && w < maxWidth)
	{
		this.DIV.style.width = `${w + dW}px`;

		return;
	}

	clearInterval(this._adjustWidthInt);
};

BX.CHint.prototype.adjustPos = function(this: any): void
{
	this.adjustWidth();

	const pos = this.getAdjustPos();

	this.DIV.style.top = `${pos.top}px`;
	this.DIV.style.left = `${pos.left}px`;
};

BX.CHint.prototype.Close = function(this: any): void
{
	if (this.ID && BX.WindowManager)
	{
		BX.WindowManager.saveWindowOptions(this.ID, { display: 'off' });
	}
	this.__hide_immediately();
	this.Destroy();
};

BX.CHint.prototype.Destroy = function(this: any): void
{
	// Q-2 #2: `bInited` is not cleared and the hint is not removed from `BX.CHint.openHints`, so
	// a Show after a Destroy takes the "already initialised" path and reaches for a node that has
	// been cleaned out, and the static registry keeps a destroyed hint. Carried verbatim.
	if (this.PARENT)
	{
		BX.unbind(this.PARENT, 'mouseover', proxy(this.Show, this));
		BX.unbind(this.PARENT, 'mouseout', proxy(this.Hide, this));
	}

	if (this.DIV)
	{
		BX.unbind(this.DIV, 'mouseover', proxy(this.Show, this));
		BX.unbind(this.DIV, 'mouseout', proxy(this.Hide, this));

		BX.ZIndexManager.unregister(this.DIV);

		BX.cleanNode(this.DIV, true);
	}
};

BX.CHint.prototype.enable = function(this: any): void { this.disabled = false; };

BX.CHint.prototype.disable = function(this: any): void { this.__hide_immediately(); this.disabled = true; };

/******* HINT ***************/
// if function has 2 params - the 2nd one is hint html. otherwise hint_html is third and hint_title - 2nd;
// '<div onmouseover="BX.hint(this, 'This is &lt;b&gt;Hint&lt;/b&gt;')"'>;
// BX.hint(el, 'This is <b>Hint</b>') - this won't work, use constructor
export function hint(el: any, hint_title?: any, hint_html?: any, hint_id?: any): void
{
	if (hint_html == null)
	{
		hint_html = hint_title;
		hint_title = '';
	}

	// already hinted: a second call is a silent no-op
	if (el.BXHINT == null)
	{
		el.BXHINT = new BX.CHint({
			parent: el, hint: hint_html, title: hint_title, id: hint_id,
		});
		el.BXHINT.Show();
	}
}

export function hint_replace(el: any, hint_title?: any, hint_html?: any): any
{
	if (hint_html == null)
	{
		hint_html = hint_title;
		hint_title = '';
	}

	if (!el || !el.parentNode || !hint_html)
	{
		return null;
	}

	const obHint = new BX.CHint({
		hint: hint_html,
		title: hint_title,
	});

	obHint.CreateParent();

	el.parentNode.insertBefore(obHint.PARENT, el);
	el.parentNode.removeChild(el);

	obHint.PARENT.style.marginLeft = '5px';

	// the node that was removed, not the one that replaced it
	return el;
}
