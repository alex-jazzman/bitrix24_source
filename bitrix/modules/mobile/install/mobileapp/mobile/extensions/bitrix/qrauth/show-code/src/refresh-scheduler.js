/**
 * @module qrauth/show-code/src/refresh-scheduler
 */
jn.define('qrauth/show-code/src/refresh-scheduler', (require, exports, module) => {
	const MILLISECONDS_IN_SECOND = 1000;
	const TICK_INTERVAL = MILLISECONDS_IN_SECOND;

	/**
	 * @class RefreshScheduler
	 */
	class RefreshScheduler
	{
		/**
		 * @param {{ onRefresh: function(): void, onTick?: function(number): void }} params
		 */
		constructor({ onRefresh, onTick })
		{
			this.onRefresh = onRefresh;
			this.onTick = onTick;
			this.isPaused = false;
			this.deadlineAt = null;
			this.timer = null;
			this.tickTimer = null;
		}

		/**
		 * @param {number} ttlSeconds
		 */
		start(ttlSeconds)
		{
			this.stop();

			const ttlMilliseconds = ttlSeconds * MILLISECONDS_IN_SECOND;

			this.deadlineAt = Date.now() + ttlMilliseconds;
			this.timer = setInterval(() => this.#onDeadline(), ttlMilliseconds);
			this.tickTimer = setInterval(() => this.#onTick(), TICK_INTERVAL);

			this.#onTick();
		}

		pause()
		{
			this.isPaused = true;
			this.stop();
		}

		resume()
		{
			this.isPaused = false;
			this.onRefresh();
		}

		stop()
		{
			if (this.timer)
			{
				clearInterval(this.timer);
				this.timer = null;
			}

			if (this.tickTimer)
			{
				clearInterval(this.tickTimer);
				this.tickTimer = null;
			}
		}

		/**
		 * @return {number}
		 */
		getSecondsLeft()
		{
			if (this.deadlineAt === null)
			{
				return 0;
			}

			return Math.max(0, Math.ceil((this.deadlineAt - Date.now()) / MILLISECONDS_IN_SECOND));
		}

		#onDeadline()
		{
			if (this.isPaused)
			{
				return;
			}

			this.onRefresh();
		}

		#onTick()
		{
			if (this.isPaused)
			{
				return;
			}

			this.onTick?.(this.getSecondsLeft());
		}
	}

	module.exports = { RefreshScheduler };
});
