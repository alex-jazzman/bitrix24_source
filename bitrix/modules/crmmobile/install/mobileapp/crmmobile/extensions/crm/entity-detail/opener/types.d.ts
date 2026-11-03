// the opener passes payload straight into the card component, so callers extend it freely:
// entity-tab adds tabs and permissions, notifications add activeTab, copying adds copy
type EntityDetailOpenerPayload = {
	entityTypeId: number;
	entityId?: number;
	categoryId?: number;
	copy?: boolean;
	activeTab?: string;
	[key: string]: unknown;
};

type EntityDetailOpenerParams = {
	payload: EntityDetailOpenerPayload;
	widgetParams?: BaseWidgetSettings;
	parentWidget?: LayoutWidget | null;
	canOpenInDefault?: boolean;
	analytics?: AnalyticsDTO | AnalyticsEvent;
	presentation?: Presentation | null;
};
