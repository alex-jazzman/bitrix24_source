/**
 * All the answer of the menu carries: the rule of the card set reads the state and the demo
 * availability, and the demo plate carries the purchase call on to the demo description screen.
 */
export interface DemoTariffData {
	state: string,
	/** Whether the demo tariff can still be activated; drives the demo-enable card. */
	isDemoAvailable: boolean,
	/** Whether the plate may call to purchase; the demo plate passes it on as `showPurchaseCta`. */
	cta: boolean,
	/** Debug flag of the server: the call is drawn whatever the store of the build allows. */
	ctaForced: boolean,
}

/** The full tariff: the answer of the section carries it, the answer of the menu narrows it. */
export interface TariffData extends DemoTariffData {
	/** Backend tariff type code, e.g. license classification. */
	type: string,
	name: string,
	family: string,
	expireText: string | null,
	daysLeft: number | null,
}

export interface SubscriptionData {
	state: string,
	expireText: string | null,
	isDemoAvailable: boolean,
	/** Whether the platform may draw a purchase call at all: a feature flag of the portal decides. */
	cta: boolean,
	/** Debug flag of the server: the call is drawn whatever the store of the build allows. */
	ctaForced: boolean,
	/** Whether the portal may buy the subscription at all: its region and monetization model decide. */
	canBuy: boolean,
}

export interface TariffPlateData {
	visible: boolean,
	tariff?: TariffData | DemoTariffData,
	/** Absent altogether in the answer of the menu while the section is on. */
	subscription?: SubscriptionData,
}

export interface TariffPlateProps {
	/** Widget the block is drawn in; the cards of the block open their screens over it. */
	layout: LayoutWidget,
	/**
	 * The payload of whoever mounts the block, and its only source of data: the block asks nobody for
	 * it. Left out or `null`, the set of the cards comes out empty and the block draws nothing.
	 */
	tariffPlate?: TariffPlateData | null,
	testId?: string,
	/** The call to purchase was tapped; only the section of the company listens to this. */
	onCardClick?: () => void,
}
