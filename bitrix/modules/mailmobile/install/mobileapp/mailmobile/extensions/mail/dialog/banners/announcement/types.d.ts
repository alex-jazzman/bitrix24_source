/**
 * What the display point gives the announcement. The decision is read on the way into mail (API-01)
 * and handed over, so the message asks for none of its own and only reports itself as shown (API-02);
 * the widgets come from the registry of the application messages.
 */
export type MigrationAnnouncementProps = {
	decision: MigrationNoticeDecision,
	layoutWidget?: MigrationNoticeWidget,
	parentWidget?: MigrationNoticeWidget,
	needsToCloseLayout?: boolean,
};
