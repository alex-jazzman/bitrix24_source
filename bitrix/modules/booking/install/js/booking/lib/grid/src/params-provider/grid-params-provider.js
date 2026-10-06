import { Core } from 'booking.core';
import { Model } from 'booking.const';

import { type GridRenderParams } from '../types';

export class GridParamsProvider
{
	#params: ?Partial<GridRenderParams>;

	constructor(params: ?Partial<GridRenderParams> = null)
	{
		this.#params = params;
	}

	get(key: $Keys<GridRenderParams>): any
	{
		return this.#params?.[key] ?? Core.getStore().getters[`${Model.Interface}/${key}`];
	}
}
