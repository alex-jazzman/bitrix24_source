/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports) {
	'use strict';

	exports.AhaMoment = void 0;
	(function (AhaMoment) {
		AhaMoment["Banner"] = "banner";
		AhaMoment["TrialBanner"] = "trial_banner";
		AhaMoment["AddResource"] = "add_resource";
		AhaMoment["MessageTemplate"] = "message_template";
		AhaMoment["AddClient"] = "add_client";
		AhaMoment["ResourceWorkload"] = "resource_workload";
		AhaMoment["ResourceIntersection"] = "resource_intersection";
		AhaMoment["ExpandGrid"] = "expand_grid";
		AhaMoment["SelectResources"] = "select_resources";
		AhaMoment["CyclePopup"] = "cycle_popup";
		AhaMoment["SearchNavigation"] = "search_navigation";
		AhaMoment["IntegrationMapsYa"] = "integration_maps_ya";
		AhaMoment["WeekView"] = "week_view";
	})(exports.AhaMoment || (exports.AhaMoment = {}));

	exports.AiCallBannerMode = void 0;
	(function (AiCallBannerMode) {
		AiCallBannerMode["Invitation"] = "invitation";
		AiCallBannerMode["AutoSwitched"] = "auto_switched";
	})(exports.AiCallBannerMode || (exports.AiCallBannerMode = {}));

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

	exports.BookingSource = void 0;
	(function (BookingSource) {
		BookingSource["Internal"] = "internal";
		BookingSource["Yandex"] = "yandex";
		BookingSource["Crm"] = "crm_form";
		BookingSource["Ai"] = "mcp_tools";
	})(exports.BookingSource || (exports.BookingSource = {}));

	exports.BusySlot = void 0;
	(function (BusySlot) {
		BusySlot["OffHours"] = "offHours";
		BusySlot["Intersection"] = "intersection";
		BusySlot["IntersectionOverbooking"] = "intersection-overbooking";
	})(exports.BusySlot || (exports.BusySlot = {}));

	exports.CrmEntity = void 0;
	(function (CrmEntity) {
		CrmEntity["Contact"] = "CONTACT";
		CrmEntity["Company"] = "COMPANY";
		CrmEntity["Deal"] = "DEAL";
	})(exports.CrmEntity || (exports.CrmEntity = {}));

	exports.CrmFormTemplateId = void 0;
	(function (CrmFormTemplateId) {
		CrmFormTemplateId["BookingAutoSelection"] = "booking_auto_selection";
		CrmFormTemplateId["BookingAnyResource"] = "booking_any_resource";
		CrmFormTemplateId["BookingManualSettings"] = "booking_manual_settings";
		CrmFormTemplateId["BookingAutoSelectionPay"] = "booking_auto_selection_pay";
		CrmFormTemplateId["BookingAnyResourcePay"] = "booking_any_resource_pay";
		CrmFormTemplateId["BookingManualSettingsPay"] = "booking_manual_settings_pay";
		CrmFormTemplateId["BookingAutoSelectionSku"] = "booking_auto_selection_services";
		CrmFormTemplateId["BookingAnyResourceSku"] = "booking_any_resource_services";
		CrmFormTemplateId["BookingManualSettingsSku"] = "booking_manual_settings_services";
	})(exports.CrmFormTemplateId || (exports.CrmFormTemplateId = {}));
	exports.CrmFormSettingsDataPropName = void 0;
	(function (CrmFormSettingsDataPropName) {
		CrmFormSettingsDataPropName["autoSelection"] = "autoSelection";
		CrmFormSettingsDataPropName["default"] = "default";
		CrmFormSettingsDataPropName["isAutoSelectionOn"] = "isAutoSelectionOn";
	})(exports.CrmFormSettingsDataPropName || (exports.CrmFormSettingsDataPropName = {}));
	const CrmFormTemplatesWithSku = Object.freeze([exports.CrmFormTemplateId.BookingAutoSelectionPay, exports.CrmFormTemplateId.BookingAnyResourcePay, exports.CrmFormTemplateId.BookingManualSettingsPay, exports.CrmFormTemplateId.BookingAutoSelectionSku, exports.CrmFormTemplateId.BookingAnyResourceSku, exports.CrmFormTemplateId.BookingManualSettingsSku]);

	const DateFormat = Object.freeze({
		Server: 'Y-m-d',
		ServerParse: 'YYYY-MM-DD',
		WeekDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
	});

	exports.EntityDataAttribute = void 0;
	(function (EntityDataAttribute) {
		EntityDataAttribute["Booking"] = "booking";
		EntityDataAttribute["WaitListItem"] = "wait-list-item";
	})(exports.EntityDataAttribute || (exports.EntityDataAttribute = {}));

	exports.EntitySelectorEntity = void 0;
	(function (EntitySelectorEntity) {
		EntitySelectorEntity["Deal"] = "deal";
		EntitySelectorEntity["Resource"] = "resource";
		EntitySelectorEntity["Room"] = "room";
		EntitySelectorEntity["User"] = "user";
		EntitySelectorEntity["ResourceType"] = "resource-type";
		EntitySelectorEntity["Product"] = "product";
	})(exports.EntitySelectorEntity || (exports.EntitySelectorEntity = {}));

	exports.EntitySelectorTab = void 0;
	(function (EntitySelectorTab) {
		EntitySelectorTab["Recent"] = "recents";
	})(exports.EntitySelectorTab || (exports.EntitySelectorTab = {}));

	exports.EntityTypeId = void 0;
	(function (EntityTypeId) {
		EntityTypeId["Company"] = "COMPANY";
		EntityTypeId["Contact"] = "CONTACT";
		EntityTypeId["Deal"] = "DEAL";
		EntityTypeId["Lead"] = "LEAD";
	})(exports.EntityTypeId || (exports.EntityTypeId = {}));

	exports.EventName = void 0;
	(function (EventName) {
		EventName["CloseWizard"] = "booking:resource-creation-wizard:close";
		EventName["CloseYandexIntegrationWizard"] = "booking:yandex-integration-wizard:close";
		EventName["CloseSkuResourcesEditor"] = "booking:sku-resources-editor:close";
		EventName["CreateBookings"] = "booking:booking:create";
		EventName["DeleteBooking"] = "booking:booking:delete";
		EventName["UpdateBooking"] = "booking:booking:update";
		EventName["StartLockedBookingAnimation"] = "booking:booking:startLockedBookingAnimation";
		EventName["BookingOpenSkusSettings"] = "booking:booking:open-skus-settings";
		EventName["MultiBookingShowPreviousPeriod"] = "booking:booking:multi-booking-show-previous-period";
		EventName["MultiBookingShowNextPeriod"] = "booking:booking:multi-booking-show-next-period";
		EventName["AiCallBannerClosed"] = "booking:banner:ai-call:closed";
	})(exports.EventName || (exports.EventName = {}));

	exports.Limit = void 0;
	(function (Limit) {
		Limit[Limit["ResourcesDialog"] = 20] = "ResourcesDialog";
	})(exports.Limit || (exports.Limit = {}));
	exports.LimitFeatureId = void 0;
	(function (LimitFeatureId) {
		LimitFeatureId["CalendarIntegration"] = "booking_calendar";
		LimitFeatureId["MultiResources"] = "booking_multi";
		LimitFeatureId["NotificationsSettings"] = "booking_notifications_settings";
		LimitFeatureId["Overbooking"] = "booking_overbooking";
		LimitFeatureId["Waitlist"] = "booking_waitlist";
		LimitFeatureId["MultidayBooking"] = "booking_long";
	})(exports.LimitFeatureId || (exports.LimitFeatureId = {}));

	exports.Model = void 0;
	(function (Model) {
		Model["BookingInfo"] = "booking-info";
		Model["Bookings"] = "bookings";
		Model["Clients"] = "clients";
		Model["Counters"] = "counters";
		Model["Dictionary"] = "dictionary";
		Model["Favorites"] = "favorites";
		Model["Interface"] = "interface";
		Model["MainResources"] = "main-resources";
		Model["MessageStatus"] = "message-status";
		Model["Notifications"] = "notifications";
		Model["ResourceCreationWizard"] = "resource-creation-wizard";
		Model["YandexIntegrationWizard"] = "yandex-integration-wizard";
		Model["ResourceTypes"] = "resourceTypes";
		Model["Resources"] = "resources";
		Model["WaitList"] = "wait-list";
		Model["Filter"] = "filter";
		Model["SaleChannels"] = "sale-channels";
		Model["SkuResourcesEditor"] = "sku-resources-editor";
		Model["ResourceSkuRelations"] = "resource-sku-relations";
		Model["Sku"] = "sku";
	})(exports.Model || (exports.Model = {}));

	exports.Module = void 0;
	(function (Module) {
		Module["Booking"] = "booking";
		Module["Crm"] = "crm";
	})(exports.Module || (exports.Module = {}));

	var NotificationOn;
	(function (NotificationOn) {
		NotificationOn["info"] = "isInfoNotificationOn";
		NotificationOn["confirmation"] = "isConfirmationNotificationOn";
		NotificationOn["reminder"] = "isReminderNotificationOn";
		NotificationOn["delayed"] = "isDelayedNotificationOn";
		NotificationOn["feedback"] = "isFeedbackNotificationOn";
		NotificationOn["cancellation"] = "isCancellationNotificationOn";
	})(NotificationOn || (NotificationOn = {}));
	var TemplateType;
	(function (TemplateType) {
		TemplateType["info"] = "templateTypeInfo";
		TemplateType["confirmation"] = "templateTypeConfirmation";
		TemplateType["reminder"] = "templateTypeReminder";
		TemplateType["delayed"] = "templateTypeDelayed";
		TemplateType["feedback"] = "templateTypeFeedback";
	})(TemplateType || (TemplateType = {}));
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

	exports.NotificationTemplateType = void 0;
	(function (NotificationTemplateType) {
		NotificationTemplateType["Base"] = "base";
		NotificationTemplateType["Animate"] = "animate";
		NotificationTemplateType["Inanimate"] = "inanimate";
		NotificationTemplateType["InanimateLong"] = "inanimate_long";
	})(exports.NotificationTemplateType || (exports.NotificationTemplateType = {}));

	exports.Option = void 0;
	(function (Option) {
		Option["BookingEnabled"] = "aha_banner";
		Option["IntersectionForAll"] = "IntersectionForAll";
		Option["WaitListExpanded"] = "wait_list_expanded";
		Option["GridMode"] = "grid_mode";
		Option["CalendarExpanded"] = "calendar_expanded";
		Option["NotificationsExpanded"] = "notificationsExpanded";
		Option["whatsAppEmergencyNotified"] = "whatsapp_emergency_notified";
		Option["AhaBanner"] = "aha_banner";
		Option["AhaTrialBanner"] = "aha_trial_banner";
		Option["AhaAddResource"] = "aha_add_resource";
		Option["AhaMessageTemplate"] = "aha_message_template";
		Option["AhaAddClient"] = "aha_add_client";
		Option["AhaResourceWorkload"] = "aha_resource_workload";
		Option["AhaResourceIntersection"] = "aha_resource_intersection";
		Option["AhaExpandGrid"] = "aha_expand_grid";
		Option["AhaSelectResources"] = "aha_select_resources";
		Option["AhaCyclePopup"] = "aha_cycle_popup";
		Option["AhaSearchNavigation"] = "aha_search_navigation";
		Option["AhaIntegrationMapsYa"] = "aha_integration_maps_ya";
		Option["AhaWeekView"] = "aha_week_view";
	})(exports.Option || (exports.Option = {}));

	exports.NotificationChannel = void 0;
	(function (NotificationChannel) {
		NotificationChannel["WhatsApp"] = "wha";
		NotificationChannel["Sms"] = "sms";
	})(exports.NotificationChannel || (exports.NotificationChannel = {}));

	exports.BookingCounterType = void 0;
	(function (BookingCounterType) {
		BookingCounterType["Delayed"] = "booking_delayed";
		BookingCounterType["Unconfirmed"] = "booking_unconfirmed";
	})(exports.BookingCounterType || (exports.BookingCounterType = {}));

	exports.DraggedElementKind = void 0;
	(function (DraggedElementKind) {
		DraggedElementKind["Booking"] = "booking";
		DraggedElementKind["WaitListItem"] = "wait-list-item";
	})(exports.DraggedElementKind || (exports.DraggedElementKind = {}));

	exports.VisitStatus = void 0;
	(function (VisitStatus) {
		VisitStatus["Unknown"] = "unknown";
		VisitStatus["Visited"] = "visited";
		VisitStatus["NotVisited"] = "notVisited";
	})(exports.VisitStatus || (exports.VisitStatus = {}));

	exports.ResourceEntityType = void 0;
	(function (ResourceEntityType) {
		ResourceEntityType["Calendar"] = "calendar";
		ResourceEntityType["Sku"] = "sku";
	})(exports.ResourceEntityType || (exports.ResourceEntityType = {}));

	exports.IntegrationMapItemCode = void 0;
	(function (IntegrationMapItemCode) {
		IntegrationMapItemCode["Yandex"] = "yandex";
		IntegrationMapItemCode["Gis"] = "gis";
	})(exports.IntegrationMapItemCode || (exports.IntegrationMapItemCode = {}));
	exports.IntegrationMapItemStatus = void 0;
	(function (IntegrationMapItemStatus) {
		IntegrationMapItemStatus["Connected"] = "connected";
		IntegrationMapItemStatus["NotConnected"] = "not_connected";
		IntegrationMapItemStatus["InProgress"] = "in_progress";
	})(exports.IntegrationMapItemStatus || (exports.IntegrationMapItemStatus = {}));

	exports.SkuResourcesEditorTab = void 0;
	(function (SkuResourcesEditorTab) {
		SkuResourcesEditorTab["Skus"] = "SkusView";
		SkuResourcesEditorTab["Resources"] = "ResourcesView";
	})(exports.SkuResourcesEditorTab || (exports.SkuResourcesEditorTab = {}));

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

	exports.ScrollDirection = void 0;
	(function (ScrollDirection) {
		ScrollDirection["Vertical"] = "scrollTop";
		ScrollDirection["Horizontal"] = "scrollLeft";
	})(exports.ScrollDirection || (exports.ScrollDirection = {}));

	exports.NavigationUnit = void 0;
	(function (NavigationUnit) {
		NavigationUnit["day"] = "day";
		NavigationUnit["week"] = "week";
		NavigationUnit["month"] = "month";
	})(exports.NavigationUnit || (exports.NavigationUnit = {}));
	exports.NavigationDirection = void 0;
	(function (NavigationDirection) {
		NavigationDirection[NavigationDirection["previous"] = -1] = "previous";
		NavigationDirection[NavigationDirection["next"] = 1] = "next";
	})(exports.NavigationDirection || (exports.NavigationDirection = {}));

	exports.Communication = void 0;
	(function (Communication) {
		Communication["AiCall"] = "ai_call";
		Communication["Bitrix24"] = "bitrix24";
	})(exports.Communication || (exports.Communication = {}));

	exports.AnalyticsTool = void 0;
	(function (AnalyticsTool) {
		AnalyticsTool["booking"] = "booking";
	})(exports.AnalyticsTool || (exports.AnalyticsTool = {}));
	exports.AnalyticsCategory = void 0;
	(function (AnalyticsCategory) {
		AnalyticsCategory["booking"] = "booking";
		AnalyticsCategory["waitlist"] = "waitlist";
		AnalyticsCategory["banners"] = "banners";
	})(exports.AnalyticsCategory || (exports.AnalyticsCategory = {}));
	exports.AnalyticsEvent = void 0;
	(function (AnalyticsEvent) {
		AnalyticsEvent["showPopup"] = "show_popup";
		AnalyticsEvent["clickAddResource"] = "click_add_resource";
		AnalyticsEvent["addResourceStep1"] = "add_resource_step1";
		AnalyticsEvent["addResourceStep2"] = "add_resource_step2";
		AnalyticsEvent["addResourceFinish"] = "add_resource_finish";
		AnalyticsEvent["acceptAgreement"] = "accept_agreement";
	})(exports.AnalyticsEvent || (exports.AnalyticsEvent = {}));
	exports.AnalyticsType = void 0;
	(function (AnalyticsType) {
		AnalyticsType["showPopup"] = "show_popup";
		AnalyticsType["clickAddResource"] = "click_add_resource";
	})(exports.AnalyticsType || (exports.AnalyticsType = {}));
	exports.AnalyticsCSection = void 0;
	(function (AnalyticsCSection) {
		AnalyticsCSection["booking"] = "booking";
		AnalyticsCSection["crm"] = "crm";
		AnalyticsCSection["mainMenu"] = "main_menu";
	})(exports.AnalyticsCSection || (exports.AnalyticsCSection = {}));
	exports.AnalyticsElement = void 0;
	(function (AnalyticsElement) {
		AnalyticsElement["addButton"] = "add_button";
	})(exports.AnalyticsElement || (exports.AnalyticsElement = {}));
	exports.AnalyticsCSubSection = void 0;
	(function (AnalyticsCSubSection) {
		AnalyticsCSubSection["accept"] = "accept";
		AnalyticsCSubSection["deny"] = "deny";
	})(exports.AnalyticsCSubSection || (exports.AnalyticsCSubSection = {}));

	exports.CrmFormTemplatesWithSku = CrmFormTemplatesWithSku;
	exports.DateFormat = DateFormat;
	exports.Grid = Grid;
	exports.HelpDesk = HelpDesk;
	exports.NotificationFieldsMap = NotificationFieldsMap;

})(this.BX.Booking.Const = this.BX.Booking.Const || {});
//# sourceMappingURL=const.bundle.js.map
