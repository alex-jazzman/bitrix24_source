import { EventEmitter } from 'main.core.events';

import { Logger } from 'im.v2.lib.logger';
import { Animation, type AnimationHandle } from 'im.v2.lib.animation';

import { ProgrammaticScrollPosition } from './programmatic-scroll-position';

const EVENT_NAMESPACE = 'BX.Messenger.v2.Dialog.ScrollManager';

type ScrollPinHooks = {
	getSpacerHeight: () => number,
	isPinActive: () => boolean,
	onContainerHeightChange: () => void,
};

const BOTTOM_POSITION_THRESHOLD = 40;

export class ScrollManager extends EventEmitter
{
	container: HTMLElement;
	isScrolling: boolean = false;
	currentScroll: number = 0;
	lastScroll: number = 0;
	chatIsScrolledUp: boolean = false;
	scrollButtonClicked: boolean = false;
	startScrollNeeded: boolean = true;

	#resizeObserver: ResizeObserver | null = null;
	#lastContainerHeight: number = 0;

	#activeAnimation: AnimationHandle | null = null;
	#resolveActiveScroll: (() => void) | null = null;
	#animatingToBottom: boolean = false;
	#programmaticPosition: ProgrammaticScrollPosition | null = null;
	#clearScrollFlagFrameId: number | null = null;

	// The scroll-pin spacer occupies the physical bottom of the container, so "bottom" is always
	// measured without it. The spacer outlives an active pin, hence the height is read live.
	#scrollPinHooks: ScrollPinHooks = {
		getSpacerHeight: () => 0,
		isPinActive: () => false,
		onContainerHeightChange: () => {},
	};

	#userLeftBottom: boolean = false;

	// The start scroll positions the feed once, on a chat nobody has scrolled yet, and the position
	// it chooses is not "near the bottom" in the sense the stick-to-bottom guard means: a container
	// shrinking in the same frame must not drag the feed off the New messages mark. Stays null
	// until a start scroll actually moves the feed, and describes nothing once the user has moved
	// away from it.
	#startScrollPosition: number | null = null;

	static events = {
		onScrollTriggerUp: 'onScrollTriggerUp',
		onScrollTriggerDown: 'onScrollTriggerDown',
		onScrollThresholdPass: 'onScrollThresholdPass',
	};

	static scrollPosition = {
		messageTop: 'messageTop',
		messageBottom: 'messageBottom',
		messageCenter: 'messageCenter',
	};

	static FLOATING_DATE_OFFSET = 52;

	constructor(): ScrollManager
	{
		super();
		this.setEventNamespace(EVENT_NAMESPACE);
	}

	setContainer(container: HTMLElement)
	{
		this.container = container;
		this.#programmaticPosition = new ProgrammaticScrollPosition(container);
	}

	setScrollPinHooks(hooks: ScrollPinHooks)
	{
		this.#scrollPinHooks = hooks;
	}

	#contentScrollHeight(): number
	{
		return this.container.scrollHeight - this.#scrollPinHooks.getSpacerHeight();
	}

	observeResize()
	{
		if (this.#resizeObserver || !this.container)
		{
			return;
		}

		this.#lastContainerHeight = this.container.clientHeight;
		this.#resizeObserver = new ResizeObserver(this.#handleContainerResize);
		this.#resizeObserver.observe(this.container);
	}

	destroy()
	{
		this.cancelAnimatedScroll();
		if (this.#clearScrollFlagFrameId !== null)
		{
			cancelAnimationFrame(this.#clearScrollFlagFrameId);
			this.#clearScrollFlagFrameId = null;
		}
		this.#resizeObserver?.disconnect();
		this.#resizeObserver = null;
	}

	#handleContainerResize = (): void => {
		const newHeight = this.container.clientHeight;
		const heightDecreased = newHeight < this.#lastContainerHeight;
		this.#lastContainerHeight = newHeight;

		if (this.#scrollPinHooks.isPinActive())
		{
			this.#scrollPinHooks.onContainerHeightChange();

			return;
		}

		if (!heightDecreased || !this.#shouldStickToBottomOnResize())
		{
			return;
		}

		this.scrollToBottom();
	};

	// The resize itself changes the geometry (a shrunk container, rewrapped text), so only state
	// taken on the last gesture describes a position the user actually chose.
	#shouldStickToBottomOnResize(): boolean
	{
		if (this.#holdsStartScrollPosition())
		{
			return false;
		}

		return !this.chatIsScrolledUp && !this.#hasUserLeftBottom();
	}

	#holdsStartScrollPosition(): boolean
	{
		return this.#startScrollPosition !== null && this.container.scrollTop === this.#startScrollPosition;
	}

	// Called once the start-scroll chain is through: a chain that found nothing to scroll to, or one
	// whose write the browser clamped to the position already on screen, leaves the feed where it
	// was and has no position to protect.
	markStartScrollPosition(positionBeforeStartScroll: number): void
	{
		const position = this.container.scrollTop;
		this.#startScrollPosition = position === positionBeforeStartScroll ? null : position;
	}

	onScroll(event: Event)
	{
		if (!event.target)
		{
			return;
		}

		this.currentScroll = event.target.scrollTop;
		const isScrollingDown = this.lastScroll < this.currentScroll;
		const isScrollingUp = !isScrollingDown;

		if (!this.isScrolling)
		{
			if (isScrollingUp)
			{
				this.scrollButtonClicked = false;
			}

			const SCROLLING_THRESHOLD = 1500;
			const leftSpaceBottom = event.target.scrollHeight - event.target.scrollTop - event.target.clientHeight;
			if (isScrollingDown && this.isStartScrollCompleted() && leftSpaceBottom < SCROLLING_THRESHOLD)
			{
				this.emit(ScrollManager.events.onScrollTriggerDown);
			}
			else if (isScrollingUp && this.currentScroll <= SCROLLING_THRESHOLD)
			{
				this.emit(ScrollManager.events.onScrollTriggerUp);
			}
		}

		this.lastScroll = this.currentScroll;

		this.checkIfChatIsScrolledUp();
	}

	// Called straight from the container's scroll event, before the debounced onScroll: the
	// programmatic-scroll flag lives one animation frame, and by the time the debounced handler
	// runs it is long cleared, so the pin's own positioning would read as a user gesture.
	onRawScroll(): void
	{
		const movedByOthers = this.#cancelAnimationIfMovedByOthers();

		// while a question is pinned only the controller knows the intent behind the event and
		// reports it through markUserScroll(); the pin has also just repositioned the viewport,
		// so whatever was known about the user leaving the bottom no longer describes it
		if (this.#scrollPinHooks.isPinActive())
		{
			this.#userLeftBottom = false;

			return;
		}

		// a position the manager did not write is by definition not its own movement, and the
		// cancel above keeps the programmatic flag up until the next frame
		this.#syncUserLeftBottom(movedByOthers || !this.isProgrammaticScroll());
	}

	// The only way a gesture reaches the manager while a question is pinned: inside the pin's own
	// animation the event reads as programmatic here, so the controller reports its own verdict.
	markUserScroll(): void
	{
		this.#syncUserLeftBottom(true);
	}

	#syncUserLeftBottom(movedByUser: boolean): void
	{
		if (this.#scrollPinHooks.getSpacerHeight() === 0 || this.isAtContentBottom())
		{
			this.#userLeftBottom = false;

			return;
		}

		this.#userLeftBottom = this.#userLeftBottom || movedByUser;
	}

	isProgrammaticScroll(): boolean
	{
		return this.isScrolling;
	}

	checkIfChatIsScrolledUp()
	{
		const SCROLLED_UP_THRESHOLD = 400;

		const availableScrollHeight = this.#contentScrollHeight() - this.container.clientHeight;
		const newFlag = this.currentScroll + SCROLLED_UP_THRESHOLD < availableScrollHeight;
		if (newFlag !== this.chatIsScrolledUp)
		{
			this.emit(ScrollManager.events.onScrollThresholdPass, newFlag);
		}
		this.chatIsScrolledUp = newFlag;
	}

	scrollToBottom()
	{
		Logger.warn('Dialog: ScrollManager: scroll to bottom');
		this.forceScrollTo(this.#contentScrollHeight() - this.container.clientHeight);
	}

	animatedScrollToBottom()
	{
		Logger.warn('Dialog: ScrollManager: animated scroll to bottom');
		this.animatedScrollTo(this.#contentScrollHeight() - this.container.clientHeight, { toBottom: true });
	}

	scrollToMessage(messageId: number, params: { withDateOffset?: boolean, topOffset?: ?number, position?: string } = {})
	{
		Logger.warn('Dialog: ScrollManager: scroll to message - ', messageId);
		const element = this.getDomElementById(messageId);
		if (!element)
		{
			Logger.warn('Dialog: ScrollManager: message not found - ', messageId);

			return;
		}

		const scrollPosition = this.#getScrollPosition(element, params);
		this.forceScrollTo(scrollPosition);
	}

	setStartScrollNeeded(flag: boolean): void
	{
		this.startScrollNeeded = flag;
	}

	isStartScrollCompleted(): boolean
	{
		if (!this.startScrollNeeded)
		{
			return true;
		}

		return this.lastScroll > 0;
	}

	animatedScrollToMessage(messageId: number, params: { withDateOffset?: boolean, topOffset?: ?number, position?: string } = {}): Promise
	{
		Logger.warn('Dialog: ScrollManager: animated scroll to message - ', messageId);
		const element = this.getDomElementById(messageId);
		if (!element)
		{
			Logger.warn('Dialog: ScrollManager: message not found - ', messageId);

			return Promise.resolve();
		}

		const scrollPosition = this.#getScrollPosition(element, params);

		return this.animatedScrollTo(scrollPosition);
	}

	forceScrollTo(position: number)
	{
		Logger.warn('Dialog: ScrollManager: Force scroll to - ', position);
		this.cancelAnimatedScroll();
		this.#markProgrammaticScrollStart();
		this.container.scroll({ top: position, behavior: 'instant' });
		this.#markProgrammaticScrollEnd();
	}

	// Programmatic relative scroll: shift scrollTop by delta under the programmatic-scroll flag, so the
	// resulting scroll event is not misread as a user gesture (mirrors forceScrollTo's flag handling).
	adjustScrollBy(delta: number)
	{
		this.#markProgrammaticScrollStart();
		this.container.scrollTop += delta;
		this.#markProgrammaticScrollEnd();
	}

	adjustScrollOnHistoryAddition(oldContainerHeight: number)
	{
		Logger.warn('Dialog: ScrollManager: Adjusting scroll after history addition');
		const newContainerHeight = this.container.scrollHeight - this.container.clientHeight;
		const newScrollPosition = this.container.scrollTop + newContainerHeight - oldContainerHeight;
		this.forceScrollTo(newScrollPosition);
	}

	animatedScrollTo(position: number, { toBottom = false }: { toBottom?: boolean } = {}): Promise
	{
		Logger.warn('Dialog: ScrollManager: Animated scroll to - ', position);
		this.cancelAnimatedScroll();

		if (this.prefersReducedMotion())
		{
			this.forceScrollTo(position);

			return Promise.resolve();
		}

		return new Promise((resolve) => {
			this.#markProgrammaticScrollStart();
			this.#animatingToBottom = toBottom;
			this.#resolveActiveScroll = resolve;
			this.#activeAnimation = Animation.start({
				start: this.container.scrollTop,
				end: position,
				element: this.#programmaticPosition,
				elementProperty: 'scrollTop',
				callback: () => {
					this.checkIfChatIsScrolledUp();
					this.#finalizeScrollAnimation();
				},
			});
		});
	}

	cancelAnimatedScroll()
	{
		if (!this.#activeAnimation)
		{
			return;
		}

		this.#activeAnimation.cancel();
		this.#finalizeScrollAnimation();
	}

	// The cause of an outside move does not matter - the manager stops leading and lets geometry
	// decide again.
	#cancelAnimationIfMovedByOthers(): boolean
	{
		if (!this.#animatingToBottom || !this.#programmaticPosition.wasMovedByOthers())
		{
			return false;
		}

		Logger.warn('Dialog: ScrollManager: the feed was moved from outside, stopping the animated scroll');
		this.cancelAnimatedScroll();

		return true;
	}

	#finalizeScrollAnimation(): void
	{
		const resolve = this.#resolveActiveScroll;
		this.#activeAnimation = null;
		this.#resolveActiveScroll = null;
		this.#animatingToBottom = false;
		this.#programmaticPosition.forget();
		this.#markProgrammaticScrollEnd();
		resolve?.();
	}

	#markProgrammaticScrollStart(): void
	{
		if (this.#clearScrollFlagFrameId !== null)
		{
			cancelAnimationFrame(this.#clearScrollFlagFrameId);
			this.#clearScrollFlagFrameId = null;
		}
		this.isScrolling = true;
	}

	#markProgrammaticScrollEnd(): void
	{
		if (this.#clearScrollFlagFrameId !== null)
		{
			cancelAnimationFrame(this.#clearScrollFlagFrameId);
		}

		this.#clearScrollFlagFrameId = requestAnimationFrame(() => {
			this.#clearScrollFlagFrameId = null;
			this.isScrolling = false;
		});
	}

	prefersReducedMotion(): boolean
	{
		return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
	}

	isAtTheTop(): boolean
	{
		return this.container.scrollTop === 0;
	}

	isAtTheBottom(): boolean
	{
		return this.container.scrollTop + this.container.clientHeight >= this.#contentScrollHeight();
	}

	isAtOrBelowContentBottom(): boolean
	{
		return this.#distanceToContentBottom() < BOTTOM_POSITION_THRESHOLD;
	}

	isAtContentBottom(): boolean
	{
		return Math.abs(this.#distanceToContentBottom()) < BOTTOM_POSITION_THRESHOLD;
	}

	// A running animation to the bottom counts as being there: a block landing mid-flight retargets
	// it instead of being dropped for the distance the animation has not covered yet.
	shouldFollowNewContent(): boolean
	{
		if (this.#hasUserLeftBottom())
		{
			return false;
		}

		return this.#animatingToBottom || this.isAtContentBottom();
	}

	// a view the spacer holds below the content bottom is the pin's position, not a chosen one
	isAtBottomUnlessUserLeft(): boolean
	{
		return !this.#hasUserLeftBottom() && this.isAtOrBelowContentBottom();
	}

	#hasUserLeftBottom(): boolean
	{
		return this.#userLeftBottom && this.#scrollPinHooks.getSpacerHeight() > 0;
	}

	#distanceToContentBottom(): number
	{
		return this.#contentScrollHeight() - this.container.scrollTop - this.container.clientHeight;
	}

	getDomElementById(id: number | string): ?HTMLElement
	{
		return this.container.querySelector(`[data-id="${id}"]`);
	}

	#getScrollPosition(element: HTMLElement, params: { withDateOffset?: boolean, topOffset?: ?number, position?: string } = {}): number
	{
		const MESSAGE_BOTTOM_OFFSET = 100;

		const { withDateOffset = true, topOffset = null, position = ScrollManager.scrollPosition.messageTop } = params;
		// an explicit topOffset pins the element that many px from the top (0 = top edge, used by scroll-pin);
		// otherwise fall back to the floating-date reserve or the default small buffer
		const offset = topOffset === null ? (withDateOffset ? -ScrollManager.FLOATING_DATE_OFFSET : -10) : -topOffset;

		let scrollPosition = element.offsetTop + offset;
		if (position === ScrollManager.scrollPosition.messageBottom)
		{
			scrollPosition += element.clientHeight - MESSAGE_BOTTOM_OFFSET;
		}
		else if (position === ScrollManager.scrollPosition.messageCenter
			&& this.container.clientHeight > element.clientHeight
		)
		{
			scrollPosition = scrollPosition - (this.container.clientHeight / 2) + (element.clientHeight / 2);
		}

		return scrollPosition;
	}
}
