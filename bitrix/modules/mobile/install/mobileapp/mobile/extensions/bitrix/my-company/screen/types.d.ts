/**
 * Codes of the blocks of the section, in the display order the server sends: the values of the
 * `BlockId` enum it walks to build the composition.
 */
type MyCompanyBlockId =
	| 'employees'
	| 'tariff'
	| 'whatsNew'
	| 'bitrixAnswers'
	| 'support'
	| 'personalAccount'
	| 'purchases'
	| 'integrator'
	| 'implementationSpecialists';

/**
 * The code of the showcase of the states of the tariff plate. No block of the answer carries it: the
 * screen puts it in the place of `tariff` while the answer says the demo mode of the plate is on.
 */
type MyCompanyShowcaseId = 'tariffShowcase';

/** Everything the registry of the cards can draw: the codes of the wire and the one of the client. */
type MyCompanyCardId = MyCompanyBlockId | MyCompanyShowcaseId;

type MyCompanyPortal = {
	name: string,
	url: string,
	/** Theme of the portal: the wallpaper the section lies on decides the color of its texts. */
	theme: UserTheme | null,
};

/**
 * Data of the blocks, keyed by the block code. A block whose card draws a static view or loads its own
 * data has no record here, and neither has one with nothing to show: the shape of a record belongs to
 * the card that reads it.
 */
type MyCompanyBlockData = Partial<Record<MyCompanyBlockId, object>>;

/**
 * The answer of `mobile.Menu.getMyCompany`: the composition of the section and the data of every block
 * of it. When the section is unavailable the answer holds `available` alone.
 */
type MyCompanySectionData = {
	available: boolean,
	blocks?: MyCompanyBlockId[],
	blockData?: MyCompanyBlockData,
	portal?: MyCompanyPortal,
	/** The QA showcase of the states of the tariff plate draws the tariff block instead of the plate. */
	tariffShowcase?: boolean,
};

/** What a block code of the section draws and how the screen builds it. */
type MyCompanyCardEntry = {
	/** Root locator of the card. */
	testId: string,
	/** Builds the card: every card of the section is built by a call of this, never by `new`. */
	create: (props: object) => object,
	/**
	 * Turns the record of the block into the props of the card. Only the cards fed from the answer carry
	 * it: a card with a static view and one that loads its own data are handed no data at all.
	 */
	toProps?: (data: object) => object,
};

type MyCompanyScreenProps = {
	/**
	 * Root widget of the modal of the section, handed over by its component: the parent everything the
	 * cards and the floating layer open stands over.
	 */
	layout: LayoutWidget,
	testId?: string,
	highlight?: string,
};

type MyCompanyScreenState = {
	/** The section as the server sent it; `null` until the first answer, saved or fresh, arrives. */
	section: MyCompanySectionData | null,
	/** The load brought nothing back while the screen has nothing of its own to keep showing. */
	loadFailed: boolean,
	/** A request started by the gesture of the refresh is on its way. */
	refreshing: boolean,
	/** Bumped on every news of the counters; nothing is drawn from it, it only asks for a redraw. */
	countersRevision: number,
};

export {
	MyCompanyBlockData,
	MyCompanyBlockId,
	MyCompanyCardEntry,
	MyCompanyCardId,
	MyCompanyPortal,
	MyCompanyScreenProps,
	MyCompanyScreenState,
	MyCompanySectionData,
	MyCompanyShowcaseId,
};
