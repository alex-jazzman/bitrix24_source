/** The part of the in-app-url route context the opener reads. */
type MyCompanyOpenContext = {
	presentation?: { isModal(): boolean } | null,
	parentWidget?: LayoutWidget,
};

type MyCompanyOpenParams = {
	context?: MyCompanyOpenContext,
	/** Code of the section to highlight after opening; comes from the query string as a raw string. */
	highlight?: string,
};

export {
	MyCompanyOpenContext,
	MyCompanyOpenParams,
};
