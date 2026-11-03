import { Runtime } from 'main.core';

const QUEUE_EXTENSIONS = ['ui.banner-dispatcher', 'ui.auto-launch'];
const TOUR_QUEUE_ID = 'im-folder-all-onboarding-tour';

const RequestState = {
	idle: 'idle',
	loading: 'loading',
	queued: 'queued',
	running: 'running',
	finished: 'finished',
	cancelled: 'cancelled',
};

export class TourLauncher
{
	#state: $Values<typeof RequestState> = RequestState.idle;
	// ui.banner-dispatcher keeps the queued callback for the life of the page, so the tour is let go once over
	#show: ?() => void = null;
	#onDone: ?() => void = null;
	#autoLauncher: ?{ unregister: (id: string) => void } = null;

	async request(show: () => void): Promise<void>
	{
		if (this.#state !== RequestState.idle)
		{
			return;
		}

		this.#state = RequestState.loading;
		this.#show = show;

		try
		{
			const { BannerDispatcher, AutoLauncher } = await Runtime.loadExtension(QUEUE_EXTENSIONS);
			if (this.#state === RequestState.cancelled)
			{
				return;
			}

			this.#autoLauncher = AutoLauncher;
			if (!AutoLauncher.isEnabled())
			{
				AutoLauncher.enable();
			}

			// Set before queueing: an item started right inside toQueue() must stay running
			this.#state = RequestState.queued;
			BannerDispatcher.high.toQueue((done: () => void) => this.#launch(done), {
				id: TOUR_QUEUE_ID,
				forceShowOnTop: true,
			});
		}
		catch
		{
			this.#state = RequestState.finished;
		}
	}

	finish(): void
	{
		if (this.#state === RequestState.running)
		{
			this.#release();
		}
	}

	cancel(): void
	{
		if (this.#state === RequestState.running)
		{
			this.#release();

			return;
		}

		if (this.#state === RequestState.queued)
		{
			this.#autoLauncher.unregister(TOUR_QUEUE_ID);
			this.#autoLauncher = null;
		}

		if (this.#state !== RequestState.finished)
		{
			this.#state = RequestState.cancelled;
		}

		this.#show = null;
	}

	#launch(done: () => void): {}
	{
		this.#onDone = done;
		if (this.#state === RequestState.cancelled)
		{
			this.#release();

			return {};
		}

		this.#state = RequestState.running;

		try
		{
			this.#show();
		}
		catch
		{
			this.#release();
		}

		// LaunchItemCallback must return a non-nullish value; the launcher ignores it
		return {};
	}

	#release(): void
	{
		if (!this.#onDone)
		{
			return;
		}

		const done = this.#onDone;
		this.#onDone = null;
		this.#show = null;
		this.#state = RequestState.finished;
		done();
	}
}
