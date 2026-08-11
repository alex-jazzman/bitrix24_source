/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports) {
	'use strict';

	const AhaMoment = Object.freeze({
		Banner: 'banner',
		TrialBanner: 'trial_banner',
		AddResource: 'add_resource',
		MessageTemplate: 'message_template',
		AddClient: 'add_client',
		ResourceWorkload: 'resource_workload',
		ResourceIntersection: 'resource_intersection',
		ExpandGrid: 'expand_grid',
		SelectResources: 'select_resources',
		CyclePopup: 'cycle_popup',
		SearchNavigation: 'search_navigation',
		IntegrationMapsYa: 'integration_maps_ya',
		WeekView: 'week_view'
	});

	const AiCallBannerMode = Object.freeze({
		Invitation: 'invitation',
		AutoSwitched: 'auto_switched'
	});

	const HelpDesk = Object.freeze({
		Intersection: {
			code: '23712054',
			anchorCode: 'inte'
		},
		ResourceIntegrationSettings: {
			code: '23661822',
			anchorCode: 'calen'
		},
		ResourceBaseFields: {
			code: '23661822',
			anchorCode: ''
		},
		ResourceType: {
			code: '23661822',
			anchorCode: 'reso'
		},
		ResourceSchedule: {
			code: '23661822',
			anchorCode: 'show'
		},
		ResourceWorkTime: {
			code: '23661822',
			anchorCode: 'sche'
		},
		ResourceSlotLength: {
			code: '23661822',
			anchorCode: 'dur'
		},
		ResourceNotificationInfo: {
			code: '23661926',
			anchorCode: 'mess'
		},
		ResourceNotificationConfirmation: {
			code: '23661926',
			anchorCode: 'conf'
		},
		ResourceNotificationReminder: {
			code: '23661926',
			anchorCode: 'remi'
		},
		ResourceNotificationLate: {
			code: '23661926',
			anchorCode: 'late'
		},
		ResourceNotificationFeedback: {
			code: '23661926',
			anchorCode: 'feed'
		},
		ResourceNotificationCancellation: {
			code: '23661926',
			anchorCode: 'canc'
		},
		ResourceTariffInfo: {
			code: '23661926',
			anchorCode: ''
		},
		AhaSelectResources: {
			code: '23661972',
			anchorCode: 'filt'
		},
		AhaResourceWorkload: {
			code: '23661972',
			anchorCode: 'cont'
		},
		AhaResourceIntersection: {
			code: '23712054',
			anchorCode: 'inte'
		},
		AhaAddResource: {
			code: '23661822',
			anchorCode: ''
		},
		AhaMessageTemplate: {
			code: '23661926',
			anchorCode: ''
		},
		BookingActionsDeal: {
			code: '23661964',
			anchorCode: 'deal'
		},
		BookingActionsMessage: {
			code: '23661964',
			anchorCode: 'remind'
		},
		BookingActionsConfirmation: {
			code: '23661964',
			anchorCode: 'appr'
		},
		BookingActionsVisit: {
			code: '23661964',
			anchorCode: 'visit'
		},
		WaitListDescription: {
			code: '24846212',
			anchorCode: ''
		},
		ResourceYandexIntegration: {
			code: '26922108',
			anchorCode: ''
		},
		ResourceYandexIntegrationServices: {
			code: '26922108',
			anchorCode: 'serv'
		}
	});

	const BookingSource = Object.freeze({
		Internal: 'internal',
		Yandex: 'yandex',
		Crm: 'crm_form',
		Ai: 'mcp_tools'
	});

	const BusySlot = Object.freeze({
		OffHours: 'offHours',
		Intersection: 'intersection',
		IntersectionOverbooking: 'intersection-overbooking'
	});

	const CrmEntity = Object.freeze({
		Contact: 'CONTACT',
		Company: 'COMPANY',
		Deal: 'DEAL'
	});

	const CrmFormTemplateId = Object.freeze({
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
		BookingManualSettingsSku: 'booking_manual_settings_services'
	});
	const CrmFormSettingsDataPropName = Object.freeze({
		autoSelection: 'autoSelection',
		default: 'default',
		isAutoSelectionOn: 'isAutoSelectionOn'
	});
	const CrmFormTemplatesWithSku = Object.freeze([CrmFormTemplateId.BookingAutoSelectionPay, CrmFormTemplateId.BookingAnyResourcePay, CrmFormTemplateId.BookingManualSettingsPay, CrmFormTemplateId.BookingAutoSelectionSku, CrmFormTemplateId.BookingAnyResourceSku, CrmFormTemplateId.BookingManualSettingsSku]);

	const DateFormat = Object.freeze({
		Server: 'Y-m-d',
		ServerParse: 'YYYY-MM-DD',
		WeekDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
	});

	const EntityDataAttribute = Object.freeze({
		Booking: 'booking',
		WaitListItem: 'wait-list-item'
	});

	const EntitySelectorEntity = Object.freeze({
		Deal: 'deal',
		Resource: 'resource',
		Room: 'room',
		User: 'user',
		ResourceType: 'resource-type',
		Product: 'product'
	});

	const EntitySelectorTab = Object.freeze({
		Recent: 'recents'
	});

	const EntityTypeId = Object.freeze({
		Company: 'COMPANY',
		Contact: 'CONTACT',
		Deal: 'DEAL',
		Lead: 'LEAD'
	});

	const EventName = Object.freeze({
		CloseWizard: 'booking:resource-creation-wizard:close',
		CloseYandexIntegrationWizard: 'booking:yandex-integration-wizard:close',
		CloseSkuResourcesEditor: 'booking:sku-resources-editor:close',
		CreateBookings: 'booking:booking:create',
		DeleteBooking: 'booking:booking:delete',
		UpdateBooking: 'booking:booking:update',
		StartLockedBookingAnimation: 'booking:booking:startLockedBookingAnimation',
		BookingOpenSkusSettings: 'booking:booking:open-skus-settings',
		MultiBookingShowPreviousPeriod: 'booking:booking:multi-booking-show-previous-period',
		MultiBookingShowNextPeriod: 'booking:booking:multi-booking-show-next-period',
		AiCallBannerClosed: 'booking:banner:ai-call:closed'
	});

	const Limit = Object.freeze({
		ResourcesDialog: 20
	});
	const LimitFeatureId = Object.freeze({
		CalendarIntegration: 'booking_calendar',
		MultiResources: 'booking_multi',
		NotificationsSettings: 'booking_notifications_settings',
		Overbooking: 'booking_overbooking',
		Waitlist: 'booking_waitlist',
		MultidayBooking: 'booking_long'
	});

	const Model = Object.freeze({
		BookingInfo: 'booking-info',
		Bookings: 'bookings',
		Clients: 'clients',
		Counters: 'counters',
		Dictionary: 'dictionary',
		Favorites: 'favorites',
		Interface: 'interface',
		MainResources: 'main-resources',
		MessageStatus: 'message-status',
		Notifications: 'notifications',
		ResourceCreationWizard: 'resource-creation-wizard',
		YandexIntegrationWizard: 'yandex-integration-wizard',
		ResourceTypes: 'resourceTypes',
		Resources: 'resources',
		WaitList: 'wait-list',
		Filter: 'filter',
		SaleChannels: 'sale-channels',
		SkuResourcesEditor: 'sku-resources-editor',
		ResourceSkuRelations: 'resource-sku-relations',
		Sku: 'sku'
	});

	const Module = Object.freeze({
		Booking: 'booking',
		Crm: 'crm'
	});

	const NotificationOn = Object.freeze({
		info: 'isInfoNotificationOn',
		confirmation: 'isConfirmationNotificationOn',
		reminder: 'isReminderNotificationOn',
		delayed: 'isDelayedNotificationOn',
		feedback: 'isFeedbackNotificationOn',
		cancellation: 'isCancellationNotificationOn'
	});
	const TemplateType = Object.freeze({
		info: 'templateTypeInfo',
		confirmation: 'templateTypeConfirmation',
		reminder: 'templateTypeReminder',
		delayed: 'templateTypeDelayed',
		feedback: 'templateTypeFeedback'
	});
	const Settings = Object.freeze({
		info: ['infoNotificationDelay'],
		confirmation: ['confirmationNotificationDelay', 'confirmationNotificationRepetitions', 'confirmationNotificationRepetitionsInterval', 'confirmationCounterDelay'],
		reminder: ['reminderNotificationDelay'],
		delayed: ['delayedNotificationDelay', 'delayedCounterDelay'],
		feedback: [],
		cancellation: ['cancellationNotificationDelay']
	});
	const NotificationFieldsMap = Object.freeze({
		NotificationOn,
		TemplateType,
		Settings
	});

	const Option = Object.freeze({
		BookingEnabled: 'aha_banner',
		IntersectionForAll: 'IntersectionForAll',
		WaitListExpanded: 'wait_list_expanded',
		GridMode: 'grid_mode',
		CalendarExpanded: 'calendar_expanded',
		NotificationsExpanded: 'notificationsExpanded',
		whatsAppEmergencyNotified: 'whatsapp_emergency_notified',
		// AhaMoments
		AhaBanner: 'aha_banner',
		AhaTrialBanner: 'aha_trial_banner',
		AhaAddResource: 'aha_add_resource',
		AhaMessageTemplate: 'aha_message_template',
		AhaAddClient: 'aha_add_client',
		AhaResourceWorkload: 'aha_resource_workload',
		AhaResourceIntersection: 'aha_resource_intersection',
		AhaExpandGrid: 'aha_expand_grid',
		AhaSelectResources: 'aha_select_resources',
		AhaCyclePopup: 'aha_cycle_popup',
		AhaSearchNavigation: 'aha_search_navigation',
		AhaIntegrationMapsYa: 'aha_integration_maps_ya',
		AhaWeekView: 'aha_week_view'
	});

	const NotificationChannel = Object.freeze({
		WhatsApp: 'wha',
		Sms: 'sms'
	});

	const BookingCounterType = Object.freeze({
		Delayed: 'booking_delayed',
		Unconfirmed: 'booking_unconfirmed'
	});

	const DraggedElementKind = Object.freeze({
		Booking: 'booking',
		WaitListItem: 'wait-list-item'
	});

	const VisitStatus = Object.freeze({
		Unknown: 'unknown',
		Visited: 'visited',
		NotVisited: 'notVisited'
	});

	const ResourceEntityType = Object.freeze({
		Calendar: 'calendar',
		Sku: 'sku'
	});

	const IntegrationMapItemCode = Object.freeze({
		Yandex: 'yandex',
		Gis: 'gis'
	});
	const IntegrationMapItemStatus = Object.freeze({
		Connected: 'connected',
		NotConnected: 'not_connected',
		InProgress: 'in_progress'
	});

	const SkuResourcesEditorTab = Object.freeze({
		Skus: 'SkusView',
		Resources: 'ResourcesView'
	});

	const Grid = Object.freeze({
		Duration: {
			Day: 1,
			Week: 7
		},
		Mode: {
			Day: 'day',
			Week: 'week'
		}
	});

	const ScrollDirection = {
		Vertical: 'scrollTop',
		Horizontal: 'scrollLeft'
	};

	const NavigationUnit = {
		day: 'day',
		week: 'week',
		month: 'month'
	};
	const NavigationDirection = {
		previous: -1,
		next: 1
	};

	const Communication = Object.freeze({
		AiCall: 'ai_call',
		Bitrix24: 'bitrix24'
	});

	const AnalyticsTool = Object.freeze({
		booking: 'booking'
	});
	const AnalyticsCategory = Object.freeze({
		booking: 'booking',
		waitlist: 'waitlist',
		banners: 'banners'
	});
	const AnalyticsEvent = Object.freeze({
		showPopup: 'show_popup',
		clickAddResource: 'click_add_resource',
		addResourceStep1: 'add_resource_step1',
		addResourceStep2: 'add_resource_step2',
		addResourceFinish: 'add_resource_finish',
		acceptAgreement: 'accept_agreement'
	});
	const AnalyticsType = Object.freeze({
		showPopup: 'show_popup',
		clickAddResource: 'click_add_resource'
	});
	const AnalyticsCSection = Object.freeze({
		booking: 'booking',
		crm: 'crm',
		mainMenu: 'main_menu'
	});
	const AnalyticsElement = Object.freeze({
		addButton: 'add_button'
	});
	const AnalyticsCSubSection = Object.freeze({
		accept: 'accept',
		deny: 'deny'
	});

	exports.AhaMoment = AhaMoment;
	exports.AiCallBannerMode = AiCallBannerMode;
	exports.AnalyticsCSection = AnalyticsCSection;
	exports.AnalyticsCSubSection = AnalyticsCSubSection;
	exports.AnalyticsCategory = AnalyticsCategory;
	exports.AnalyticsElement = AnalyticsElement;
	exports.AnalyticsEvent = AnalyticsEvent;
	exports.AnalyticsTool = AnalyticsTool;
	exports.AnalyticsType = AnalyticsType;
	exports.BookingCounterType = BookingCounterType;
	exports.BookingSource = BookingSource;
	exports.BusySlot = BusySlot;
	exports.Communication = Communication;
	exports.CrmEntity = CrmEntity;
	exports.CrmFormSettingsDataPropName = CrmFormSettingsDataPropName;
	exports.CrmFormTemplateId = CrmFormTemplateId;
	exports.CrmFormTemplatesWithSku = CrmFormTemplatesWithSku;
	exports.DateFormat = DateFormat;
	exports.DraggedElementKind = DraggedElementKind;
	exports.EntityDataAttribute = EntityDataAttribute;
	exports.EntitySelectorEntity = EntitySelectorEntity;
	exports.EntitySelectorTab = EntitySelectorTab;
	exports.EntityTypeId = EntityTypeId;
	exports.EventName = EventName;
	exports.Grid = Grid;
	exports.HelpDesk = HelpDesk;
	exports.IntegrationMapItemCode = IntegrationMapItemCode;
	exports.IntegrationMapItemStatus = IntegrationMapItemStatus;
	exports.Limit = Limit;
	exports.LimitFeatureId = LimitFeatureId;
	exports.Model = Model;
	exports.Module = Module;
	exports.NavigationDirection = NavigationDirection;
	exports.NavigationUnit = NavigationUnit;
	exports.NotificationChannel = NotificationChannel;
	exports.NotificationFieldsMap = NotificationFieldsMap;
	exports.Option = Option;
	exports.ResourceEntityType = ResourceEntityType;
	exports.ScrollDirection = ScrollDirection;
	exports.SkuResourcesEditorTab = SkuResourcesEditorTab;
	exports.VisitStatus = VisitStatus;

})(this.BX.Booking.Const = this.BX.Booking.Const || {});
//# sourceMappingURL=const.bundle.js.map
