import { BX } from './internal/global';

/**
 * Node-attached data (MOD-01).
 *
 * `BX.data`, the storage constructor and the single instance between them are one group: the
 * accessor is nothing but a thin read/write front for that one instance, and a second instance
 * would mean data written through `BX.data` that `BX.data` cannot read back.
 *
 * FIX-01 #5 is closed here. In the source the instance is created on the very last line of the
 * file, after the function that uses it, and that works only because `var` is hoisted - the
 * accessor is never called during the load, so by the time anyone calls it the assignment has
 * happened. A module has no such hoisting, and the same order would leave the accessor closing
 * over a binding in its temporal dead zone. The order is therefore written out explicitly:
 * constructor, then instance, then accessor. Nothing observable changes; what changes is that the
 * dependency is now stated rather than implied.
 *
 * The leak is carried over as it is: the keys are numbers in a plain object, so a node that has
 * left the document is still held. A `WeakMap` would not hold it, and that is exactly why it is
 * not one - the change would be observable to anyone reading data off a detached node.
 */

export function DataStorage(this: any): void
{
	this.keyOffset = 1;
	this.data = {};
	this.uniqueTag = `BX-${Math.random()}`;

	this.resolve = function(this: any, owner: any, create: any): any {
		if (typeof owner[this.uniqueTag] == 'undefined')
		{
			if (create)
			{
				try
				{
					// non-enumerable, so the marker does not show up in an enumeration of the node
					Object.defineProperty(owner, this.uniqueTag, {
						value: this.keyOffset++,
					});
				}
				catch (e)
				{
					owner[this.uniqueTag] = this.keyOffset++;
				}
			}
			else
			{
				return undefined;
			}
		}

		return owner[this.uniqueTag];
	};

	this.get = function(this: any, owner: any, key: any): any {
		if ((owner != document && !BX.type.isElementNode(owner)) || typeof key == 'undefined')
		{
			return undefined;
		}

		owner = this.resolve(owner, false);

		if (typeof owner == 'undefined' || typeof this.data[owner] == 'undefined')
		{
			return undefined;
		}

		return this.data[owner][key];
	};

	this.set = function(this: any, owner: any, key: any, value: any): void {
		if ((owner != document && !BX.type.isElementNode(owner)) || typeof value == 'undefined')
		{
			return;
		}

		const o = this.resolve(owner, true);

		if (typeof this.data[o] == 'undefined')
		{
			this.data[o] = {};
		}

		this.data[o][key] = value;
	};
}

// some internal variables for new logic
// manager which BX.data() uses to keep data. Built from the local binding, not from
// `BX.DataStorage`: the exports that publish the symbol run at the very end of the bundle, long
// after this line.
const dataStorage = new (DataStorage as any)();

/* data storage */
export function data(node: any, key?: any, value?: any): any
{
	if (typeof node == 'undefined')
	{
		return undefined;
	}

	if (typeof key == 'undefined')
	{
		return undefined;
	}

	if (typeof value != 'undefined')
	{
		// write to manager
		dataStorage.set(node, key, value);
	}
	else
	{
		let stored;

		// from manager
		if ((stored = dataStorage.get(node, key)) != undefined)
		{
			return stored;
		}

		// from attribute data-*
		// the asymmetry is carried over: a stored value keeps its type, an attribute is a string
		if ('getAttribute' in node)
		{
			stored = node.getAttribute(`data-${key.toString()}`);
			if (stored === null)
			{
				return undefined;
			}

			return stored;
		}

		return undefined;
	}

	return undefined;
}
