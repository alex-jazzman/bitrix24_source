import { Dom, Event, Loc, Runtime, Text, Type } from 'main.core';
import { type Balloon, type Center } from 'ui.notification';

/** The block of the balloon: the class its stylesheet reaches by, and the name the tests find it by. */
const HINT_BLOCK = 'mail-migration-notice-dismiss-hint';
const HINT_CLOSE_TESTID = 'mail-migration-notice-dismiss-hint-close';

/** What the hint is drawn with: asked for at the moment a message was closed, and not before. */
type HintUi = {
	Center: typeof Center,
};

/** The one thing the hint asks of `ui.a11y`. */
type LiveAnnouncer = { announce: (message: string) => void };

let uiPromise: Promise<HintUi> | null = null;

function loadUi(): Promise<HintUi>
{
	uiPromise ??= Runtime
		.loadExtension('ui.notification')
		.then((exports: unknown): HintUi => exports as HintUi)
	;

	return uiPromise;
}

/**
 * The balloon of `ui.notification` speaks to the eye alone: neither a role nor a live region reaches
 * a screen reader from it. The words are said over `ui.a11y`, which is asked for at the moment there
 * is something to say - a person who answers the popup never brings it in.
 */
function announce(message: string): void
{
	void Runtime
		.loadExtension('ui.a11y')
		.then((exports: unknown): void => {
			(exports as { LiveAnnouncer?: LiveAnnouncer }).LiveAnnouncer?.announce(message);
		})
		// A page that cannot bring `ui.a11y` stays as silent as it was before
		.catch((): void => {})
	;
}

/**
 * AC-012. The hint of a closed message: where the transfer can be picked up later.
 *
 * It speaks of a message that is already gone by the time it appears, so it belongs to the extension
 * and not to that message - and the message the closing brings in its place, the banner, leaves it
 * alone. It is taken down by the person, by a hint that replaces it, or by a state of the mailbox
 * read anew, for which the words are no longer true.
 *
 * The balloon itself waits: the eight seconds of `ui.notification` are not enough to read it and are
 * a limit of time nobody can extend (WCAG 2.2.1).
 */
export class MigrationDismissHint
{
	#hint: string;
	#balloon: Balloon | null = null;
	#closed: boolean = false;

	constructor(hint: string)
	{
		this.#hint = hint;
	}

	show(): void
	{
		void this.#draw();
		announce(this.#hint);
	}

	close(): void
	{
		this.#closed = true;
		this.#balloon?.close();
		this.#balloon = null;
	}

	async #draw(): Promise<void>
	{
		// A page that cannot bring `ui.notification` shows no balloon, and says the words all the same
		const ui = await loadUi().catch((): null => null);

		// the hint of a closing can be over before the balloon of it is in, and then it is not due
		if (ui === null || this.#closed)
		{
			return;
		}

		const balloon = ui.Center.notify({
			content: Text.encode(this.#hint),
			autoHide: false,
			testId: HINT_BLOCK,
			// the width of the balloon and its limit on a narrow screen are both in the stylesheet
			width: 'auto',
		});

		if (balloon !== undefined)
		{
			this.#balloon = balloon;
			Dom.addClass(balloon.getContainer(), HINT_BLOCK);
			this.#adjustCloseBtn(balloon);
		}
	}

	/**
	 * The cross of the balloon is a decoration of `ui.notification`: a bare `div` the keyboard cannot
	 * reach. A message that stays until it is taken down has to have a way to take it down.
	 */
	#adjustCloseBtn(balloon: Balloon): void
	{
		const closeBtn = balloon.getCloseButton();
		const label = Loc.getMessage('MAIL_MIGRATION_NOTICE_DISMISS_HINT_CLOSE');

		Dom.attr(closeBtn, {
			role: 'button',
			tabindex: '0',
			// an empty name is a nameless button all the same, and `Dom.attr` drops an attribute on null
			'aria-label': Type.isStringFilled(label) ? label : null,
			'data-testid': HINT_CLOSE_TESTID,
		});

		Event.bind(closeBtn, 'keydown', (event: KeyboardEvent): void => {
			if (event.key === 'Enter' || event.key === ' ')
			{
				event.preventDefault();
				closeBtn.click();
			}
		});
	}
}
