/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
(function (exports, main_core) {
	'use strict';

	const POLL_INTERVAL_MS = 5000;
	const MAX_CONSECUTIVE_ERRORS = 5;
	const STATUS_ACTION = 'landing.api.presetemptystate.status';
	const PERMANENT_ERROR_CODES = ['ACCESS_DENIED', 'EXTRANET_IS_NOT_ALLOWED'];
	// the component template marks the placeholder container with the window it has left
	const REMAINING_ATTRIBUTE = 'data-preset-empty-state-remaining';

	/**
	 * Watches the preset empty state placeholder shown on the site list page.
	 *
	 * While the placeholder is on the screen the observer polls the portal status and reloads the page
	 * as soon as the waiting window is over: either the AI feature became available, or the portal is
	 * not in the preset waiting state anymore, or the local deadline has expired.
	 */
	class PresetEmptyStateObserver {
		#deadlineTs = 0;
		#intervalId = null;
		#isFinished = false;
		#isRequestInFlight = false;
		#isPollingStopped = false;
		#consecutiveErrorCount = 0;
		constructor(options = {}) {
			this.remainingSeconds = Math.max(0, parseInt(options.remainingSeconds, 10) || 0);
			this.tick = this.tick.bind(this);
		}
		observe() {
			// the observer lives as a page singleton: once the waiting is over it stays over, otherwise
			// a repeated observe() would revive a finished observer and poll forever
			if (this.#isFinished || this.#intervalId) {
				return;
			}

			// the waiting window belongs to the first observe(): a repeated one may restart the timer,
			// but never moves the deadline further away
			if (this.#deadlineTs === 0) {
				this.#deadlineTs = Date.now() + this.remainingSeconds * 1000;
			}
			this.#intervalId = setInterval(this.tick, POLL_INTERVAL_MS);
		}
		stopObserve() {
			if (this.#intervalId) {
				clearInterval(this.#intervalId);
				this.#intervalId = null;
			}
		}
		tick() {
			// the expired window is the only way out of the placeholder, so it is checked before anything
			// that may skip the tick: neither a hidden tab nor a point that stopped answering may cost
			// the user the reload
			if (Date.now() >= this.#deadlineTs) {
				this.finish();
				return;
			}

			// the point is not asked anymore - it keeps failing or refuses for good - but the tick above
			// still owes the reload
			if (this.#isPollingStopped) {
				return;
			}

			// a hidden tab waits in silence: nobody looks at the placeholder, so nobody needs the poll.
			// The waiting resumes by itself on the first tick after the tab is looked at again
			if (this.isPageHidden()) {
				return;
			}

			// a slow answer must not get the next request piled on top of it
			if (this.#isRequestInFlight) {
				return;
			}
			this.#isRequestInFlight = true;
			main_core.ajax.runAction(STATUS_ACTION, {
				data: {}
			}).then(response => {
				this.#isRequestInFlight = false;
				this.#consecutiveErrorCount = 0;
				const status = response?.data ?? {};
				if (status.aiAvailable === true || status.actual !== true) {
					this.finish();
				}
			}).catch(error => {
				this.#isRequestInFlight = false;
				this.handleRequestError(error);
			});
		}
		isPageHidden() {
			return document.hidden === true;
		}
		handleRequestError(error) {
			// a permanent refusal never turns into an answer: no access right to the section, an extranet
			// user, an expired session. Asking it to the end of the window is pointless - but only the
			// questions are given up on, never the waiting: the deadline still owes the user the reload.
			// By that time the server is out of the preset window and answers with the usual site list
			// or with the plain access refusal, and either of them is better than a placeholder that
			// stays on the screen until the page is navigated away by hand
			if (this.isPermanentError(error)) {
				this.stopPolling();
				return;
			}

			// a single network error must not stop the waiting, but a point that keeps failing is not
			// worth the whole window either. Only the requests are given up on here: the network comes
			// back or it does not, and either way the user must leave the placeholder by the deadline
			this.#consecutiveErrorCount += 1;
			if (this.#consecutiveErrorCount >= MAX_CONSECUTIVE_ERRORS) {
				this.stopPolling();
			}
		}

		// the questions stop, the waiting does not: the tick stays alive, and the expired window still
		// reloads the page. Both ways out of the polling lead here - the point that keeps failing and
		// the point that refuses for good
		stopPolling() {
			this.#isPollingStopped = true;
		}
		isPermanentError(error) {
			if (error?.status === 'denied') {
				return true;
			}
			const errors = Array.isArray(error?.errors) ? error.errors : [];
			return errors.some(item => PERMANENT_ERROR_CODES.includes(String(item?.code ?? '')));
		}
		finish() {
			if (this.#isFinished) {
				return;
			}
			this.#isFinished = true;
			this.stopObserve();
			this.reloadPage();
		}
		reloadPage() {
			document.location.reload();
		}
	}

	// set on the container once its observer is running, so a repeated bootstrap is a no-op
	const STARTED_ATTRIBUTE = 'data-preset-empty-state-started';

	/**
	 * Starts the observer over the placeholder rendered by the component template, taking the window
	 * left from the container the template marks. The page carries no start-up code of its own, so the
	 * markup is the whole contract between the two.
	 */
	function bootstrapPresetEmptyState() {
		const container = document.querySelector(`[${REMAINING_ATTRIBUTE}]`);

		// a second observer over the same placeholder would poll the point twice as often
		if (!container || container.hasAttribute(STARTED_ATTRIBUTE)) {
			return null;
		}
		container.setAttribute(STARTED_ATTRIBUTE, '');
		const observer = new PresetEmptyStateObserver({
			remainingSeconds: main_core.Text.toInteger(container.getAttribute(REMAINING_ATTRIBUTE))
		});
		observer.observe();
		return observer;
	}
	main_core.Event.ready(bootstrapPresetEmptyState);

	exports.MAX_CONSECUTIVE_ERRORS = MAX_CONSECUTIVE_ERRORS;
	exports.PERMANENT_ERROR_CODES = PERMANENT_ERROR_CODES;
	exports.POLL_INTERVAL_MS = POLL_INTERVAL_MS;
	exports.PresetEmptyStateObserver = PresetEmptyStateObserver;
	exports.REMAINING_ATTRIBUTE = REMAINING_ATTRIBUTE;
	exports.STARTED_ATTRIBUTE = STARTED_ATTRIBUTE;
	exports.STATUS_ACTION = STATUS_ACTION;
	exports.bootstrapPresetEmptyState = bootstrapPresetEmptyState;

})(this.BX.Landing.SiteList = this.BX.Landing.SiteList || {}, BX);
//# sourceMappingURL=preset-empty-state.bundle.js.map
