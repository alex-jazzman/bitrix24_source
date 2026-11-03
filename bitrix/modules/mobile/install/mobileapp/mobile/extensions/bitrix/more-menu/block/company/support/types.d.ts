export interface SupportButtonProps {
	testId?: string,
	supportBotId?: number | null,
	/**
	 * The destinations of the tap, handed over by whoever mounted the card. The card asks nobody for
	 * them: left out altogether, the tap goes to the helpdesk with no address of its own.
	 */
	canUseSupport?: boolean,
	helpdeskUrl?: string | null,
	hubDesign?: boolean,
	/** The card was tapped; only the section of the company listens to this. */
	onCardClick?: () => void,
	/** The screen the card is drawn in; left out, its own events stay with the menu that owns it. */
	analyticsSection?: string,
}
