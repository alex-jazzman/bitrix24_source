type WidgetPresenterComponentOptions = {
	version?: string;
	componentParams?: Record<string, unknown>;
};

type WidgetPresenterNamedComponent = {
	name: string;
} & WidgetPresenterComponentOptions;

type WidgetPresenterTabsOptions = {
	backgroundLayout?: Record<string, unknown>;
	grabTitle?: boolean;
};

export { WidgetPresenterComponentOptions, WidgetPresenterTabsOptions, WidgetPresenterNamedComponent };
