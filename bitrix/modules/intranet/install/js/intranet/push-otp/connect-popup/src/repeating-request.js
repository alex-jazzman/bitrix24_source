export class RepeatingRequest
{
	constructor(interval: number)
	{
		this.interval = interval;
		this.timerId = null;
	}

	start(request: () => Promise): void
	{
		if (this.timerId === null)
		{
			request();
			this.timerId = setInterval(() => {
				request();
			}, this.interval);
		}
	}

	stop()
	{
		if (this.timerId !== null)
		{
			clearInterval(this.timerId);
			this.timerId = null;
		}
	}
}
