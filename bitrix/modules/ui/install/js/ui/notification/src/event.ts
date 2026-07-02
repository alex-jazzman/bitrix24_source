import { Type } from 'main.core';

import { type Balloon } from './balloon';

export class NotificationEvent
{
	#balloon: Balloon | null = null;
	#name: string | null = null;

	static getFullName(eventName: string): string
	{
		return `UI.Notification.Balloon:${eventName}`;
	}

	getBalloon(): Balloon | null
	{
		return this.#balloon;
	}

	setBalloon(balloon: unknown): void
	{
		// Avoid a runtime import cycle with Balloon — use a duck-typed object check.
		if (Type.isObject(balloon))
		{
			this.#balloon = balloon as Balloon;
		}
	}

	getName(): string | null
	{
		return this.#name;
	}

	setName(name: unknown): void
	{
		if (Type.isStringFilled(name))
		{
			this.#name = name;
		}
	}

	getFullName(): string
	{
		return NotificationEvent.getFullName(this.#name ?? '');
	}
}
