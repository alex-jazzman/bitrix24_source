import Type from '../type';

const blockedKeys = new Set(['__proto__', 'constructor', 'prototype']);

function cloneValue(value: unknown): unknown
{
	if (Type.isPlainObject(value))
	{
		return mergeInto(Object.create(null), value);
	}

	if (Type.isArray(value))
	{
		return value.map((item) => cloneValue(item));
	}

	return value;
}

function mergeInto(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown>
{
	Object.keys(source).forEach((key) => {
		if (blockedKeys.has(key))
		{
			return;
		}

		const value = source[key];
		if (Type.isUndefined(value))
		{
			return;
		}

		const existing = target[key];
		if (Type.isPlainObject(value) && Type.isPlainObject(existing))
		{
			mergeInto(existing, value);

			return;
		}

		target[key] = cloneValue(value);
	});

	return target;
}

/**
 * Deep-merges configuration objects left to right (defaults -> instance -> request)
 * into a fresh null-prototype accumulator:
 * - sources are never mutated, plain objects and arrays are copied;
 * - `__proto__`, `constructor` and `prototype` keys are dropped (prototype pollution guard);
 * - `undefined` values do not override earlier ones;
 * - non-plain values (FormData, Headers, AbortSignal, functions) are passed by reference as is.
 */
export function mergeConfig<T = Record<string, unknown>>(...sources: Array<object | null | undefined>): T
{
	return sources.reduce((acc: Record<string, unknown>, source) => {
		if (Type.isPlainObject(source))
		{
			mergeInto(acc, source);
		}

		return acc;
	}, Object.create(null)) as T;
}
