/** DTO-02. A button of the decision: an address to follow, or an answer to the message. */
export type MigrationNoticeButton = {
	id: string,
	label: string,
	url: string,
};

/** DTO-01. What the server decided to show here and now. */
export type MigrationNoticeDecision = {
	code: string,
	mailboxId: number | null,
	title: string,
	text: string,
	buttons: MigrationNoticeButton[],
	dismissHint: string,
	reactionToken: string,
};

/** As much of a widget of the registry as the popup touches. */
export type MigrationNoticeWidget = {
	on?: (eventName: string, handler: () => void) => void,
	close?: (callback?: () => void) => void,
};

/**
 * What the display point gives the popup. The decision arrives with the message list (DTO-03), so the
 * popup spends no request of its own on the way in; the widgets come from the registry of the
 * application messages.
 */
export type MigrationNoticeProps = {
	decision: MigrationNoticeDecision,
	layoutWidget?: MigrationNoticeWidget,
	parentWidget?: MigrationNoticeWidget,
	needsToCloseLayout?: boolean,
};
