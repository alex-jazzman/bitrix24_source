export interface BitrixAnswersProps {
	testId: string,
	/** The card was tapped; only the section of the company listens to this. */
	onCardClick?: () => void,
	/** Widget the card is drawn in: the screen of the answers opens inside it. */
	layout?: LayoutWidget,
	/** Address of the page the screen opens, as the data of the block sent it. */
	url?: string,
	/**
	 * Where a tap of support made inside the screen goes, as the data of the block sent it. The card
	 * reads none of the three: it hands them over to the screen untouched.
	 */
	canUseSupport?: boolean,
	helpdeskUrl?: string | null,
	supportBotId?: number | null,
	/** Section of the analytics; the card only hands it on to the screen. */
	analyticsSection?: string,
}
