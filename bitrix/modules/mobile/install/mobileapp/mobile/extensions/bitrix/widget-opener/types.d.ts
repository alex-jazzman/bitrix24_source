type WidgetOpenerComponentOptions = {
	version?: string;
	componentParams?: Record<string, unknown>;
};

type WidgetOpenerNamedComponent = {
	name: string;
} & WidgetOpenerComponentOptions;

export { WidgetOpenerComponentOptions, WidgetOpenerNamedComponent };
