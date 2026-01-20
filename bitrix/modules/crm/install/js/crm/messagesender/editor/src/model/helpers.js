import { Runtime, Type } from 'main.core';

export function makeFrozenClone(source: any): any
{
	return deepFreeze(Runtime.clone(source));
}

export function deepFreeze(target: {[key: string]: any})
{
	if (Type.isObject(target))
	{
		Object.values(target).forEach((value) => {
			deepFreeze(value);
		});

		return Object.freeze(target);
	}

	return target;
}
