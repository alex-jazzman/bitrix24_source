import { Event } from 'main.core';

import { LiveAnnouncer } from 'ui.a11y';

// The announcer of a document is looked up by the document itself, and weakly: a document
// nobody holds any more has to be collectable together with the live region inside it.
let announcers = new WeakMap<Document, LiveAnnouncer>();

// The same announcers, reachable for `destroyAnnouncers()` — and only weakly, because this
// list must not be the thing that keeps them alive. A `WeakMap` cannot be walked, so the
// list is needed; but holding an announcer strongly here would make the `WeakMap` pointless,
// as the announcer holds its live region, the region is a child of `doc.body`, and the
// document hangs on that chain. On a portal every slider is a document of its own, and
// «strong» there means «until the page is reloaded»: a document that showed one notification
// would keep its whole DOM and everything reachable from it out of the collector's reach.
const instances = new Set<WeakRef<LiveAnnouncer>>();

let releaseBound = false;

/**
 * Takes the live regions this window created down while it is still there to do it.
 *
 * `showOnTopWindow` puts the region into `window.top.document.body` — the body of the portal,
 * which outlives the frame that asked for the announcement. Nothing in the top document knows
 * about that region, and the only module that does is about to be gone with its frame: the
 * region would then stay in the portal body for good, one more per opened slider, and a
 * screen reader watches every live region of a document at once. So the frame cleans up after
 * itself on the way out.
 *
 * `pagehide` and not `unload`: a page with an `unload` listener is not eligible for the
 * back/forward cache, and this is not worth that. The binding is made on the first announcer
 * and only then — a window that never announced anything has nothing to take down.
 */
function bindRelease(): void
{
	if (releaseBound)
	{
		return;
	}

	releaseBound = true;
	Event.bind(window, 'pagehide', () => destroyAnnouncers());
}

function rememberAnnouncer(announcer: LiveAnnouncer): void
{
	// A reference whose announcer is already collected is an empty box: it is dropped here
	// rather than left to pile up one per document the window has ever announced into.
	instances.forEach((ref: WeakRef<LiveAnnouncer>) => {
		if (ref.deref() === undefined)
		{
			instances.delete(ref);
		}
	});

	instances.add(new WeakRef(announcer));
}

export function announce(message: string, options?: { document?: Document, politeness?: 'polite' | 'assertive' }): void
{
	if (message.trim() === '')
	{
		return;
	}

	const doc = options?.document ?? document;
	let announcer = announcers.get(doc);
	if (!announcer)
	{
		announcer = new LiveAnnouncer({ container: doc.body });
		announcers.set(doc, announcer);
		rememberAnnouncer(announcer);
		bindRelease();
	}

	announcer.announce(message, options?.politeness ?? 'polite');
}

export function getAnnouncerDocument(showOnTopWindow: boolean): Document
{
	if (showOnTopWindow)
	{
		try
		{
			return window.top!.document;
		}
		catch
		{
			return document;
		}
	}

	return document;
}

export function destroyAnnouncers(): void
{
	instances.forEach((ref: WeakRef<LiveAnnouncer>) => ref.deref()?.destroy());
	instances.clear();
	announcers = new WeakMap();
}
