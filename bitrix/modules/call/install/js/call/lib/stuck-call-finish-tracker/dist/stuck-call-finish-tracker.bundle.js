/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports) {
	'use strict';

	class StuckCallFinishTracker {
		static DEBOUNCE_MS = 3000;
		static MAX_CLOSED_UUIDS = 100;
		_scheduledKeys = new Set();
		_pendingTimers = new Map();
		_closedUuids = new Set();
		_keyOf(callId, callUuid) {
			return `${callUuid || ''}|${callId || ''}`;
		}
		scheduleFinish(callId, callUuid, fire) {
			const key = this._keyOf(callId, callUuid);
			if (this._scheduledKeys.has(key)) {
				return false;
			}
			this._scheduledKeys.add(key);
			const timer = setTimeout(() => {
				this._pendingTimers.delete(key);
				Promise.resolve().then(() => fire()).finally(() => this._scheduledKeys.delete(key));
			}, StuckCallFinishTracker.DEBOUNCE_MS);
			this._pendingTimers.set(key, timer);
			return true;
		}
		cancelPending(callId, callUuid) {
			const key = this._keyOf(callId, callUuid);
			const timer = this._pendingTimers.get(key);
			if (timer !== undefined) {
				clearTimeout(timer);
				this._pendingTimers.delete(key);
			}
			this._scheduledKeys.delete(key);
		}
		markClosed(callUuid) {
			if (!callUuid) {
				return;
			}
			this._closedUuids.delete(callUuid);
			this._closedUuids.add(callUuid);
			while (this._closedUuids.size > StuckCallFinishTracker.MAX_CLOSED_UUIDS) {
				const oldest = this._closedUuids.values().next().value;
				if (oldest === undefined) {
					break;
				}
				this._closedUuids.delete(oldest);
			}
		}
		isRecentlyClosed(callUuid) {
			return callUuid ? this._closedUuids.has(callUuid) : false;
		}
	}
	const stuckCallFinishTracker = new StuckCallFinishTracker();

	exports.StuckCallFinishTracker = StuckCallFinishTracker;
	exports.stuckCallFinishTracker = stuckCallFinishTracker;

})(this.BX.Call.Lib = this.BX.Call.Lib || {});
//# sourceMappingURL=stuck-call-finish-tracker.bundle.js.map
