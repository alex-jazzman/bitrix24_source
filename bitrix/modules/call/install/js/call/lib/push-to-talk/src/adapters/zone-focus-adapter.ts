import { Event, Type } from 'main.core';
import { type ClockPort, type TimerId } from '../port/clock-port';

/**
 * How long the zone may hold no focus at all before it counts as left. The gap of a real move
 * between the windows is more than the window activation of the operating system alone - measured at
 * 4-5 ms: the focus event then waits in the task queue of the window that receives it, and that queue
 * carries the media of a live call. A grace sized after the activation alone would still cut a phrase
 * short. This one stays far below the 750 ms of open microphone the liveness sensor allows (AC-026).
 */
export const FOCUS_GAP_GRACE_MS = 150;

export interface ZoneFocusConfig {
	callWindowDocument: () => Document;
	isFolded: () => boolean;
	onZoneFocusChanged: (focused: boolean) => void;
	clock: ClockPort;
}

/**
 * Keeps "the zone is focused" as a derivative of the state of the zone documents, not of the fact
 * that an event arrived. The zone is made of the documents of this very call: the call window while
 * the card is unfolded, and the Picture-in-Picture window handed over by it.
 */
export class ZoneFocusAdapter
{
	readonly #callWindowDocument: () => Document;
	readonly #isFolded: () => boolean;
	readonly #onZoneFocusChanged: (focused: boolean) => void;
	readonly #clock: ClockPort;

	#pipDocument: Document | null = null;
	#zoneFocused: boolean = false;
	#scheduled: TimerId | null = null;

	constructor(config: ZoneFocusConfig)
	{
		this.#callWindowDocument = config.callWindowDocument;
		this.#isFolded = config.isFolded;
		this.#onZoneFocusChanged = config.onZoneFocusChanged;
		this.#clock = config.clock;
	}

	start(): void
	{
		this.#bind(this.#callWindowDocument());
		this.#bind(this.#pipDocument);

		// the window opens in an already focused document, and no focus event follows
		this.#recompute();
	}

	stop(): void
	{
		this.#unbind(this.#callWindowDocument());
		this.#unbind(this.#pipDocument);
		this.#pipDocument = null;
		this.#cancelScheduled();
	}

	setPipDocument(pipDocument: Document | null): void
	{
		const closed = pipDocument === null && this.#pipDocument !== null;

		this.#unbind(this.#pipDocument);
		this.#pipDocument = pipDocument;
		this.#bind(this.#pipDocument);

		// a closed window hands the focus to the call window a gap later - the same gap a move between
		// the windows leaves, and the button returning to the call goes exactly this way: it closes the
		// window first and focuses the call afterwards. With no document left to take that focus the zone
		// is genuinely gone, and a folded card must feel the closing at once
		if (closed && this.#zoneDocuments().length > 0)
		{
			this.#scheduleRecompute();

			return;
		}

		this.#recompute();
	}

	onFoldChanged(): void
	{
		this.#recompute();
	}

	#zoneDocuments(): Document[]
	{
		const documents: Document[] = [];

		// a folded card takes the call window document out of the zone; the PiP window stays in it
		if (!this.#isFolded())
		{
			documents.push(this.#callWindowDocument());
		}

		if (this.#pipDocument !== null)
		{
			documents.push(this.#pipDocument);
		}

		return documents;
	}

	#recompute(): void
	{
		// hasFocus() and not activeElement: activeElement answers even for a document holding no focus
		const next = this.#zoneDocuments().some((zoneDocument) => zoneDocument.hasFocus());

		if (next === this.#zoneFocused)
		{
			return;
		}

		this.#zoneFocused = next;
		this.#onZoneFocusChanged(next);
	}

	// focus travels between the windows of the zone with a gap, so the recompute waits for the other
	// document to take the focus - otherwise a move into the PiP window reads as leaving the zone
	#scheduleRecompute(): void
	{
		// without the cancel two losses of focus in a row leave a timer of the first one hanging
		this.#cancelScheduled();
		this.#scheduled = this.#clock.after(FOCUS_GAP_GRACE_MS, () => {
			this.#scheduled = null;
			this.#recompute();
		});
	}

	readonly #handleBlur = (): void => {
		this.#scheduleRecompute();
	};

	readonly #handleFocus = (): void => {
		this.#cancelScheduled();
		this.#recompute();
	};

	readonly #handlePageHide = (): void => {
		this.#recompute();
	};

	// focus, blur and pagehide are fired at the window, not at the document
	#bind(zoneDocument: Document | null): void
	{
		const view = zoneDocument?.defaultView;

		if (Type.isNil(view))
		{
			return;
		}

		Event.bind(view, 'blur', this.#handleBlur);
		Event.bind(view, 'focus', this.#handleFocus);
		Event.bind(view, 'pagehide', this.#handlePageHide);
	}

	#unbind(zoneDocument: Document | null): void
	{
		const view = zoneDocument?.defaultView;

		if (Type.isNil(view))
		{
			return;
		}

		Event.unbind(view, 'blur', this.#handleBlur);
		Event.unbind(view, 'focus', this.#handleFocus);
		Event.unbind(view, 'pagehide', this.#handlePageHide);
	}

	#cancelScheduled(): void
	{
		if (this.#scheduled !== null)
		{
			this.#clock.cancel(this.#scheduled);
			this.#scheduled = null;
		}
	}
}
