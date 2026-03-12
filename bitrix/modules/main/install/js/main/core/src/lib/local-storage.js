import Type from './type';
import Loc from './loc';
import Event from './event';
import EventEmitter from './event/event-emitter';
import BaseEvent from './event/base-event';

import { type JsonValue } from './types/json';

export type LocalStorageOptions = {
	prefix?: string,
};

export class LocalStorage
{
	#prefix: string | null = null;

	constructor(storageOptions: LocalStorageOptions = {})
	{
		const options = Type.isPlainObject(storageOptions) ? storageOptions : {};

		this.#setPrefix(options.prefix);

		Event.bind(window, 'storage', this.#handleStorageChange.bind(this));
		setInterval(this.#clear.bind(this), 5000);
	}

	set(key: string, value, ttl: number = 60): boolean
	{
		if (!Type.isStringFilled(key) || Type.isNil(value))
		{
			return false;
		}

		try
		{
			window.localStorage.setItem(
				this.getPrefix() + key,
				`${Math.round(Date.now() / 1000) + ttl}:${this.#encode(value)}`,
			);
		}
		catch
		{
			console.error('LocalStorage error', key, ttl);

			return false;
		}

		return true;
	}

	get(key: string): string | null
	{
		const storageValue = window.localStorage.getItem(this.getPrefix() + key);
		if (storageValue)
		{
			const valueParts = this.#parseValue(storageValue);
			if (valueParts === null)
			{
				return null;
			}

			const [ttl, value] = valueParts;
			if (Date.now() <= ttl)
			{
				return this.#decode(value);
			}

			this.remove(key);
		}

		return null;
	}

	remove(key: string): void
	{
		window.localStorage.removeItem(this.getPrefix() + key);
	}

	getPrefix(): string
	{
		if (this.#prefix === null)
		{
			const userId = Loc.hasMessage('USER_ID') ? Loc.getMessage('USER_ID') : '';
			const siteId = Loc.hasMessage('SITE_ID') ? Loc.getMessage('SITE_ID') : 'admin';
			this.#prefix = `${this.getBasePrefix()}${userId}-${siteId}-`;
		}

		return this.#prefix;
	}

	getBasePrefix(): string
	{
		return 'bx';
	}

	#setPrefix(prefix: string)
	{
		if (Type.isString(prefix))
		{
			this.#prefix = `${this.getBasePrefix()}-${prefix}`;
		}
	}

	#handleStorageChange(event: StorageEvent): void
	{
		if (!Type.isStringFilled(event.key) || !event.key.startsWith(this.getPrefix()))
		{
			return;
		}

		const key = event.key.slice(this.getPrefix().length);
		const value = this.#getRealValue(event.newValue);
		const oldValue = this.#getRealValue(event.oldValue);
		const data = { key, value, oldValue };

		if (key === 'BXGCE')
		{
			// BX Global Custom Event
			if (value)
			{
				EventEmitter.emit(data.value.e, new BaseEvent({ data: data.value.p, compatData: data.value.p }));
			}
		}
		else
		{
			// normal event handlers
			if (event.newValue)
			{
				EventEmitter.emit('onLocalStorageSet', new BaseEvent({ data: [data], compatData: [data] }));
			}

			if (event.oldValue && !event.newValue)
			{
				EventEmitter.emit('onLocalStorageRemove', new BaseEvent({ data: [data], compatData: [data] }));
			}

			EventEmitter.emit('onLocalStorageChange', new BaseEvent({ data: [data], compatData: [data] }));
		}
	}

	#clear(): void
	{
		const curDate = Date.now();
		for (let i = 0; i < window.localStorage.length; i++)
		{
			const key = window.localStorage.key(i);
			if (key.startsWith(this.getBasePrefix()))
			{
				const value = window.localStorage.getItem(key);
				const valueParts = this.#parseValue(value);
				if (valueParts === null)
				{
					continue;
				}

				const [ttl] = valueParts;
				if (curDate >= ttl)
				{
					window.localStorage.removeItem(key);
				}
			}
		}
	}

	#encode(value: JsonValue): string
	{
		if (Type.isJsonValue(value))
		{
			return JSON.stringify(value);
		}

		return value.toString();
	}

	#decode(value): null | JsonValue
	{
		let result = null;
		if (Type.isStringFilled(value))
		{
			try
			{
				result = JSON.parse(value);
			}
			catch
			{
				result = value;
			}
		}

		return result;
	}

	#getRealValue(value: string): JsonValue
	{
		const valueParts = this.#parseValue(value);
		if (valueParts === null)
		{
			return null;
		}

		return this.#decode(valueParts[1]);
	}

	#parseValue(value: string): [number, string] | null
	{
		if (!this.#isValueValid(value))
		{
			return null;
		}

		const [ttl] = value.split(':', 1);
		const realValue = value.slice(ttl.length + 1);

		return [parseInt(ttl, 10) * 1000, realValue];
	}

	#isValueValid(value: string): boolean
	{
		return Type.isStringFilled(value) && /^\d{10}:/.test(value);
	}
}

export const localStorage = new LocalStorage();
