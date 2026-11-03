import { ajax, Runtime, Type } from 'main.core';
import { type BaseEvent, EventEmitter } from 'main.core.events';
import 'ui.design-tokens';
import 'ui.design-tokens.air';

import { MigrationAnnouncement } from './announcement';
import { MigrationBanner } from './banner';
import { MigrationDismissHint } from './dismiss-hint';
import { MigrationPopup } from './popup';
import {
	type MigrationNoticeOptions,
	type NoticeAction,
	type NoticeButton,
	type NoticeDecision,
	type NoticeSurface,
} from './types';

import './css/style.css';

/** DTO-01. The codes this extension draws; every other one belongs to another surface. */
const Code = Object.freeze({
	Announcement: 'ann_1',
	MigrationVariantA: 'mig_a',
	MigrationVariantB: 'mig_b',
	Banner: 'ban_1',
});

/**
 * The 3D illustration each message is topped with, by its code.
 *
 * The canon of composition asks for one over the title of a dialog, and for a tone that matches what
 * the dialog is about: blue is the neutral default, orange is attention, red is a state that is
 * really broken. So the news gets the neutral subject of an announcement, the warning about the
 * providers gets the orange envelope, and the mailbox that stopped receiving gets the red one.
 *
 * The banner carries none: it is a strip over the list and not an accent top, and the library is for
 * accent tops alone.
 */
const ILLUSTRATION = Object.freeze({
	ann_1: 'announcement',
	mig_a: 'email--warning',
	mig_b: 'email--alert',
});

/** API-02. What a person can answer a message with. */
const Reaction = Object.freeze({
	Shown: 'shown',
	RemindLater: 'remind_later',
	Dismissed: 'dismissed',
});

const REACTIONS: string[] = Object.values(Reaction);

const GET_ACTION = 'mail.MigrationNotice.get';
const REACT_ACTION = 'mail.MigrationNotice.react';
const PULL_EVENT = 'onPullEvent-mail';
const PULL_COMMAND = 'mailbox_migration_status_changed';
/**
 * The module says with this one that a mailbox changed hands between "works" and "fell off". It is
 * the same signal the rest of the section already watches, it carries no mailbox of its own, and it
 * is sent on that change alone - so it is answered by reading the decision again rather than by
 * working out here which message the new state is worth.
 */
const PROBLEM_STATE_PULL_COMMAND = 'mailbox_grid_button_counter_refresh';

/** The one thing this extension asks of `pull.client`: keep the tag of the mailbox alive. */
type PullWatcher = {
	extendWatch: (tag: string) => void,
};

/** The one message a decision draws; which of them it is, the code of the decision says. */
type MigrationMessage = MigrationAnnouncement | MigrationBanner | MigrationPopup;

/**
 * API-01. The surfaces already speaking in this document. A surface names a place of the portal, and
 * a place says one thing at a time: the decision is about the person and their mailbox and knows
 * nothing of the letter that happens to be on screen. A document that mounted one surface twice - the
 * CRM card loads the letters of a chain into a document of one slider - would ask for the same
 * decision twice, watch the same mailbox twice and draw the second banner under the first, while
 * `main.popup` keeps one popup shown at a time and would take the first one down for the second.
 */
const speakingSurfaces: Set<NoticeSurface> = new Set();

type DecisionResponse = {
	data?: {
		decision?: unknown,
	},
};

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
export class MigrationNotice
{
	#surface: NoticeSurface;
	#container: HTMLElement | null;
	#mailboxId: number | null;
	#decision: NoticeDecision | null;
	#message: MigrationMessage | null = null;
	#dismissHint: MigrationDismissHint | null = null;
	#drawings: number = 0;
	#watchedMailboxId: number | null = null;
	#speaking: boolean = false;

	constructor(options: MigrationNoticeOptions)
	{
		const { surface, container = null, mailboxId = null, decision = null } = options;

		this.#surface = surface;
		this.#container = container;
		this.#mailboxId = Type.isNumber(mailboxId) ? mailboxId : null;
		this.#decision = this.#normalizeDecision(decision);
	}

	/** A surface that came with its decision spends no request; the rest ask for one (API-01). */
	show(): void
	{
		// The surface is already speaking in this document, and it says one thing at a time
		if (!this.#takeTheFloor())
		{
			return;
		}

		if (this.#decision === null)
		{
			void this.#load();

			return;
		}

		void this.#draw(this.#decision);
	}

	destroy(): void
	{
		// a message still on its way is no longer due, and the count of the drawings is what says so
		this.#drawings += 1;
		this.#erase();
		this.#closeDismissHint();
		EventEmitter.unsubscribe(PULL_EVENT, this.#handlePull);
		this.#watchedMailboxId = null;
		this.#decision = null;
		this.#leaveTheFloor();
	}

	#takeTheFloor(): boolean
	{
		if (this.#speaking)
		{
			return true;
		}

		if (speakingSurfaces.has(this.#surface))
		{
			return false;
		}

		speakingSurfaces.add(this.#surface);
		this.#speaking = true;

		return true;
	}

	#leaveTheFloor(): void
	{
		if (!this.#speaking)
		{
			return;
		}

		speakingSurfaces.delete(this.#surface);
		this.#speaking = false;
	}

	async #load(): Promise<void>
	{
		const data: { surface: NoticeSurface, mailboxId?: number } = { surface: this.#surface };
		if (this.#mailboxId !== null)
		{
			data.mailboxId = this.#mailboxId;
		}

		const decision = await this.#request(GET_ACTION, data);
		if (decision !== null)
		{
			// the state of the mailbox was read anew, and the hint speaks of the state before that
			this.#closeDismissHint();
			await this.#draw(decision);
		}
	}

	async #draw(decision: NoticeDecision): Promise<void>
	{
		const drawing = this.#drawings + 1;
		this.#drawings = drawing;

		const message = await this.#createMessage(decision);
		// a decision that came while the message was being built is the one that stands
		if (drawing !== this.#drawings)
		{
			return;
		}

		this.#erase();
		this.#decision = decision;
		this.#watch(decision.mailboxId);
		this.#message = message;
		message?.show();
	}

	/**
	 * The code of the decision says which message is due, and only that message brings its own
	 * extensions in: a surface pays for what it shows and not for what the other surfaces show.
	 */
	async #createMessage(decision: NoticeDecision): Promise<MigrationMessage | null>
	{
		if (decision.code === Code.Announcement)
		{
			return MigrationAnnouncement.create({
				illustration: ILLUSTRATION[Code.Announcement],
				title: decision.title,
				text: decision.text,
				actions: this.#toActions(decision),
				onShown: (): void => {
					// The announcement is shown once for a lifetime (AC-002), and the server counts it
					void this.#react(Reaction.Shown, false);
				},
			});
		}

		if (decision.code === Code.MigrationVariantA || decision.code === Code.MigrationVariantB)
		{
			return MigrationPopup.create({
				illustration: ILLUSTRATION[decision.code] ?? '',
				title: decision.title,
				text: decision.text,
				actions: this.#toActions(decision),
				onShown: (): void => {
					// The popup is shown once per mailbox (AC-010, AC-021), and the server counts it
					void this.#react(Reaction.Shown, false);
				},
				onDismiss: (): void => {
					this.#showDismissHint(decision.dismissHint);
					void this.#react(Reaction.Dismissed, true);
				},
			});
		}

		// A surface that draws no banner passes no container, and a banner has then nowhere to go
		if (decision.code === Code.Banner && this.#container !== null)
		{
			return MigrationBanner.create({
				container: this.#container,
				title: decision.title,
				text: decision.text,
				actions: this.#toActions(decision),
				onDismiss: (): void => {
					void this.#react(Reaction.Dismissed, true);
				},
			});
		}

		return null;
	}

	#erase(): void
	{
		this.#message?.destroy();
		this.#message = null;
	}

	/**
	 * AC-012. The hint of the closing outlives the message it speaks of - the closing is what takes
	 * that message down - so it is held here and not by the popup, and the banner the very same
	 * closing brings in its place leaves it standing.
	 */
	#showDismissHint(hint: string): void
	{
		if (!Type.isStringFilled(hint))
		{
			return;
		}

		this.#closeDismissHint();

		const dismissHint = new MigrationDismissHint(hint);
		this.#dismissHint = dismissHint;
		dismissHint.show();
	}

	#closeDismissHint(): void
	{
		this.#dismissHint?.close();
		this.#dismissHint = null;
	}

	/**
	 * The answer to a reaction is the decision in force once it is written down, so the message that
	 * follows is drawn from it and not guessed here. Reporting a message as shown changes nothing a
	 * person is looking at, so that answer is not drawn.
	 */
	async #react(reaction: string, draw: boolean): Promise<void>
	{
		const reactionToken = this.#decision?.reactionToken ?? '';
		if (!Type.isStringFilled(reactionToken))
		{
			return;
		}

		const decision = await this.#request(REACT_ACTION, { reactionToken, reaction });
		if (draw && decision !== null)
		{
			await this.#draw(decision);
		}
	}

	#toActions(decision: NoticeDecision): NoticeAction[]
	{
		return decision.buttons
			.filter((button: NoticeButton): boolean => this.#leadsSomewhere(button))
			.map((button: NoticeButton): NoticeAction => ({
				id: button.id,
				label: button.label,
				url: Type.isStringFilled(button.url) ? button.url : '',
				answer: this.#toAnswer(button),
			}))
		;
	}

	/**
	 * DTO-02. A button does one of two things: it follows the address it carries, or its identifier
	 * names a reaction to answer the message with (API-02). One that does neither is not drawn at all -
	 * a message that closed itself on such a button would tell a person their action went through.
	 */
	#leadsSomewhere(button: NoticeButton): boolean
	{
		return Type.isStringFilled(button?.label)
			&& (Type.isStringFilled(button?.url) || REACTIONS.includes(button?.id))
		;
	}

	/** A button with an address leads there and leaves the message alone; the rest answer it. */
	#toAnswer(button: NoticeButton): (() => void) | null
	{
		if (Type.isStringFilled(button.url))
		{
			return null;
		}

		return (): void => {
			void this.#react(button.id, true);
		};
	}

	/**
	 * EVENT-01. The transfer of the mailbox moved on, so which message is due now is asked again
	 * instead of being worked out here.
	 *
	 * The watch tag is only extended and never cleared: the banner of the transfer state lives on the
	 * same tag, and clearing it would leave that banner deaf.
	 */
	#watch(mailboxId: number | null): void
	{
		if (mailboxId === null || this.#watchedMailboxId === mailboxId)
		{
			return;
		}

		if (this.#watchedMailboxId === null)
		{
			EventEmitter.subscribe(PULL_EVENT, this.#handlePull);
		}

		this.#watchedMailboxId = mailboxId;
		void this.#extendWatch(mailboxId);
	}

	/** The client of the pull events belongs to the surfaces that know a mailbox, and to no other. */
	async #extendWatch(mailboxId: number): Promise<void>
	{
		try
		{
			await Runtime.loadExtension('pull.client');
		}
		catch
		{
			// A page that cannot bring the client of the pull events hears none of them, as before
			return;
		}

		(BX as typeof BX & { PULL?: PullWatcher }).PULL?.extendWatch(`mail_mailbox_migration_${mailboxId}`);
	}

	#handlePull = (event: BaseEvent<[string, unknown]>): void => {
		const [command, payload] = event.getData() ?? [];

		/*
			The mail of a mailbox stopping or starting to arrive is a state of the display like any
			other, and the message due changes with it: the variant A gives way to the variant B, and
			the offer beside the red alert comes and goes. The event names no mailbox, and it reaches
			only the people a mailbox of theirs changed for, so it is taken as it comes.
		*/
		if (command === PROBLEM_STATE_PULL_COMMAND)
		{
			void this.#load();

			return;
		}

		if (command !== PULL_COMMAND || !Type.isObject(payload))
		{
			return;
		}

		if (Number((payload as Record<string, unknown>).mailboxId ?? 0) !== this.#watchedMailboxId)
		{
			return;
		}

		void this.#load();
	};

	/** A decision that could not be read changes nothing: the extension invents none of its own. */
	async #request(action: string, data: Record<string, unknown>): Promise<NoticeDecision | null>
	{
		try
		{
			const response: DecisionResponse = await ajax.runAction(action, { data });

			return this.#normalizeDecision(response?.data?.decision);
		}
		catch
		{
			return null;
		}
	}

	#normalizeDecision(payload: unknown): NoticeDecision | null
	{
		if (!Type.isPlainObject(payload))
		{
			return null;
		}

		const value = payload as Record<string, unknown>;
		if (!Type.isStringFilled(value.code))
		{
			return null;
		}

		return {
			code: value.code as string,
			mailboxId: Type.isNumber(value.mailboxId) ? value.mailboxId as number : null,
			title: Type.isString(value.title) ? value.title as string : '',
			text: Type.isString(value.text) ? value.text as string : '',
			buttons: Type.isArray(value.buttons) ? value.buttons as NoticeButton[] : [],
			dismissHint: Type.isString(value.dismissHint) ? value.dismissHint as string : '',
			reactionToken: Type.isString(value.reactionToken) ? value.reactionToken as string : '',
		};
	}
}

export { MigrationControlPanel } from './control-panel';
export { MigrationPanelHint } from './panel-hint';
export type {
	MigrationNoticeOptions,
	MigrationPanelHintOptions,
	NoticeDecision,
	NoticeSurface,
} from './types';
