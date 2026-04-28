export const CrmFormTemplateId = Object.freeze({
	BookingAutoSelection: 'booking_auto_selection',
	BookingAnyResource: 'booking_any_resource',
	BookingManualSettings: 'booking_manual_settings',
	// with pay
	BookingAutoSelectionPay: 'booking_auto_selection_pay',
	BookingAnyResourcePay: 'booking_any_resource_pay',
	BookingManualSettingsPay: 'booking_manual_settings_pay',
	// with service
	BookingAutoSelectionSku: 'booking_auto_selection_services',
	BookingAnyResourceSku: 'booking_any_resource_services',
	BookingManualSettingsSku: 'booking_manual_settings_services',
});

export const CrmFormSettingsDataPropName = Object.freeze({
	autoSelection: 'autoSelection',
	default: 'default',
	isAutoSelectionOn: 'isAutoSelectionOn',
});

export const CrmFormTemplatesWithSku = Object.freeze([
	CrmFormTemplateId.BookingAutoSelectionPay,
	CrmFormTemplateId.BookingAnyResourcePay,
	CrmFormTemplateId.BookingManualSettingsPay,
	CrmFormTemplateId.BookingAutoSelectionSku,
	CrmFormTemplateId.BookingAnyResourceSku,
	CrmFormTemplateId.BookingManualSettingsSku,
]);
