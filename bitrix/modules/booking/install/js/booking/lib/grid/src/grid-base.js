import { Duration } from 'booking.lib.duration';

import { type GridParamsProvider } from './params-provider/grid-params-provider';
import { type GridRenderParams } from './types';

export class GridBase
{
	#paramsProvider: GridParamsProvider;

	constructor(paramsProvider: GridParamsProvider)
	{
		this.#paramsProvider = paramsProvider;
	}

	calculateLeft(...args)
	{
		throw new Error('Method calculateLeft must be implemented');
	}

	calculateTop(...args)
	{
		throw new Error('Method calculateTop must be implemented');
	}

	calculateHeight(...args)
	{
		throw new Error('Method calculateHeight must be implemented');
	}

	calculateRealHeight(...args)
	{
		return this.calculateHeight(...args);
	}

	calculateWidth(...args)
	{
		throw new Error('Method calculateWidth must be implemented');
	}

	getUnitDurations()
	{
		return Duration.getUnitDurations();
	}

	getParamValue(key: $Keys<GridRenderParams>): any
	{
		return this.#paramsProvider.get(key);
	}
}
