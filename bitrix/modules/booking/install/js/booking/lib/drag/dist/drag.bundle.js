/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports, booking_lib_duration, main_core, main_popup, main_date, ui_draganddrop_draggable, booking_const, booking_core, booking_lib_busySlots, booking_component_nonDraggableBookingPopup, booking_lib_analytics, booking_lib_limit, booking_provider_service_bookingService, booking_provider_service_waitListService, booking_lib_isRealId) {
	'use strict';

	const MaxInteractionBookingDurationsMs = 12 * booking_lib_duration.Duration.getUnitDurations().H;

	class DragActions {
		async moveBookingOnGrid({
			bookingId,
			resourceId,
			cell
		}) {
			const booking = this.#store.getters[`${booking_const.Model.Bookings}/getById`](bookingId);
			if (!booking) {
				return;
			}
			if (cell.fromTs === booking.dateFromTs && cell.toTs === booking.dateToTs && cell.resourceId === resourceId) {
				return;
			}
			const resourceIds = booking.resourcesIds.includes(cell.resourceId) ? booking.resourcesIds : [cell.resourceId, ...booking.resourcesIds.filter(id => id !== resourceId)];
			const uniqueResourceIds = [...new Set(resourceIds)];
			const isMultiResourcesFeatureEnabled = this.#store.state[booking_const.Model.Interface].enabledFeature.bookingMulti;
			if (uniqueResourceIds.length > 1 && !isMultiResourcesFeatureEnabled) {
				void booking_lib_limit.limit.show(booking_const.LimitFeatureId.MultiResources);
				return;
			}
			await booking_provider_service_bookingService.bookingService.update({
				id: booking.id,
				dateFromTs: cell.fromTs,
				dateToTs: cell.toTs,
				resourcesIds: uniqueResourceIds,
				timezoneFrom: booking.timezoneFrom,
				timezoneTo: booking.timezoneTo
			});
		}
		async moveBookingToWaitList(bookingId) {
			const booking = this.#store.getters[`${booking_const.Model.Bookings}/getById`](bookingId);
			if (!booking) {
				return;
			}
			const editingState = {
				editingBookingId: this.#editingBookingId,
				editingWaitListItemId: this.#editingWaitListItemId
			};
			await this.#store.dispatch(`${booking_const.Model.Interface}/addDeletingBooking`, bookingId);
			if (this.#editingBookingId === bookingId) {
				await this.#setEditingWaitListItemId(bookingId);
			}
			const result = await booking_provider_service_waitListService.waitListService.createFromBooking(bookingId, {
				id: this.#getTemporaryItemId(),
				clients: booking.clients,
				primaryClient: booking.primaryClient,
				externalData: booking.externalData,
				createdAt: Date.now(),
				updatedAt: Date.now()
			});
			if (!result.success || !result.waitListItem) {
				await this.#rollbackMoveBookingToWaitList({
					bookingId,
					editingState
				});
				return;
			}
			booking_lib_analytics.BookingAnalytics.sendAddWaitListItem();
			if (this.#editingWaitListItemId === bookingId) {
				await this.#setEditingWaitListItemId(result.waitListItem.id);
			}
		}
		async createBookingFromWaitListItem({
			waitListItemId,
			cell
		}) {
			const waitListItem = this.#store.getters[`${booking_const.Model.WaitList}/getById`](waitListItemId);
			if (!waitListItem) {
				return;
			}
			const editingState = {
				editingBookingId: this.#editingBookingId,
				editingWaitListItemId: this.#editingWaitListItemId
			};
			const resource = this.#store.getters[`${booking_const.Model.Resources}/getById`](cell.resourceId);
			const timezone = resource?.slotRanges?.[0]?.timezone;
			const clients = [...waitListItem.clients];
			const intersections = this.#store.getters[`${booking_const.Model.Interface}/intersections`] ?? {};
			if (this.#editingWaitListItemId === waitListItemId) {
				await this.#setEditingBookingId(waitListItemId);
			}
			const result = await booking_provider_service_bookingService.bookingService.createFromWaitListItem(waitListItemId, {
				id: `wl${waitListItemId}`,
				clients,
				primaryClient: clients.length > 0 ? clients[0] : undefined,
				externalData: [...waitListItem.externalData],
				name: waitListItem.name,
				note: waitListItem.note,
				resourcesIds: [...new Set([cell.resourceId, ...(intersections[0] ?? []), ...(intersections[cell.resourceId] ?? [])])],
				dateFromTs: cell.fromTs,
				dateToTs: cell.toTs,
				timezoneFrom: timezone,
				timezoneTo: timezone
			});
			if (!result.success || !result.booking) {
				await this.#restoreEditingState(editingState);
				return;
			}
			booking_lib_analytics.BookingAnalytics.sendAddBooking({
				isOverbooking: false
			});
			if (this.#editingBookingId === waitListItemId) {
				await this.#setEditingBookingId(result.booking.id);
			}
		}
		async #rollbackMoveBookingToWaitList({
			bookingId,
			editingState
		}) {
			await Promise.all([this.#store.dispatch(`${booking_const.Model.Interface}/removeDeletingBooking`, bookingId), this.#restoreEditingState(editingState)]);
		}
		async #restoreEditingState({
			editingBookingId,
			editingWaitListItemId
		}) {
			await Promise.all([this.#store.dispatch(`${booking_const.Model.Interface}/setEditingBookingId`, editingBookingId), this.#store.dispatch(`${booking_const.Model.Interface}/setEditingWaitListItemId`, editingWaitListItemId)]);
		}
		async #setEditingBookingId(id) {
			await Promise.all([this.#store.dispatch(`${booking_const.Model.Interface}/setEditingBookingId`, id), this.#store.dispatch(`${booking_const.Model.Interface}/setEditingWaitListItemId`, 0)]);
		}
		async #setEditingWaitListItemId(id) {
			await Promise.all([this.#store.dispatch(`${booking_const.Model.Interface}/setEditingWaitListItemId`, id), this.#store.dispatch(`${booking_const.Model.Interface}/setEditingBookingId`, 0)]);
		}
		#getTemporaryItemId() {
			return `tmp-id-${Date.now()}-${main_core.Text.getRandom(4)}`;
		}
		get #store() {
			return booking_core.Core.getStore();
		}
		get #editingBookingId() {
			return this.#store.getters[`${booking_const.Model.Interface}/editingBookingId`];
		}
		get #editingWaitListItemId() {
			return this.#store.getters[`${booking_const.Model.Interface}/editingWaitListItemId`];
		}
	}
	const dragActions = new DragActions();

	class Drag {
		#params;
		#dragManager;
		#draggedId;
		#draggedKind;
		constructor(params) {
			this.#params = {
				element: 'booking-booking-card-container',
				...params
			};
			this.#dragManager = new ui_draganddrop_draggable.Draggable({
				container: this.#params.container,
				draggable: this.#params.draggable,
				elementsPreventingDrag: ['.booking-booking-resize'],
				delay: 200
			});
			this.#dragManager.subscribe('start', this.#onDragStart.bind(this));
			this.#dragManager.subscribe('move', this.#onDragMove.bind(this));
			this.#dragManager.subscribe('end', this.#onDragEnd.bind(this));
		}
		destroy() {
			this.#dragManager.destroy();
		}
		async #onDragStart(event) {
			const {
				draggable,
				source: {
					dataset
				},
				clientX,
				clientY
			} = event.getData();
			this.#params.element = 'booking-booking-card-container';
			this.#draggedKind = dataset.kind;
			this.#draggedId = parseInt(dataset.id, 10);
			await booking_core.Core.getStore().dispatch(`${booking_const.Model.Interface}/setDraggedDataTransfer`, {
				kind: this.#draggedKind,
				id: this.#draggedId,
				resourceId: parseInt(dataset.resourceId, 10) ?? 0
			});
			main_core.Dom.style(draggable, 'pointer-events', 'none');
			this.#getAdditionalBookingElements(this.#params.container).forEach(element => {
				const clone = main_core.Runtime.clone(element);
				draggable.append(clone);
				const translateX = element.getBoundingClientRect().left - draggable.getBoundingClientRect().left;
				const translateY = element.getBoundingClientRect().top - draggable.getBoundingClientRect().top;
				main_core.Dom.style(clone, 'transition', 'none');
				main_core.Dom.style(clone, 'transform', `translate(${translateX}px, ${translateY}px)`);
				main_core.Dom.style(clone, 'animation', 'none');
			});
			this.#getDraggedElements(this.#params.container).forEach(element => {
				if (draggable.contains(element)) {
					return;
				}
				main_core.Dom.addClass(element, '--drag-source');
				main_core.Dom.style(element, 'visibility', 'visible');
			});
			const transformOriginX = clientX - draggable.getBoundingClientRect().left;
			const transformOriginY = clientY - draggable.getBoundingClientRect().top;
			this.#getDraggedElements(draggable).forEach(clone => {
				main_core.Dom.style(clone, 'transform-origin', `${transformOriginX}px ${transformOriginY}px`);
			});
			main_popup.PopupManager.getPopups().forEach(popup => popup.close());
			void booking_lib_busySlots.busySlots.loadBusySlots();
		}
		#onDragMove(event) {
			if (main_core.Type.isNull(this.#draggedKind)) {
				return;
			}
			const {
				draggable,
				clientX,
				clientY
			} = event.getData();
			this.#getAdditionalBookingElements(draggable).forEach((clone, index) => {
				main_core.Dom.style(clone, 'transition', '');
				main_core.Dom.style(clone, 'transform', `rotate(${index === 1 ? 4 : 0}deg)`);
				main_core.Dom.style(clone, 'zIndex', `-${index + 1}`);
			});
			if (this.#isDragDeleteHovered(clientX, clientY)) {
				main_core.Dom.addClass(draggable, '--deleting');
			} else {
				main_core.Dom.removeClass(draggable, '--deleting');
			}
			if (this.#draggedKind === booking_const.DraggedElementKind.Booking) {
				draggable.querySelectorAll('[data-element="booking-booking-time"]').forEach(time => {
					time.innerText = this.#timeFormatted;
				});
			}
			this.#updateScroll(draggable, clientX, clientY);
		}
		async #onDragEnd(event) {
			clearInterval(this.scrollTimeout);
			this.#getDraggedElements(this.#params.container).forEach(element => {
				main_core.Dom.removeClass(element, '--drag-source');
				main_core.Dom.style(element, 'visibility', '');
			});
			if (this.#hoveredPlacementSlot && !this.#getResourceById(this.#hoveredPlacementSlot.resourceId)?.isDeleted) {
				if (this.#draggedKind === booking_const.DraggedElementKind.Booking) {
					void dragActions.moveBookingOnGrid({
						bookingId: this.#draggedBookingId,
						resourceId: this.#draggedBookingResourceId,
						cell: this.#hoveredPlacementSlot
					});
				} else if (this.#draggedKind === booking_const.DraggedElementKind.WaitListItem) {
					void dragActions.createBookingFromWaitListItem({
						waitListItemId: this.#draggedDataTransfer.id,
						cell: this.#hoveredPlacementSlot
					});
				}
			}
			if (this.#getResourceById(this.#draggedBookingResourceId)?.isDeleted) {
				const bookingId = this.#draggedBooking.id;
				if (booking_core.Core.getStore().getters[`${booking_const.Model.Interface}/deletingBookings`][bookingId]) {
					return;
				}
				this.#showPopupOnNonDraggableBookingFromDeletedResource(event.data.source, bookingId);
			}
			this.#draggedKind = null;
			this.#draggedId = null;
			await booking_core.Core.getStore().dispatch(`${booking_const.Model.Interface}/clearDraggedDataTransfer`);
			void booking_lib_busySlots.busySlots.loadBusySlots();
		}
		#getDraggedElements(container) {
			const id = this.#draggedDataTransfer.id || this.#draggedId;
			const items = [...container.querySelectorAll(`[data-element="${this.#params.element}"][data-id="${id}"]`)];
			if (!id && items.length === 0) {
				return this.#tryGetLostDraggedElements(container);
			}
			return items;
		}
		#tryGetLostDraggedElements(container) {
			return [...container.querySelectorAll(`[data-element="${this.#params.element}"].--drag-source`)];
		}
		#getAdditionalBookingElements(container) {
			const id = this.#draggedBookingId;
			const resourceId = this.#draggedBookingResourceId;
			return [...container.querySelectorAll(`[data-element="${this.#params.element}"][data-id="${id}"]:not([data-resource-id="${resourceId}"])`)];
		}
		#updateScroll(draggable, x, y) {
			clearTimeout(this.scrollTimeout);
			if (this.#isDragDeleteHovered(x, y)) {
				return;
			}
			const gridRect = this.#gridWrap.getBoundingClientRect();
			const draggableRect = draggable.getBoundingClientRect();
			this.scrollTimeout = setTimeout(() => this.#updateScroll(draggable), 16);
			if (draggableRect.left < gridRect.left) {
				this.#gridColumns.scrollLeft -= this.#getSpeed(draggableRect.left, gridRect.left);
			} else if (draggableRect.right > gridRect.right) {
				this.#gridColumns.scrollLeft += this.#getSpeed(draggableRect.right, gridRect.right);
			} else if (draggableRect.top < gridRect.top) {
				this.#gridWrap.scrollTop -= this.#getSpeed(draggableRect.top, gridRect.top);
			} else if (draggableRect.bottom > gridRect.bottom) {
				this.#gridWrap.scrollTop += 2 * this.#getSpeed(draggableRect.bottom, gridRect.bottom);
			} else {
				clearTimeout(this.scrollTimeout);
			}
		}
		#getSpeed(a, b) {
			return (Math.floor(Math.sqrt(Math.abs(a - b))) + 1) / 2;
		}
		#isDragDeleteHovered(x, y) {
			if (!x || !y) {
				return false;
			}
			return document.elementFromPoint(x, y)?.closest('[data-element="booking-drag-delete"]');
		}
		get #timeFormatted() {
			const timeFormat = main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT');
			const from = this.#hoveredPlacementSlot?.fromTs ?? this.#draggedBooking.dateFromTs;
			const to = this.#hoveredPlacementSlot?.toTs ?? this.#draggedBooking.dateToTs;
			return main_core.Loc.getMessage('BOOKING_BOOKING_TIME_RANGE', {
				'#FROM#': main_date.DateTimeFormat.format(timeFormat, (from + this.#offset) / 1000),
				'#TO#': main_date.DateTimeFormat.format(timeFormat, (to + this.#offset) / 1000)
			});
		}
		#showPopupOnNonDraggableBookingFromDeletedResource(bookingEl, bookingId) {
			const popupId = `booking-non-draggable-booking-${bookingId}`;
			const popup = new booking_component_nonDraggableBookingPopup.NonDraggableBookingPopup({
				id: popupId,
				bindElement: bookingEl
			});
			popup.show();
			setTimeout(() => {
				popup.destroy(popupId);
			}, 5000);
		}
		#getResourceById(resourceId) {
			return booking_core.Core.getStore().getters[`${booking_const.Model.Resources}/getById`](resourceId);
		}
		get #draggedBooking() {
			return booking_core.Core.getStore().getters[`${booking_const.Model.Bookings}/getById`](this.#draggedBookingId) ?? null;
		}
		get #draggedDataTransfer() {
			return booking_core.Core.getStore().getters[`${booking_const.Model.Interface}/draggedDataTransfer`];
		}
		get #draggedBookingId() {
			return booking_core.Core.getStore().getters[`${booking_const.Model.Interface}/draggedBookingId`];
		}
		get #draggedBookingResourceId() {
			return booking_core.Core.getStore().getters[`${booking_const.Model.Interface}/draggedBookingResourceId`];
		}
		get #hoveredPlacementSlot() {
			return booking_core.Core.getStore().getters[`${booking_const.Model.Interface}/hoveredPlacementSlot`];
		}
		get #offset() {
			return booking_core.Core.getStore().getters[`${booking_const.Model.Interface}/offset`];
		}
		get #gridWrap() {
			return BX('booking-booking-grid-wrap');
		}
		get #gridColumns() {
			return BX('booking-booking-grid-columns') ?? this.#gridWrap;
		}
	}

	class DragPolicy {
		canMoveBookingOnGrid(booking) {
			if (!booking) {
				return false;
			}
			return !this.#isWeekMode && booking.dateToTs - booking.dateFromTs <= MaxInteractionBookingDurationsMs;
		}
		canMoveBookingOnCheckList({
			draggedBookingId,
			draggedBookingResourceId
		}) {
			return Boolean(draggedBookingId) && booking_lib_isRealId.isRealId(draggedBookingId) && !this.#store.getters[`${booking_const.Model.Resources}/isDeleted`](draggedBookingResourceId);
		}
		get #store() {
			return booking_core.Core.getStore();
		}
		get #isWeekMode() {
			return this.#store.getters[`${booking_const.Model.Interface}/isWeekMode`];
		}
	}
	const dragPolicy = new DragPolicy();

	exports.Drag = Drag;
	exports.MaxInteractionBookingDurationsMs = MaxInteractionBookingDurationsMs;
	exports.dragActions = dragActions;
	exports.dragPolicy = dragPolicy;

})(this.BX.Booking.Lib = this.BX.Booking.Lib || {}, BX.Booking.Lib, BX, BX.Main, BX.Main, BX.UI.DragAndDrop, BX.Booking.Const, BX.Booking, BX.Booking.Lib, BX.Booking.Component, BX.Booking.Lib, BX.Booking.Lib, BX.Booking.Provider.Service, BX.Booking.Provider.Service, BX.Booking.Lib);
//# sourceMappingURL=drag.bundle.js.map
