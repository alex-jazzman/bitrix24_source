import { Core } from 'booking.core';
import { Grid, Model } from 'booking.const';

import { GridDay } from './grid-day';
import { GridWeek } from './grid-week';
import { type GridBase } from './grid-base';
import { type GridRenderParams } from './types';
import { GridParamsProvider } from './params-provider/grid-params-provider';

const stateParamsProvider = new GridParamsProvider();
const gridDay = new GridDay(stateParamsProvider);
const gridWeek = new GridWeek(stateParamsProvider);

export class GridFactory
{
	static getGrid(params: GridRenderParams | null = null): GridBase
	{
		if (!params)
		{
			const isWeekMode = Core.getStore().getters[`${Model.Interface}/isWeekMode`];

			return isWeekMode ? gridWeek : gridDay;
		}

		const paramsProvider = new GridParamsProvider(params);

		return params.gridMode === Grid.Mode.Week
			? new GridWeek(paramsProvider)
			: new GridDay(paramsProvider)
		;
	}
}
