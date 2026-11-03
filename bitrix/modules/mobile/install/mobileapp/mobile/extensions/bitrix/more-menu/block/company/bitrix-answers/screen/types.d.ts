export interface BitrixAnswersScreenProps {
	/** Widget the opener created: the navigation bar the screen rebuilds belongs to it. */
	layout: LayoutWidget,
	/** Address of the page, theme parameter of the app already appended. */
	url: string,
	/** Title the screen opens with; the phrase belongs to the card of the section. */
	title: string,
	/**
	 * Whether the bar above the screen is the screen's own. Left out - it is: a modal widget hands the
	 * bar over and the screen rebuilds title and buttons in it. A native container draws its own bar
	 * over anything the screen puts there, so it passes `false` and the screen neither draws the bar nor
	 * keeps a state for it.
	 */
	ownsNavigationBar?: boolean,
	/**
	 * Where the tap of support goes, as the data of the block sent it. The screen asks the page for none
	 * of it: an event of support carries the fact of the command and nothing else. Left out altogether,
	 * the tap goes to the helpdesk with no address of its own, exactly as it does for the card.
	 */
	canUseSupport?: boolean,
	helpdeskUrl?: string | null,
	supportBotId?: number | null,
	/** Section of the analytics the card reports; the screen adds no events of its own. */
	analyticsSection?: string,
}

export interface BitrixAnswersScreenState {
	/**
	 * Whether the page has shown itself. It answers one question and answers it once: the placeholder
	 * covers the web view until the page reports itself ready AND the pause that follows that report has
	 * run out (`screen.js`, `PAGE_READY_DELAY`), and never comes back after that.
	 */
	pageReady: boolean,
}
