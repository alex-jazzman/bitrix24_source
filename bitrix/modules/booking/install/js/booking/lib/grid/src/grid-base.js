import { Duration } from 'booking.lib.duration';

export class GridBase
{
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

	calculateWidth(width: number): number
	{
		return width;
	}

	getUnitDurations()
	{
		return Duration.getUnitDurations();
	}
}
