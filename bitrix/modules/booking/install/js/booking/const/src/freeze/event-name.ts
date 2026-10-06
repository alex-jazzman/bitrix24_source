export enum EventName {
	CloseWizard = 'booking:resource-creation-wizard:close',
	CloseYandexIntegrationWizard = 'booking:yandex-integration-wizard:close',
	CloseSkuResourcesEditor = 'booking:sku-resources-editor:close',
	CreateBookings = 'booking:booking:create',
	DeleteBooking = 'booking:booking:delete',
	UpdateBooking = 'booking:booking:update',
	StartLockedBookingAnimation = 'booking:booking:startLockedBookingAnimation',
	BookingOpenSkusSettings = 'booking:booking:open-skus-settings',
	MultiBookingShowPreviousPeriod = 'booking:booking:multi-booking-show-previous-period',
	MultiBookingShowNextPeriod = 'booking:booking:multi-booking-show-next-period',
	AiCallBannerClosed = 'booking:banner:ai-call:closed',
}
