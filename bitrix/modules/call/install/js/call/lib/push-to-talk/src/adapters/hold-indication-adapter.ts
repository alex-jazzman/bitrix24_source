import { Event, Type } from 'main.core';
import { type ClockPort, type TimerId } from '../port/clock-port';
import { isTextEntry } from './document-keyboard-adapter';

/**
 * The contract of this extension with the stylesheets of the call window: the mode holds the microphone.
 */
export const HOLD_INDICATION_ATTRIBUTE = 'data-bx-call-push-to-talk-hold';

/**
 * The same kind of contract, on the element whose activation the hold took: it lives while that element
 * keeps the focus and does not follow the focus further.
 */
export const FALSE_FOCUS_RING_ATTRIBUTE = 'data-bx-call-push-to-talk-false-focus-ring';

const FOCUS_LOSS_EVENT = 'focusout';
const FOCUS_GAIN_EVENT = 'focusin';

export interface HoldIndicationConfig {
	callWindowDocument: () => Document;
	clock: ClockPort;
}

// the element is kept with the document it was read from: that is what tells whether it left the zone
interface RingBearer {
	element: Element;
	zoneDocument: Document;
}

/**
 * Shows a hold nobody can otherwise see: an open microphone is invisible in a folded card, and the
 * focus ring of the control the hold took the space bar from promises a key that will not reach it.
 */
export class HoldIndicationAdapter
{
	readonly #callWindowDocument: () => Document;
	readonly #clock: ClockPort;

	#pipDocument: Document | null = null;
	#holding: boolean = false;
	#ringBearer: RingBearer | null = null;
	// the element the mark has just left, kept for the one task a hand-over lasts: whether that element
	// went away with a rebuilt panel is invisible from its own focusout - Chromium fires that event
	// while the removed node still answers isConnected
	#previousBearer: Element | null = null;
	#scheduled: TimerId | null = null;

	constructor(config: HoldIndicationConfig)
	{
		this.#callWindowDocument = config.callWindowDocument;
		this.#clock = config.clock;
	}

	setHolding(holding: boolean): void
	{
		this.#holding = holding;

		if (holding)
		{
			this.#takeRingFrom(this.#focusedBearer());
		}

		this.#markHold(this.#callWindowDocument(), holding);
		this.#markHold(this.#pipDocument, holding);
	}

	// the window that leaves takes the mark with it, and one opened in the middle of a hold carries
	// it from its first frame - a hold running now is the state of the mode, not of a document
	setPipDocument(pipDocument: Document | null): void
	{
		this.#markHold(this.#pipDocument, false);
		// the document that leaves takes the listener with it, and the new one gets its own
		this.#bindZoneFocus(false);
		// a hand-over waits for a focus of the zone, and the zone is not the same one anymore
		this.#endHandOver();

		// the bearer of the mark leaves with its document: no focusout ever comes from an unloaded window
		if (this.#ringBearer?.zoneDocument === this.#pipDocument)
		{
			this.#takeRingFrom(null);
		}

		this.#pipDocument = pipDocument;
		this.#markHold(pipDocument, this.#holding);
		this.#watchZoneFocus();
	}

	stop(): void
	{
		this.setHolding(false);
		this.#takeRingFrom(null);
		this.#pipDocument = null;
	}

	// hasFocus() and not activeElement alone: activeElement of the other document of the zone answers
	// without holding the focus, and a mark left there waits for a focusout that never comes
	#focusedBearer(): RingBearer | null
	{
		const zoneDocument = [this.#callWindowDocument(), this.#pipDocument]
			.find((candidate) => candidate?.hasFocus() === true);
		const element = zoneDocument?.activeElement;

		if (Type.isNil(zoneDocument) || Type.isNil(element) || this.#keepsItsRing(zoneDocument, element))
		{
			return null;
		}

		return { element, zoneDocument };
	}

	// text entry keeps its ring - the mode never takes a keystroke from a field, and the capture comes
	// on a timer, by which time the focus can be in one. The root and the body carry no ring to take
	#keepsItsRing(zoneDocument: Document, focused: Element): boolean
	{
		if (focused === zoneDocument.documentElement || focused === zoneDocument.body)
		{
			return true;
		}

		return isTextEntry(focused);
	}

	// one element at a time: the key cycle of the zone is one, and so is the ring it takes
	#takeRingFrom(bearer: RingBearer | null): void
	{
		this.#endHandOver();

		if (this.#ringBearer !== null)
		{
			this.#ringBearer.element.removeAttribute(FALSE_FOCUS_RING_ATTRIBUTE);
			Event.unbind(this.#ringBearer.element, FOCUS_LOSS_EVENT, this.#handleRingLoss);
		}

		this.#ringBearer = bearer;

		if (bearer !== null)
		{
			bearer.element.setAttribute(FALSE_FOCUS_RING_ATTRIBUTE, '');
			Event.bind(bearer.element, FOCUS_LOSS_EVENT, this.#handleRingLoss);
		}

		this.#watchZoneFocus();
	}

	// the element is remembered after the mark goes down and not before: taking the ring from anybody
	// ends a hand-over nobody claimed
	readonly #handleRingLoss = (): void => {
		const formerBearer = this.#ringBearer?.element ?? null;

		this.#takeRingFrom(null);
		this.#previousBearer = formerBearer;
		// the hand-over lasts one task: a panel rebuild focuses the element it mounted in the same task
		// as the focusout that dropped the bearer, while a Tab of a human comes tasks later
		this.#scheduled = this.#clock.after(0, () => {
			this.#scheduled = null;
			this.#previousBearer = null;
			this.#watchZoneFocus();
		});

		this.#watchZoneFocus();
	};

	// a panel rebuilt under a running hold drops the marked element and focuses the one it mounted in
	// its place: that one takes the mark over. A focus that moved on its own leaves its element in the
	// document, and the ring it took along was earned by the keyboard - that one is not ours to hide
	readonly #handleZoneFocusIn = (): void => {
		const bearerWasDropped = this.#previousBearer !== null && !this.#previousBearer.isConnected;

		this.#endHandOver();

		if (bearerWasDropped)
		{
			this.#takeRingFrom(this.#focusedBearer());
		}

		this.#watchZoneFocus();
	};

	// the watch is re-read by the callers and not here: setPipDocument ends the hand-over of a zone that
	// is already changing, and a watch re-read on the document that leaves would outlive it
	#endHandOver(): void
	{
		this.#previousBearer = null;

		if (this.#scheduled !== null)
		{
			this.#clock.cancel(this.#scheduled);
			this.#scheduled = null;
		}
	}

	// as long as the mark can still move, and not as long as the hold runs: the microphone command that
	// ends a hold rebuilds the panel of the Picture-in-Picture window in the same task, so a mark that
	// outlived its hold still has to move on to the element that replaced its bearer. A bearer whose
	// disappearance can hand the mark over, or a hand-over already armed - otherwise nothing to hear
	#watchZoneFocus(): void
	{
		this.#bindZoneFocus(this.#ringBearer !== null || this.#previousBearer !== null);
	}

	// the focus of both documents is watched because the element of the mark can be in either of them
	#bindZoneFocus(watching: boolean): void
	{
		[this.#callWindowDocument(), this.#pipDocument].forEach((zoneDocument) => {
			if (Type.isNil(zoneDocument))
			{
				return;
			}

			Event.unbind(zoneDocument, FOCUS_GAIN_EVENT, this.#handleZoneFocusIn);

			if (watching)
			{
				Event.bind(zoneDocument, FOCUS_GAIN_EVENT, this.#handleZoneFocusIn);
			}
		});
	}

	#markHold(targetDocument: Document | null, holding: boolean): void
	{
		const root = targetDocument?.documentElement;

		if (Type.isNil(root))
		{
			return;
		}

		if (holding)
		{
			root.setAttribute(HOLD_INDICATION_ATTRIBUTE, '');

			return;
		}

		root.removeAttribute(HOLD_INDICATION_ATTRIBUTE);
	}
}
