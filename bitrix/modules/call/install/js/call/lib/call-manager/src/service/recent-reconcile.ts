type GetActiveResponse = {
	data?: {
		calls?: Record<string, Object>,
	},
};

type PullStatusData = {
	status?: string,
};

type RecentReconcileDeps = {
	// Subscribes to pull connection status; returns false when pull is unavailable on this page.
	subscribePullStatus: (handler: (data: PullStatusData) => void) => boolean,
	// Pull status values to compare against (BX.PullClient.PullStatus).
	pullStatus: { online: string, offline: string },
	// Fetches active calls: lean by default, full (USERS/USER_DATA) when withUserData is set.
	fetchActiveCalls: (withUserData: boolean) => Promise<GetActiveResponse>,
	// True when the snapshot holds a call recent does not know about.
	hasMissingActiveCalls: (calls: Object) => boolean,
	// Instantiates the calls missing from recent; additive, never removes.
	addMissingActiveCalls: (calls: Object) => void,
	// Injected clock, so the throttle window is testable without waiting it out.
	now: () => number,
	// Minimum interval between two server passes.
	minIntervalMs: number,
	onWarn: (message: string, ...args: unknown[]) => void,
};

// Reconciles recent with the server after a pull outage: while the socket was down the client
// missed the pull events that put active calls into recent, so a card can be absent with no
// event left to deliver it. Runs on the offline -> online front only, throttled.
export class RecentReconcile
{
	#deps: RecentReconcileDeps;
	// Starts offline: the first Online status is a front and reconciles, which also covers a page
	// that loaded while pull was down.
	#pullOffline: boolean = true;
	#inFlight: boolean = false;
	#pending: boolean = false;
	#lastRunAt: number = 0;

	constructor(deps: RecentReconcileDeps)
	{
		this.#deps = deps;
	}

	start(): void
	{
		if (!this.#deps.subscribePullStatus((data) => this.#onPullStatusChange(data)))
		{
			this.#deps.onWarn('RecentReconcile: pull is unavailable, skipping pull status subscription');
		}
	}

	#onPullStatusChange(data: PullStatusData): void
	{
		if (data.status === this.#deps.pullStatus.online)
		{
			// Reconcile only on the offline -> online front to dedupe status jitter.
			if (this.#pullOffline)
			{
				this.#pullOffline = false;
				void this.reconcile();
			}

			return;
		}

		if (data.status === this.#deps.pullStatus.offline)
		{
			this.#pullOffline = true;
		}
	}

	async reconcile(): Promise<void>
	{
		if (this.#inFlight)
		{
			// A pass is already running; remember to run once more after it settles so a front
			// arriving mid-flight is not lost.
			this.#pending = true;

			return;
		}

		const sinceLast = this.#deps.now() - this.#lastRunAt;
		if (sinceLast < this.#deps.minIntervalMs)
		{
			// Within the cooldown window: defer a single run for the remaining interval instead of
			// dropping this front.
			if (!this.#pending)
			{
				this.#pending = true;
				setTimeout(() => {
					this.#pending = false;
					void this.reconcile();
				}, this.#deps.minIntervalMs - sinceLast);
			}

			return;
		}

		this.#inFlight = true;

		try
		{
			// Lean first: the lightweight snapshot already carries UUID, enough to detect calls
			// missing from recent. Usually nothing is missing, so the heavy USERS/USER_DATA payload
			// is not pulled at all.
			const leanResponse = await this.#deps.fetchActiveCalls(false);
			const leanCalls = leanResponse?.data?.calls ?? {};

			if (this.#deps.hasMissingActiveCalls(leanCalls))
			{
				const fullResponse = await this.#deps.fetchActiveCalls(true);
				this.#deps.addMissingActiveCalls(fullResponse?.data?.calls ?? {});
			}

			// Advance the throttle only on a successful pass, so a failed request does not burn the
			// cooldown window.
			this.#lastRunAt = this.#deps.now();
		}
		catch (error)
		{
			this.#deps.onWarn('RecentReconcile: recent reconcile on pull online failed', error);
		}
		finally
		{
			this.#inFlight = false;

			// Handle at most one queued run per release to avoid an unbounded loop.
			if (this.#pending)
			{
				this.#pending = false;
				void this.reconcile();
			}
		}
	}
}
