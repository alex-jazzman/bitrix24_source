import { Runtime } from 'main.core';
import { LoaderType } from '../type';

import type { BulletLoaderOptions, DefaultLoaderOptions } from '../type';

export class LoaderFactory
{
	static async createByType(
		type: $Values<typeof LoaderType>,
		options: DefaultLoaderOptions | BulletLoaderOptions = {},
	): Promise<Object | null>
	{
		switch (type)
		{
			case LoaderType.DEFAULT:
			{
				const { Loader } = await Runtime.loadExtension('main.loader');

				return new Loader(options);
			}

			case LoaderType.BULLET:
			{
				const { Loader: UiLoader } = await Runtime.loadExtension('ui.loader');

				return new UiLoader(options);
			}

			default:
			{
				console.error(`Booking.LoaderFactory: Not loader by type: "${type}"`);

				return null;
			}
		}
	}
}
