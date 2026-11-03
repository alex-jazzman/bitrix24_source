import { Type, Text, Tag, Event, Dom } from 'main.core';

import { type Balloon } from './balloon';
import { type ActionOptions } from './types';

type DomEventHandler = (event: globalThis.Event) => void;

// Only schemes that cannot execute code are linkable. An allowlist rather than a denylist:
// `javascript:` hides behind case, control characters and wrappers such as `feed:javascript:`.
const ALLOWED_HREF_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:']);
const HREF_SCHEME = /^([a-z][\d+.a-z-]*):/;
const DELETE_CHAR = '\u007F';

// A browser drops ASCII whitespace and control characters while it reads the scheme, so the
// check drops them too: `java<TAB>script:` is `javascript:`. The href itself keeps them.
// A value without a scheme — a path, a query, an anchor — stays a link: it cannot execute.
function isLinkableHref(href: string): boolean
{
	const scheme = [...href]
		.filter((char) => char > ' ' && char !== DELETE_CHAR)
		.join('')
		.toLowerCase()
		.match(HREF_SCHEME)
	;

	return scheme === null || ALLOWED_HREF_SCHEMES.has(`${scheme[1]}:`);
}

// Fields are intentionally public so that subclasses such as
// ui.notification-manager's BrowserNotificationAction — which read `this.container`
// and `this.events.click` directly — keep working after the migration.
export class Action
{
	balloon: Balloon;
	id: string;
	// Whether the id came from the consumer: an id the action made up for itself does not
	// survive the rebuild of the actions, so the balloon cannot recognise the action by it.
	generatedId: boolean;
	href: string | null;
	title: string | null;
	testId: string | null;
	window: Window;
	container: HTMLElement | null = null;
	events: Record<string, DomEventHandler> = {};

	constructor(balloon: Balloon, options: ActionOptions = {})
	{
		const opts = Type.isPlainObject(options) ? options : ({} as ActionOptions);

		this.balloon = balloon;
		this.generatedId = !Type.isStringFilled(opts.id);
		this.id = this.generatedId ? Text.getRandom(8).toLowerCase() : (opts.id as string);
		this.href = Type.isStringFilled(opts.href) ? (opts.href as string) : null;
		this.title = Type.isStringFilled(opts.title) ? (opts.title as string) : null;
		this.testId = Type.isStringFilled(opts.testId) ? (opts.testId as string) : null;
		this.window = window;

		if (Type.isPlainObject(opts.events))
		{
			for (const [eventName, fn] of Object.entries(opts.events!))
			{
				if (!Type.isFunction(fn))
				{
					continue;
				}

				this.events[eventName] = (event: globalThis.Event): void => {
					fn.call(event.target as EventTarget, event, this.getBalloon(), this);
				};
			}
		}
	}

	getBalloon(): Balloon
	{
		return this.balloon;
	}

	getId(): string
	{
		return this.id;
	}

	hasGeneratedId(): boolean
	{
		return this.generatedId;
	}

	getTitle(): string | null
	{
		return this.title;
	}

	getHref(): string | null
	{
		return this.href;
	}

	getTestId(): string | null
	{
		return this.testId;
	}

	getContainer(): HTMLElement
	{
		if (this.container === null)
		{
			const href = this.getHref();
			// Tag.render concatenates a substitution outside an attribute value straight into
			// the HTML source, so the title has to arrive already encoded.
			const title = Text.encode(this.getTitle() ?? '');
			const linkHref = href !== null && isLinkableHref(href) ? href : null;

			if (href !== null && linkHref === null)
			{
				// The action keeps its click handlers and stays visible — only the navigation is
				// dropped, so a consumer sees a button instead of losing the action silently.
				console.error(`BX.UI.Notification.Action: blocked a potentially unsafe href: ${href}`);
			}

			this.container = linkHref === null
				? Tag.render`<button type="button" class="ui-notification-balloon-action">${title}</button>`
				: Tag.render`<a class="ui-notification-balloon-action" href="${linkHref}">${title}</a>`;

			if (this.testId !== null)
			{
				Dom.attr(this.container!, 'data-testid', this.testId);
			}

			for (const [eventName, handler] of Object.entries(this.events))
			{
				Event.bind(this.container!, eventName, handler);
			}
		}

		return this.container!;
	}

	handleKeyDown(event: KeyboardEvent): void
	{
		if (event.key !== 'Enter' && event.key !== ' ')
		{
			return;
		}

		event.preventDefault();
		this.container!.click();
	}

	getWindow(): Window
	{
		return this.window;
	}
}
