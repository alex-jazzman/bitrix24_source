import { BX } from './internal/global';

/**
 * Inheritance and merging - `ext`, `extend`, `is_subclass_of`, `merge`, `mergeEx` (MOD-01).
 *
 * `merge` calls `BX.util.array_merge` and `BX.util.objectMerge` calls `BX.mergeEx`: the two
 * modules form a ring, so both directions go through the global rather than through an import
 * (ADR 3.4). The differences between `merge` and `mergeEx` - array handling, the `isUIWidget`
 * escape hatch, cloning - are not interchangeable and are pinned by
 * `test/old/core/inherit.test.ts`.
 */

export function ext(this: any, ob: any): void
{
	// copies into `this`; called plainly as BX.ext({...}) that means the global BX itself
	for (const i in ob)
	{
		if (Object.prototype.hasOwnProperty.call(ob, i))
		{
			this[i] = ob[i];
		}
	}
}

/* OO emulation utility */
export function extend(child: any, parent: any): void
{
	const f = function() {};
	f.prototype = parent.prototype;

	child.prototype = new (f as any)();
	child.prototype.constructor = child;

	child.superclass = parent.prototype;
	child.prototype.superclass = parent.prototype;
	// side effect on the parent: a prototype that never declared a constructor gets one
	if (parent.prototype.constructor == Object.prototype.constructor)
	{
		parent.prototype.constructor = parent;
	}
}

export function is_subclass_of(ob: any, parent_class: any): boolean
{
	if (ob instanceof parent_class)
	{
		return true;
	}

	// `superclass` is a prototype object, so this recursion throws rather than walking up;
	// transcribed as it stands, fixing it would turn thrown errors into `false` answers
	if (parent_class.superclass)
	{
		return is_subclass_of(ob, parent_class.superclass);
	}

	return false;
}

// access private. use BX.mergeEx instead.
// todo: refactor BX.merge, make it work through BX.mergeEx
export function merge(...arg: any[]): any
{
	if (arg.length < 2)
	{
		return {};
	}

	const result = arg.shift();

	for (const element of arg)
	{
		for (const k in element)
		{
			if (typeof element === 'undefined' || element == null)
			{
				continue;
			}

			if (Object.prototype.hasOwnProperty.call(element, k))
			{
				if (typeof element[k] === 'undefined' || element[k] == null)
				{
					continue;
				}

				if (typeof element[k] === 'object' && !BX.type.isDomNode(element[k]) && (typeof element[k].isUIWidget === 'undefined'))
				{
					// go deeper

					// "array" means "has a length property", which is wider than Array.isArray
					const isArray = 'length' in element[k];

					if (typeof result[k] !== 'object')
					{
						result[k] = isArray ? [] : {};
					}

					if (isArray)
					{
						// ring inherit <-> util (`util.objectMerge` calls `mergeEx`): stays late-bound
						BX.util.array_merge(result[k], element[k]);
					}
					else
					{
						merge(result[k], element[k]);
					}
				}
				else
				{
					result[k] = element[k];
				}
			}
		}
	}

	return result;
}

export function mergeEx(...arg: any[]): any
{
	if (arg.length < 2)
	{
		return {};
	}

	const result = arg.shift();
	for (const element of arg)
	{
		for (const k in element)
		{
			if (typeof element === 'undefined' || element == null || !Object.prototype.hasOwnProperty.call(element, k))
			{
				continue;
			}

			if (BX.type.isPlainObject(element[k]) && BX.type.isPlainObject(result[k]))
			{
				mergeEx(result[k], element[k]);
			}
			else
			{
				result[k] = BX.type.isPlainObject(element[k]) ? BX.clone(element[k]) : element[k];
			}
		}
	}

	return result;
}
