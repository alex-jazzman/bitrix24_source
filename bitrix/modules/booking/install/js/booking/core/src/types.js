import type{ AhaMoment } from 'booking.const';
import type { MoneyStatistics } from 'booking.model.interface';

export type BookingParams = {
	container: HTMLElement,
	afterTitleContainer: HTMLElement,
	counterPanelContainer: HTMLElement,
	isSlider: boolean,
	currentUserId: number,
	isFeatureEnabled: boolean,
	features: Feature[],
	canTurnOnTrial: boolean,
	canTurnOnDemo: boolean,
	timezone: string,
	filterId: string,
	editingBookingId: number,
	editingWaitListItemId: ?number,
	ahaMoments: $Values<typeof AhaMoment>,
	totalClients: number,
	totalClientsToday: number,
	moneyStatistics: MoneyStatistics,
	isCalendarExpanded: boolean,
	isWaitListExpanded: boolean,
	embedItems: {
		id: number,
		code: string,
		module: string,
	}[],
};

export type InitCoreOptions = {
	skipCoreModels: ?boolean;
	skipPull: ?boolean;
}

export type Feature = {
	id: string;
	isEnabled: boolean;
}
