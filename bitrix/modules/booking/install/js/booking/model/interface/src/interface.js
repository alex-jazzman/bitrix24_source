/* eslint-disable no-param-reassign */

import { Type } from 'main.core';
import { BuilderModel } from 'ui.vue3.vuex';
import type { GetterTree, ActionTree, MutationTree } from 'ui.vue3.vuex';

import { BusySlot, DraggedElementKind, Model } from 'booking.const';
import { Timezone } from 'booking.lib.timezone';
import type { BusySlotDto } from 'booking.lib.busy-slots';
import type { BookingModel, DealData } from 'booking.model.bookings';

import { getOverbookingOccupancy } from './lib';
import type {
	InterfaceModelState,
	Intersections,
	MousePosition,
	MoneyStatistics,
	QuickFilter,
	Occupancy,
	DraggedDataTransfer,
} from './types';

export class Interface extends BuilderModel
{
	getName(): string
	{
		return Model.Interface;
	}

	getState(): InterfaceModelState
	{
		const today = new Date();
		const schedule = this.getVariable('schedule', {});

		return {
			isFeatureEnabled: this.getVariable('isFeatureEnabled', false),
			canTurnOnTrial: this.getVariable('canTurnOnTrial', false),
			canTurnOnDemo: this.getVariable('canTurnOnDemo', false),
			editingBookingId: this.getVariable('editingBookingId', 0),
			editingWaitListItemId: this.getVariable('editingWaitListItemId', 0),
			draggedBookingId: 0,
			draggedBookingResourceId: 0,
			draggedDataTransfer: {
				id: 0,
				resourceId: 0,
				kind: '',
			},
			resizedBookingId: 0,
			isLoaded: false,
			zoom: 1,
			expanded: false,
			scroll: 0,
			offHoursHover: false,
			offHoursExpanded: false,
			waitListExpanded: this.getVariable('waitListExpanded', true),
			calendarExpanded: this.getVariable('calendarExpanded', true),
			fromHour: schedule.fromHour ?? 9,
			toHour: schedule.toHour ?? 19,
			selectedDateTs: new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime(),
			viewDateTs: new Date(today.getFullYear(), today.getMonth()).getTime(),
			deletingBookings: {},
			deletingWaitListItemIds: {},
			selectedCells: {},
			hoveredCell: null,
			busySlots: {},
			disabledBusySlots: {},
			resourcesIds: [],
			isFilterMode: false,
			isIntersectionForAll: true,
			filteredBookingsIds: [],
			filteredMarks: [],
			counterMarks: [],
			freeMarks: [],
			totalClients: this.getVariable('totalClients', 0),
			totalNewClientsToday: this.getVariable('totalNewClientsToday', 0),
			moneyStatistics: this.getVariable('moneyStatistics', null),
			intersections: {},
			quickFilter: {
				hovered: {},
				active: {},
				ignoredBookingIds: {},
			},
			timezone: this.getVariable('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone),
			mousePosition: {
				top: 0,
				left: 0,
			},
			isCurrentSenderAvailable: false,
			isShownTrialPopup: false,
			embedItems: this.getVariable('embedItems', []),
			animationPause: false,
			createdFromEmbedBookings: {},
			createdFromEmbedWaitListItems: {},
		};
	}

	// eslint-disable-next-line max-lines-per-function
	getGetters(): GetterTree<InterfaceModelState>
	{
		return {
			/** @function interface/isFeatureEnabled */
			isFeatureEnabled: (state): boolean => {
				return state.isFeatureEnabled || state.canTurnOnTrial;
			},
			/** @function interface/canTurnOnTrial */
			canTurnOnTrial: (state): boolean => state.canTurnOnTrial,
			/** @function interface/canTurnOnDemo */
			canTurnOnDemo: (state): boolean => state.canTurnOnDemo,
			/** @function interface/isShownTrialPopup */
			isShownTrialPopup: (state): boolean => state.isShownTrialPopup,
			/** @function interface/editingBookingId */
			editingBookingId: (state): number => state.editingBookingId,
			/** @function interface/editingWaitListItemId */
			editingWaitListItemId: (state): number => state.editingWaitListItemId,
			/** @function interface/isEditingBookingMode */
			isEditingBookingMode: (state): boolean => {
				return state.editingBookingId > 0 || state.editingWaitListItemId > 0;
			},
			/** @function interface/draggedBookingId */
			draggedBookingId: (state): number => {
				return state.draggedDataTransfer.kind === DraggedElementKind.Booking
					? state.draggedDataTransfer.id
					: 0;
			},
			/** @function interface/draggedBookingResourceId */
			draggedBookingResourceId: (state): number => {
				return state.draggedDataTransfer.kind === DraggedElementKind.Booking
					? state.draggedDataTransfer.resourceId
					: 0;
			},
			/** @function interface/draggedDataTransfer */
			draggedDataTransfer: (state): DraggedDataTransfer => state.draggedDataTransfer,
			/** @function interface/resizedBookingId */
			resizedBookingId: (state): number => state.resizedBookingId,
			/** @function interface/isDragMode */
			isDragMode: (state): boolean => state.draggedDataTransfer.id > 0 || state.resizedBookingId,
			/** @function interface/isLoaded */
			isLoaded: (state): boolean => state.isLoaded,
			/** @function interface/zoom */
			zoom: (state): number => state.zoom,
			/** @function interface/expanded */
			expanded: (state): boolean => state.expanded,
			/** @function interface/scroll */
			scroll: (state): number => state.scroll,
			/** @function interface/offHoursHover */
			offHoursHover: (state): boolean => state.offHoursHover,
			/** @function interface/offHoursExpanded */
			offHoursExpanded: (state): boolean => state.offHoursExpanded,
			/** @function interface/waitListExpanded */
			waitListExpanded: (state): boolean => state.waitListExpanded,
			/** @function interface/calendarExpanded */
			calendarExpanded: (state): boolean => state.calendarExpanded,
			/** @function interface/fromHour */
			fromHour: (state): number => state.fromHour,
			/** @function interface/toHour */
			toHour: (state): number => state.toHour,
			/** @function interface/selectedDateTs */
			selectedDateTs: (state, getters): number => state.selectedDateTs - getters.offset,
			/** @function interface/viewDateTs */
			viewDateTs: (state, getters): number => state.viewDateTs - getters.offset,
			/** @function interface/deletingBookings */
			deletingBookings: (state): { [id: number]: number } => state.deletingBookings,
			/** @function interface/deletingWaitListItems */
			deletingWaitListItems: (state): { [id: number]: number } => state.deletingWaitListItemIds,
			/** @function interface/selectedCells */
			selectedCells: (state): { [id: string]: CellDto } => state.selectedCells,
			/** @function interface/hoveredCell */
			hoveredCell: (state): CellDto | null => state.hoveredCell,
			/** @function interface/busySlots */
			busySlots: (state): BusySlotDto[] => Object.values(state.busySlots),
			/** @function interface/disabledBusySlots */
			disabledBusySlots: (state): { [id: string]: BusySlotDto } => state.disabledBusySlots,
			/** @function interface/resourcesIds */
			resourcesIds: (state, getters, rootState, rootGetters): number[] => {
				const extraResourcesIds = rootGetters[`${Model.Bookings}/getByDate`](state.selectedDateTs)
					.filter((booking) => !getters.isFilterMode && booking.counter > 0)
					.map((booking) => booking.resourcesIds[0]);

				const resourcesIds = [...new Set([...state.resourcesIds, ...extraResourcesIds])];

				const excludeResources = new Set(
					getters.getOccupancy(resourcesIds, Object.values(state.quickFilter.ignoredBookingIds))
						.filter((occupancy: Occupancy) => Object.values(state.quickFilter.active).some((hour) => {
							const fromTs = new Date(state.selectedDateTs).setHours(hour) - getters.offset;
							const toTs = new Date(state.selectedDateTs).setHours(hour + 1) - getters.offset;

							return toTs > occupancy.fromTs && fromTs < occupancy.toTs;
						}))
						.flatMap((occupancy: Occupancy) => occupancy.resourcesIds),
				);

				return resourcesIds.filter((id) => !excludeResources.has(id));
			},
			extraResourcesIds: (state, getters) => {
				const resourcesIds = state.resourcesIds;

				return getters.resourcesIds.filter((id) => !resourcesIds.includes(id));
			},
			/** @function interface/isFilterMode */
			isFilterMode: (state): boolean => state.isFilterMode,
			/** @function interface/isIntersectionForAll */
			isIntersectionForAll: (state): boolean => state.isIntersectionForAll,
			/** @function interface/filteredBookingsIds */
			filteredBookingsIds: (state): number[] => state.filteredBookingsIds,
			/** @function interface/filteredMarks */
			filteredMarks: (state): string[] => state.filteredMarks,
			/** @function interface/freeMarks */
			freeMarks: (state): string[] => state.freeMarks,
			/** @function interface/totalClients */
			totalClients: (state): number => state.totalClients,
			/** @function interface/totalNewClientsToday */
			totalNewClientsToday: (state): number => state.totalNewClientsToday,
			/** @function interface/moneyStatistics */
			moneyStatistics: (state): MoneyStatistics | null => state.moneyStatistics,
			getCounterMarks: (state) => (filterDates: string[] | null = null) => {
				if (Type.isNull(filterDates))
				{
					return state.counterMarks;
				}

				return state.counterMarks.filter((date) => filterDates.includes(date));
			},
			/** @function interface/intersections */
			intersections: (state): Intersections => state.intersections,
			/** @function interface/quickFilter */
			quickFilter: (state): QuickFilter => state.quickFilter,
			/** @function interface/timezone */
			timezone: (state): string => state.timezone,
			/** @function interface/offset */
			offset: (state): number => {
				const timezoneOffset = Timezone.getOffset(state.selectedDateTs, state.timezone);

				return (timezoneOffset + new Date(state.selectedDateTs).getTimezoneOffset() * 60) * 1000;
			},
			/** @function interface/mousePosition */
			mousePosition: (state): MousePosition => state.mousePosition,
			/** @function interface/isCurrentSenderAvailable */
			isCurrentSenderAvailable: (state): boolean => state.isCurrentSenderAvailable,
			/** @function interface/getColliding */
			getColliding: (state, getters) => {
				return (
					resourceId: number | number[],
					excludedBookingIds: number[] | (booking: BookingModel) => boolean,
				): Occupancy[] => {
					const resourcesIds = Array.isArray(resourceId) ? resourceId : [resourceId];

					return [
						...getters.getOccupancy(resourcesIds, excludedBookingIds),
						...Object.values(state.selectedCells)
							.filter((cell: CellDto) => resourcesIds.includes(cell.resourceId))
							.map((cell: CellDto) => ({
								fromTs: cell.fromTs,
								toTs: cell.toTs,
								resourcesIds: [cell.resourceId],
							})),
					];
				};
			},
			/** @function interface/getOccupancy */
			getOccupancy: (state, getters, rootState, rootGetters) => {
				return (
					resourcesIds: number[],
					excludedBookingIds: number[] | (booking: BookingModel) => boolean = [],
				): Occupancy[] => {
					const resources = new Set(resourcesIds);

					const bookings = rootGetters[`${Model.Bookings}/get`]
						.filter((booking: BookingModel) => {
							const belongsToResources = booking.resourcesIds.some((id) => resources.has(id));
							const isNotExcluded: boolean = Type.isFunction(excludedBookingIds)
								? !excludedBookingIds(booking)
								: !excludedBookingIds.includes(booking.id);

							return belongsToResources && isNotExcluded;
						})
						.map((booking: BookingModel) => ({
							fromTs: booking.dateFromTs,
							toTs: booking.dateToTs,
							resourcesIds: booking.resourcesIds,
						}))
					;

					const busySlots = Object.values(state.busySlots)
						.filter((busySlot: BusySlotDto) => {
							const isDragOffHours = getters.isDragMode && busySlot.type === BusySlot.OffHours;
							const isActive = !(busySlot.id in state.disabledBusySlots) && !isDragOffHours;
							const belongsToResources = resources.has(busySlot.resourceId);
							const isIntersectionOverbooking = busySlot.type === BusySlot.IntersectionOverbooking;

							return isIntersectionOverbooking && isActive && belongsToResources;
						})
						.map(({ fromTs, toTs, resourceId }) => ({ fromTs, toTs, resourcesIds: [resourceId] }))
					;

					const overbookingOccupancy = getOverbookingOccupancy(
						rootGetters[`${Model.Bookings}/overbookingMap`],
						resources,
					);

					return [...bookings, ...busySlots, ...overbookingOccupancy];
				};
			},
			/** @function interface/embedItems */
			embedItems: (state): DealData[] => state.embedItems,
			/** @function interface/animationPause */
			animationPause: (state): boolean => state.animationPause,
			/** @function interface/isBookingCreatedFromEmbed */
			isBookingCreatedFromEmbed: (state) => (id: number | string): boolean => {
				return id in state.createdFromEmbedBookings;
			},
			/** @function interface/isWaitListItemCreatedFromEmbed */
			isWaitListItemCreatedFromEmbed: (state) => (id: number | string): boolean => {
				return id in state.createdFromEmbedWaitListItems;
			},
		};
	}

	// eslint-disable-next-line max-lines-per-function
	getActions(): ActionTree<InterfaceModelState>
	{
		return {
			/** @function interface/setEditingBookingId */
			setEditingBookingId: (store, editingBookingId: number) => {
				store.commit('setEditingBookingId', editingBookingId);
			},
			/** @function interface/setEditingWaitListItemId */
			setEditingWaitListItemId: (store, editingWaitListItemId: number) => {
				store.commit('setEditingWaitListItemId', editingWaitListItemId);
			},
			/** @function interface/setDraggedBookingId */
			setDraggedBookingId: (store, draggedBookingId: number) => {
				store.commit('setDraggedBookingId', draggedBookingId);
			},
			/** @function interface/setDraggedBookingResourceId */
			setDraggedBookingResourceId: (store, draggedBookingResourceId: number) => {
				store.commit('setDraggedBookingResourceId', draggedBookingResourceId);
			},
			/** @function interface/setDraggedDataTransfer */
			setDraggedDataTransfer: (store, draggedDataTransfer: DraggedDataTransfer): void => {
				store.commit('setDraggedDataTransfer', draggedDataTransfer);
			},
			/** @function interface/clearDraggedDataTransfer */
			clearDraggedDataTransfer: (store): void => {
				store.commit('setDraggedDataTransfer', {
					kind: null,
					id: 0,
					resourceId: 0,
				});
			},
			/** @function interface/setResizedBookingId */
			setResizedBookingId: (store, resizedBookingId: number) => {
				store.commit('setResizedBookingId', resizedBookingId);
			},
			/** @function interface/setIsLoaded */
			setIsLoaded: (store, isLoaded: boolean) => {
				store.commit('setIsLoaded', isLoaded);
			},
			/** @function interface/setZoom */
			setZoom: (store, zoom: number) => {
				store.commit('setZoom', zoom);
			},
			/** @function interface/setExpanded */
			setExpanded: (store, expanded: boolean) => {
				store.commit('setExpanded', expanded);
			},
			/** @function interface/setScroll */
			setScroll: (store, scroll: number) => {
				store.commit('setScroll', scroll);
			},
			/** @function interface/setOffHoursHover */
			setOffHoursHover: (store, offHoursHover: boolean) => {
				store.commit('setOffHoursHover', offHoursHover);
			},
			/** @function interface/setOffHoursExpanded */
			setOffHoursExpanded: (store, offHoursExpanded: boolean) => {
				store.commit('setOffHoursExpanded', offHoursExpanded);
			},
			/** @function interface/setWaitListExpanded */
			setWaitListExpanded: (store, waitListExpanded: boolean) => {
				store.commit('setWaitListExpanded', waitListExpanded);
			},
			/** @function interface/setCalendarExpanded */
			setCalendarExpanded: (store, calendarExpanded: boolean) => {
				store.commit('setCalendarExpanded', calendarExpanded);
			},
			/** @function interface/setSelectedDateTs */
			setSelectedDateTs: (store, selectedDateTs: number) => {
				store.commit('setSelectedDateTs', selectedDateTs);
			},
			/** @function interface/setViewDateTs */
			setViewDateTs: (store, viewDateTs: number) => {
				store.commit('setViewDateTs', viewDateTs);
			},
			/** @function interface/addDeletingBooking */
			addDeletingBooking: (store, bookingId: number) => {
				store.commit('addDeletingBooking', bookingId);
			},
			/** @function interface/removeDeletingBooking */
			removeDeletingBooking: (store, bookingId: number) => {
				store.commit('removeDeletingBooking', bookingId);
			},
			/** @function interfcae/addDeletingWaitListItemId */
			addDeletingWaitListItemId: (store, waitListItemId: number | number[]) => {
				store.commit('addDeletingWaitListItemId', waitListItemId);
			},
			/** @function interface/removeDeletingWaitListItemId */
			removeDeletingWaitListItemId: (store, waitListItemId: number | number[]) => {
				store.commit('removeDeletingWaitListItemId', waitListItemId);
			},
			/** @function interface/addSelectedCell */
			addSelectedCell: (store, cell: CellDto) => {
				store.commit('addSelectedCell', cell);
			},
			/** @function interface/removeSelectedCell */
			removeSelectedCell: (store, cell: CellDto) => {
				store.commit('removeSelectedCell', cell);
			},
			/** @function interface/clearSelectedCells */
			clearSelectedCells: (store) => {
				store.commit('clearSelectedCells');
			},
			/** @function interface/setHoveredCell */
			setHoveredCell: (store, cell: CellDto | null) => {
				store.commit('setHoveredCell', cell);
			},
			/** @function interface/upsertBusySlotMany */
			upsertBusySlotMany: (store: Store, busySlots: BusySlotDto[]): void => {
				busySlots.forEach((busySlot) => store.commit('upsertBusySlot', busySlot));
			},
			/** @function interface/clearBusySlots */
			clearBusySlots: (store) => {
				store.commit('clearBusySlots');
			},
			/** @function interface/addDisabledBusySlot */
			addDisabledBusySlot: (store, busySlot: BusySlotDto) => {
				store.commit('addDisabledBusySlot', busySlot);
			},
			/** @function interface/clearDisabledBusySlots */
			clearDisabledBusySlots: (store) => {
				store.commit('clearDisabledBusySlots');
			},
			/** @function interface/setResourcesIds */
			setResourcesIds: (store, resourcesIds: number[]) => {
				store.commit('setResourcesIds', resourcesIds);
			},
			/** @function interface/deleteResourceId */
			deleteResourceId: (store, resourceId: number) => {
				store.commit('deleteResourceId', resourceId);
			},
			/** @function interface/setFilterMode */
			setFilterMode: (store, isFilterMode: boolean) => {
				store.commit('setFilterMode', isFilterMode);
			},
			/** @function interface/setIntersectionMode */
			setIntersectionMode: (store, isIntersectionForAll: boolean) => {
				store.commit('setIntersectionMode', isIntersectionForAll);
			},
			/** @function interface/setFilteredBookingsIds */
			setFilteredBookingsIds: (store, filteredBookingsIds: number[]) => {
				store.commit('setFilteredBookingsIds', filteredBookingsIds);
			},
			/** @function interface/setFilteredMarks */
			setFilteredMarks: (store, dates: number[]) => {
				store.commit('setFilteredMarks', dates);
			},
			/** @function interface/setFreeMarks */
			setFreeMarks: (store, dates: number[]) => {
				store.commit('setFreeMarks', dates);
			},
			/** @function interface/setTotalClients */
			setTotalClients: (store, totalClients: number) => {
				store.commit('setTotalClients', totalClients);
			},
			/** @function interface/setTotalNewClientsToday */
			setTotalNewClientsToday: (store, totalNewClientsToday: number) => {
				store.commit('setTotalNewClientsToday', totalNewClientsToday);
			},
			/** @function interface/setMoneyStatistics */
			setMoneyStatistics: (store, moneyStatistics: MoneyStatistics) => {
				store.commit('setMoneyStatistics', moneyStatistics);
			},
			setCounterMarks: (state, dates: number[]): void => {
				state.commit('setCounterMarks', dates);
			},
			/** @function interface/setIntersections */
			setIntersections: (store, intersections: Intersections) => {
				store.commit('setIntersections', intersections);
			},
			/** @function interface/hoverQuickFilter */
			hoverQuickFilter: (store, hour: number) => {
				store.commit('hoverQuickFilter', hour);
			},
			/** @function interface/fleeQuickFilter */
			fleeQuickFilter: (store, hour: number) => {
				store.commit('fleeQuickFilter', hour);
			},
			/** @function interface/activateQuickFilter */
			activateQuickFilter: (store, hour: number) => {
				store.commit('activateQuickFilter', hour);
				store.commit('clearQuickFilterIgnoredBookingIds');
			},
			/** @function interface/deactivateQuickFilter */
			deactivateQuickFilter: (store, hour: number) => {
				store.commit('deactivateQuickFilter', hour);
				store.commit('clearQuickFilterIgnoredBookingIds');
			},
			/** @function interface/addQuickFilterIgnoredBookingId */
			addQuickFilterIgnoredBookingId: (store, bookingId: number) => {
				store.commit('addQuickFilterIgnoredBookingId', bookingId);
			},
			/** @function interface/setMousePosition */
			setMousePosition: (store, mousePosition: MousePosition) => {
				store.commit('setMousePosition', mousePosition);
			},
			/** @function interface/setIsCurrentSenderAvailable */
			setIsCurrentSenderAvailable: (store, isCurrentSenderAvailable: boolean) => {
				store.commit('setIsCurrentSenderAvailable', isCurrentSenderAvailable);
			},
			/** @function interface/setIsFeatureEnabled */
			setIsFeatureEnabled: (store, isFeatureEnabled: boolean) => {
				store.commit('setIsFeatureEnabled', isFeatureEnabled);
			},
			/** @function interface/setCanTurnOnTrial */
			setCanTurnOnTrial: (store, canTurnOnTrial: boolean) => {
				store.commit('setCanTurnOnTrial', canTurnOnTrial);
			},
			/** @function interface/setIsShownTrialPopup */
			setIsShownTrialPopup: (store, isShownTrialPopup: boolean) => {
				store.commit('setIsShownTrialPopup', isShownTrialPopup);
			},
			/** @function interface/setEmbedItems */
			setEmbedItems: (store, embedItems: DealData[]) => {
				store.commit('setEmbedItems', embedItems);
			},
			/** @function interface/setAnimationPause */
			setAnimationPause: ({ commit }, pause: boolean) => {
				commit('setAnimationPause', pause);
			},
			/** @function interface/addCreatedFromEmbedBooking */
			addCreatedFromEmbedBooking: ({ commit, getters }, id: number | string | Array<number | string>) => {
				const embedItems = getters.embedItems || [];
				if (embedItems.length > 0)
				{
					commit('addCreatedFromEmbedBooking', id);
				}
			},
			/** @function interface/addCreatedFromEmbedWaitListItem */
			addCreatedFromEmbedWaitListItem: ({ commit, getters }, id: number | string | Array<number | string>) => {
				const embedItems = getters.embedItems || [];
				if (embedItems.length > 0)
				{
					commit('addCreatedFromEmbedWaitListItem', id);
				}
			},
		};
	}

	// eslint-disable-next-line max-lines-per-function
	getMutations(): MutationTree<InterfaceModelState>
	{
		return {
			setEditingBookingId: (state, editingBookingId: number) => {
				state.editingBookingId = editingBookingId;
			},
			setEditingWaitListItemId: (state, editingWaitListItemId: number) => {
				state.editingWaitListItemId = editingWaitListItemId;
			},
			setDraggedBookingId: (state, draggedBookingId: number) => {
				state.draggedBookingId = draggedBookingId;
			},
			setResizedBookingId: (state, resizedBookingId: number) => {
				state.resizedBookingId = resizedBookingId;
			},
			setDraggedBookingResourceId: (state, draggedBookingResourceId: number) => {
				state.draggedBookingResourceId = draggedBookingResourceId;
			},
			setDraggedDataTransfer: (state, draggedDataTransfer: DraggedDataTransfer) => {
				state.draggedDataTransfer = draggedDataTransfer;
			},
			setIsLoaded: (state, isLoaded: boolean) => {
				state.isLoaded = isLoaded;
			},
			setZoom: (state, zoom: number) => {
				state.zoom = zoom;
			},
			setExpanded: (state, expanded: boolean) => {
				state.expanded = expanded;
			},
			setScroll: (state, scroll: number) => {
				state.scroll = scroll;
			},
			setOffHoursHover: (state, offHoursHover: boolean) => {
				state.offHoursHover = offHoursHover;
			},
			setOffHoursExpanded: (state, offHoursExpanded: boolean) => {
				state.offHoursExpanded = offHoursExpanded;
			},
			setWaitListExpanded: (state, waitListExpanded: boolean) => {
				state.waitListExpanded = waitListExpanded;
			},
			setCalendarExpanded: (state, calendarExpanded: boolean) => {
				state.calendarExpanded = calendarExpanded;
			},
			setSelectedDateTs: (state, selectedDateTs: number) => {
				state.selectedDateTs = selectedDateTs;
			},
			setViewDateTs: (state, viewDateTs: number) => {
				state.viewDateTs = viewDateTs;
			},
			addDeletingBooking: (state, bookingId: number) => {
				state.deletingBookings[bookingId] = bookingId;
			},
			removeDeletingBooking: (state, bookingId: number) => {
				delete state.deletingBookings[bookingId];
			},
			addDeletingWaitListItemId: (state, waitListItemId: number | number[]) => {
				if (Type.isArray(waitListItemId))
				{
					waitListItemId.forEach((id) => {
						state.deletingWaitListItemIds[id] = id;
					});
				}
				else
				{
					state.deletingWaitListItemIds[waitListItemId] = waitListItemId;
				}
			},
			removeDeletingWaitListItemId: (state, waitListItemId: number | number[]) => {
				if (Type.isArray(waitListItemId))
				{
					waitListItemId.forEach((id) => {
						delete state.deletingWaitListItemIds[id];
					});
				}
				else
				{
					delete state.deletingWaitListItemIds[waitListItemId];
				}
			},
			addSelectedCell: (state, cell: CellDto) => {
				state.selectedCells[cell.id] = cell;
			},
			removeSelectedCell: (state, cell: CellDto) => {
				delete state.selectedCells[cell.id];
			},
			clearSelectedCells: (state) => {
				state.selectedCells = {};
			},
			setHoveredCell: (state, cell: CellDto | null) => {
				state.hoveredCell = cell;
			},
			upsertBusySlot: (state, busySlot: BusySlotDto): void => {
				state.busySlots[busySlot.id] ??= busySlot;
				Object.assign(state.busySlots[busySlot.id], busySlot);
			},
			clearBusySlots: (state) => {
				state.busySlots = {};
			},
			addDisabledBusySlot: (state, busySlot: BusySlotDto) => {
				state.disabledBusySlots[busySlot.id] = busySlot;
			},
			clearDisabledBusySlots: (state) => {
				state.disabledBusySlots = {};
			},
			setResourcesIds: (state, resourcesIds: number[]) => {
				state.resourcesIds = resourcesIds.sort((a, b) => a - b);
			},
			deleteResourceId: (state, resourceId: number) => {
				state.resourcesIds = state.resourcesIds.filter((id: number) => id !== resourceId);
			},
			setFilterMode: (state, isFilterMode: boolean) => {
				state.isFilterMode = isFilterMode;
			},
			setIntersectionMode: (state, isIntersectionForAll: boolean) => {
				state.isIntersectionForAll = isIntersectionForAll;
			},
			setFilteredBookingsIds: (state, filteredBookingsIds: number[]) => {
				state.filteredBookingsIds = [...filteredBookingsIds];
			},
			setFilteredMarks: (state, dates: number[]) => {
				state.filteredMarks = dates;
			},
			setFreeMarks: (state, dates: number[]) => {
				state.freeMarks = dates;
			},
			setTotalClients: (state, totalClients: number) => {
				state.totalClients = totalClients;
			},
			setTotalNewClientsToday: (state, totalNewClientsToday: number) => {
				state.totalNewClientsToday = totalNewClientsToday;
			},
			setMoneyStatistics: (state, moneyStatistics: MoneyStatistics) => {
				state.moneyStatistics = moneyStatistics;
			},
			setCounterMarks: (state, dates: number[]) => {
				state.counterMarks = dates;
			},
			setIntersections: (state, intersections: Intersections) => {
				state.intersections = intersections;
			},
			hoverQuickFilter: (state, hour: number) => {
				state.quickFilter.hovered[hour] = hour;
			},
			fleeQuickFilter: (state, hour: number) => {
				delete state.quickFilter.hovered[hour];
			},
			activateQuickFilter: (state, hour: number) => {
				state.quickFilter.active[hour] = hour;
			},
			deactivateQuickFilter: (state, hour: number) => {
				delete state.quickFilter.active[hour];
			},
			addQuickFilterIgnoredBookingId: (state, bookingId: number) => {
				state.quickFilter.ignoredBookingIds[bookingId] = bookingId;
			},
			clearQuickFilterIgnoredBookingIds: (state) => {
				state.quickFilter.ignoredBookingIds = {};
			},
			setMousePosition: (state, mousePosition: MousePosition) => {
				state.mousePosition = mousePosition;
			},
			setIsCurrentSenderAvailable: (state, isCurrentSenderAvailable: boolean) => {
				state.isCurrentSenderAvailable = isCurrentSenderAvailable;
			},
			setIsFeatureEnabled: (state, isFeatureEnabled: boolean) => {
				state.isFeatureEnabled = isFeatureEnabled;
			},
			setCanTurnOnTrial: (state, canTurnOnTrial: boolean) => {
				state.canTurnOnTrial = canTurnOnTrial;
			},
			setIsShownTrialPopup: (state, isShownTrialPopup: boolean) => {
				state.isShownTrialPopup = isShownTrialPopup;
			},
			setEmbedItems: (state, embedItems: DealData[]) => {
				state.embedItems = embedItems;
			},
			setAnimationPause: (state, pause: boolean) => {
				state.animationPause = pause;
			},
			addCreatedFromEmbedBooking: (state, id: string | number | Array<number | string>) => {
				if (Type.isArray(id))
				{
					for (const bookingId of id)
					{
						state.createdFromEmbedBookings[bookingId] = bookingId;
					}

					return;
				}

				state.createdFromEmbedBookings[id] = id;
			},
			addCreatedFromEmbedWaitListItem: (state, id: string | number | Array<number | string>) => {
				if (Type.isArray(id))
				{
					for (const waitListItemId of id)
					{
						state.createdFromEmbedWaitListItems[waitListItemId] = waitListItemId;
					}

					return;
				}

				state.createdFromEmbedWaitListItems[id] = id;
			},
		};
	}
}
