import { DraggedElementKind, Grid } from 'booking.const';
import type { AiCallBannerMode } from 'booking.const';

export type InterfaceModelState = {
	isFeatureEnabled: boolean,
	canTurnOnTrial: boolean,
	canTurnOnDemo: boolean,
	isLoaded: boolean,
	saleChannelsLoaded: boolean,
	gridMode: $Values<typeof Grid.Mode>,
	zoom: number,
	expanded: boolean,
	scroll: number,
	offHoursHover: boolean,
	offHoursExpanded: boolean,
	waitListExpanded: boolean,
	calendarExpanded: boolean,
	intersectionExpanded: boolean,
	firstWeekDay: number,
	fromHour: number,
	toHour: number,
	selectedDateTs: number,
	selectedFirstDayPeriodTs: number | null,
	viewDateTs: number,
	deletingBookings: { [key: number ]: number },
	deletingResources: { [key: number ]: number },
	deletingWaitListItemIds: { [key: number ]: number },
	selectedPlacementSlots: { [key: string ]: Object },
	hoveredPlacementSlot: HoveredPlacementSlot | null,
	busySlots: { [key: string ]: Object },
	disabledBusySlots: { [key: string ]: Object },
	resourcesIds: number[],
	pinnedResourceIds: number[],
	isIntersectionForAll: boolean,
	counterMarks: string[],
	freeMarks: string[],
	totalClients: number,
	totalNewClientsToday: number,
	moneyStatistics: MoneyStatistics | null,
	intersections: Intersections,
	timezone: string,
	editingBookingId: number,
	editingWaitListItemId: number,
	draggedBookingId: number,
	draggedBookingResourceId: number,
	draggedDataTransfer: DraggedDataTransfer,
	resizedBookingId: number,
	mousePosition: MousePosition,
	isShownTrialPopup: boolean,
	animationPause: boolean,
	createdFromEmbedBookings: { [key: number | string ]: number | string },
	createdFromEmbedWaitListItems: { [key: number | string ]: number | string },
	menuOpenedForBookingKey: string,
	menuOpenedForWaitListItem: number,
	enabledFeature: EnabledFeatures,
	shouldShowWhatsAppEmergency: boolean,
	aiCallBannerMode: $Values<typeof AiCallBannerMode> | null,
	isAiCallAhaShown: boolean,
}

export type CellStats = {
	busySlotsCount: number,
	freeSlotsCount: number,
};

export type Cell = {
	id: string,
	minutes: number,
	fromTs: number,
	toTs: number,
	resourceId: number,
};

export type HoveredPlacementSlot = Cell & {
	stats: CellStats | null,
	isFixed: Boolean | null,
};

export type Intersections = {
	[resourceId: number | 0]: number[],
};

export type MousePosition = {
	top: number,
	left: number,
};

export type MoneyStatistics = {
	today: {
		currencyId: string,
		opportunity: number,
	}[],
	month: {
		currencyId: string,
		opportunity: number,
	}[],
};

export type Occupancy = {
	fromTs: number,
	toTs: number,
	resourcesIds: number[],
};

export type DraggedDataTransfer = {
	id: number,
	resourceId: number,
	kind: $Values<typeof DraggedElementKind> | null,
}

export type EnabledFeatures = {
	booking: boolean;
	bookingCalendar: boolean;
	bookingWaitlist: boolean;
	bookingOverbooking: boolean;
	bookingMulti: boolean;
	bookingCrmSlider: boolean;
	bookingNotificationsSettings: boolean;
	bookingNotificationsAiCall: boolean;
	bookingLong: boolean;
}
