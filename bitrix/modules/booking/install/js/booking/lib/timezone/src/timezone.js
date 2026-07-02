export class Timezone
{
	static #cache: { [key: string]: number } = {};

	static getOffsetFromUtc(dateTs: number, timeZone: string): number
	{
		const key = `${dateTs}-${timeZone}`;
		if (!this.#cache[key])
		{
			const date = new Date(dateTs);
			const dateInTimezone = new Date(date.toLocaleString('en-US', { timeZone }));
			const dateInUTC = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));

			this.#cache[key] = (dateInTimezone.getTime() - dateInUTC.getTime()) / 1000;
		}

		return this.#cache[key];
	}

	static getOffsetFromClientTimezone(dateTs: number, timeZone: string): number
	{
		return (this.getOffsetFromUtc(dateTs, timeZone) + new Date(dateTs).getTimezoneOffset() * 60) * 1000;
	}
}
