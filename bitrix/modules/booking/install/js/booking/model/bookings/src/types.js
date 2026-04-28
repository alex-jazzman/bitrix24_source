import { ClientData } from 'booking.model.clients';
import { EntityTypeId } from 'booking.const';

export opaque type BookingId = number;

export type BookingsState = {
	collection: { [bookingId: string]: BookingModel }
};

export type BookingCounterType = 'booking_unconfirmed' | 'booking_delayed';
export type BookingCounter = {
	type: BookingCounterType,
	value: 0 | 1,
};

export type BookingModel = {
	id: BookingId,
	updatedAt: number,
	resourcesIds: number[],
	primaryClient: ClientData,
	clients: ClientData[],
	counter: number,
	counters: BookingCounter[],
	name: string,
	dateFromTs: number,
	dateToTs: number,
	timezoneFrom: string,
	timezoneTo: string,
	rrule: string,
	isConfirmed: boolean,
	visitStatus: string,
	note: string | null,
	externalData: DealData[],
	messages: MessageModel[],
	skus: SkuModel[],
	payment: PaymentModel,
};

export type DealData = {
	moduleId: string,
	entityTypeId: $Values<typeof EntityTypeId>,
	value: string,
	data: {
		createdTimestamp: number,
		currencyId: string,
		opportunity: number,
	},
};

export type OverbookingMap = Map<number, OverbookingMapItem>;

export type OverbookingMapItem = {
	id: BookingId,
	booking: BookingModel,
	items: OverbookingResourceIntersections[],
};

export type OverbookingResourceIntersections = {
	resourceId: number,
	shifted: boolean,
	intersections: OverbookingIntersection[],
};

export type OverbookingIntersection = {
	id: number,
	dateFromTs: number,
	dateToTs: number,
};

export type MessageModel = {
	id: number,
	bookingId: number,
	notificationType: string,
};

export type SkuModel = {
	id: number,
	name: string,
	price: number,
	currencyId: string,
};

export type PaymentModel = {
	id: number,
	isPaid: boolean,
	isPaidManually: boolean,
};
