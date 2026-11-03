import { BX } from './internal/global';
import { type as coreType } from '../core-compatibility';

/**
 * The two converters (MOD-01). No shared state; one namespace on the public surface.
 */

export const convert = {
	toNumber(value: any): number
	{
		if (coreType.isNumber(value))
		{
			return value;
		}

		value = Number(value);

		// anything that does not convert comes back as a zero, never as a NaN
		return !isNaN(value) ? value : 0;
	},
	nodeListToArray(nodes: any): any[]
	{
		try
		{
			return (Array.prototype.slice.call(nodes, 0));
		}
		catch (ex)
		{
			// the manual copy is the fallback for browsers where slice refused a host collection
			const ary = [];
			for (let i = 0, l = nodes.length; i < l; i++)
			{
				ary.push(nodes[i]);
			}

			return ary;
		}
	},
};
