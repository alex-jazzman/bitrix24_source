/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports) {
	'use strict';

	class RequestRevisionGuard {
		#revisions = new Map();
		next(entityId) {
			const nextRevision = (this.#revisions.get(entityId) ?? 0) + 1;
			this.#revisions.set(entityId, nextRevision);
			return nextRevision;
		}
		isActual(entityId, revision) {
			return this.#revisions.get(entityId) === revision;
		}
	}

	exports.RequestRevisionGuard = RequestRevisionGuard;

})(this.BX.Booking.Lib = this.BX.Booking.Lib || {});
//# sourceMappingURL=request-revision-guard.bundle.js.map
