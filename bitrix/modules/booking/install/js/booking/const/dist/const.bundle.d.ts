/* eslint-disable */
type HelpDesk = typeof BX.Booking.Const.HelpDesk;

type CrmFormTemplatesWithSku = typeof BX.Booking.Const.CrmFormTemplatesWithSku;

type DateFormat = typeof BX.Booking.Const.DateFormat;

type NotificationFieldsMap = typeof BX.Booking.Const.NotificationFieldsMap;

type Grid = typeof BX.Booking.Const.Grid;

declare namespace BX.Booking.Const {
	enum AhaMoment {
		Banner = "banner",
		TrialBanner = "trial_banner",
		AddResource = "add_resource",
		MessageTemplate = "message_template",
		AddClient = "add_client",
		ResourceWorkload = "resource_workload",
		ResourceIntersection = "resource_intersection",
		ExpandGrid = "expand_grid",
		SelectResources = "select_resources",
		CyclePopup = "cycle_popup",
		SearchNavigation = "search_navigation",
		IntegrationMapsYa = "integration_maps_ya",
		WeekView = "week_view"
	}

	enum AiCallBannerMode {
		Invitation = "invitation",
		AutoSwitched = "auto_switched"
	}

	const HelpDesk: Readonly<{
		readonly Intersection: {
			readonly code: "23712054";
			readonly anchorCode: "inte";
		};
		readonly ResourceIntegrationSettings: {
			readonly code: "23661822";
			readonly anchorCode: "calen";
		};
		readonly ResourceBaseFields: {
			readonly code: "23661822";
			readonly anchorCode: "";
		};
		readonly ResourceType: {
			readonly code: "23661822";
			readonly anchorCode: "reso";
		};
		readonly ResourceSchedule: {
			readonly code: "23661822";
			readonly anchorCode: "show";
		};
		readonly ResourceWorkTime: {
			readonly code: "23661822";
			readonly anchorCode: "sche";
		};
		readonly ResourceSlotLength: {
			readonly code: "23661822";
			readonly anchorCode: "dur";
		};
		readonly ResourceNotificationInfo: {
			readonly code: "23661926";
			readonly anchorCode: "mess";
		};
		readonly ResourceNotificationConfirmation: {
			readonly code: "23661926";
			readonly anchorCode: "conf";
		};
		readonly ResourceNotificationReminder: {
			readonly code: "23661926";
			readonly anchorCode: "remi";
		};
		readonly ResourceNotificationLate: {
			readonly code: "23661926";
			readonly anchorCode: "late";
		};
		readonly ResourceNotificationFeedback: {
			readonly code: "23661926";
			readonly anchorCode: "feed";
		};
		readonly ResourceNotificationCancellation: {
			readonly code: "23661926";
			readonly anchorCode: "canc";
		};
		readonly ResourceTariffInfo: {
			readonly code: "23661926";
			readonly anchorCode: "";
		};
		readonly AhaSelectResources: {
			readonly code: "23661972";
			readonly anchorCode: "filt";
		};
		readonly AhaResourceWorkload: {
			readonly code: "23661972";
			readonly anchorCode: "cont";
		};
		readonly AhaResourceIntersection: {
			readonly code: "23712054";
			readonly anchorCode: "inte";
		};
		readonly AhaAddResource: {
			readonly code: "23661822";
			readonly anchorCode: "";
		};
		readonly AhaMessageTemplate: {
			readonly code: "23661926";
			readonly anchorCode: "";
		};
		readonly BookingActionsDeal: {
			readonly code: "23661964";
			readonly anchorCode: "deal";
		};
		readonly BookingActionsMessage: {
			readonly code: "23661964";
			readonly anchorCode: "remind";
		};
		readonly BookingActionsConfirmation: {
			readonly code: "23661964";
			readonly anchorCode: "appr";
		};
		readonly BookingActionsVisit: {
			readonly code: "23661964";
			readonly anchorCode: "visit";
		};
		readonly WaitListDescription: {
			readonly code: "24846212";
			readonly anchorCode: "";
		};
		readonly ResourceYandexIntegration: {
			readonly code: "26922108";
			readonly anchorCode: "";
		};
		readonly ResourceYandexIntegrationServices: {
			readonly code: "26922108";
			readonly anchorCode: "serv";
		};
	}>;

	enum BookingSource {
		Internal = "internal",
		Yandex = "yandex",
		Crm = "crm_form",
		Ai = "mcp_tools"
	}

	enum BusySlot {
		OffHours = "offHours",
		Intersection = "intersection",
		IntersectionOverbooking = "intersection-overbooking"
	}

	enum CrmEntity {
		Contact = "CONTACT",
		Company = "COMPANY",
		Deal = "DEAL"
	}

	enum CrmFormTemplateId {
		BookingAutoSelection = "booking_auto_selection",
		BookingAnyResource = "booking_any_resource",
		BookingManualSettings = "booking_manual_settings",
		BookingAutoSelectionPay = "booking_auto_selection_pay",
		BookingAnyResourcePay = "booking_any_resource_pay",
		BookingManualSettingsPay = "booking_manual_settings_pay",
		BookingAutoSelectionSku = "booking_auto_selection_services",
		BookingAnyResourceSku = "booking_any_resource_services",
		BookingManualSettingsSku = "booking_manual_settings_services"
	}

	enum CrmFormSettingsDataPropName {
		autoSelection = "autoSelection",
		default = "default",
		isAutoSelectionOn = "isAutoSelectionOn"
	}

	const CrmFormTemplatesWithSku: readonly [CrmFormTemplateId.BookingAutoSelectionPay, CrmFormTemplateId.BookingAnyResourcePay, CrmFormTemplateId.BookingManualSettingsPay, CrmFormTemplateId.BookingAutoSelectionSku, CrmFormTemplateId.BookingAnyResourceSku, CrmFormTemplateId.BookingManualSettingsSku];

	const DateFormat: Readonly<{
		readonly Server: "Y-m-d";
		readonly ServerParse: "YYYY-MM-DD";
		readonly WeekDays: readonly ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
	}>;

	enum EntityDataAttribute {
		Booking = "booking",
		WaitListItem = "wait-list-item"
	}

	enum EntitySelectorEntity {
		Deal = "deal",
		Resource = "resource",
		Room = "room",
		User = "user",
		ResourceType = "resource-type",
		Product = "product"
	}

	enum EntitySelectorTab {
		Recent = "recents"
	}

	enum EntityTypeId {
		Company = "COMPANY",
		Contact = "CONTACT",
		Deal = "DEAL",
		Lead = "LEAD"
	}

	enum EventName {
		CloseWizard = "booking:resource-creation-wizard:close",
		CloseYandexIntegrationWizard = "booking:yandex-integration-wizard:close",
		CloseSkuResourcesEditor = "booking:sku-resources-editor:close",
		CreateBookings = "booking:booking:create",
		DeleteBooking = "booking:booking:delete",
		UpdateBooking = "booking:booking:update",
		StartLockedBookingAnimation = "booking:booking:startLockedBookingAnimation",
		BookingOpenSkusSettings = "booking:booking:open-skus-settings",
		MultiBookingShowPreviousPeriod = "booking:booking:multi-booking-show-previous-period",
		MultiBookingShowNextPeriod = "booking:booking:multi-booking-show-next-period",
		AiCallBannerClosed = "booking:banner:ai-call:closed"
	}

	enum Limit {
		ResourcesDialog = 20
	}

	enum LimitFeatureId {
		CalendarIntegration = "booking_calendar",
		MultiResources = "booking_multi",
		NotificationsSettings = "booking_notifications_settings",
		Overbooking = "booking_overbooking",
		Waitlist = "booking_waitlist",
		MultidayBooking = "booking_long"
	}

	enum Model {
		BookingInfo = "booking-info",
		Bookings = "bookings",
		Clients = "clients",
		Counters = "counters",
		Dictionary = "dictionary",
		Favorites = "favorites",
		Interface = "interface",
		MainResources = "main-resources",
		MessageStatus = "message-status",
		Notifications = "notifications",
		ResourceCreationWizard = "resource-creation-wizard",
		YandexIntegrationWizard = "yandex-integration-wizard",
		ResourceTypes = "resourceTypes",
		Resources = "resources",
		WaitList = "wait-list",
		Filter = "filter",
		SaleChannels = "sale-channels",
		SkuResourcesEditor = "sku-resources-editor",
		ResourceSkuRelations = "resource-sku-relations",
		Sku = "sku"
	}

	enum Module {
		Booking = "booking",
		Crm = "crm"
	}

	const NotificationFieldsMap: Readonly<{
		readonly NotificationOn: typeof NotificationOn;
		readonly TemplateType: typeof TemplateType;
		readonly Settings: Readonly<{
			readonly info: readonly ["infoNotificationDelay"];
			readonly confirmation: readonly ["confirmationNotificationDelay", "confirmationNotificationRepetitions", "confirmationNotificationRepetitionsInterval", "confirmationCounterDelay"];
			readonly reminder: readonly ["reminderNotificationDelay"];
			readonly delayed: readonly ["delayedNotificationDelay", "delayedCounterDelay"];
			readonly feedback: readonly [];
			readonly cancellation: readonly ["cancellationNotificationDelay"];
		}>;
	}>;

	enum NotificationOn {
		info = "isInfoNotificationOn",
		confirmation = "isConfirmationNotificationOn",
		reminder = "isReminderNotificationOn",
		delayed = "isDelayedNotificationOn",
		feedback = "isFeedbackNotificationOn",
		cancellation = "isCancellationNotificationOn"
	}

	enum TemplateType {
		info = "templateTypeInfo",
		confirmation = "templateTypeConfirmation",
		reminder = "templateTypeReminder",
		delayed = "templateTypeDelayed",
		feedback = "templateTypeFeedback"
	}

	enum NotificationTemplateType {
		Base = "base",
		Animate = "animate",
		Inanimate = "inanimate",
		InanimateLong = "inanimate_long"
	}

	enum Option {
		BookingEnabled = "aha_banner",
		IntersectionForAll = "IntersectionForAll",
		WaitListExpanded = "wait_list_expanded",
		GridMode = "grid_mode",
		CalendarExpanded = "calendar_expanded",
		NotificationsExpanded = "notificationsExpanded",
		whatsAppEmergencyNotified = "whatsapp_emergency_notified",
		AhaBanner = "aha_banner",
		AhaTrialBanner = "aha_trial_banner",
		AhaAddResource = "aha_add_resource",
		AhaMessageTemplate = "aha_message_template",
		AhaAddClient = "aha_add_client",
		AhaResourceWorkload = "aha_resource_workload",
		AhaResourceIntersection = "aha_resource_intersection",
		AhaExpandGrid = "aha_expand_grid",
		AhaSelectResources = "aha_select_resources",
		AhaCyclePopup = "aha_cycle_popup",
		AhaSearchNavigation = "aha_search_navigation",
		AhaIntegrationMapsYa = "aha_integration_maps_ya",
		AhaWeekView = "aha_week_view"
	}

	enum NotificationChannel {
		WhatsApp = "wha",
		Sms = "sms"
	}

	enum BookingCounterType {
		Delayed = "booking_delayed",
		Unconfirmed = "booking_unconfirmed"
	}

	enum DraggedElementKind {
		Booking = "booking",
		WaitListItem = "wait-list-item"
	}

	enum VisitStatus {
		Unknown = "unknown",
		Visited = "visited",
		NotVisited = "notVisited"
	}

	enum ResourceEntityType {
		Calendar = "calendar",
		Sku = "sku"
	}

	enum IntegrationMapItemCode {
		Yandex = "yandex",
		Gis = "gis"
	}

	enum IntegrationMapItemStatus {
		Connected = "connected",
		NotConnected = "not_connected",
		InProgress = "in_progress"
	}

	enum SkuResourcesEditorTab {
		Skus = "SkusView",
		Resources = "ResourcesView"
	}

	const Grid: Readonly<{
		readonly Duration: {
			readonly Day: 1;
			readonly Week: 7;
		};
		readonly Mode: {
			readonly Day: "day";
			readonly Week: "week";
		};
	}>;

	enum ScrollDirection {
		Vertical = "scrollTop",
		Horizontal = "scrollLeft"
	}

	enum Communication {
		AiCall = "ai_call",
		Bitrix24 = "bitrix24"
	}

	enum NavigationUnit {
		day = "day",
		week = "week",
		month = "month"
	}

	enum NavigationDirection {
		previous = -1,
		next = 1
	}

	enum AnalyticsTool {
		booking = "booking"
	}

	enum AnalyticsCategory {
		booking = "booking",
		waitlist = "waitlist",
		banners = "banners"
	}

	enum AnalyticsEvent {
		showPopup = "show_popup",
		clickAddResource = "click_add_resource",
		addResourceStep1 = "add_resource_step1",
		addResourceStep2 = "add_resource_step2",
		addResourceFinish = "add_resource_finish",
		acceptAgreement = "accept_agreement"
	}

	enum AnalyticsType {
		showPopup = "show_popup",
		clickAddResource = "click_add_resource"
	}

	enum AnalyticsCSection {
		booking = "booking",
		crm = "crm",
		mainMenu = "main_menu"
	}

	enum AnalyticsElement {
		addButton = "add_button"
	}

	enum AnalyticsCSubSection {
		accept = "accept",
		deny = "deny"
	}
}
