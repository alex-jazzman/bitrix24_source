import { Event, Type, ZIndexManager } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import { FocusTrap } from 'ui.a11y';
import {
	Popover,
	PopoverAlignment,
	PopoverDesignContext,
	PopoverPosition,
	type PopoverStateChangePayload,
} from 'ui.system.popover';

export type SurfaceOptions = {
	// Header action the bubble is placed against and which the header owner shows.
	anchor: HTMLElement,
	// Bubble of the popover: the surface wraps it in nothing and owns neither its look nor its content.
	bubble: HTMLElement,
	// The popup went off the screen for good, by whichever of the closing routes. The surface reports the
	// fact and draws no conclusion from it.
	onClose: () => void,
};

// The focus reaches the frame element only after the window has lost it, so the sign of a press inside a
// frame is read a tick later and never in the handler of the blur itself.
const FOCUS_SETTLE_MS = 0;

const FRAME_TAG = 'IFRAME';

const isOnScreen = (element: HTMLElement | null): boolean => {
	return element !== null && element.isConnected && element.getClientRects().length > 0;
};

// The layer the node stands in, as the stacking registry of the platform keeps it: the popover registers
// its own root there, and the windows of the portal are compared against that root.
const layerZIndex = (node: HTMLElement): number | null => {
	for (let element: HTMLElement | null = node; element !== null; element = element.parentElement)
	{
		const component = ZIndexManager.getComponent(element);
		if (component)
		{
			return component.getZIndex();
		}
	}

	return null;
};

// The document of the window the page is nested in, where there is one to reach: the report may open inside
// a slider, and a press on the chrome of that slider lands in the document above ours. A host of another
// origin gives nothing to listen to at all.
const getHostDocument = (): Document | null => {
	if (window === top)
	{
		return null;
	}

	try
	{
		const hostDocument = top?.document ?? null;

		return hostDocument === document ? null : hostDocument;
	}
	catch
	{
		return null;
	}
};

/**
 * Placement of the popup, its closing and the ban on closing after the popup is up. The surface reads no
 * scenario and knows of no state: the ban is its own attribute, switched from the outside by setClosable().
 */
export class Surface
{
	#popover: Popover;
	#anchor: HTMLElement;
	#bubble: HTMLElement;
	#focusTrap: FocusTrap;
	#closable: boolean = true;
	#hostDocument: Document | null = null;
	#shouldApplyInitialFocus: boolean = false;

	constructor(options: SurfaceOptions)
	{
		this.#anchor = options.anchor;
		this.#bubble = options.bubble;
		this.#focusTrap = new FocusTrap(options.bubble, {
			initialFocus: ['first-tabbable', 'container'],
			restoreFocus: (): HTMLElement | null => {
				return isOnScreen(this.#anchor) ? this.#anchor : null;
			},
			preventScroll: true,
		});
		this.#popover = new Popover({
			content: options.bubble,
			target: options.anchor,
			designContext: PopoverDesignContext.ContentLight,
			positioning: {
				position: PopoverPosition.Bottom,
				alignment: PopoverAlignment.End,
				// The engine, not a width in the stylesheet, holds the geometry: it caps the bubble to the
				// space left in the boundary, and the bubble follows by the layout defaults of the popover.
				constrainSize: true,
				// whenAnchorHidden stays on its default 'hide': a header button scrolled out of sight only
				// takes the bubble off the screen visually and brings it back, which is not a closing and
				// leaves the state alone. The 'close' mode calls hide(), so a scroll of the page would put
				// out a popup holding an unfinished changing request - against AC-012 and AC-014.
			},
			events: {
				onShow: (): void => this.#watchOutside(),
				onStateChange: this.#handlePopoverStateChange,
				onHide: (): void => {
					this.#unwatchOutside();
					options.onClose();
				},
			},
		});
	}

	show(): void
	{
		this.#popover.show();
	}

	isShown(): boolean
	{
		return this.#popover.isShown();
	}

	// Both closing routes rebind on a shown popover, so the ban works after the popup is already up. The
	// watch of the presses the engine cannot see reads the same sign and never outlives it.
	setClosable(closable: boolean): void
	{
		this.#closable = closable;
		this.#popover.setCloseByClickOutside(closable);
		this.#popover.setCloseByEsc(closable);
	}

	destroy(): void
	{
		this.#popover.destroy();
		this.#focusTrap.destroy();
	}

	/**
	 * A press outside the bubble can land in three places, and the engine of the popover listens in one of
	 * them: the document the popup lives in. That one is left to it alone - it arbitrates the layers of the
	 * page there, and a second watch beside it would close the popup under a window that opened over it.
	 *
	 * The other two are watched here. The document of the host window is listened to as a press. A frame of
	 * another origin - the dashboard of the report, which covers the page below the bar of the header - lets
	 * nothing through: the one trace a press inside it leaves on our side is the focus moving onto the frame
	 * element, and the blur of the window is read for that. Without it a press into the report leaves the
	 * popup up, and the Escape that follows goes into the frame along with the focus.
	 */
	#watchOutside(): void
	{
		this.#shouldApplyInitialFocus = true;
		this.#focusTrap.activate({ initialFocus: false });
		this.#applyInitialFocusWhenReady();

		this.#hostDocument = getHostDocument();
		if (this.#hostDocument !== null)
		{
			Event.bind(this.#hostDocument, 'mousedown', this.#handleHostPress, { capture: true });
		}

		Event.bind(window, 'blur', this.#handleWindowBlur);
	}

	// The subscriptions live exactly as long as the popup is on the screen: the popover reports its leaving
	// by the same event the closing of the state is carried by.
	#unwatchOutside(): void
	{
		this.#shouldApplyInitialFocus = false;
		this.#focusTrap.deactivate();

		if (this.#hostDocument !== null)
		{
			Event.unbind(this.#hostDocument, 'mousedown', this.#handleHostPress, { capture: true });
			this.#hostDocument = null;
		}

		Event.unbind(window, 'blur', this.#handleWindowBlur);
	}

	#handlePopoverStateChange = (event: BaseEvent): void => {
		const { state } = event.getData() as PopoverStateChangePayload;

		this.#applyInitialFocusWhenReady(state.positioned);
	};

	#applyInitialFocusWhenReady(positioned: boolean = this.#popover.getState().positioned): void
	{
		if (!this.#shouldApplyInitialFocus || !positioned)
		{
			return;
		}

		this.#shouldApplyInitialFocus = false;
		this.#focusTrap.applyInitialFocus();
	}

	#handleHostPress = (event: MouseEvent): void => {
		const target = event.target;
		if (
			!Type.isElementNode(target)
			|| this.#bubble.contains(target as Node)
			|| this.#anchor.contains(target as Node)
		)
		{
			return;
		}

		this.#closeFromOutside();
	};

	#handleWindowBlur = (): void => {
		setTimeout((): void => {
			if (document.activeElement?.tagName === FRAME_TAG)
			{
				this.#closeFromOutside();
			}
		}, FOCUS_SETTLE_MS);
	};

	// A press past the popup closes it only while the popup may be closed at all: the ban of an unfinished
	// changing request stands above everything (AC-012), and a window of the portal above the bubble - the
	// confirmation of the reissue, the window of the tariff offer - takes the press to itself. A press on
	// such a window is not a press past the popup, and the engine steps aside under it just the same.
	#closeFromOutside(): void
	{
		if (!this.#closable || !this.#popover.isShown() || this.#hasWindowAbove())
		{
			return;
		}

		this.#popover.hide();
	}

	#hasWindowAbove(): boolean
	{
		const ownZIndex = layerZIndex(this.#bubble);
		const stack = ZIndexManager.getStack(document.body);
		if (ownZIndex === null || !stack)
		{
			return false;
		}

		return stack.getComponents().some((component) => {
			return component.getZIndex() > ownZIndex && isOnScreen(component.getElement());
		});
	}
}
