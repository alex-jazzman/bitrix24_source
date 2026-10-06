/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports) {
	'use strict';

	const MAX_HISTORY_ENTRIES = 100;
	class ReconnectHistory {
		#history = [];
		#hasActiveInitialEntry = false;
		startEntry(reason, target, userId) {
			if (!target) {
				return;
			}
			this.updateLastEntry(target);
			let finalReason;
			if (userId !== undefined) {
				finalReason = reason ? `${reason} on user ${userId}` : `Reconnection without a reason on user ${userId}`;
			} else {
				finalReason = reason;
			}
			let initial = false;
			if (!this.#hasActiveInitialEntry) {
				this.#hasActiveInitialEntry = true;
				initial = true;
			}
			this.#history.push({
				target,
				initial,
				reason: finalReason,
				started: Date.now(),
				ended: null,
				last: false
			});
			this.#trimIfNeeded();
		}
		updateLastEntry(target, isSuccessful = false) {
			if (!target) {
				return false;
			}
			const reconnectHistoryLength = this.#history.length;
			if (reconnectHistoryLength === 0) {
				return false;
			}
			if (isSuccessful) {
				this.#hasActiveInitialEntry = false;
			}
			for (let i = reconnectHistoryLength - 1; i >= 0; i--) {
				const entry = this.#history[i];
				if (entry.target === target && entry.ended === null) {
					entry.ended = Date.now();
					entry.last = isSuccessful;
					return true;
				} else if (entry.target === target && entry.ended !== null) {
					return false;
				}
			}
			return false;
		}
		getHistory() {
			return this.#history.map(entry => ({
				...entry
			}));
		}
		clear() {
			this.#history.length = 0;
			this.#hasActiveInitialEntry = false;
		}
		#trimIfNeeded() {
			const hadActiveInitialEntry = this.#hasActiveInitialEntry;
			while (this.#history.length > MAX_HISTORY_ENTRIES) {
				this.#history.shift();
			}
			const hasActiveInitialEntry = this.#history.some(entry => entry.initial);
			if (this.#history.length > 0 && hadActiveInitialEntry && !hasActiveInitialEntry) {
				this.#history[0].initial = true;
			}
		}
	}

	const ReconnectTarget = {
		Sdk: 'sdk',
		Provider: 'provider'
	};

	exports.ReconnectHistory = ReconnectHistory;
	exports.ReconnectTarget = ReconnectTarget;

})(this.BX.Call.Lib = this.BX.Call.Lib || {});
//# sourceMappingURL=reconnect-history.bundle.js.map
