import { Core } from 'booking.core';
import { Model } from 'booking.const';

import { gridDay } from './grid-day';
import { gridWeek } from './grid-week';
import { GridBase } from './grid-base';

class GridFactory
{
	getGrid(): GridBase
	{
		const isWeekMode = Core.getStore().getters[`${Model.Interface}/isWeekMode`];

		return isWeekMode ? gridWeek : gridDay;
	}
}

export const gridFactory = new GridFactory();
