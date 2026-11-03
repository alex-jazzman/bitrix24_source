import { Event } from 'main.core';
import { EventEmitter, type BaseEvent } from 'main.core.events';
import { type Store } from 'ui.vue3.vuex';

import { Core } from 'im.v2.application.core';
import { EventType } from 'im.v2.const';
import { Logger } from 'im.v2.lib.logger';
import { type ImModelMessage } from 'im.v2.model';

import { ScrollManager } from './scroll-manager';

type PinQuestionEvent = BaseEvent<{ dialogId: string, messageId: number | string }>;
type StoreMutation = {
	type: string,
	payload: { id: number | string, fields?: { id?: number | string }, messages?: ImModelMessage[] },
};
type Anchor = { chatId: number, messageId: number | string };
type PendingAnchor = { dialogId: string, messageId: number | string, expiresAt: number };
type ControllerParams = {
	dialogId: string,
	store: Store,
	getContainer: () => ?HTMLElement,
	getScrollManager: () => ScrollManager,
	onSpacerHeightChange?: (height: number, animate?: boolean) => void,
	onAnchorGapChange?: (messageId: ?(number | string), height: number) => void,
};

const ScrollPinConfig = {
	// The floating date pill is sticky at the top of the feed, so a question pinned closer than its
	// height ends up under it. The reserve the rest of the feed already scrolls by covers the pill and
	// the gap of the mockup below it, and sharing it keeps the pin and scrollToMessage on one line.
	topOffset: ScrollManager.FLOATING_DATE_OFFSET,
	pendingAnchorTtl: 15000, // start-screen pending anchor lifetime, ms
	retryRepinTtl: 4000, // ms to wait for the pull-recreated question before giving up the pin (copilot retry)
};

// Keys that move the scroll viewport: any of them means the user drives the scroll (ALG-02).
const NAVIGATION_KEYS = new Set([
	'ArrowUp',
	'ArrowDown',
	'PageUp',
	'PageDown',
	'Home',
	'End',
	' ',
	'Spacebar',
]);

export const ScrollPinRegion = {
	aboveAnchor: 'aboveAnchor',
	belowAnchor: 'belowAnchor',
	container: 'container',
};

// Vue patches the DOM asynchronously, so pin() may run before the anchor element exists (I-4).
const PIN_ANCHOR_MAX_RETRIES = 30;

// ALG-10: a discrepancy up to this many pixels counts as "the anchor is at the target", so the
// settle is idempotent and a clamped, unreachable target stops correcting by itself
const PIN_SETTLE_TOLERANCE = 1;

// the message list root: everything above the anchor lives in it, so its height changes are exactly
// what pushes the pinned question out of the top of the viewport
const MESSAGE_LIST_SELECTOR = '.bx-im-message-list__container';

// lets the static listener know whether a mounted feed already owns the target dialog
const activeControllers: Map<string, ScrollPinController> = new Map();
let pendingAnchor: PendingAnchor | null = null;

// start-screen send: no feed is mounted yet, so the anchor waits for a freshly-mounted controller
const handlePinQuestionAtModuleLevel = (event: PinQuestionEvent): void => {
	const { dialogId, messageId } = event.getData();
	if (activeControllers.has(dialogId))
	{
		return;
	}

	pendingAnchor = {
		dialogId,
		messageId,
		expiresAt: Date.now() + ScrollPinConfig.pendingAnchorTtl,
	};
};

// a stale im.v2.const must not crash the whole module at import time
if (EventType.dialog?.pinQuestion)
{
	EventEmitter.subscribe(EventType.dialog.pinQuestion, handlePinQuestionAtModuleLevel);
}

export function consumePendingAnchor(dialogId: string): ?{ messageId: number | string }
{
	if (!pendingAnchor || pendingAnchor.dialogId !== dialogId)
	{
		return null;
	}

	const expired = Date.now() > pendingAnchor.expiresAt;
	const result = expired ? null : { messageId: pendingAnchor.messageId };
	pendingAnchor = null;

	return result;
}

/**
 * The anchor is a logical message reference — never a DOM node — so it survives
 * temporaryId -> server id swaps and message-list DOM re-creation.
 */
export class ScrollPinController
{
	#dialogId: string;
	#store: Store;
	#getContainer: () => ?HTMLElement;
	#getScrollManager: () => ScrollManager;
	#onSpacerHeightChange: (height: number, animate: boolean) => void;
	#onAnchorGapChange: (messageId: ?(number | string), height: number) => void;

	#anchor: Anchor | null = null;
	#active: boolean = false;
	#spacerHeight: number = 0;
	#anchorTop: number = 0;

	// QA-3: the feed keeps an empty gap of topOffset right above the pinned question, so the reserve the
	// pin target leaves over it shows nothing of the previous answer. The message the gap belongs to, or
	// null while there is none; it lives and dies with the spacer, not with #active (a frozen pin keeps
	// both, or the feed would jump by the gap under the user's hand).
	#gapAnchorId: number | string | null = null;

	// ALG-10: the position the settle last left the feed at, together with the anchor offset it was
	// read against. The gesture classification of ALG-02 is knowingly incomplete, so the settle cannot
	// rely on being told about a gesture: it compares the feed against its own last word instead.
	// `rangeFloor` is the narrowest scroll range seen since that position was written (QA-4) - see
	// #observeScrollRange.
	#assertedPosition: { scrollTop: number, anchorTop: number, rangeFloor: number } | null = null;

	#resizeObserver: ResizeObserver | null = null;
	#contentResizeObserver: ResizeObserver | null = null;
	// the feed node the content observer is attached to, so a re-created list can be told from the live one
	#observedContent: ?HTMLElement = null;
	#storeUnsubscribe: (() => void) | null = null;

	// ALG-10: while the pin runs its own animated scroll the position belongs to that animation, so the
	// settle stands aside. The generation keeps a superseded animation from settling the pin that
	// replaced it: cancelAnimatedScroll resolves its promise after the new pin is already armed.
	#pinScrollAnimating: boolean = false;
	#pinScrollGeneration: number = 0;
	// ALG-02: the way the pin scroll travels, fixed when it starts and read only while it runs. A wheel
	// that way asks for nothing the pin is not already doing, so it is not a gesture - see #handleWheel.
	#pinScrollDirection: number = 0;
	// the pin scroll waits a frame for the spacer to reach the DOM, and the frame reads #anchor when it
	// wakes up, so a superseded pin has to take its frame with it (the generation guards the follow-up)
	#pinScrollFrameId: number | null = null;

	// ALG-02: input handlers arm it, the scroll handler tells a gesture from the pin's own movement
	#manualIntent: boolean = false;
	#manualIntentFrameId: number | null = null;
	#inputListenersBound: boolean = false;

	// I-4: pin() may run before Vue paints the anchor; these drive the bounded retry.
	#pinRetryFrameId: number | null = null;
	#pinRetriesLeft: number = 0;

	// lands the real target one frame after the spacer is armed at 0, so CSS has a state to leave
	#riseFrameId: number | null = null;

	// ERR-007: the streaming answer grows scrollHeight, which no ResizeObserver watches - the anchor
	// observer sees the question, the container observer sees clientHeight. Store mutations drive this.
	#recalcFrameId: number | null = null;

	// copilot retry deletes the anchor question and pushes a new one without a pinQuestion event, so
	// the spacer is held while the recreated own question is awaited instead of dropping to the bottom
	#pendingRepin: { chatId: number, expiresAt: number } | null = null;
	#pendingRepinTimerId: number | null = null;

	// while set, the spacer carries the `--rising` modifier and CSS owns its height; recalcs are
	// suppressed so a mount reflow or a streaming answer cannot retarget it mid-transition
	#spacerRising: boolean = false;

	// captured at rise start: recomputing in the deferred frame reads mid-mount geometry and overshoots
	#riseTarget: number = 0;

	constructor(params: ControllerParams)
	{
		this.#dialogId = params.dialogId;
		this.#store = params.store;
		this.#getContainer = params.getContainer;
		this.#getScrollManager = params.getScrollManager;
		this.#onSpacerHeightChange = params.onSpacerHeightChange ?? (() => {});
		this.#onAnchorGapChange = params.onAnchorGapChange ?? (() => {});
	}

	attach(): void
	{
		// a double mount must not leave the previous controller with live listeners and a spacer
		const existing = activeControllers.get(this.#dialogId);
		if (existing && existing !== this)
		{
			existing.destroy();
		}
		activeControllers.set(this.#dialogId, this);
		EventEmitter.subscribe(EventType.dialog.pinQuestion, this.#handlePinQuestion);
		this.#storeUnsubscribe = this.#store.subscribe(this.#handleStoreMutation);
		this.#bindInputListeners();
	}

	destroy(): void
	{
		EventEmitter.unsubscribe(EventType.dialog.pinQuestion, this.#handlePinQuestion);
		this.#storeUnsubscribe?.();
		this.#storeUnsubscribe = null;
		this.#unbindInputListeners();
		this.#cancelManualIntentFrame();
		this.#cancelPinRetry();
		this.#cancelPinScrollFrame();
		this.#cancelRiseFrame();
		this.#cancelRecalcFrame();
		this.#pendingRepin = null;
		this.#clearPendingRepinTimer();
		this.#spacerRising = false;
		this.#stopPinScroll();
		this.#disconnectObservers();
		activeControllers.delete(this.#dialogId);
		this.#anchor = null;
		this.#active = false;
		this.#setSpacerHeight(0);
		this.#setAnchorGap(null);
	}

	isActive(): boolean
	{
		return this.#active;
	}

	getAnchor(): Anchor | null
	{
		return this.#anchor;
	}

	getSpacerHeight(): number
	{
		return this.#spacerHeight;
	}

	pin(messageId: number | string, { animate = true }: { animate?: boolean } = {}): void
	{
		const dialog = this.#store.getters['chats/get'](this.#dialogId, true);
		// a rapid second send supersedes the previous pin without an intermediate jump (AC-014/015)
		this.#getScrollManager().cancelAnimatedScroll();
		this.#cancelRiseFrame();
		this.#spacerRising = false;
		this.#cancelPinRetry();
		this.#cancelPinScrollFrame();
		this.#pinScrollGeneration++;
		// the previous pin's own scroll is over; #fixAnchorToTop fixes the direction of this one anew
		this.#stopPinScroll();
		this.#pinScrollAnimating = animate;
		// the position of the previous pin says nothing about this one; the first settle records it anew
		this.#assertedPosition = null;
		this.#anchor = { chatId: dialog.chatId, messageId };
		this.#active = true;
		this.#pinRetriesLeft = PIN_ANCHOR_MAX_RETRIES;

		this.#applyPin(animate);
	}

	// On a normal send the anchor is not painted on the first pass, so the frame is retried until it
	// appears or the budget runs out - otherwise the pin stays active but inert (I-4).
	#applyPin(animate: boolean): void
	{
		if (!this.#active || !this.#anchor)
		{
			return;
		}

		const anchorEl = this.#resolveAnchorElement();
		if (!anchorEl)
		{
			if (this.#pinRetriesLeft > 0)
			{
				this.#pinRetriesLeft--;
				this.#pinRetryFrameId = requestAnimationFrame(() => {
					this.#pinRetryFrameId = null;
					this.#applyPin(animate);
				});

				return;
			}

			// anchor never rendered within the retry budget: release so the pin never stays active-but-inert (I-4)
			this.release({ compensate: false });

			return;
		}

		if (this.#tryAnimateSpacerRise(anchorEl, animate))
		{
			// the rise lifts the question by growing the spacer, so no scroll of ours is pending
			this.#stopPinScroll();
			this.#observeGeometry();

			return;
		}

		// QA-3: the gap goes first - it grows the feed above the anchor, so both the spacer maths and the
		// pin scroll have to read the geometry it produces. The reactive height reaches the DOM within the
		// microtask that follows, i.e. before the frame #fixAnchorToTop waits for, exactly as the spacer does.
		this.#setAnchorGap(this.#anchor.messageId);
		this.recalcSpacerHeight();
		this.#observeGeometry();
		this.#fixAnchorToTop(animate);
	}

	// First send in a fresh chat: the question already sits at the bottom, so an animated scroll has no
	// range to move (ALG-01) and the rise has to come from the spacer growing instead. Any other case
	// keeps the scroll-driven path.
	#tryAnimateSpacerRise(anchor: HTMLElement, animate: boolean): boolean
	{
		if (!animate || this.#spacerHeight !== 0)
		{
			return false;
		}

		const container = this.#getContainer();
		if (!container)
		{
			return false;
		}

		const spacerTarget = this.#computeSpacerHeight(container, anchor);
		const contentHeightWithoutSpacer = container.scrollHeight - this.#spacerHeight;
		const fitsViewport = contentHeightWithoutSpacer <= container.clientHeight + ScrollPinConfig.topOffset;
		// flex-end stretches short content, so geometry alone cannot tell an empty chat from an old one
		if (spacerTarget <= 0 || !fitsViewport || !this.#isAnchorFirstMessage())
		{
			return false;
		}

		this.#anchorTop = anchor.offsetTop;

		// IMP-01: reduced motion means no transition and therefore no transitionend, so #spacerRising
		// would stay set and suppress every later recalc
		if (this.#getScrollManager().prefersReducedMotion())
		{
			this.#setSpacerHeight(spacerTarget);

			return true;
		}

		this.#spacerRising = true;
		this.#riseTarget = spacerTarget;
		// the browser needs a committed 0-height state to transition from, or the rise snaps
		this.#setSpacerHeight(0, true);
		this.#scheduleRiseTarget();

		return true;
	}

	// getByChatId returns the collection oldest-first; at pin time the anchor may still carry its
	// send-time temporaryId, and a missing one counts as NOT-first so the safe scroll path runs
	#isAnchorFirstMessage(): boolean
	{
		if (!this.#anchor)
		{
			return false;
		}

		const messages: ImModelMessage[] = this.#store.getters['messages/getByChatId'](this.#anchor.chatId);
		const anchorId = String(this.#anchor.messageId);
		const anchorIndex = messages.findIndex((message: ImModelMessage) => {
			return String(message.id) === anchorId || String(message.temporaryId) === anchorId;
		});

		return anchorIndex === 0;
	}

	#scheduleRiseTarget(): void
	{
		this.#cancelRiseFrame();
		this.#riseFrameId = requestAnimationFrame(() => {
			this.#riseFrameId = null;
			if (!this.#active || !this.#spacerRising)
			{
				return;
			}

			const container = this.#getContainer();
			const spacer = container?.querySelector('.bx-im-dialog-chat__scroll-pin-spacer');
			if (spacer)
			{
				// force layout so the height:0 + --rising state is committed before the height changes
				void spacer.offsetHeight;
			}

			// the captured target, not a fresh recalc: mid-mount geometry would overshoot
			this.#setSpacerHeight(this.#riseTarget, true);
		});
	}

	#cancelRiseFrame(): void
	{
		if (this.#riseFrameId !== null)
		{
			cancelAnimationFrame(this.#riseFrameId);
			this.#riseFrameId = null;
		}
	}

	// Coalesce answer-stream recalcs to one per frame and run after Vue has painted the mutation.
	#scheduleRecalc(): void
	{
		if (this.#recalcFrameId !== null)
		{
			return;
		}

		this.#recalcFrameId = requestAnimationFrame(() => {
			this.#recalcFrameId = null;
			this.#onGeometrySettled();
		});
	}

	#cancelRecalcFrame(): void
	{
		if (this.#recalcFrameId !== null)
		{
			cancelAnimationFrame(this.#recalcFrameId);
			this.#recalcFrameId = null;
		}
	}

	#cancelPinRetry(): void
	{
		if (this.#pinRetryFrameId !== null)
		{
			cancelAnimationFrame(this.#pinRetryFrameId);
			this.#pinRetryFrameId = null;
		}
	}

	#cancelPinScrollFrame(): void
	{
		if (this.#pinScrollFrameId !== null)
		{
			cancelAnimationFrame(this.#pinScrollFrameId);
			this.#pinScrollFrameId = null;
		}
	}

	// First send from the draft empty state (AC-005/006): the feed is only now mounting,
	// so the pin lands instantly. The stashed id is the send-time temporaryId; by mount it
	// may already be swapped for the server id, hence the resolve.
	pinFromStart(messageId: number | string): void
	{
		this.pin(this.#resolveSentMessageId(messageId), { animate: false });
	}

	// also disposes a spacer left frozen by a manual cancel (down-button, AC-008)
	release({ compensate = true }: { compensate?: boolean } = {}): void
	{
		// a long answer leaves the spacer at 0 while the gap above the question is still there
		if (!this.#active && this.#spacerHeight === 0 && this.#gapAnchorId === null)
		{
			return;
		}

		this.#active = false;
		this.#anchor = null;
		this.#cancelPinRetry();
		this.#cancelPinScrollFrame();
		this.#cancelRiseFrame();
		this.#pendingRepin = null;
		this.#clearPendingRepinTimer();
		this.#spacerRising = false;
		this.#stopPinScroll();
		this.#disconnectObservers();
		if (compensate)
		{
			this.#compensateOnRelease();
		}
		this.#setSpacerHeight(0);
		this.#setAnchorGap(null);
	}

	// Soft cancel for a manual scroll or a message navigation (AC-008/AC-012/AC-013): unlike release,
	// the spacer stays, so the content bottom holds until the next send.
	freeze(): void
	{
		if (!this.#active)
		{
			return;
		}

		this.#getScrollManager().cancelAnimatedScroll();
		this.#cancelPinRetry();
		this.#cancelPinScrollFrame();
		this.#cancelRiseFrame();
		this.#spacerRising = false;
		this.#stopPinScroll();
		this.#active = false;
		this.#anchor = null;
		this.#disconnectObservers();
	}

	// the anchor was deleted by a copilot retry: hold the spacer and wait for the recreated question,
	// falling back to a compensated release when none arrives within the TTL
	#beginPendingRepin(): void
	{
		const chatId = this.#anchor?.chatId;
		if (chatId == null)
		{
			this.release({ compensate: true });

			return;
		}

		this.#active = false;
		this.#anchor = null;
		this.#cancelPinRetry();
		this.#cancelPinScrollFrame();
		this.#cancelRiseFrame();
		this.#spacerRising = false;
		this.#stopPinScroll();
		this.#disconnectObservers();

		this.#pendingRepin = { chatId, expiresAt: Date.now() + ScrollPinConfig.retryRepinTtl };
		this.#clearPendingRepinTimer();
		this.#pendingRepinTimerId = setTimeout(() => {
			this.#pendingRepinTimerId = null;
			this.#expirePendingRepin();
		}, ScrollPinConfig.retryRepinTtl);
	}

	// the recreated question is the first stored message of the pending chat authored by the current
	// user; the transient id-0 placeholder and the bot answer are skipped by the filter below
	#tryConsumePendingRepin(payload: { messages?: ImModelMessage[] }): void
	{
		const pending = this.#pendingRepin;
		if (!pending)
		{
			return;
		}

		if (Date.now() > pending.expiresAt)
		{
			this.#expirePendingRepin();

			return;
		}

		const messages: ImModelMessage[] = Array.isArray(payload?.messages) ? payload.messages : [];
		const currentUserId = Core.getUserId();
		const ownQuestion = messages.find((message: ImModelMessage) => {
			return Number(message.chatId) === pending.chatId
				&& Number(message.authorId) === currentUserId
				&& String(message.id) !== '0';
		});
		if (!ownQuestion)
		{
			return;
		}

		this.#clearPendingRepinTimer();
		this.#pendingRepin = null;
		// the recreated question sits where the old one was, so pin instantly — an animated re-scroll
		// would read as a jump.
		this.pin(ownQuestion.id, { animate: false });
	}

	#expirePendingRepin(): void
	{
		if (!this.#pendingRepin)
		{
			return;
		}

		this.#pendingRepin = null;
		this.#clearPendingRepinTimer();
		// no recreated question arrived: fall back to the original anchor-delete behaviour.
		this.release({ compensate: true });
	}

	#clearPendingRepinTimer(): void
	{
		if (this.#pendingRepinTimerId !== null)
		{
			clearTimeout(this.#pendingRepinTimerId);
			this.#pendingRepinTimerId = null;
		}
	}

	// ALG-01: spacerHeight = max(0, containerHeight - topOffset - anchorHeight - contentBelowAnchorHeight)
	recalcSpacerHeight(): void
	{
		if (!this.#active || this.#spacerRising)
		{
			// during the rise the height is owned by the captured target + CSS transition; a recalc here
			// (mount ResizeObserver, streaming answer) would retarget and jitter. onSpacerRiseEnd settles.
			return;
		}

		const container = this.#getContainer();
		const anchor = this.#resolveAnchorElement();
		if (!container || !anchor)
		{
			return;
		}

		this.#setSpacerHeight(this.#computeSpacerHeight(container, anchor));
	}

	#computeSpacerHeight(container: HTMLElement, anchor: HTMLElement): number
	{
		const contentHeightWithoutSpacer = container.scrollHeight - this.#spacerHeight;
		const contentBelowAnchor = contentHeightWithoutSpacer - (anchor.offsetTop + anchor.clientHeight);

		return Math.max(
			0,
			container.clientHeight - ScrollPinConfig.topOffset - anchor.clientHeight - contentBelowAnchor,
		);
	}

	// ALG-10
	#getPinTarget(anchor: HTMLElement): number
	{
		return anchor.offsetTop - ScrollPinConfig.topOffset;
	}

	// ALG-10: bring the feed back to the pin target. The target is clamped to the reachable range, so
	// an unreachable pin (question taller than the viewport) settles once and then produces no further
	// corrections - the correction is idempotent, not a retry loop.
	#settleToPinTarget(): void
	{
		if (!this.#active || this.#spacerRising || this.#pinScrollAnimating)
		{
			return;
		}

		const container = this.#getContainer();
		const anchor = this.#resolveAnchorElement();
		if (!container || !anchor)
		{
			return;
		}

		const maxScrollTop = this.#getMaxScrollTop(container);
		if (this.#wasFeedMovedByOthers(container, anchor, maxScrollTop))
		{
			this.#yieldToExternalMove();

			return;
		}

		// the settle has the last word on the position, so the offset it read is where the next relative
		// compensation measures from - on the branch that moves nothing too (ERR-004)
		this.#anchorTop = anchor.offsetTop;

		const target = Math.min(Math.max(0, this.#getPinTarget(anchor)), maxScrollTop);
		const delta = target - container.scrollTop;
		if (Math.abs(delta) <= PIN_SETTLE_TOLERANCE)
		{
			this.#rememberAssertedPosition(container, anchor);

			return;
		}

		Logger.warn('Dialog: ScrollPinController: settle to pin target - ', target, container.scrollTop, delta);
		// route through ScrollManager so the resulting scroll event is marked programmatic and not
		// misread as a user gesture
		this.#getScrollManager().adjustScrollBy(delta);
		this.#rememberAssertedPosition(container, anchor);
	}

	// ALG-02 arms #manualIntent from input events, and it misses whole classes of gesture: an overlay
	// scrollbar drag (it does not shrink clientWidth, so #handleMouseDown never sees it), middle-button
	// autoscroll, find-in-page, a scrollIntoView of a neighbouring subsystem. None of them is a scroll
	// the pin may undo, so the settle judges the move rather than the gesture. Two moves are the feed's
	// own geometry and not a scroll: content inserted above the anchor carries the viewport with it
	// (history pagination), and a scroll range that shrank under the feed is clamped by the browser.
	#wasFeedMovedByOthers(container: HTMLElement, anchor: HTMLElement, maxScrollTop: number): boolean
	{
		if (this.#assertedPosition === null)
		{
			return false;
		}

		const { scrollTop, anchorTop, rangeFloor } = this.#assertedPosition;
		const carriedByContent = scrollTop + (anchor.offsetTop - anchorTop);
		// QA-4: the clamp is judged against the narrowest range the feed has had since, not the one it
		// has now. Content removed below the anchor (the bot drops its "thinking" message before the
		// answer) shrinks the range for a frame and the spacer grows it back on the next one, so by the
		// time the settle looks, the range that produced the clamp is already gone.
		const clampedToRange = Math.min(scrollTop, maxScrollTop, rangeFloor);

		return [carriedByContent, clampedToRange].every((position: number) => {
			return Math.abs(container.scrollTop - position) > PIN_SETTLE_TOLERANCE;
		});
	}

	// the gesture behind the move was not recognised, but the move itself is the verdict: the manager
	// cannot classify it either, so it is told, and the pin gives way as on AC-012
	#yieldToExternalMove(): void
	{
		Logger.warn('Dialog: ScrollPinController: the feed was moved from outside, releasing the pin');
		this.#getScrollManager().markUserScroll();
		this.freeze();
	}

	// read back rather than remembered as asked for: the browser clamps the write
	#rememberAssertedPosition(container: HTMLElement, anchor: HTMLElement): void
	{
		this.#assertedPosition = {
			scrollTop: container.scrollTop,
			anchorTop: anchor.offsetTop,
			// the floor belongs to this position and is measured from it: a range seen before the write
			// says nothing about a clamp that can only happen after it
			rangeFloor: this.#getMaxScrollTop(container),
		};
	}

	// QA-4: a range that shrinks under the feed is only visible while it is shrunk, and it is the
	// browser that reports it - the clamp it forces raises a scroll event in the same frame. LR-B1 draws
	// the line at the position: the scroll listener must not record where the feed is, or an
	// unrecognised gesture (an overlay scrollbar drag, find-in-page) would be adopted as the pin's own
	// move. The range is not the position - no gesture changes it - so watching it adopts nothing.
	#observeScrollRange(): void
	{
		const container = this.#getContainer();
		if (!container || this.#assertedPosition === null)
		{
			return;
		}

		this.#assertedPosition.rangeFloor = Math.min(
			this.#assertedPosition.rangeFloor,
			this.#getMaxScrollTop(container),
		);
	}

	#getMaxScrollTop(container: HTMLElement): number
	{
		return Math.max(0, container.scrollHeight - container.clientHeight);
	}

	// ALG-10: every point where the geometry comes to rest ends here. The order is part of the
	// solution: the spacer defines the reachable maximum, so it is recomputed before the position.
	#onGeometrySettled(): void
	{
		this.#reobserveDetachedFeed();
		this.recalcSpacerHeight();
		this.#settleToPinTarget();
	}

	// ALG-01 onHeightChange(region)
	onHeightChange(region: string): void
	{
		// during the rise the captured target and CSS own the height, so reflows are ignored
		if (!this.#active || this.#spacerRising)
		{
			return;
		}

		if (region === ScrollPinRegion.belowAnchor)
		{
			// ERR-007: the spacer absorbs the growing answer, so the settle usually finds the position
			// already on target and moves nothing
			this.#onGeometrySettled();

			return;
		}

		if (region === ScrollPinRegion.aboveAnchor)
		{
			// media in history, a previous answer re-rendering taller (ERR-004): keep the anchor visually
			// fixed by the offsetTop delta, then let the settle assert the absolute target (ALG-10)
			if (this.#pinScrollAnimating)
			{
				// the position belongs to the pin's own animation, exactly as in #settleToPinTarget: a
				// write here is overwritten by the next tick anyway, and it would end the programmatic-
				// scroll window in the middle of the animation
				return;
			}

			const anchor = this.#resolveAnchorElement();
			const container = this.#getContainer();
			if (!anchor || !container)
			{
				return;
			}

			const anchorTopNew = anchor.offsetTop;
			const delta = anchorTopNew - this.#anchorTop;
			if (Math.abs(delta) <= PIN_SETTLE_TOLERANCE)
			{
				// the observed node is the whole feed, so this branch also runs while the answer grows
				// below the anchor. The anchor did not move: there is nothing to compensate, and an empty
				// adjustScrollBy would still open (and a frame later close) a programmatic-scroll window.
				return;
			}

			// The compensation is relative and its result is recorded as the pin's own position, so both
			// have to come after the verdict: applied on top of a position the user chose they would drag
			// the feed back and leave the move invisible to every later check (ALG-10).
			const maxScrollTop = this.#getMaxScrollTop(container);
			if (this.#wasFeedMovedByOthers(container, anchor, maxScrollTop))
			{
				this.#yieldToExternalMove();

				return;
			}

			// route through ScrollManager so the resulting scroll event is marked programmatic and not
			// misread as a user "scrolled up" gesture (which would cancel the pin / trigger pagination)
			this.#getScrollManager().adjustScrollBy(delta);
			this.#anchorTop = anchorTopNew;
			this.#rememberAssertedPosition(container, anchor);
			// the relative compensation is only the first step: the absolute target still has to be
			// asserted, and it is clamped by the spacer, so it goes through the normative order (ALG-10)
			this.#onGeometrySettled();

			return;
		}

		if (region === ScrollPinRegion.container)
		{
			// the container shrinks from the bottom, so the spacer carries the change - but the shrink also
			// raises the reachable maximum, and a target clamped short earlier becomes reachable here.
			// The animated re-scroll must not come back: it jittered the feed on every autosize step
			// (ERR-008), while the settle is instant and does nothing once the position is on target.
			this.#onGeometrySettled();
		}
	}

	#handlePinQuestion = (event: PinQuestionEvent): void => {
		const { dialogId, messageId } = event.getData();
		if (dialogId !== this.#dialogId)
		{
			return;
		}

		this.pin(messageId);
	};

	#handleStoreMutation = (mutation: StoreMutation): void => {
		if (this.#pendingRepin && mutation.type === 'messages/store')
		{
			this.#tryConsumePendingRepin(mutation.payload);
		}

		if (!this.#anchor)
		{
			return;
		}

		if (typeof mutation.type === 'string' && mutation.type.startsWith('messages/'))
		{
			// ERR-007: the streaming answer resizes neither the anchor nor the container, so no observer
			// fires and the spacer has to follow the mutations instead
			this.#scheduleRecalc();
		}

		if (mutation.type === 'messages/updateWithId')
		{
			const { id, fields } = mutation.payload;
			// rebind only when the swap targets our anchor AND the new server id stays in the
			// anchor's chat (SEC-NIT-01: the logical anchor is chat + message, not message alone)
			if (this.#isAnchorId(id) && fields?.id != null && this.#belongsToAnchorChat(fields.id))
			{
				// temporaryId -> server id: keep the logical anchor, rebind the observers
				this.#anchor = { ...this.#anchor, messageId: fields.id };
				this.#observeGeometry();
				// QA-3: the feed knows the gap by the id it was given, and the swapped message keeps no
				// trace of the old one - a gap left on the old id is silently dropped by the next render
				if (this.#gapAnchorId !== null)
				{
					this.#setAnchorGap(fields.id);
				}
			}

			return;
		}

		if (
			mutation.type === 'messages/delete'
			&& this.#isAnchorId(mutation.payload.id)
			&& this.#belongsToAnchorChat(mutation.payload.id)
		)
		{
			// the pair recreated by a copilot retry arrives by pull and emits no pinQuestion
			this.#beginPendingRepin();
		}
	};

	#isAnchorId(id: number | string): boolean
	{
		return this.#anchor !== null && String(id) === String(this.#anchor.messageId);
	}

	// SEC-NIT-01: the anchor is chat + message, so a mutated message is checked against the anchor's
	// chat. A deleted one can no longer be checked, and a globally unique id rules out a collision.
	#belongsToAnchorChat(messageId: number | string): boolean
	{
		if (this.#anchor === null)
		{
			return false;
		}

		const message: ?ImModelMessage = this.#store.getters['messages/getById'](messageId);
		if (!message)
		{
			return true;
		}

		return Number(message.chatId) === Number(this.#anchor.chatId);
	}

	#resolveAnchorElement(): ?HTMLElement
	{
		if (!this.#anchor)
		{
			return null;
		}

		return this.#getScrollManager().getDomElementById(this.#anchor.messageId);
	}

	// ALG-10 fail-safe: #pinScrollAnimating silences the settle, so every path that ends or abandons the
	// pin's own scroll has to clear it - a flag left set disables the correction for the whole life of
	// this pin, and silently. The generation check keeps a superseded scroll from unsilencing the pin
	// that replaced it.
	#endPinScroll(generation: number): void
	{
		if (generation === this.#pinScrollGeneration)
		{
			this.#stopPinScroll();
		}
	}

	// the direction only means anything while the pin's own scroll runs, so it dies together with it
	#stopPinScroll(): void
	{
		this.#pinScrollAnimating = false;
		this.#pinScrollDirection = 0;
	}

	// The unclamped target on purpose: the spacer height has not reached the DOM yet, so the reachable
	// maximum is understated here and a clamped delta of zero would leave the direction unknown.
	#computePinScrollDirection(anchor: HTMLElement): number
	{
		const container = this.#getContainer();
		if (!container)
		{
			return 0;
		}

		return Math.sign(this.#getPinTarget(anchor) - container.scrollTop);
	}

	#fixAnchorToTop(animate: boolean = true): void
	{
		const generation = this.#pinScrollGeneration;
		const anchor = this.#resolveAnchorElement();
		if (!anchor)
		{
			// the anchor was resolved in #applyPin and is gone already: nothing of ours will scroll
			this.#endPinScroll(generation);

			return;
		}

		this.#anchorTop = anchor.offsetTop;
		this.#pinScrollDirection = this.#computePinScrollDirection(anchor);
		// let the reactive spacer height reach the DOM before scrolling the anchor to the top
		this.#cancelPinScrollFrame();
		this.#pinScrollFrameId = requestAnimationFrame(() => {
			this.#pinScrollFrameId = null;
			if (!this.#active || !this.#anchor)
			{
				this.#endPinScroll(generation);

				return;
			}

			const params = {
				position: ScrollManager.scrollPosition.messageTop,
				topOffset: ScrollPinConfig.topOffset,
			};
			// both paths reach the same target (ADR invariant 4), so the continuation is shared: an
			// instant scroll gets clamped or lost exactly like an animated one, and waiting for some
			// unrelated equilibrium point to notice would leave the question below the top meanwhile.
			const settleAfterPinScroll = () => {
				if (generation !== this.#pinScrollGeneration)
				{
					return;
				}

				// one frame later the browser has committed the final position, so the settle sees what
				// the scroll actually reached: clamped short, lost to a missing element, or on target
				requestAnimationFrame(() => {
					if (generation !== this.#pinScrollGeneration)
					{
						return;
					}

					this.#endPinScroll(generation);
					this.#onGeometrySettled();
				});
			};

			if (animate)
			{
				void this.#getScrollManager()
					.animatedScrollToMessage(this.#anchor.messageId, params)
					.then(settleAfterPinScroll);

				return;
			}

			this.#getScrollManager().scrollToMessage(this.#anchor.messageId, params);
			settleAfterPinScroll();
		});
	}

	// The stashed id was the send-time temporaryId; the message model keeps `temporaryId`
	// through the server-id swap, so a swapped anchor is found by it.
	#resolveSentMessageId(messageId: number | string): number | string
	{
		if (this.#store.getters['messages/getById'](messageId))
		{
			return messageId;
		}

		const dialog = this.#store.getters['chats/get'](this.#dialogId, true);
		const messages: ImModelMessage[] = this.#store.getters['messages/getByChatId'](dialog.chatId);
		const swapped = messages.find((message) => String(message.temporaryId) === String(messageId));

		return swapped ? swapped.id : messageId;
	}

	// The anchor and the feed content share one observer lifecycle: both are (re)bound wherever the
	// anchor is bound and both are dropped on release / freeze / destroy. The nodes are resolved anew
	// every time because Vue re-creates the message list.
	#observeGeometry(): void
	{
		this.#disconnectObservers();
		const content = this.#getContainer()?.querySelector(MESSAGE_LIST_SELECTOR) ?? null;
		this.#observedContent = content;
		if (typeof ResizeObserver === 'undefined')
		{
			return;
		}

		const anchor = this.#resolveAnchorElement();
		if (anchor)
		{
			this.#resizeObserver = new ResizeObserver(this.#handleAnchorResize);
			this.#resizeObserver.observe(anchor);
		}

		if (content)
		{
			this.#contentResizeObserver = new ResizeObserver(this.#handleContentResize);
			this.#contentResizeObserver.observe(content);
		}
	}

	// Vue re-creates the message list, and the observer keeps the node it was given at pin time: once
	// that node is detached the feed grows unnoticed - the fix stops working without a sign, and the
	// detached subtree is held until release. Every equilibrium point checks the node is still the
	// container's own and rebinds if it is not.
	#reobserveDetachedFeed(): void
	{
		if (!this.#active)
		{
			return;
		}

		const content = this.#getContainer()?.querySelector(MESSAGE_LIST_SELECTOR) ?? null;
		if (content !== this.#observedContent)
		{
			this.#observeGeometry();
		}
	}

	#handleAnchorResize = (): void => {
		this.recalcSpacerHeight();
	};

	// The feed grew or shrank. Growth below the anchor leaves its offsetTop alone, so this is only
	// consequential when something above the anchor changed height (ERR-004).
	#handleContentResize = (): void => {
		this.onHeightChange(ScrollPinRegion.aboveAnchor);
	};

	#disconnectObservers(): void
	{
		this.#resizeObserver?.disconnect();
		this.#resizeObserver = null;
		this.#contentResizeObserver?.disconnect();
		this.#contentResizeObserver = null;
		this.#observedContent = null;
	}

	#bindInputListeners(): void
	{
		const container = this.#getContainer();
		if (!container || this.#inputListenersBound)
		{
			return;
		}

		Event.bind(container, 'scroll', this.#handleContainerScroll);
		Event.bind(container, 'wheel', this.#handleWheel);
		Event.bind(container, 'touchmove', this.#handleManualGesture);
		Event.bind(container, 'keydown', this.#handleKeydown);
		Event.bind(container, 'mousedown', this.#handleMouseDown);
		Event.bind(document, 'mouseup', this.#handleMouseUp);
		this.#inputListenersBound = true;
	}

	#unbindInputListeners(): void
	{
		if (!this.#inputListenersBound)
		{
			return;
		}

		// mouseup is bound on document, not the container, so it must be released even when the
		// container is already gone on destroy — otherwise the listener (and this controller) leaks.
		const container = this.#getContainer();
		if (container)
		{
			Event.unbind(container, 'scroll', this.#handleContainerScroll);
			Event.unbind(container, 'wheel', this.#handleWheel);
			Event.unbind(container, 'touchmove', this.#handleManualGesture);
			Event.unbind(container, 'keydown', this.#handleKeydown);
			Event.unbind(container, 'mousedown', this.#handleMouseDown);
		}
		Event.unbind(document, 'mouseup', this.#handleMouseUp);
		this.#inputListenersBound = false;
	}

	#handleManualGesture = (): void => {
		this.#armManualIntent();
	};

	// ALG-02: a trackpad keeps sending inertial wheels for a while after the send, and they arrive in
	// the middle of the pin's own scroll. Read as a gesture they froze the pin halfway, so a wheel that
	// pushes the way the pin is already going is not one while that scroll runs. Against it, and at any
	// other time, a wheel is a gesture exactly as before (AC-012).
	#handleWheel = (event: WheelEvent): void => {
		if (this.#pinScrollAnimating && !this.#isAgainstPinScroll(event.deltaY))
		{
			return;
		}

		this.#armManualIntent();
	};

	// a wheel with no vertical delta moves no scroll range at all, and an unknown pin direction (0)
	// leaves every wheel a gesture, as it was before the inertia exception
	#isAgainstPinScroll(deltaY: number): boolean
	{
		return deltaY !== 0 && Math.sign(deltaY) !== this.#pinScrollDirection;
	}

	#handleKeydown = (event: KeyboardEvent): void => {
		if (NAVIGATION_KEYS.has(event.key))
		{
			this.#armManualIntent();
		}
	};

	#handleMouseDown = (event: MouseEvent): void => {
		const container = this.#getContainer();
		if (!container)
		{
			return;
		}

		// the scrollbar zone starts to the right of the content box; event.offsetX is relative to the
		// child under the cursor, so the container's own box is measured instead
		const offsetX = event.clientX - container.getBoundingClientRect().left;
		if (offsetX > container.clientWidth)
		{
			this.#manualIntent = true;
		}
	};

	#handleMouseUp = (): void => {
		this.#cancelManualIntentFrame();
		this.#manualIntent = false;
	};

	// one frame is long enough for the scroll event the gesture triggers
	#armManualIntent(): void
	{
		this.#manualIntent = true;
		this.#cancelManualIntentFrame();
		this.#manualIntentFrameId = requestAnimationFrame(() => {
			this.#manualIntentFrameId = null;
			this.#manualIntent = false;
		});
	}

	#cancelManualIntentFrame(): void
	{
		if (this.#manualIntentFrameId !== null)
		{
			cancelAnimationFrame(this.#manualIntentFrameId);
			this.#manualIntentFrameId = null;
		}
	}

	// ALG-02: a user gesture cancels the pin for the current answer, an intent-less shift is a reflow
	// the spacer absorbs. While the pin is active the scroll manager defers to this verdict entirely.
	#handleContainerScroll = (): void => {
		// before every verdict below: a range collapsing under the feed is only observable from the
		// event the clamp it forces raises, and that observation is not a position (QA-4)
		this.#observeScrollRange();

		if (!this.#active)
		{
			// a frozen spacer still holds the content bottom, and the manager cannot classify a gesture
			// that lands inside an animation of its own
			if (this.#manualIntent)
			{
				this.#getScrollManager().markUserScroll();
			}

			return;
		}

		if (this.#getScrollManager().isProgrammaticScroll())
		{
			// the user fights the pin's own animation: kill it and treat as manual
			if (this.#manualIntent)
			{
				this.#getScrollManager().markUserScroll();
				this.freeze();
			}

			return;
		}

		if (this.#manualIntent)
		{
			this.#getScrollManager().markUserScroll();
			this.freeze(); // AC-012

			return;
		}

		// A scroll event is not an equilibrium point, and the classification above is knowingly
		// incomplete (an overlay scrollbar drag arms no intent, see #handleMouseDown), so the position
		// is not asserted from here: an unrecognised gesture would be undone on its own scroll event.
		// The settle runs from the equilibrium points instead - the feed observer above all.
		this.recalcSpacerHeight();
	};

	#compensateOnRelease(): void
	{
		const container = this.#getContainer();
		if (!container)
		{
			return;
		}

		// both the spacer and the gap go away with the pin, so the feed loses the height of the two
		const maxScroll = container.scrollHeight - this.#spacerHeight - this.#anchorGapHeight() - container.clientHeight;
		if (container.scrollTop > maxScroll)
		{
			// programmatic absolute scroll so the clamp is not misread as a user gesture
			this.#getScrollManager().forceScrollTo(Math.max(0, maxScroll));
		}
	}

	#setSpacerHeight(height: number, animate: boolean = false): void
	{
		this.#spacerHeight = height;
		this.#onSpacerHeightChange(height, animate);
	}

	#setAnchorGap(messageId: ?(number | string)): void
	{
		this.#gapAnchorId = messageId ?? null;
		this.#onAnchorGapChange(this.#gapAnchorId, this.#anchorGapHeight());
	}

	#anchorGapHeight(): number
	{
		return this.#gapAnchorId === null ? 0 : ScrollPinConfig.topOffset;
	}

	// the answer may have reflowed during the rise, so the settled geometry is recomputed once here
	onSpacerRiseEnd(): void
	{
		this.#spacerRising = false;
		this.#onGeometrySettled();
	}
}
