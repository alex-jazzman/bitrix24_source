/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports) {
	'use strict';

	function normalizeSeriesUserId(userId) {
		return Number.isFinite(userId) ? Number(userId) : null;
	}
	function buildSeriesKey({
		target,
		userId
	}) {
		const seriesUserId = normalizeSeriesUserId(userId);
		return seriesUserId === null ? target : `${target}:${seriesUserId}`;
	}

	const MAX_HISTORY_ENTRIES = 100;
	const ReconnectTarget = {
		MediaServer: 'mediaserver',
		Peer: 'peer'
	};
	const ReconnectOutcome = {
		Success: 'success',
		NotConnected: 'not_connected',
		NotRecovered: 'not_recovered',
		Escalated: 'escalated'
	};

	class ReconnectHistory {
		#history = [];
		#series = new Map();
		startEntry(params) {
			const {
				target,
				userId,
				reason = null
			} = params ?? {};
			if (!target) {
				return;
			}
			if (target === ReconnectTarget.Peer && !Number.isFinite(userId)) {
				console.error('[reconnect-history] startEntry for a peer target requires a numeric userId, got ' + `${String(userId)}: the attempt is dropped. Without the id every interlocutor shares one series, ` + 'so their reconnects would be counted and closed together.');
				return;
			}
			const key = {
				target,
				userId
			};
			this.#endOpenEntry(key, false);
			const series = this.#startAttempt(key, reason);
			this.#history.push({
				target,
				userId: series.userId,
				initial: series.attempts === 1,
				reason,
				started: Date.now(),
				ended: null,
				last: false
			});
			this.#trimIfNeeded();
		}
		updateLastEntry(params) {
			const {
				target,
				userId,
				isSuccessful = false
			} = params ?? {};
			if (!target) {
				return false;
			}
			const key = {
				target,
				userId
			};
			const ended = this.#endOpenEntry(key, isSuccessful);
			if (isSuccessful) {
				this.#recordOutcome(key, ReconnectOutcome.Success);
			}
			return ended;
		}
		closeSeries(params) {
			const {
				target,
				userId,
				outcome
			} = params ?? {};
			if (!target || !outcome) {
				return false;
			}
			const key = {
				target,
				userId
			};
			if (!this.#recordOutcome(key, outcome)) {
				return false;
			}
			this.#endOpenEntry(key, outcome === ReconnectOutcome.Success);
			return true;
		}
		isSeriesOpen(key) {
			const series = this.#findSeries(key);
			return series !== null && series.outcome === null;
		}
		getSeries(key) {
			const series = this.#findSeries(key);
			return series ? {
				...series
			} : null;
		}
		getOpenSeries() {
			const openSeries = [];
			this.#series.forEach(series => {
				if (series.outcome === null) {
					openSeries.push({
						...series
					});
				}
			});
			return openSeries;
		}
		getHistory() {
			return this.#history.map(entry => ({
				...entry
			}));
		}
		clear() {
			this.#history.length = 0;
			this.#series.clear();
		}
		#findSeries(key) {
			const {
				target,
				userId
			} = key ?? {};
			if (!target) {
				return null;
			}
			return this.#series.get(buildSeriesKey({
				target,
				userId
			})) ?? null;
		}
		#startAttempt(key, reason) {
			const openSeries = this.#findSeries(key);
			if (openSeries && openSeries.outcome === null) {
				openSeries.attempts++;
				return openSeries;
			}
			const series = {
				target: key.target,
				userId: normalizeSeriesUserId(key.userId),
				reason,
				startedAt: Date.now(),
				attempts: 1,
				outcome: null,
				endedAt: null
			};
			this.#series.set(buildSeriesKey(key), series);
			return series;
		}
		#recordOutcome(key, outcome) {
			const series = this.#findSeries(key);
			if (!series || series.outcome !== null) {
				return false;
			}
			series.outcome = outcome;
			series.endedAt = Date.now();
			return true;
		}
		#endOpenEntry(key, isSuccessful) {
			const userId = normalizeSeriesUserId(key.userId);
			for (let i = this.#history.length - 1; i >= 0; i--) {
				const entry = this.#history[i];
				if (entry.target !== key.target || entry.userId !== userId) {
					continue;
				}
				if (entry.ended !== null) {
					return false;
				}
				entry.ended = Date.now();
				entry.last = isSuccessful;
				return true;
			}
			return false;
		}
		#trimIfNeeded() {
			while (this.#history.length > MAX_HISTORY_ENTRIES) {
				this.#history.shift();
			}
		}
	}

	exports.ReconnectHistory = ReconnectHistory;
	exports.ReconnectOutcome = ReconnectOutcome;
	exports.ReconnectTarget = ReconnectTarget;
	exports.buildSeriesKey = buildSeriesKey;

})(this.BX.Call.Lib = this.BX.Call.Lib || {});
//# sourceMappingURL=reconnect-history.bundle.js.map
