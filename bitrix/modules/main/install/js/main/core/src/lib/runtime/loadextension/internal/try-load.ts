import { waitOnline } from '../../wait-online';

const TIMEOUTS = [1000, 3000, 5000];

export async function tryLoad<T>(extensions: Array<string>, callback: () => Promise<T>): Promise<T>
{
	for (let i = 0; i <= TIMEOUTS.length; i++)
	{
		try
		{
			// eslint-disable-next-line no-await-in-loop
			return await callback();
		}
		catch
		{
			if (navigator.onLine === false)
			{
				// eslint-disable-next-line no-console
				console.warn(`Wait online for load ${extensions.join(', ')}`);

				// eslint-disable-next-line no-await-in-loop
				await waitOnline();

				i--;

				continue;
			}

			if (i === TIMEOUTS.length)
			{
				throw new Error(`${extensions.join(', ')} loading failed...`);
			}

			const delay = TIMEOUTS[i];
			const displayRetryCount = i + 1;

			// eslint-disable-next-line no-console
			console.warn(`Retry load #${displayRetryCount}: ${extensions.join(', ')}`);

			// eslint-disable-next-line no-await-in-loop
			await new Promise((resolve) => {
				setTimeout(resolve, delay);
			});
		}
	}

	throw new Error('Unexpected end of retry loop');
}
