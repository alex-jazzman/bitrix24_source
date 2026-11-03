/* eslint-disable */
/**
 * TPL-01. What a mounting site gives the extension.
 *
 * A surface that already carries the decision with its first render passes it and spends no request;
 * a surface that does not know the decision omits it, and the extension reads it itself (API-01).
 *
 * The container is the node of the banner, so the portal - which carries the announcement alone -
 * passes none.
 */
type MigrationNoticeOptions = {
	surface: NoticeSurface;
	container?: HTMLElement | null;
	mailboxId?: number | null;
	decision?: NoticeDecision | null;
};

/**
 * API-01. Where the notice is about to be shown.
 *
 * The whole vocabulary of the server stands here, including the two surfaces of the mobile
 * application: a name this file does not carry is a name the server would refuse, and the extension
 * mounts on the three surfaces of the web alone.
 */
type NoticeSurface = 'portal' | 'mail' | 'crm' | 'mobile_portal' | 'mobile_list';

/** DTO-01. What the server decided to show here and now. */
type NoticeDecision = {
	code: string;
	mailboxId: number | null;
	title: string;
	text: string;
	buttons: NoticeButton[];
	dismissHint: string;
	reactionToken: string;
};

/** DTO-02. A button of the decision: an address to follow, or an answer to the message. */
type NoticeButton = {
	id: string;
	label: string;
	url: string;
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
type MigrationPanelHintOptions = {
	buttonSelector: string;
	title: string;
	text: string;
	linkTitle: string;
	visitOptionName: string;
	hintOptionName: string;
	hintDue: boolean;
};

declare namespace BX.Mail {
	/**
	 * TPL-01. The messages about the migration of mail to Bitrix24 Mail in the web: the announcement over
	 * the portal (ANN-1), the popup (MIG-A, MIG-B) and the banner (BAN-1).
	 *
	 * The extension holds no condition of the display and knows none: it draws the decision it was given
	 * (DTO-01) and returns what the person did (API-02). Which message is due, for which mailbox and with
	 * which words is the server's to say, and it says it again after every reaction - so closing the popup
	 * is what brings the banner, and no rule of that lives here.
	 *
	 * ```js
	 * import { MigrationNotice } from 'mail.migration-notice';
	 *
	 * new MigrationNotice({ surface: 'mail', container, mailboxId, decision }).show();
	 * ```
	 */
	class MigrationNotice {
		constructor(options: MigrationNoticeOptions);
		/** A surface that came with its decision spends no request; the rest ask for one (API-01). */
		show(): void;
		destroy(): void;
	}

	/**
	 * The way into the control panel as a page of the portal calls it: a name in the namespace of the module,
	 * so a template names the entry instead of spelling an address it must not spell.
	 */
	class MigrationControlPanel {
		static open(): void;
	}

	/**
	 * HINT-3. The aha-moment of the button that leads into the control panel of the company mail
	 * (SC-007): where the domain, the records and the addresses of the employees are settled.
	 *
	 * The hint belongs to that button and to no place of its own (AC-043), and a person meets it once
	 * (AC-044). Both halves of that are marks on the server, in the store the states of the feature
	 * already use: leaving for the panel writes the first one, and the hint itself writes the second.
	 * Which of them is due the page decides - there is no rule of the display here.
	 *
	 * ```js
	 * new BX.Mail.MigrationPanelHint({ buttonSelector, ... }).run();
	 * ```
	 */
	class MigrationPanelHint {
		constructor(options: MigrationPanelHintOptions);
		/**
		 * Watches the way out into the panel, and meets the person on the way back when the hint is due.
		 * A page without the button has neither to offer.
		 */
		run(): void;
		destroy(): void;
	}
}
