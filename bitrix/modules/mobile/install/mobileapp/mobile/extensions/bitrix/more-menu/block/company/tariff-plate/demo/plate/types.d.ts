export type DemoPlateProps = {
	layout: LayoutWidget,
	/** Comes from tariff.cta: whether the demo drawer offers a purchase call to action. */
	showPurchaseCta: boolean,
	/** Comes from tariff.ctaForced: the call is drawn whatever the store of the build allows. */
	isCtaForced?: boolean,
	testId?: string,
};
