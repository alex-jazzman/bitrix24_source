/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports) {
	'use strict';

	class ResourcesDateCache {
		#cache = {};
		upsertIds(dateTs, ids) {
			const currentIds = this.getIdsByDateTs(dateTs);
			const newIds = ids.filter(id => !currentIds.includes(id));
			this.#cache[dateTs].push(...newIds);
		}
		isDateLoaded(dateTs, ids) {
			const loadedResourcesIds = this.getIdsByDateTs(dateTs);
			return ids.every(id => loadedResourcesIds.includes(id));
		}
		getIdsByDateTs(dateTs) {
			this.#cache[dateTs] ??= [];
			return this.#cache[dateTs];
		}
	}
	const resourcesDateCache = new ResourcesDateCache();

	exports.resourcesDateCache = resourcesDateCache;

})(this.BX.Booking.Lib = this.BX.Booking.Lib || {});
//# sourceMappingURL=resources-date-cache.bundle.js.map
