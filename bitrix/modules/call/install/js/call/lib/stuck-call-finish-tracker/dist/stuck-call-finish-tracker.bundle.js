/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports) {
	'use strict';

	class StuckCallFinishTracker {
		static DEBOUNCE_MS = 3000;
		_scheduledKeys = new Set();
		_pendingTimers = new Map();
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
	}
	const stuckCallFinishTracker = new StuckCallFinishTracker();

	exports.StuckCallFinishTracker = StuckCallFinishTracker;
	exports.stuckCallFinishTracker = stuckCallFinishTracker;

})(this.BX.Call.Lib = this.BX.Call.Lib || {});
//# sourceMappingURL=stuck-call-finish-tracker.bundle.js.map
