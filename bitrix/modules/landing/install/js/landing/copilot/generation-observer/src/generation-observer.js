const pullHandlers = new Set();
const landingIdResolvers = new Set();

const normalizeLandingId = (landingId) => Math.max(0, parseInt(landingId, 10) || 0);

export class GenerationObserver
{
	static INTERVAL = 30000;

	generationId: number;
	landingId: number;
	#intervalId: ?number = null;
	#isSubscribed: boolean = false;

	static registerPullHandler(handler: Function | {handle: Function}): Function
	{
		if (
			typeof handler !== 'function'
			&& typeof handler?.handle !== 'function'
		)
		{
			return () => {};
		}

		pullHandlers.add(handler);

		return () => {
			pullHandlers.delete(handler);
		};
	}

	static registerLandingIdResolver(resolver: Function): Function
	{
		if (typeof resolver !== 'function')
		{
			return () => {};
		}

		landingIdResolvers.add(resolver);

		return () => {
			landingIdResolvers.delete(resolver);
		};
	}

	static resolveLandingId(): number
	{
		let landingId = 0;

		landingIdResolvers.forEach((resolver) => {
			if (landingId > 0)
			{
				return;
			}

			try
			{
				landingId = normalizeLandingId(resolver());
			}
			catch (error)
			{
				landingId = 0;
			}
		});

		return landingId;
	}

	constructor(generationId: ?number = null, options: {landingId?: ?number} = {})
	{
		this.generationId = Math.max(0, parseInt(generationId, 10) || 0);
		this.landingId = Math.max(
			0,
			parseInt(options.landingId, 10) || 0,
			GenerationObserver.resolveLandingId(),
		);
		this.onGenerationRestart = this.onGenerationRestart.bind(this);
	}

	getGenerationId(): number
	{
		return this.generationId;
	}

	getLandingId(): number
	{
		return this.landingId || GenerationObserver.resolveLandingId();
	}

	observe()
	{
		if (this.generationId > 0)
		{
			this.restartObserve();
		}

		if (this.#isSubscribed)
		{
			return;
		}

		this.#isSubscribed = true;

		BX.PULL.subscribe({
			type: BX.PullClient.SubscriptionType.Server,
			moduleId: 'landing',
			callback: (event) => {
				const command = event.command;

				for (const handler of pullHandlers)
				{
					if (typeof handler?.handle === 'function')
					{
						if (handler.handle(event, this) === true)
						{
							return;
						}
					}
					else if (typeof handler === 'function')
					{
						if (handler(event, this) === true)
						{
							return;
						}
					}
				}

				if (this.generationId <= 0)
				{
					return;
				}

				if (
					event.params.generationId !== undefined
					&& event.params.generationId !== this.generationId
				)
				{
					return;
				}

				if (
					command === 'LandingCopilotGeneration:onStepExecute'
					|| command === 'LandingCopilotGeneration:onPreviewImageCreate'
					|| command === 'LandingCopilotGeneration:onCopilotImageCreate'
				)
				{
					this.restartObserve();
				}

				if (command === 'LandingCopilotGeneration:onCopilotTimeIsOver')
				{
					this.onGenerationRestart();
				}

				if (
					command === 'LandingCopilotGeneration:onGenerationError'
					|| command === 'LandingCopilotGeneration:onGenerationFinish'
				)
				{
					this.stopObserve();
				}
			},
		});
	}

	restartObserve()
	{
		if (this.generationId <= 0)
		{
			return;
		}

		if (this.#intervalId)
		{
			clearInterval(this.#intervalId);
		}

		this.#intervalId = setInterval(this.onGenerationRestart, GenerationObserver.INTERVAL);
	}

	stopObserve()
	{
		if (this.#intervalId)
		{
			clearInterval(this.#intervalId);
			this.#intervalId = null;
		}
	}

	onGenerationRestart()
	{
		if (this.generationId <= 0)
		{
			return;
		}

		BX.ajax.runAction(
			'landing.api.copilot.executeGeneration',
			{
				data: {
					generationId: this.generationId,
				},
			},
		);

		this.restartObserve();
	}
}
