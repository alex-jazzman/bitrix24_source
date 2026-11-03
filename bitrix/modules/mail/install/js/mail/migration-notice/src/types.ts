/** DTO-02. A button of the decision: an address to follow, or an answer to the message. */
export type NoticeButton = {
	id: string,
	label: string,
	url: string,
};

/** DTO-01. What the server decided to show here and now. */
export type NoticeDecision = {
	code: string,
	mailboxId: number | null,
	title: string,
	text: string,
	buttons: NoticeButton[],
	dismissHint: string,
	reactionToken: string,
};

/**
 * API-01. Where the notice is about to be shown.
 *
 * The whole vocabulary of the server stands here, including the two surfaces of the mobile
 * application: a name this file does not carry is a name the server would refuse, and the extension
 * mounts on the three surfaces of the web alone.
 */
export type NoticeSurface = 'portal' | 'mail' | 'crm' | 'mobile_portal' | 'mobile_list';

/**
 * TPL-01. What a mounting site gives the extension.
 *
 * A surface that already carries the decision with its first render passes it and spends no request;
 * a surface that does not know the decision omits it, and the extension reads it itself (API-01).
 *
 * The container is the node of the banner, so the portal - which carries the announcement alone -
 * passes none.
 */
export type MigrationNoticeOptions = {
	surface: NoticeSurface,
	container?: HTMLElement | null,
	mailboxId?: number | null,
	decision?: NoticeDecision | null,
};

/**
 * A button of the decision as the messages draw it. The shape of the button says what it does: one
 * with an address leads there, one without answers the message in place.
 */
export type NoticeAction = {
	id: string,
	label: string,
	url: string,
	answer: (() => void) | null,
};

/**
 * HINT-3. What the page of the connected mailboxes gives the hint of the panel button.
 *
 * The words come from the page, as they do for the rest of the messages of the feature; `hintDue` is
 * the answer of the server to "has this person come back from the panel and not been told yet", and the
 * two option names are the marks that answer it next time.
 *
 * No address of the panel is among them: it is issued one-off and expires in a minute, so both the button
 * and the link of the hint ask for one at the click.
 */
export type MigrationPanelHintOptions = {
	buttonSelector: string,
	title: string,
	text: string,
	linkTitle: string,
	visitOptionName: string,
	hintOptionName: string,
	hintDue: boolean,
};
