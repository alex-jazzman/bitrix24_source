/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports, booking_core, booking_const, booking_lib_slotRanges, booking_provider_service_resourceDialogService, booking_lib_resourcesDateCache, booking_lib_cell, booking_lib_duration) {
	'use strict';

	function getIntersectionBusySlots({
		busyRanges,
		resourceId,
		selectedDateTs,
		intersectingBookings,
		intersectingResourcesIds,
		overbookingMap
	}) {
		const intersectionBusySlots = [];
		for (const busyRange of busyRanges) {
			let fromTs = new Date(selectedDateTs).setMinutes(busyRange.from);
			const toTs = new Date(selectedDateTs).setMinutes(busyRange.to);
			const booking = intersectingBookings.find(intersectingBooking => intersectingBooking.id === busyRange.id);
			const intersectingResourceId = booking ? booking.resourcesIds.find(it => intersectingResourcesIds.includes(it)) : 0;
			const overbookingIntersections = getOverbookingIntersections(resourceId, busyRange.id, overbookingMap);
			const overbookingIntersectionBusySlots = overbookingIntersections.map(overbookingIntersection => {
				const overbookingFromTs = fromTs >= overbookingIntersection.dateFromTs ? fromTs : overbookingIntersection.dateFromTs;
				const overbookingToTs = toTs <= overbookingIntersection.dateToTs ? toTs : overbookingIntersection.dateToTs;
				if (overbookingFromTs === overbookingToTs) {
					return null;
				}
				return {
					id: `${resourceId}-${overbookingFromTs}-${overbookingToTs}`,
					fromTs: overbookingFromTs,
					toTs: overbookingToTs,
					resourceId,
					intersectingResourceId,
					type: booking_const.BusySlot.IntersectionOverbooking
				};
			}).filter(item => item !== null);
			overbookingIntersectionBusySlots.forEach(overbookingIntersectionBusySlot => {
				if (fromTs <= overbookingIntersectionBusySlot.fromTs) {
					intersectionBusySlots.push({
						id: booking_lib_cell.cellService.generateId(resourceId, fromTs, overbookingIntersectionBusySlot.fromTs),
						fromTs,
						toTs: overbookingIntersectionBusySlot.fromTs,
						resourceId,
						intersectingResourceId,
						type: booking_const.BusySlot.Intersection
					});
					fromTs = overbookingIntersectionBusySlot.toTs;
				}
			});
			intersectionBusySlots.push(...overbookingIntersectionBusySlots);
			if (fromTs !== toTs) {
				intersectionBusySlots.push({
					id: booking_lib_cell.cellService.generateId(resourceId, fromTs, toTs),
					fromTs,
					toTs,
					resourceId,
					intersectingResourceId,
					type: booking_const.BusySlot.Intersection
				});
			}
		}
		return intersectionBusySlots;
	}
	function getOverbookingIntersections(resourceId, bookingId, overbookingMap) {
		const overbooking = overbookingMap.get(bookingId);
		if (!overbooking) {
			return [];
		}
		return overbooking.items.filter(item => item.resourceId !== resourceId).flatMap(item => item.intersections);
	}

	const minBookingViewMs = 15 * 60 * 1000;
	class BusySlots {
		#busySlots = [];
		#getBookings(dateTs) {
			return booking_core.Core.getStore().getters[`${booking_const.Model.Bookings}/getByDateAndResources`](dateTs, this.#resourcesIds);
		}
		#getIntersectingBookings(resourcesIds, dateTs) {
			return booking_core.Core.getStore().getters[`${booking_const.Model.Bookings}/getByDateAndResources`](dateTs, resourcesIds);
		}
		get #isWeekMode() {
			return booking_core.Core.getStore().getters[`${booking_const.Model.Interface}/isWeekMode`];
		}
		get #selectedDateTs() {
			return booking_core.Core.getStore().getters[`${booking_const.Model.Interface}/selectedDateTs`];
		}
		get #selectedFirstDayPeriodTs() {
			return booking_core.Core.getStore().getters[`${booking_const.Model.Interface}/selectedFirstDayPeriodTs`];
		}
		get #offset() {
			return booking_core.Core.getStore().getters[`${booking_const.Model.Interface}/offset`];
		}
		get #timezone() {
			return booking_core.Core.getStore().getters[`${booking_const.Model.Interface}/timezone`];
		}
		get #resourcesIds() {
			return booking_core.Core.getStore().getters[`${booking_const.Model.Interface}/resourcesIds`];
		}
		get #intersections() {
			if (this.#draggedBooking) {
				const draggedIds = [...this.#draggedBooking.resourcesIds];
				const notDraggedIds = draggedIds.filter(id => id !== this.#draggedBookingResourceId);
				const resourceIntersections = Object.fromEntries([...this.#resourcesIds].map(id => [id, notDraggedIds]));
				const draggedIntersections = Object.fromEntries(notDraggedIds.map(id => [id, draggedIds]));
				return {
					...resourceIntersections,
					...draggedIntersections
				};
			}
			return booking_core.Core.getStore().getters[`${booking_const.Model.Interface}/intersections`];
		}
		get #draggedBooking() {
			return booking_core.Core.getStore().getters[`${booking_const.Model.Bookings}/getById`](this.#draggedBookingId) ?? null;
		}
		get #draggedBookingId() {
			return booking_core.Core.getStore().getters[`${booking_const.Model.Interface}/draggedBookingId`] || booking_core.Core.getStore().getters[`${booking_const.Model.Interface}/resizedBookingId`];
		}
		get #draggedBookingResourceId() {
			return booking_core.Core.getStore().getters[`${booking_const.Model.Interface}/draggedBookingResourceId`];
		}
		#getPeriodDates() {
			if (this.#isWeekMode) {
				return Array.from({
					length: booking_const.Grid.Duration.Week
				}, (_, i) => this.#selectedFirstDayPeriodTs + i * booking_lib_duration.Duration.getUnitDurations().d);
			}
			return [this.#selectedDateTs];
		}
		async loadBusySlots() {
			if (this.#resourcesIds.length === 0) {
				return;
			}
			const dates = this.#getPeriodDates();
			await this.#loadIntersections(dates);
			void booking_core.Core.getStore().dispatch(`${booking_const.Model.Interface}/clearDisabledBusySlots`);
			void booking_core.Core.getStore().dispatch(`${booking_const.Model.Interface}/clearBusySlots`);
			const resourcesWithIntersections = Object.keys(this.#intersections).flatMap(key => {
				const resourceId = Number(key);
				if (resourceId > 0) {
					return resourceId;
				}
				return this.#resourcesIds;
			});
			this.#busySlots = dates.flatMap(dateTs => [...this.#resourcesIds.flatMap(resourceId => this.#calculateOffHoursBusySlots(resourceId, dateTs)), ...resourcesWithIntersections.flatMap(resourceId => this.#calculateIntersectionBusySlots(resourceId, dateTs))]);
			return booking_core.Core.getStore().dispatch(`${booking_const.Model.Interface}/upsertBusySlotMany`, this.#busySlots);
		}
		async #loadIntersections(dates) {
			const selectedResourceIds = [...new Set(Object.values(this.#intersections).flat())];
			await Promise.all(dates.map(async dateTs => {
				const dateTsSeconds = dateTs / 1000;
				const loadedResourcesIds = new Set(booking_lib_resourcesDateCache.resourcesDateCache.getIdsByDateTs(dateTsSeconds));
				const idsToLoad = selectedResourceIds.filter(id => !loadedResourcesIds.has(id));
				await booking_provider_service_resourceDialogService.resourceDialogService.loadByIds(idsToLoad, dateTsSeconds);
			}));
		}
		#calculateOffHoursBusySlots(resourceId, dateTs) {
			const resource = this.#getResource(resourceId);
			if (resource.slotRanges.length === 0) {
				return [];
			}
			const weekDay = booking_const.DateFormat.WeekDays[new Date(dateTs + this.#offset).getDay()];
			const bookingRanges = this.#getBookings(dateTs).filter(booking => booking.resourcesIds.includes(resourceId)).map(booking => this.#calculateMinutesRange(booking, dateTs));
			const slotRanges = booking_lib_slotRanges.SlotRanges.applyTimezone(resource.slotRanges, dateTs, this.#timezone).filter(slotRange => slotRange.weekDays.includes(weekDay));
			const freeRanges = this.filterSlotRanges([...slotRanges, ...bookingRanges]);
			const busyRanges = [0, ...freeRanges.flatMap(({
				from,
				to
			}) => [from, to]), 24 * 60].reduce((acc, minutes, index) => {
				const chunkIndex = Math.floor(index / 2);
				acc[chunkIndex] ??= [];
				acc[chunkIndex].push(minutes);
				return acc;
			}, []);
			return busyRanges.filter(([from, to]) => to - from > 0).map(([from, to]) => {
				const fromTs = new Date(dateTs).setMinutes(from);
				const toTs = new Date(dateTs).setMinutes(to);
				const id = booking_lib_cell.cellService.generateId(resourceId, fromTs, toTs);
				const type = booking_const.BusySlot.OffHours;
				return {
					id,
					fromTs,
					toTs,
					resourceId,
					type
				};
			});
		}
		#calculateIntersectionBusySlots(resourceId, dateTs) {
			const resource = this.#getResource(resourceId);
			if (resource.slotRanges.length === 0) {
				return [];
			}
			const intersectingResourcesIds = [...(this.#intersections[0] ?? []), ...(this.#intersections[resourceId] ?? [])];
			const bookingRanges = this.#getBookings(dateTs).filter(booking => booking.resourcesIds.includes(resourceId)).map(booking => this.#calculateMinutesRange(booking, dateTs));
			const intersectingBookings = this.#getIntersectingBookings(intersectingResourcesIds, dateTs).filter(booking => {
				const notCurrentResource = !booking.resourcesIds.includes(resourceId);
				const isNotDragged = booking.id !== this.#draggedBookingId;
				return notCurrentResource && isNotDragged;
			});
			const intersectingBookingRanges = intersectingBookings.map(booking => this.#calculateMinutesRange(booking, dateTs)).filter(ir => {
				return bookingRanges.filter(br => br.from <= ir.from && ir.to <= br.to).length < 2;
			});
			if (intersectingBookingRanges.length === 0) {
				return [];
			}
			const busyRanges = intersectingBookingRanges.flatMap(intersectingRange => {
				return this.#subtractRanges(intersectingRange, bookingRanges);
			});
			return getIntersectionBusySlots({
				resourceId,
				busyRanges,
				overbookingMap: this.#getOverbookingMap(),
				selectedDateTs: dateTs,
				intersectingBookings,
				intersectingResourcesIds
			});
		}
		#calculateMinutesRange(booking, dateTs) {
			const date = new Date(dateTs);
			const dateFromTs = Math.max(date.getTime(), booking.dateFromTs) + this.#offset;
			const bookingViewToTs = Math.max(booking.dateToTs, booking.dateFromTs + minBookingViewMs);
			const dateToTs = Math.min(date.setDate(date.getDate() + 1), bookingViewToTs) + this.#offset;
			const dateFrom = new Date(dateFromTs);
			const dateTo = new Date(dateToTs);
			const to = dateTo.getHours() * 60 + dateTo.getMinutes();
			return {
				from: dateFrom.getHours() * 60 + dateFrom.getMinutes(),
				to: to === 0 ? 60 * 24 : to,
				id: booking.id
			};
		}
		#subtractRanges(range, bookingRanges) {
			let remainingRanges = [{
				...range
			}];
			bookingRanges.forEach(bookingRange => {
				remainingRanges = remainingRanges.flatMap(remainingRange => {
					if (this.#rangesOverlap(remainingRange, bookingRange)) {
						const parts = [];
						if (remainingRange.from < bookingRange.from) {
							parts.push({
								from: remainingRange.from,
								to: bookingRange.from,
								id: remainingRange.id
							});
						}
						if (remainingRange.to > bookingRange.to) {
							parts.push({
								from: bookingRange.to,
								to: remainingRange.to,
								id: remainingRange.id
							});
						}
						if (parts.length > 0) {
							return parts;
						}
					}
					return [remainingRange];
				});
			});
			return remainingRanges;
		}
		#rangesOverlap(range1, range2) {
			return range1.from < range2.to && range2.from < range1.to;
		}
		filterSlotRanges(slotRanges) {
			return slotRanges.map(({
				from,
				to
			}) => ({
				from,
				to
			})).sort((a, b) => a.from - b.from).reduce((acc, {
				from,
				to
			}) => {
				const last = acc.length - 1;
				if (acc[last] && acc[last].to >= from) {
					if (acc[last].to <= to) {
						acc[last].to = to;
					}
				} else {
					acc.push({
						from,
						to
					});
				}
				return acc;
			}, []).filter(({
				from,
				to
			}) => to - from > 0);
		}
		#getResource(resourceId) {
			return booking_core.Core.getStore().getters[`${booking_const.Model.Resources}/getById`](resourceId);
		}
		#getOverbookingMap() {
			return booking_core.Core.getStore().getters[`${booking_const.Model.Bookings}/overbookingMap`];
		}
	}
	const busySlots = new BusySlots();

	exports.busySlots = busySlots;

})(this.BX.Booking.Lib = this.BX.Booking.Lib || {}, BX.Booking, BX.Booking.Const, BX.Booking.Lib, BX.Booking.Provider.Service, BX.Booking.Lib, BX.Booking.Lib, BX.Booking.Lib);
//# sourceMappingURL=busy-slots.bundle.js.map
