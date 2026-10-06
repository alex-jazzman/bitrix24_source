/**
 * @module more-menu/block/company/personal-account/src/pull/pull-handler
 */
jn.define('more-menu/block/company/personal-account/src/pull/pull-handler', (require, exports, module) => {
	const MODULE_ID = 'humanresources';
	// Push is the primary channel; polling is a rare background fallback.
	const POLL_INTERVAL_MS = 15000;
	// Overall wait before giving up on a silent 1C.
	const TIMEOUT_MS = 90000;

	const JobStatus = {
		DONE: 'DONE',
		EXPIRED: 'EXPIRED',
		CANCELED: 'CANCELED',
	};

	/**
	 * Arbitrates one async step (PIN wait or document wait): subscribes to a Pull
	 * command (primary) and runs a rare getResult poll (fallback) in parallel. The
	 * first channel that reaches a terminal result wins - the other is silenced
	 * (unsubscribe + stop polling), so the step never completes twice. Push taskId
	 * is matched against the tracked one.
	 *
	 * @class PullHandler
	 */
	class PullHandler
	{
		/**
		 * @param {object} options
		 * @param {object} options.api - SalaryVacationApi instance (for getResult)
		 * @param {number} options.taskId
		 * @param {string} options.command - Pull command to subscribe to
		 * @param {number} options.companyId
		 * @param {number} options.employeeId
		 * @param {function(object): void} options.onDone - terminal DONE result
		 * @param {function(string): void} options.onError - EXPIRED | timeout
		 */
		constructor(options)
		{
			this.api = options.api;
			this.taskId = options.taskId;
			this.command = options.command;
			this.companyId = options.companyId;
			this.employeeId = options.employeeId;
			this.onDone = options.onDone;
			this.onError = options.onError;

			this.finished = false;
			this.unsubscribe = null;
			this.pollTimer = null;
			this.deadline = 0;
		}

		start()
		{
			this.finished = false;
			this.deadline = Date.now() + TIMEOUT_MS;
			this.unsubscribe = this.#subscribe();
			// Probe once up front: a job already terminal (step reopened inside the push
			// throttling window, no new push coming) finishes now instead of after a full
			// poll interval. A non-terminal result just falls through to push + polling.
			this.#probe();
			this.#scheduleNextPoll();
		}

		/**
		 * Silences both channels without invoking callbacks (unmount / channel switch).
		 */
		stop()
		{
			this.#finish();
		}

		#subscribe()
		{
			// BX.PULL is a runtime global in the mobile shell; polling covers its absence.
			if (typeof BX === 'undefined' || !BX.PULL)
			{
				return null;
			}

			return BX.PULL.subscribe({
				moduleId: MODULE_ID,
				command: this.command,
				callback: (params) => this.#handlePush(params),
			});
		}

		#handlePush(params)
		{
			if (this.finished || Number(params?.taskId) !== Number(this.taskId))
			{
				return;
			}

			this.api
				.getResult({ taskId: this.taskId, companyId: this.companyId, employeeId: this.employeeId })
				.then((result) => this.#consume(result))
				.catch(() => {});
		}

		#probe()
		{
			if (this.finished)
			{
				return;
			}

			this.api
				.getResult({ taskId: this.taskId, companyId: this.companyId, employeeId: this.employeeId })
				.then((result) => this.#consume(result))
				// A failed probe is not fatal - push and polling still cover the wait.
				.catch(() => {});
		}

		#scheduleNextPoll()
		{
			if (this.finished)
			{
				return;
			}

			if (this.pollTimer)
			{
				clearTimeout(this.pollTimer);
			}

			this.pollTimer = setTimeout(() => this.#pollTick(), POLL_INTERVAL_MS);
		}

		#pollTick()
		{
			if (this.finished)
			{
				return;
			}

			if (Date.now() >= this.deadline)
			{
				this.#finishError('timeout');

				return;
			}

			this.api
				.getResult({ taskId: this.taskId, companyId: this.companyId, employeeId: this.employeeId })
				.then((result) => this.#consume(result))
				// A single network error on a tick is not fatal - keep waiting until the deadline.
				.catch(() => {})
				.finally(() => this.#scheduleNextPoll());
		}

		#consume(result)
		{
			if (this.finished)
			{
				return;
			}

			const status = result?.status;

			if (status === JobStatus.DONE)
			{
				this.#resolve(result);
			}
			else if (status === JobStatus.EXPIRED)
			{
				this.#finishError('expired');
			}
			else if (status === JobStatus.CANCELED)
			{
				// Canceled by 1C - a terminal refusal, fail fast like EXPIRED.
				this.#finishError('canceled');
			}
			// Otherwise not terminal yet - keep waiting (polling continues).
		}

		#resolve(result)
		{
			if (this.finished)
			{
				return;
			}

			this.#finish();
			this.onDone(result);
		}

		#finishError(reason)
		{
			if (this.finished)
			{
				return;
			}

			this.#finish();
			this.onError(reason);
		}

		#finish()
		{
			this.finished = true;

			if (this.unsubscribe)
			{
				this.unsubscribe();
				this.unsubscribe = null;
			}

			if (this.pollTimer)
			{
				clearTimeout(this.pollTimer);
				this.pollTimer = null;
			}
		}
	}

	module.exports = { PullHandler };
});
