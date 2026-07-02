import { Type, Text, Tag, Event } from 'main.core';

import { type Balloon } from './balloon';
import { type ActionOptions } from './types';

type DomEventHandler = (event: globalThis.Event) => void;

// Fields are intentionally public so that subclasses such as
// ui.notification-manager's BrowserNotificationAction — which read `this.container`
// and `this.events.click` directly — keep working after the migration.
export class Action
{
	balloon: Balloon;
	id: string;
	href: string | null;
	title: string | null;
	window: Window;
	container: HTMLElement | null = null;
	events: Record<string, DomEventHandler> = {};

	constructor(balloon: Balloon, options: ActionOptions = {})
	{
		const opts = Type.isPlainObject(options) ? options : ({} as ActionOptions);

		this.balloon = balloon;
		this.id = Type.isStringFilled(opts.id) ? (opts.id as string) : Text.getRandom(8).toLowerCase();
		this.href = Type.isStringFilled(opts.href) ? (opts.href as string) : null;
		this.title = Type.isStringFilled(opts.title) ? (opts.title as string) : null;
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

	getTitle(): string | null
	{
		return this.title;
	}

	getHref(): string | null
	{
		return this.href;
	}

	getContainer(): HTMLElement
	{
		if (this.container === null)
		{
			const href = this.getHref();
			const title = this.getTitle() ?? '';

			this.container = href === null
				? Tag.render`<span class="ui-notification-balloon-action">${title}</span>`
				: Tag.render`<a class="ui-notification-balloon-action" href="${href}">${title}</a>`;

			for (const [eventName, handler] of Object.entries(this.events))
			{
				Event.bind(this.container!, eventName, handler);
			}
		}

		return this.container!;
	}

	getWindow(): Window
	{
		return this.window;
	}
}
