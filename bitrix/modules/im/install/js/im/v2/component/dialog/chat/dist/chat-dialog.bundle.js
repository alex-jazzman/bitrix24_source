/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, main_core, main_core_events, main_popup, pull_vue3_status, im_v2_application_core, im_v2_component_elements_guestNamePopup, im_v2_component_entitySelector, im_v2_component_messageList, im_v2_const, im_v2_lib_guest, im_v2_lib_access, im_v2_lib_analytics, im_v2_lib_call, im_v2_lib_feature, im_v2_lib_layout, im_v2_lib_logger, im_v2_lib_permission, im_v2_provider_service_chat, im_v2_provider_service_message, im_v2_lib_rest, im_v2_lib_channel, im_v2_lib_demo, im_v2_lib_animation, im_v2_lib_counter, im_v2_lib_parser, im_v2_component_elements_avatar, im_v2_lib_quote, im_v2_lib_utils, im_v2_component_elements_popup) {
	'use strict';

	const DEBOUNCE_TIME = 50;
	class AnchorService {
		#store;
		messagesToRead = new Set();
		#timerBeforeSendRequest = null;
		constructor() {
			this.#store = im_v2_application_core.Core.getStore();
		}
		readChatAnchors(chatId) {
			im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2ChatAnchorRead, {
				data: {
					chatId
				}
			}).then(() => {
				this.#store.dispatch('messages/anchors/removeChatAnchors', chatId);
			}).catch(error => {
				console.error('AnchorService: read chat anchors error', error);
			});
		}
		debouncedReadMessageAnchors(messageId) {
			this.messagesToRead.add(messageId);
			this.#store.dispatch('messages/anchors/removeUserAnchorsFromMessage', messageId);
			if (this.#timerBeforeSendRequest) {
				clearTimeout(this.#timerBeforeSendRequest);
				this.#timerBeforeSendRequest = null;
			}
			this.#timerBeforeSendRequest = setTimeout(() => {
				return this.#batchReadMessageAnchors();
			}, DEBOUNCE_TIME);
			return Promise.resolve();
		}
		#batchReadMessageAnchors() {
			if (this.messagesToRead.size === 0) {
				return;
			}
			im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2AnchorRead, {
				data: {
					messageIds: [...this.messagesToRead]
				}
			}).catch(error => {
				console.error('AnchorService: read anchor error', error);
			});
			this.messagesToRead.clear();
		}
	}

	const MESSAGES_TAG_PREFIX = 'IM_PUBLIC_';
	const COMMENTS_TAG_PREFIX = 'IM_PUBLIC_COMMENT_';
	class PullWatchManager {
		#dialog;
		#pullClient;
		constructor(dialogId) {
			this.#dialog = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
			this.#pullClient = im_v2_application_core.Core.getPullClient();
		}
		subscribe() {
			if (this.#isChannel()) {
				this.#subscribeChannel();
				return;
			}
			if (!this.#isGuest() || this.#isCommentsChat() || this.#isDemoChat()) {
				return;
			}
			this.#subscribeOpenChat();
		}
		unsubscribe() {
			this.#pullClient.clearWatch(`${MESSAGES_TAG_PREFIX}${this.#dialog.chatId}`);
			this.#pullClient.clearWatch(`${COMMENTS_TAG_PREFIX}${this.#dialog.chatId}`);
		}
		#subscribeChannel() {
			this.#requestWatchStart();
			this.#pullClient.extendWatch(`${MESSAGES_TAG_PREFIX}${this.#dialog.chatId}`);
			this.#pullClient.extendWatch(`${COMMENTS_TAG_PREFIX}${this.#dialog.chatId}`);
		}
		#subscribeOpenChat() {
			this.#requestWatchStart();
			this.#pullClient.extendWatch(`${MESSAGES_TAG_PREFIX}${this.#dialog.chatId}`);
		}
		#requestWatchStart() {
			im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2ChatExtendPullWatch, {
				data: {
					dialogId: this.#dialog.dialogId
				}
			});
		}
		#isGuest() {
			return this.#dialog?.role === im_v2_const.UserRole.guest;
		}
		#isDemoChat() {
			return im_v2_lib_demo.DemoChatBuilder.isDemoDialogId(this.#dialog?.dialogId);
		}
		#isChannel() {
			return im_v2_lib_channel.ChannelManager.isChannel(this.#dialog?.dialogId);
		}
		#isCommentsChat() {
			return this.#dialog?.type === im_v2_const.ChatType.comment;
		}
	}

	// a position further than this from the one we wrote ourselves was set by someone else
	const EXTERNAL_SCROLL_TOLERANCE = 1;

	// handed to Animation in place of the element, so every animated write goes through here
	class ProgrammaticScrollPosition {
		#container;
		#lastWritten = null;
		constructor(container) {
			this.#container = container;
		}

		// the browser clamps the write, so the value is read back rather than remembered as asked for
		set scrollTop(value) {
			this.#container.scrollTop = value;
			this.#lastWritten = this.#container.scrollTop;
		}
		get scrollTop() {
			return this.#container.scrollTop;
		}
		forget() {
			this.#lastWritten = null;
		}
		wasMovedByOthers() {
			if (this.#lastWritten === null) {
				return false;
			}
			return Math.abs(this.#container.scrollTop - this.#lastWritten) > EXTERNAL_SCROLL_TOLERANCE;
		}
	}

	const EVENT_NAMESPACE = 'BX.Messenger.v2.Dialog.ScrollManager';
	const BOTTOM_POSITION_THRESHOLD = 40;
	class ScrollManager extends main_core_events.EventEmitter {
		isScrolling = false;
		currentScroll = 0;
		lastScroll = 0;
		chatIsScrolledUp = false;
		scrollButtonClicked = false;
		startScrollNeeded = true;
		#resizeObserver = null;
		#lastContainerHeight = 0;
		#activeAnimation = null;
		#resolveActiveScroll = null;
		#animatingToBottom = false;
		#programmaticPosition = null;
		#clearScrollFlagFrameId = null;

		// The scroll-pin spacer occupies the physical bottom of the container, so "bottom" is always
		// measured without it. The spacer outlives an active pin, hence the height is read live.
		#scrollPinHooks = {
			getSpacerHeight: () => 0,
			isPinActive: () => false,
			onContainerHeightChange: () => {}
		};
		#userLeftBottom = false;

		// The start scroll positions the feed once, on a chat nobody has scrolled yet, and the position
		// it chooses is not "near the bottom" in the sense the stick-to-bottom guard means: a container
		// shrinking in the same frame must not drag the feed off the New messages mark. Stays null
		// until a start scroll actually moves the feed, and describes nothing once the user has moved
		// away from it.
		#startScrollPosition = null;
		static events = {
			onScrollTriggerUp: 'onScrollTriggerUp',
			onScrollTriggerDown: 'onScrollTriggerDown',
			onScrollThresholdPass: 'onScrollThresholdPass'
		};
		static scrollPosition = {
			messageTop: 'messageTop',
			messageBottom: 'messageBottom',
			messageCenter: 'messageCenter'
		};
		static FLOATING_DATE_OFFSET = 52;
		constructor() {
			super();
			this.setEventNamespace(EVENT_NAMESPACE);
		}
		setContainer(container) {
			this.container = container;
			this.#programmaticPosition = new ProgrammaticScrollPosition(container);
		}
		setScrollPinHooks(hooks) {
			this.#scrollPinHooks = hooks;
		}
		#contentScrollHeight() {
			return this.container.scrollHeight - this.#scrollPinHooks.getSpacerHeight();
		}
		observeResize() {
			if (this.#resizeObserver || !this.container) {
				return;
			}
			this.#lastContainerHeight = this.container.clientHeight;
			this.#resizeObserver = new ResizeObserver(this.#handleContainerResize);
			this.#resizeObserver.observe(this.container);
		}
		destroy() {
			this.cancelAnimatedScroll();
			if (this.#clearScrollFlagFrameId !== null) {
				cancelAnimationFrame(this.#clearScrollFlagFrameId);
				this.#clearScrollFlagFrameId = null;
			}
			this.#resizeObserver?.disconnect();
			this.#resizeObserver = null;
		}
		#handleContainerResize = () => {
			const newHeight = this.container.clientHeight;
			const heightDecreased = newHeight < this.#lastContainerHeight;
			this.#lastContainerHeight = newHeight;
			if (this.#scrollPinHooks.isPinActive()) {
				this.#scrollPinHooks.onContainerHeightChange();
				return;
			}
			if (!heightDecreased || !this.#shouldStickToBottomOnResize()) {
				return;
			}
			this.scrollToBottom();
		};

		// The resize itself changes the geometry (a shrunk container, rewrapped text), so only state
		// taken on the last gesture describes a position the user actually chose.
		#shouldStickToBottomOnResize() {
			if (this.#holdsStartScrollPosition()) {
				return false;
			}
			return !this.chatIsScrolledUp && !this.#hasUserLeftBottom();
		}
		#holdsStartScrollPosition() {
			return this.#startScrollPosition !== null && this.container.scrollTop === this.#startScrollPosition;
		}

		// Called once the start-scroll chain is through: a chain that found nothing to scroll to, or one
		// whose write the browser clamped to the position already on screen, leaves the feed where it
		// was and has no position to protect.
		markStartScrollPosition(positionBeforeStartScroll) {
			const position = this.container.scrollTop;
			this.#startScrollPosition = position === positionBeforeStartScroll ? null : position;
		}
		onScroll(event) {
			if (!event.target) {
				return;
			}
			this.currentScroll = event.target.scrollTop;
			const isScrollingDown = this.lastScroll < this.currentScroll;
			const isScrollingUp = !isScrollingDown;
			if (!this.isScrolling) {
				if (isScrollingUp) {
					this.scrollButtonClicked = false;
				}
				const SCROLLING_THRESHOLD = 1500;
				const leftSpaceBottom = event.target.scrollHeight - event.target.scrollTop - event.target.clientHeight;
				if (isScrollingDown && this.isStartScrollCompleted() && leftSpaceBottom < SCROLLING_THRESHOLD) {
					this.emit(ScrollManager.events.onScrollTriggerDown);
				} else if (isScrollingUp && this.currentScroll <= SCROLLING_THRESHOLD) {
					this.emit(ScrollManager.events.onScrollTriggerUp);
				}
			}
			this.lastScroll = this.currentScroll;
			this.checkIfChatIsScrolledUp();
		}

		// Called straight from the container's scroll event, before the debounced onScroll: the
		// programmatic-scroll flag lives one animation frame, and by the time the debounced handler
		// runs it is long cleared, so the pin's own positioning would read as a user gesture.
		onRawScroll() {
			const movedByOthers = this.#cancelAnimationIfMovedByOthers();

			// while a question is pinned only the controller knows the intent behind the event and
			// reports it through markUserScroll(); the pin has also just repositioned the viewport,
			// so whatever was known about the user leaving the bottom no longer describes it
			if (this.#scrollPinHooks.isPinActive()) {
				this.#userLeftBottom = false;
				return;
			}

			// a position the manager did not write is by definition not its own movement, and the
			// cancel above keeps the programmatic flag up until the next frame
			this.#syncUserLeftBottom(movedByOthers || !this.isProgrammaticScroll());
		}

		// The only way a gesture reaches the manager while a question is pinned: inside the pin's own
		// animation the event reads as programmatic here, so the controller reports its own verdict.
		markUserScroll() {
			this.#syncUserLeftBottom(true);
		}
		#syncUserLeftBottom(movedByUser) {
			if (this.#scrollPinHooks.getSpacerHeight() === 0 || this.isAtContentBottom()) {
				this.#userLeftBottom = false;
				return;
			}
			this.#userLeftBottom = this.#userLeftBottom || movedByUser;
		}
		isProgrammaticScroll() {
			return this.isScrolling;
		}
		checkIfChatIsScrolledUp() {
			const SCROLLED_UP_THRESHOLD = 400;
			const availableScrollHeight = this.#contentScrollHeight() - this.container.clientHeight;
			const newFlag = this.currentScroll + SCROLLED_UP_THRESHOLD < availableScrollHeight;
			if (newFlag !== this.chatIsScrolledUp) {
				this.emit(ScrollManager.events.onScrollThresholdPass, newFlag);
			}
			this.chatIsScrolledUp = newFlag;
		}
		scrollToBottom() {
			im_v2_lib_logger.Logger.warn('Dialog: ScrollManager: scroll to bottom');
			this.forceScrollTo(this.#contentScrollHeight() - this.container.clientHeight);
		}
		animatedScrollToBottom() {
			im_v2_lib_logger.Logger.warn('Dialog: ScrollManager: animated scroll to bottom');
			this.animatedScrollTo(this.#contentScrollHeight() - this.container.clientHeight, {
				toBottom: true
			});
		}
		scrollToMessage(messageId, params = {}) {
			im_v2_lib_logger.Logger.warn('Dialog: ScrollManager: scroll to message - ', messageId);
			const element = this.getDomElementById(messageId);
			if (!element) {
				im_v2_lib_logger.Logger.warn('Dialog: ScrollManager: message not found - ', messageId);
				return;
			}
			const scrollPosition = this.#getScrollPosition(element, params);
			this.forceScrollTo(scrollPosition);
		}
		setStartScrollNeeded(flag) {
			this.startScrollNeeded = flag;
		}
		isStartScrollCompleted() {
			if (!this.startScrollNeeded) {
				return true;
			}
			return this.lastScroll > 0;
		}
		animatedScrollToMessage(messageId, params = {}) {
			im_v2_lib_logger.Logger.warn('Dialog: ScrollManager: animated scroll to message - ', messageId);
			const element = this.getDomElementById(messageId);
			if (!element) {
				im_v2_lib_logger.Logger.warn('Dialog: ScrollManager: message not found - ', messageId);
				return Promise.resolve();
			}
			const scrollPosition = this.#getScrollPosition(element, params);
			return this.animatedScrollTo(scrollPosition);
		}
		forceScrollTo(position) {
			im_v2_lib_logger.Logger.warn('Dialog: ScrollManager: Force scroll to - ', position);
			this.cancelAnimatedScroll();
			this.#markProgrammaticScrollStart();
			this.container.scroll({
				top: position,
				behavior: 'instant'
			});
			this.#markProgrammaticScrollEnd();
		}

		// Programmatic relative scroll: shift scrollTop by delta under the programmatic-scroll flag, so the
		// resulting scroll event is not misread as a user gesture (mirrors forceScrollTo's flag handling).
		adjustScrollBy(delta) {
			this.#markProgrammaticScrollStart();
			this.container.scrollTop += delta;
			this.#markProgrammaticScrollEnd();
		}
		adjustScrollOnHistoryAddition(oldContainerHeight) {
			im_v2_lib_logger.Logger.warn('Dialog: ScrollManager: Adjusting scroll after history addition');
			const newContainerHeight = this.container.scrollHeight - this.container.clientHeight;
			const newScrollPosition = this.container.scrollTop + newContainerHeight - oldContainerHeight;
			this.forceScrollTo(newScrollPosition);
		}
		animatedScrollTo(position, {
			toBottom = false
		} = {}) {
			im_v2_lib_logger.Logger.warn('Dialog: ScrollManager: Animated scroll to - ', position);
			this.cancelAnimatedScroll();
			if (this.prefersReducedMotion()) {
				this.forceScrollTo(position);
				return Promise.resolve();
			}
			return new Promise(resolve => {
				this.#markProgrammaticScrollStart();
				this.#animatingToBottom = toBottom;
				this.#resolveActiveScroll = resolve;
				this.#activeAnimation = im_v2_lib_animation.Animation.start({
					start: this.container.scrollTop,
					end: position,
					element: this.#programmaticPosition,
					elementProperty: 'scrollTop',
					callback: () => {
						this.checkIfChatIsScrolledUp();
						this.#finalizeScrollAnimation();
					}
				});
			});
		}
		cancelAnimatedScroll() {
			if (!this.#activeAnimation) {
				return;
			}
			this.#activeAnimation.cancel();
			this.#finalizeScrollAnimation();
		}

		// The cause of an outside move does not matter - the manager stops leading and lets geometry
		// decide again.
		#cancelAnimationIfMovedByOthers() {
			if (!this.#animatingToBottom || !this.#programmaticPosition.wasMovedByOthers()) {
				return false;
			}
			im_v2_lib_logger.Logger.warn('Dialog: ScrollManager: the feed was moved from outside, stopping the animated scroll');
			this.cancelAnimatedScroll();
			return true;
		}
		#finalizeScrollAnimation() {
			const resolve = this.#resolveActiveScroll;
			this.#activeAnimation = null;
			this.#resolveActiveScroll = null;
			this.#animatingToBottom = false;
			this.#programmaticPosition.forget();
			this.#markProgrammaticScrollEnd();
			resolve?.();
		}
		#markProgrammaticScrollStart() {
			if (this.#clearScrollFlagFrameId !== null) {
				cancelAnimationFrame(this.#clearScrollFlagFrameId);
				this.#clearScrollFlagFrameId = null;
			}
			this.isScrolling = true;
		}
		#markProgrammaticScrollEnd() {
			if (this.#clearScrollFlagFrameId !== null) {
				cancelAnimationFrame(this.#clearScrollFlagFrameId);
			}
			this.#clearScrollFlagFrameId = requestAnimationFrame(() => {
				this.#clearScrollFlagFrameId = null;
				this.isScrolling = false;
			});
		}
		prefersReducedMotion() {
			return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
		}
		isAtTheTop() {
			return this.container.scrollTop === 0;
		}
		isAtTheBottom() {
			return this.container.scrollTop + this.container.clientHeight >= this.#contentScrollHeight();
		}
		isAtOrBelowContentBottom() {
			return this.#distanceToContentBottom() < BOTTOM_POSITION_THRESHOLD;
		}
		isAtContentBottom() {
			return Math.abs(this.#distanceToContentBottom()) < BOTTOM_POSITION_THRESHOLD;
		}

		// A running animation to the bottom counts as being there: a block landing mid-flight retargets
		// it instead of being dropped for the distance the animation has not covered yet.
		shouldFollowNewContent() {
			if (this.#hasUserLeftBottom()) {
				return false;
			}
			return this.#animatingToBottom || this.isAtContentBottom();
		}

		// a view the spacer holds below the content bottom is the pin's position, not a chosen one
		isAtBottomUnlessUserLeft() {
			return !this.#hasUserLeftBottom() && this.isAtOrBelowContentBottom();
		}
		#hasUserLeftBottom() {
			return this.#userLeftBottom && this.#scrollPinHooks.getSpacerHeight() > 0;
		}
		#distanceToContentBottom() {
			return this.#contentScrollHeight() - this.container.scrollTop - this.container.clientHeight;
		}
		getDomElementById(id) {
			return this.container.querySelector(`[data-id="${id}"]`);
		}
		#getScrollPosition(element, params = {}) {
			const MESSAGE_BOTTOM_OFFSET = 100;
			const {
				withDateOffset = true,
				topOffset = null,
				position = ScrollManager.scrollPosition.messageTop
			} = params;
			// an explicit topOffset pins the element that many px from the top (0 = top edge, used by scroll-pin);
			// otherwise fall back to the floating-date reserve or the default small buffer
			const offset = topOffset === null ? withDateOffset ? -ScrollManager.FLOATING_DATE_OFFSET : -10 : -topOffset;
			let scrollPosition = element.offsetTop + offset;
			if (position === ScrollManager.scrollPosition.messageBottom) {
				scrollPosition += element.clientHeight - MESSAGE_BOTTOM_OFFSET;
			} else if (position === ScrollManager.scrollPosition.messageCenter && this.container.clientHeight > element.clientHeight) {
				scrollPosition = scrollPosition - this.container.clientHeight / 2 + element.clientHeight / 2;
			}
			return scrollPosition;
		}
	}

	const ScrollPinConfig = {
		// The floating date pill is sticky at the top of the feed, so a question pinned closer than its
		// height ends up under it. The reserve the rest of the feed already scrolls by covers the pill and
		// the gap of the mockup below it, and sharing it keeps the pin and scrollToMessage on one line.
		topOffset: ScrollManager.FLOATING_DATE_OFFSET,
		pendingAnchorTtl: 15000,
		// start-screen pending anchor lifetime, ms
		retryRepinTtl: 4000 // ms to wait for the pull-recreated question before giving up the pin (copilot retry)
	};

	// Keys that move the scroll viewport: any of them means the user drives the scroll (ALG-02).
	const NAVIGATION_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Spacebar']);
	const ScrollPinRegion = {
		aboveAnchor: 'aboveAnchor',
		belowAnchor: 'belowAnchor',
		container: 'container'
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
	const activeControllers = new Map();
	let pendingAnchor = null;

	// start-screen send: no feed is mounted yet, so the anchor waits for a freshly-mounted controller
	const handlePinQuestionAtModuleLevel = event => {
		const {
			dialogId,
			messageId
		} = event.getData();
		if (activeControllers.has(dialogId)) {
			return;
		}
		pendingAnchor = {
			dialogId,
			messageId,
			expiresAt: Date.now() + ScrollPinConfig.pendingAnchorTtl
		};
	};

	// a stale im.v2.const must not crash the whole module at import time
	if (im_v2_const.EventType.dialog?.pinQuestion) {
		main_core_events.EventEmitter.subscribe(im_v2_const.EventType.dialog.pinQuestion, handlePinQuestionAtModuleLevel);
	}
	function consumePendingAnchor(dialogId) {
		if (!pendingAnchor || pendingAnchor.dialogId !== dialogId) {
			return null;
		}
		const expired = Date.now() > pendingAnchor.expiresAt;
		const result = expired ? null : {
			messageId: pendingAnchor.messageId
		};
		pendingAnchor = null;
		return result;
	}

	/**
	 * The anchor is a logical message reference — never a DOM node — so it survives
	 * temporaryId -> server id swaps and message-list DOM re-creation.
	 */
	class ScrollPinController {
		#dialogId;
		#store;
		#getContainer;
		#getScrollManager;
		#onSpacerHeightChange;
		#onAnchorGapChange;
		#anchor = null;
		#active = false;
		#spacerHeight = 0;
		#anchorTop = 0;

		// QA-3: the feed keeps an empty gap of topOffset right above the pinned question, so the reserve the
		// pin target leaves over it shows nothing of the previous answer. The message the gap belongs to, or
		// null while there is none; it lives and dies with the spacer, not with #active (a frozen pin keeps
		// both, or the feed would jump by the gap under the user's hand).
		#gapAnchorId = null;

		// ALG-10: the position the settle last left the feed at, together with the anchor offset it was
		// read against. The gesture classification of ALG-02 is knowingly incomplete, so the settle cannot
		// rely on being told about a gesture: it compares the feed against its own last word instead.
		// `rangeFloor` is the narrowest scroll range seen since that position was written (QA-4) - see
		// #observeScrollRange.
		#assertedPosition = null;
		#resizeObserver = null;
		#contentResizeObserver = null;
		// the feed node the content observer is attached to, so a re-created list can be told from the live one
		#observedContent = null;
		#storeUnsubscribe = null;

		// ALG-10: while the pin runs its own animated scroll the position belongs to that animation, so the
		// settle stands aside. The generation keeps a superseded animation from settling the pin that
		// replaced it: cancelAnimatedScroll resolves its promise after the new pin is already armed.
		#pinScrollAnimating = false;
		#pinScrollGeneration = 0;
		// ALG-02: the way the pin scroll travels, fixed when it starts and read only while it runs. A wheel
		// that way asks for nothing the pin is not already doing, so it is not a gesture - see #handleWheel.
		#pinScrollDirection = 0;
		// the pin scroll waits a frame for the spacer to reach the DOM, and the frame reads #anchor when it
		// wakes up, so a superseded pin has to take its frame with it (the generation guards the follow-up)
		#pinScrollFrameId = null;

		// ALG-02: input handlers arm it, the scroll handler tells a gesture from the pin's own movement
		#manualIntent = false;
		#manualIntentFrameId = null;
		#inputListenersBound = false;

		// I-4: pin() may run before Vue paints the anchor; these drive the bounded retry.
		#pinRetryFrameId = null;
		#pinRetriesLeft = 0;

		// lands the real target one frame after the spacer is armed at 0, so CSS has a state to leave
		#riseFrameId = null;

		// ERR-007: the streaming answer grows scrollHeight, which no ResizeObserver watches - the anchor
		// observer sees the question, the container observer sees clientHeight. Store mutations drive this.
		#recalcFrameId = null;

		// copilot retry deletes the anchor question and pushes a new one without a pinQuestion event, so
		// the spacer is held while the recreated own question is awaited instead of dropping to the bottom
		#pendingRepin = null;
		#pendingRepinTimerId = null;

		// while set, the spacer carries the `--rising` modifier and CSS owns its height; recalcs are
		// suppressed so a mount reflow or a streaming answer cannot retarget it mid-transition
		#spacerRising = false;

		// captured at rise start: recomputing in the deferred frame reads mid-mount geometry and overshoots
		#riseTarget = 0;
		constructor(params) {
			this.#dialogId = params.dialogId;
			this.#store = params.store;
			this.#getContainer = params.getContainer;
			this.#getScrollManager = params.getScrollManager;
			this.#onSpacerHeightChange = params.onSpacerHeightChange ?? (() => {});
			this.#onAnchorGapChange = params.onAnchorGapChange ?? (() => {});
		}
		attach() {
			// a double mount must not leave the previous controller with live listeners and a spacer
			const existing = activeControllers.get(this.#dialogId);
			if (existing && existing !== this) {
				existing.destroy();
			}
			activeControllers.set(this.#dialogId, this);
			main_core_events.EventEmitter.subscribe(im_v2_const.EventType.dialog.pinQuestion, this.#handlePinQuestion);
			this.#storeUnsubscribe = this.#store.subscribe(this.#handleStoreMutation);
			this.#bindInputListeners();
		}
		destroy() {
			main_core_events.EventEmitter.unsubscribe(im_v2_const.EventType.dialog.pinQuestion, this.#handlePinQuestion);
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
		isActive() {
			return this.#active;
		}
		getAnchor() {
			return this.#anchor;
		}
		getSpacerHeight() {
			return this.#spacerHeight;
		}
		pin(messageId, {
			animate = true
		} = {}) {
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
			this.#anchor = {
				chatId: dialog.chatId,
				messageId
			};
			this.#active = true;
			this.#pinRetriesLeft = PIN_ANCHOR_MAX_RETRIES;
			this.#applyPin(animate);
		}

		// On a normal send the anchor is not painted on the first pass, so the frame is retried until it
		// appears or the budget runs out - otherwise the pin stays active but inert (I-4).
		#applyPin(animate) {
			if (!this.#active || !this.#anchor) {
				return;
			}
			const anchorEl = this.#resolveAnchorElement();
			if (!anchorEl) {
				if (this.#pinRetriesLeft > 0) {
					this.#pinRetriesLeft--;
					this.#pinRetryFrameId = requestAnimationFrame(() => {
						this.#pinRetryFrameId = null;
						this.#applyPin(animate);
					});
					return;
				}

				// anchor never rendered within the retry budget: release so the pin never stays active-but-inert (I-4)
				this.release({
					compensate: false
				});
				return;
			}
			if (this.#tryAnimateSpacerRise(anchorEl, animate)) {
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
		#tryAnimateSpacerRise(anchor, animate) {
			if (!animate || this.#spacerHeight !== 0) {
				return false;
			}
			const container = this.#getContainer();
			if (!container) {
				return false;
			}
			const spacerTarget = this.#computeSpacerHeight(container, anchor);
			const contentHeightWithoutSpacer = container.scrollHeight - this.#spacerHeight;
			const fitsViewport = contentHeightWithoutSpacer <= container.clientHeight + ScrollPinConfig.topOffset;
			// flex-end stretches short content, so geometry alone cannot tell an empty chat from an old one
			if (spacerTarget <= 0 || !fitsViewport || !this.#isAnchorFirstMessage()) {
				return false;
			}
			this.#anchorTop = anchor.offsetTop;

			// IMP-01: reduced motion means no transition and therefore no transitionend, so #spacerRising
			// would stay set and suppress every later recalc
			if (this.#getScrollManager().prefersReducedMotion()) {
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
		#isAnchorFirstMessage() {
			if (!this.#anchor) {
				return false;
			}
			const messages = this.#store.getters['messages/getByChatId'](this.#anchor.chatId);
			const anchorId = String(this.#anchor.messageId);
			const anchorIndex = messages.findIndex(message => {
				return String(message.id) === anchorId || String(message.temporaryId) === anchorId;
			});
			return anchorIndex === 0;
		}
		#scheduleRiseTarget() {
			this.#cancelRiseFrame();
			this.#riseFrameId = requestAnimationFrame(() => {
				this.#riseFrameId = null;
				if (!this.#active || !this.#spacerRising) {
					return;
				}
				const container = this.#getContainer();
				const spacer = container?.querySelector('.bx-im-dialog-chat__scroll-pin-spacer');
				if (spacer) {
					// force layout so the height:0 + --rising state is committed before the height changes
					void spacer.offsetHeight;
				}

				// the captured target, not a fresh recalc: mid-mount geometry would overshoot
				this.#setSpacerHeight(this.#riseTarget, true);
			});
		}
		#cancelRiseFrame() {
			if (this.#riseFrameId !== null) {
				cancelAnimationFrame(this.#riseFrameId);
				this.#riseFrameId = null;
			}
		}

		// Coalesce answer-stream recalcs to one per frame and run after Vue has painted the mutation.
		#scheduleRecalc() {
			if (this.#recalcFrameId !== null) {
				return;
			}
			this.#recalcFrameId = requestAnimationFrame(() => {
				this.#recalcFrameId = null;
				this.#onGeometrySettled();
			});
		}
		#cancelRecalcFrame() {
			if (this.#recalcFrameId !== null) {
				cancelAnimationFrame(this.#recalcFrameId);
				this.#recalcFrameId = null;
			}
		}
		#cancelPinRetry() {
			if (this.#pinRetryFrameId !== null) {
				cancelAnimationFrame(this.#pinRetryFrameId);
				this.#pinRetryFrameId = null;
			}
		}
		#cancelPinScrollFrame() {
			if (this.#pinScrollFrameId !== null) {
				cancelAnimationFrame(this.#pinScrollFrameId);
				this.#pinScrollFrameId = null;
			}
		}

		// First send from the draft empty state (AC-005/006): the feed is only now mounting,
		// so the pin lands instantly. The stashed id is the send-time temporaryId; by mount it
		// may already be swapped for the server id, hence the resolve.
		pinFromStart(messageId) {
			this.pin(this.#resolveSentMessageId(messageId), {
				animate: false
			});
		}

		// also disposes a spacer left frozen by a manual cancel (down-button, AC-008)
		release({
			compensate = true
		} = {}) {
			// a long answer leaves the spacer at 0 while the gap above the question is still there
			if (!this.#active && this.#spacerHeight === 0 && this.#gapAnchorId === null) {
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
			if (compensate) {
				this.#compensateOnRelease();
			}
			this.#setSpacerHeight(0);
			this.#setAnchorGap(null);
		}

		// Soft cancel for a manual scroll or a message navigation (AC-008/AC-012/AC-013): unlike release,
		// the spacer stays, so the content bottom holds until the next send.
		freeze() {
			if (!this.#active) {
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
		#beginPendingRepin() {
			const chatId = this.#anchor?.chatId;
			if (chatId == null) {
				this.release({
					compensate: true
				});
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
			this.#pendingRepin = {
				chatId,
				expiresAt: Date.now() + ScrollPinConfig.retryRepinTtl
			};
			this.#clearPendingRepinTimer();
			this.#pendingRepinTimerId = setTimeout(() => {
				this.#pendingRepinTimerId = null;
				this.#expirePendingRepin();
			}, ScrollPinConfig.retryRepinTtl);
		}

		// the recreated question is the first stored message of the pending chat authored by the current
		// user; the transient id-0 placeholder and the bot answer are skipped by the filter below
		#tryConsumePendingRepin(payload) {
			const pending = this.#pendingRepin;
			if (!pending) {
				return;
			}
			if (Date.now() > pending.expiresAt) {
				this.#expirePendingRepin();
				return;
			}
			const messages = Array.isArray(payload?.messages) ? payload.messages : [];
			const currentUserId = im_v2_application_core.Core.getUserId();
			const ownQuestion = messages.find(message => {
				return Number(message.chatId) === pending.chatId && Number(message.authorId) === currentUserId && String(message.id) !== '0';
			});
			if (!ownQuestion) {
				return;
			}
			this.#clearPendingRepinTimer();
			this.#pendingRepin = null;
			// the recreated question sits where the old one was, so pin instantly — an animated re-scroll
			// would read as a jump.
			this.pin(ownQuestion.id, {
				animate: false
			});
		}
		#expirePendingRepin() {
			if (!this.#pendingRepin) {
				return;
			}
			this.#pendingRepin = null;
			this.#clearPendingRepinTimer();
			// no recreated question arrived: fall back to the original anchor-delete behaviour.
			this.release({
				compensate: true
			});
		}
		#clearPendingRepinTimer() {
			if (this.#pendingRepinTimerId !== null) {
				clearTimeout(this.#pendingRepinTimerId);
				this.#pendingRepinTimerId = null;
			}
		}

		// ALG-01: spacerHeight = max(0, containerHeight - topOffset - anchorHeight - contentBelowAnchorHeight)
		recalcSpacerHeight() {
			if (!this.#active || this.#spacerRising) {
				// during the rise the height is owned by the captured target + CSS transition; a recalc here
				// (mount ResizeObserver, streaming answer) would retarget and jitter. onSpacerRiseEnd settles.
				return;
			}
			const container = this.#getContainer();
			const anchor = this.#resolveAnchorElement();
			if (!container || !anchor) {
				return;
			}
			this.#setSpacerHeight(this.#computeSpacerHeight(container, anchor));
		}
		#computeSpacerHeight(container, anchor) {
			const contentHeightWithoutSpacer = container.scrollHeight - this.#spacerHeight;
			const contentBelowAnchor = contentHeightWithoutSpacer - (anchor.offsetTop + anchor.clientHeight);
			return Math.max(0, container.clientHeight - ScrollPinConfig.topOffset - anchor.clientHeight - contentBelowAnchor);
		}

		// ALG-10
		#getPinTarget(anchor) {
			return anchor.offsetTop - ScrollPinConfig.topOffset;
		}

		// ALG-10: bring the feed back to the pin target. The target is clamped to the reachable range, so
		// an unreachable pin (question taller than the viewport) settles once and then produces no further
		// corrections - the correction is idempotent, not a retry loop.
		#settleToPinTarget() {
			if (!this.#active || this.#spacerRising || this.#pinScrollAnimating) {
				return;
			}
			const container = this.#getContainer();
			const anchor = this.#resolveAnchorElement();
			if (!container || !anchor) {
				return;
			}
			const maxScrollTop = this.#getMaxScrollTop(container);
			if (this.#wasFeedMovedByOthers(container, anchor, maxScrollTop)) {
				this.#yieldToExternalMove();
				return;
			}

			// the settle has the last word on the position, so the offset it read is where the next relative
			// compensation measures from - on the branch that moves nothing too (ERR-004)
			this.#anchorTop = anchor.offsetTop;
			const target = Math.min(Math.max(0, this.#getPinTarget(anchor)), maxScrollTop);
			const delta = target - container.scrollTop;
			if (Math.abs(delta) <= PIN_SETTLE_TOLERANCE) {
				this.#rememberAssertedPosition(container, anchor);
				return;
			}
			im_v2_lib_logger.Logger.warn('Dialog: ScrollPinController: settle to pin target - ', target, container.scrollTop, delta);
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
		#wasFeedMovedByOthers(container, anchor, maxScrollTop) {
			if (this.#assertedPosition === null) {
				return false;
			}
			const {
				scrollTop,
				anchorTop,
				rangeFloor
			} = this.#assertedPosition;
			const carriedByContent = scrollTop + (anchor.offsetTop - anchorTop);
			// QA-4: the clamp is judged against the narrowest range the feed has had since, not the one it
			// has now. Content removed below the anchor (the bot drops its "thinking" message before the
			// answer) shrinks the range for a frame and the spacer grows it back on the next one, so by the
			// time the settle looks, the range that produced the clamp is already gone.
			const clampedToRange = Math.min(scrollTop, maxScrollTop, rangeFloor);
			return [carriedByContent, clampedToRange].every(position => {
				return Math.abs(container.scrollTop - position) > PIN_SETTLE_TOLERANCE;
			});
		}

		// the gesture behind the move was not recognised, but the move itself is the verdict: the manager
		// cannot classify it either, so it is told, and the pin gives way as on AC-012
		#yieldToExternalMove() {
			im_v2_lib_logger.Logger.warn('Dialog: ScrollPinController: the feed was moved from outside, releasing the pin');
			this.#getScrollManager().markUserScroll();
			this.freeze();
		}

		// read back rather than remembered as asked for: the browser clamps the write
		#rememberAssertedPosition(container, anchor) {
			this.#assertedPosition = {
				scrollTop: container.scrollTop,
				anchorTop: anchor.offsetTop,
				// the floor belongs to this position and is measured from it: a range seen before the write
				// says nothing about a clamp that can only happen after it
				rangeFloor: this.#getMaxScrollTop(container)
			};
		}

		// QA-4: a range that shrinks under the feed is only visible while it is shrunk, and it is the
		// browser that reports it - the clamp it forces raises a scroll event in the same frame. LR-B1 draws
		// the line at the position: the scroll listener must not record where the feed is, or an
		// unrecognised gesture (an overlay scrollbar drag, find-in-page) would be adopted as the pin's own
		// move. The range is not the position - no gesture changes it - so watching it adopts nothing.
		#observeScrollRange() {
			const container = this.#getContainer();
			if (!container || this.#assertedPosition === null) {
				return;
			}
			this.#assertedPosition.rangeFloor = Math.min(this.#assertedPosition.rangeFloor, this.#getMaxScrollTop(container));
		}
		#getMaxScrollTop(container) {
			return Math.max(0, container.scrollHeight - container.clientHeight);
		}

		// ALG-10: every point where the geometry comes to rest ends here. The order is part of the
		// solution: the spacer defines the reachable maximum, so it is recomputed before the position.
		#onGeometrySettled() {
			this.#reobserveDetachedFeed();
			this.recalcSpacerHeight();
			this.#settleToPinTarget();
		}

		// ALG-01 onHeightChange(region)
		onHeightChange(region) {
			// during the rise the captured target and CSS own the height, so reflows are ignored
			if (!this.#active || this.#spacerRising) {
				return;
			}
			if (region === ScrollPinRegion.belowAnchor) {
				// ERR-007: the spacer absorbs the growing answer, so the settle usually finds the position
				// already on target and moves nothing
				this.#onGeometrySettled();
				return;
			}
			if (region === ScrollPinRegion.aboveAnchor) {
				// media in history, a previous answer re-rendering taller (ERR-004): keep the anchor visually
				// fixed by the offsetTop delta, then let the settle assert the absolute target (ALG-10)
				if (this.#pinScrollAnimating) {
					// the position belongs to the pin's own animation, exactly as in #settleToPinTarget: a
					// write here is overwritten by the next tick anyway, and it would end the programmatic-
					// scroll window in the middle of the animation
					return;
				}
				const anchor = this.#resolveAnchorElement();
				const container = this.#getContainer();
				if (!anchor || !container) {
					return;
				}
				const anchorTopNew = anchor.offsetTop;
				const delta = anchorTopNew - this.#anchorTop;
				if (Math.abs(delta) <= PIN_SETTLE_TOLERANCE) {
					// the observed node is the whole feed, so this branch also runs while the answer grows
					// below the anchor. The anchor did not move: there is nothing to compensate, and an empty
					// adjustScrollBy would still open (and a frame later close) a programmatic-scroll window.
					return;
				}

				// The compensation is relative and its result is recorded as the pin's own position, so both
				// have to come after the verdict: applied on top of a position the user chose they would drag
				// the feed back and leave the move invisible to every later check (ALG-10).
				const maxScrollTop = this.#getMaxScrollTop(container);
				if (this.#wasFeedMovedByOthers(container, anchor, maxScrollTop)) {
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
			if (region === ScrollPinRegion.container) {
				// the container shrinks from the bottom, so the spacer carries the change - but the shrink also
				// raises the reachable maximum, and a target clamped short earlier becomes reachable here.
				// The animated re-scroll must not come back: it jittered the feed on every autosize step
				// (ERR-008), while the settle is instant and does nothing once the position is on target.
				this.#onGeometrySettled();
			}
		}
		#handlePinQuestion = event => {
			const {
				dialogId,
				messageId
			} = event.getData();
			if (dialogId !== this.#dialogId) {
				return;
			}
			this.pin(messageId);
		};
		#handleStoreMutation = mutation => {
			if (this.#pendingRepin && mutation.type === 'messages/store') {
				this.#tryConsumePendingRepin(mutation.payload);
			}
			if (!this.#anchor) {
				return;
			}
			if (typeof mutation.type === 'string' && mutation.type.startsWith('messages/')) {
				// ERR-007: the streaming answer resizes neither the anchor nor the container, so no observer
				// fires and the spacer has to follow the mutations instead
				this.#scheduleRecalc();
			}
			if (mutation.type === 'messages/updateWithId') {
				const {
					id,
					fields
				} = mutation.payload;
				// rebind only when the swap targets our anchor AND the new server id stays in the
				// anchor's chat (SEC-NIT-01: the logical anchor is chat + message, not message alone)
				if (this.#isAnchorId(id) && fields?.id != null && this.#belongsToAnchorChat(fields.id)) {
					// temporaryId -> server id: keep the logical anchor, rebind the observers
					this.#anchor = {
						...this.#anchor,
						messageId: fields.id
					};
					this.#observeGeometry();
					// QA-3: the feed knows the gap by the id it was given, and the swapped message keeps no
					// trace of the old one - a gap left on the old id is silently dropped by the next render
					if (this.#gapAnchorId !== null) {
						this.#setAnchorGap(fields.id);
					}
				}
				return;
			}
			if (mutation.type === 'messages/delete' && this.#isAnchorId(mutation.payload.id) && this.#belongsToAnchorChat(mutation.payload.id)) {
				// the pair recreated by a copilot retry arrives by pull and emits no pinQuestion
				this.#beginPendingRepin();
			}
		};
		#isAnchorId(id) {
			return this.#anchor !== null && String(id) === String(this.#anchor.messageId);
		}

		// SEC-NIT-01: the anchor is chat + message, so a mutated message is checked against the anchor's
		// chat. A deleted one can no longer be checked, and a globally unique id rules out a collision.
		#belongsToAnchorChat(messageId) {
			if (this.#anchor === null) {
				return false;
			}
			const message = this.#store.getters['messages/getById'](messageId);
			if (!message) {
				return true;
			}
			return Number(message.chatId) === Number(this.#anchor.chatId);
		}
		#resolveAnchorElement() {
			if (!this.#anchor) {
				return null;
			}
			return this.#getScrollManager().getDomElementById(this.#anchor.messageId);
		}

		// ALG-10 fail-safe: #pinScrollAnimating silences the settle, so every path that ends or abandons the
		// pin's own scroll has to clear it - a flag left set disables the correction for the whole life of
		// this pin, and silently. The generation check keeps a superseded scroll from unsilencing the pin
		// that replaced it.
		#endPinScroll(generation) {
			if (generation === this.#pinScrollGeneration) {
				this.#stopPinScroll();
			}
		}

		// the direction only means anything while the pin's own scroll runs, so it dies together with it
		#stopPinScroll() {
			this.#pinScrollAnimating = false;
			this.#pinScrollDirection = 0;
		}

		// The unclamped target on purpose: the spacer height has not reached the DOM yet, so the reachable
		// maximum is understated here and a clamped delta of zero would leave the direction unknown.
		#computePinScrollDirection(anchor) {
			const container = this.#getContainer();
			if (!container) {
				return 0;
			}
			return Math.sign(this.#getPinTarget(anchor) - container.scrollTop);
		}
		#fixAnchorToTop(animate = true) {
			const generation = this.#pinScrollGeneration;
			const anchor = this.#resolveAnchorElement();
			if (!anchor) {
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
				if (!this.#active || !this.#anchor) {
					this.#endPinScroll(generation);
					return;
				}
				const params = {
					position: ScrollManager.scrollPosition.messageTop,
					topOffset: ScrollPinConfig.topOffset
				};
				// both paths reach the same target (ADR invariant 4), so the continuation is shared: an
				// instant scroll gets clamped or lost exactly like an animated one, and waiting for some
				// unrelated equilibrium point to notice would leave the question below the top meanwhile.
				const settleAfterPinScroll = () => {
					if (generation !== this.#pinScrollGeneration) {
						return;
					}

					// one frame later the browser has committed the final position, so the settle sees what
					// the scroll actually reached: clamped short, lost to a missing element, or on target
					requestAnimationFrame(() => {
						if (generation !== this.#pinScrollGeneration) {
							return;
						}
						this.#endPinScroll(generation);
						this.#onGeometrySettled();
					});
				};
				if (animate) {
					void this.#getScrollManager().animatedScrollToMessage(this.#anchor.messageId, params).then(settleAfterPinScroll);
					return;
				}
				this.#getScrollManager().scrollToMessage(this.#anchor.messageId, params);
				settleAfterPinScroll();
			});
		}

		// The stashed id was the send-time temporaryId; the message model keeps `temporaryId`
		// through the server-id swap, so a swapped anchor is found by it.
		#resolveSentMessageId(messageId) {
			if (this.#store.getters['messages/getById'](messageId)) {
				return messageId;
			}
			const dialog = this.#store.getters['chats/get'](this.#dialogId, true);
			const messages = this.#store.getters['messages/getByChatId'](dialog.chatId);
			const swapped = messages.find(message => String(message.temporaryId) === String(messageId));
			return swapped ? swapped.id : messageId;
		}

		// The anchor and the feed content share one observer lifecycle: both are (re)bound wherever the
		// anchor is bound and both are dropped on release / freeze / destroy. The nodes are resolved anew
		// every time because Vue re-creates the message list.
		#observeGeometry() {
			this.#disconnectObservers();
			const content = this.#getContainer()?.querySelector(MESSAGE_LIST_SELECTOR) ?? null;
			this.#observedContent = content;
			if (typeof ResizeObserver === 'undefined') {
				return;
			}
			const anchor = this.#resolveAnchorElement();
			if (anchor) {
				this.#resizeObserver = new ResizeObserver(this.#handleAnchorResize);
				this.#resizeObserver.observe(anchor);
			}
			if (content) {
				this.#contentResizeObserver = new ResizeObserver(this.#handleContentResize);
				this.#contentResizeObserver.observe(content);
			}
		}

		// Vue re-creates the message list, and the observer keeps the node it was given at pin time: once
		// that node is detached the feed grows unnoticed - the fix stops working without a sign, and the
		// detached subtree is held until release. Every equilibrium point checks the node is still the
		// container's own and rebinds if it is not.
		#reobserveDetachedFeed() {
			if (!this.#active) {
				return;
			}
			const content = this.#getContainer()?.querySelector(MESSAGE_LIST_SELECTOR) ?? null;
			if (content !== this.#observedContent) {
				this.#observeGeometry();
			}
		}
		#handleAnchorResize = () => {
			this.recalcSpacerHeight();
		};

		// The feed grew or shrank. Growth below the anchor leaves its offsetTop alone, so this is only
		// consequential when something above the anchor changed height (ERR-004).
		#handleContentResize = () => {
			this.onHeightChange(ScrollPinRegion.aboveAnchor);
		};
		#disconnectObservers() {
			this.#resizeObserver?.disconnect();
			this.#resizeObserver = null;
			this.#contentResizeObserver?.disconnect();
			this.#contentResizeObserver = null;
			this.#observedContent = null;
		}
		#bindInputListeners() {
			const container = this.#getContainer();
			if (!container || this.#inputListenersBound) {
				return;
			}
			main_core.Event.bind(container, 'scroll', this.#handleContainerScroll);
			main_core.Event.bind(container, 'wheel', this.#handleWheel);
			main_core.Event.bind(container, 'touchmove', this.#handleManualGesture);
			main_core.Event.bind(container, 'keydown', this.#handleKeydown);
			main_core.Event.bind(container, 'mousedown', this.#handleMouseDown);
			main_core.Event.bind(document, 'mouseup', this.#handleMouseUp);
			this.#inputListenersBound = true;
		}
		#unbindInputListeners() {
			if (!this.#inputListenersBound) {
				return;
			}

			// mouseup is bound on document, not the container, so it must be released even when the
			// container is already gone on destroy — otherwise the listener (and this controller) leaks.
			const container = this.#getContainer();
			if (container) {
				main_core.Event.unbind(container, 'scroll', this.#handleContainerScroll);
				main_core.Event.unbind(container, 'wheel', this.#handleWheel);
				main_core.Event.unbind(container, 'touchmove', this.#handleManualGesture);
				main_core.Event.unbind(container, 'keydown', this.#handleKeydown);
				main_core.Event.unbind(container, 'mousedown', this.#handleMouseDown);
			}
			main_core.Event.unbind(document, 'mouseup', this.#handleMouseUp);
			this.#inputListenersBound = false;
		}
		#handleManualGesture = () => {
			this.#armManualIntent();
		};

		// ALG-02: a trackpad keeps sending inertial wheels for a while after the send, and they arrive in
		// the middle of the pin's own scroll. Read as a gesture they froze the pin halfway, so a wheel that
		// pushes the way the pin is already going is not one while that scroll runs. Against it, and at any
		// other time, a wheel is a gesture exactly as before (AC-012).
		#handleWheel = event => {
			if (this.#pinScrollAnimating && !this.#isAgainstPinScroll(event.deltaY)) {
				return;
			}
			this.#armManualIntent();
		};

		// a wheel with no vertical delta moves no scroll range at all, and an unknown pin direction (0)
		// leaves every wheel a gesture, as it was before the inertia exception
		#isAgainstPinScroll(deltaY) {
			return deltaY !== 0 && Math.sign(deltaY) !== this.#pinScrollDirection;
		}
		#handleKeydown = event => {
			if (NAVIGATION_KEYS.has(event.key)) {
				this.#armManualIntent();
			}
		};
		#handleMouseDown = event => {
			const container = this.#getContainer();
			if (!container) {
				return;
			}

			// the scrollbar zone starts to the right of the content box; event.offsetX is relative to the
			// child under the cursor, so the container's own box is measured instead
			const offsetX = event.clientX - container.getBoundingClientRect().left;
			if (offsetX > container.clientWidth) {
				this.#manualIntent = true;
			}
		};
		#handleMouseUp = () => {
			this.#cancelManualIntentFrame();
			this.#manualIntent = false;
		};

		// one frame is long enough for the scroll event the gesture triggers
		#armManualIntent() {
			this.#manualIntent = true;
			this.#cancelManualIntentFrame();
			this.#manualIntentFrameId = requestAnimationFrame(() => {
				this.#manualIntentFrameId = null;
				this.#manualIntent = false;
			});
		}
		#cancelManualIntentFrame() {
			if (this.#manualIntentFrameId !== null) {
				cancelAnimationFrame(this.#manualIntentFrameId);
				this.#manualIntentFrameId = null;
			}
		}

		// ALG-02: a user gesture cancels the pin for the current answer, an intent-less shift is a reflow
		// the spacer absorbs. While the pin is active the scroll manager defers to this verdict entirely.
		#handleContainerScroll = () => {
			// before every verdict below: a range collapsing under the feed is only observable from the
			// event the clamp it forces raises, and that observation is not a position (QA-4)
			this.#observeScrollRange();
			if (!this.#active) {
				// a frozen spacer still holds the content bottom, and the manager cannot classify a gesture
				// that lands inside an animation of its own
				if (this.#manualIntent) {
					this.#getScrollManager().markUserScroll();
				}
				return;
			}
			if (this.#getScrollManager().isProgrammaticScroll()) {
				// the user fights the pin's own animation: kill it and treat as manual
				if (this.#manualIntent) {
					this.#getScrollManager().markUserScroll();
					this.freeze();
				}
				return;
			}
			if (this.#manualIntent) {
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
		#compensateOnRelease() {
			const container = this.#getContainer();
			if (!container) {
				return;
			}

			// both the spacer and the gap go away with the pin, so the feed loses the height of the two
			const maxScroll = container.scrollHeight - this.#spacerHeight - this.#anchorGapHeight() - container.clientHeight;
			if (container.scrollTop > maxScroll) {
				// programmatic absolute scroll so the clamp is not misread as a user gesture
				this.#getScrollManager().forceScrollTo(Math.max(0, maxScroll));
			}
		}
		#setSpacerHeight(height, animate = false) {
			this.#spacerHeight = height;
			this.#onSpacerHeightChange(height, animate);
		}
		#setAnchorGap(messageId) {
			this.#gapAnchorId = messageId ?? null;
			this.#onAnchorGapChange(this.#gapAnchorId, this.#anchorGapHeight());
		}
		#anchorGapHeight() {
			return this.#gapAnchorId === null ? 0 : ScrollPinConfig.topOffset;
		}

		// the answer may have reflowed during the rise, so the settled geometry is recomputed once here
		onSpacerRiseEnd() {
			this.#spacerRising = false;
			this.#onGeometrySettled();
		}
	}

	/**
	 * Canonical applicability rule for the BitrixGPT scroll-pin behaviour.
	 * A dialog qualifies only when it is a Copilot chat and both server feature
	 * flags are on. This is the single source of truth for the controller; the
	 * sending service mirrors the same predicate inline (it cannot import this
	 * extension without introducing a dependency cycle).
	 */
	function isScrollPinApplicable(dialogId) {
		if (!im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isBitrixGptScrollPinAvailable) || !im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isBitrixGptV2Available)) {
			return false;
		}
		const dialog = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
		return dialog?.type === im_v2_const.ChatType.copilot;
	}

	class VisibleMessagesManager {
		#visibleMessages = new Set();
		setMessageAsVisible(messageId) {
			this.#visibleMessages.add(messageId);
		}
		setMessageAsNotVisible(messageId) {
			this.#visibleMessages.delete(messageId);
		}
		getVisibleMessages() {
			return [...this.#visibleMessages];
		}
		getFirstMessageId() {
			if (this.#visibleMessages.size === 0) {
				return 0;
			}
			const [firstVisibleMessage] = [...this.#visibleMessages].sort((a, b) => a - b);
			return firstVisibleMessage;
		}
	}

	const FloatButtonColor = Object.freeze({
		accent: 'accent',
		alert: 'alert',
		success: 'success'
	});
	const FloatButtonIcon = Object.freeze({
		chevronDown: 'chevron-down',
		heart: 'heart',
		atSymbol: 'at-symbol',
		comment: 'comment'
	});

	// @vue/component
	const FloatButton = {
		name: 'FloatButton',
		props: {
			counter: {
				type: Number,
				default: 0
			},
			color: {
				type: String,
				required: false,
				default: FloatButtonColor.accent,
				validator: value => {
					return Object.values(FloatButtonColor).includes(value);
				}
			},
			icon: {
				type: String,
				required: true,
				validator: value => {
					return Object.values(FloatButtonIcon).includes(value);
				}
			}
		},
		computed: {
			buttonClassname() {
				return ['bx-im-dialog-chat__float-button', `--color-${this.color}`, `--icon-${this.icon}`];
			},
			formattedCounter() {
				if (this.counter === 0) {
					return '';
				}
				return im_v2_lib_counter.CounterManager.formatCounter(this.counter);
			}
		},
		template: `
		<div :class="buttonClassname">
			<div class="bx-im-dialog-chat__float-button_icon"></div>
			<div v-if="counter" class="bx-im-dialog-chat__float-button_counter">
				{{ formattedCounter }}
			</div>
		</div>
	`
	};

	// @vue/component
	const ScrollButton = {
		name: 'ScrollButton',
		components: {
			FloatButton
		},
		props: {
			dialogId: {
				type: String,
				required: true
			}
		},
		computed: {
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			chatCounter() {
				return this.$store.getters['counters/getCounterByChatId'](this.dialog.chatId);
			},
			floatButtonProps() {
				return {
					color: FloatButtonColor.accent,
					icon: FloatButtonIcon.chevronDown,
					counter: this.chatCounter
				};
			}
		},
		template: `
		<FloatButton v-bind="floatButtonProps" />
	`
	};

	const ReactionsButton = {
		name: 'ReactionsButton',
		components: {
			FloatButton
		},
		props: {
			dialogId: {
				type: String,
				required: true
			}
		},
		computed: {
			reactionCounter() {
				return this.$store.getters['messages/anchors/getCounterInChatByType'](this.dialog.chatId, im_v2_const.AnchorType.reaction);
			},
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			floatButtonProps() {
				return {
					color: FloatButtonColor.alert,
					icon: FloatButtonIcon.heart,
					counter: this.reactionCounter
				};
			}
		},
		template: `
		<FloatButton v-bind="floatButtonProps" />
	`
	};

	// @vue/component
	const MentionsButton = {
		name: 'MentionsButton',
		components: {
			FloatButton
		},
		props: {
			dialogId: {
				type: String,
				required: true
			}
		},
		computed: {
			mentionCounter() {
				return this.$store.getters['messages/anchors/getCounterInChatByType'](this.dialog.chatId, im_v2_const.AnchorType.mention);
			},
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			floatButtonProps() {
				return {
					color: FloatButtonColor.accent,
					icon: FloatButtonIcon.atSymbol,
					counter: this.mentionCounter
				};
			}
		},
		template: `
		<FloatButton v-bind="floatButtonProps" />
	`
	};

	// @vue/component
	const FloatButtons = {
		components: {
			ScrollButton,
			ReactionsButton,
			MentionsButton
		},
		props: {
			dialogId: {
				type: String,
				default: ''
			},
			isScrolledUp: {
				type: Boolean,
				required: false,
				default: false
			}
		},
		emits: ['scrollButtonClick', 'reactionsButtonClick', 'mentionsButtonClick'],
		computed: {
			dialogInited() {
				return this.dialog.inited;
			},
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			showScrollButton() {
				return this.isScrolledUp || this.dialog.hasNextPage;
			},
			showMentionsButton() {
				return this.dialogInited && this.$store.getters['messages/anchors/getCounterInChatByType'](this.dialog.chatId, im_v2_const.AnchorType.mention);
			},
			showReactionsButton() {
				return this.dialogInited && this.$store.getters['messages/anchors/getCounterInChatByType'](this.dialog.chatId, im_v2_const.AnchorType.reaction);
			},
			hasAdditionalButtonSlot() {
				const slot = this.$slots['additional-float-button'];
				if (!slot) {
					return false;
				}
				const slotChildren = slot();

				/**
				 * Check that slot has empty content.
				 * Used for case when parent component passes a slot to this slot
				 * This is important for the animation to work correctly
				 */
				return slotChildren[0]?.children.length > 0;
			}
		},
		methods: {
			onReactionsButtonClick() {
				this.$emit('reactionsButtonClick');
			},
			onMentionsButtonClick() {
				this.$emit('mentionsButtonClick');
			},
			onScrollButtonClick() {
				this.$emit('scrollButtonClick');
			}
		},
		template: `
		<TransitionGroup
			name="float-button-transition"
			tag="div"
			class="bx-im-dialog-chat__float-buttons"
		>
			<div
				v-if="showReactionsButton"
				key="reaction"
				class="bx-im-dialog-chat__float-buttons_button"
			>
				<ReactionsButton :dialogId="dialogId" @click="onReactionsButtonClick" />
			</div>
			<div
				v-if="showMentionsButton"
				key="mention"
				class="bx-im-dialog-chat__float-buttons_button"
			>
				<MentionsButton :dialogId="dialogId" @click="onMentionsButtonClick" />
			</div>
			<div
				v-if="hasAdditionalButtonSlot"
				key="additionalButton"
				class="bx-im-dialog-chat__float-buttons_button"
			>
				<slot name="additional-float-button"></slot>
			</div>
			<div
				v-if="showScrollButton"
				key="scroll"
				class="bx-im-dialog-chat__float-buttons_button"
			>
				<ScrollButton :dialogId="dialogId" @click="onScrollButtonClick" />
			</div>
		</TransitionGroup>
	`
	};

	// @vue/component
	const PinnedMessage = {
		components: {
			MessageAvatar: im_v2_component_elements_avatar.MessageAvatar
		},
		props: {
			message: {
				type: Object,
				required: true
			},
			showUnpinIcon: {
				type: Boolean,
				required: true
			}
		},
		emits: ['messageUnpin'],
		computed: {
			AvatarSize: () => im_v2_component_elements_avatar.AvatarSize,
			typedMessage() {
				return this.message;
			},
			text() {
				return im_v2_lib_parser.Parser.purifyMessage(this.typedMessage);
			},
			authorId() {
				return this.typedMessage.authorId;
			},
			author() {
				return this.$store.getters['users/get'](this.authorId);
			}
		},
		template: `
		<div class="bx-im-dialog-chat__pinned_item">
			<MessageAvatar
				v-if="typedMessage.authorId"
				:messageId="typedMessage.id"
				:authorId="typedMessage.authorId"
				:size="AvatarSize.M"
			/>
			<div class="bx-im-dialog-chat__pinned_item_content">
				<div v-if="author" class="bx-im-dialog-chat__pinned_item_user">
					{{ author.name }}
				</div>
				<div class="bx-im-dialog-chat__pinned_item_text --ellipsis">
					{{ text }}
				</div>
			</div>
			<button
				v-if="showUnpinIcon"
				class="bx-im-dialog-chat__pinned_icon-item-unpin"
				@click.stop="$emit('messageUnpin', typedMessage.id)"
			></button>
		</div>
	`
	};

	// @vue/component
	const HeaderTitle = {
		name: 'HeaderTitle',
		props: {
			totalPinCounter: {
				type: Number,
				required: true
			}
		},
		emits: ['toggleList'],
		computed: {
			title() {
				return this.loc('IM_DIALOG_CHAT_PINNED_TITLE_MULTIPLE_COUNTER', {
					'#PINS_COUNT#': `
						<span class="bx-im-dialog-chat__pin-header_counter-total">
							${this.totalPinCounter}
						</span>
					`
				});
			}
		},
		methods: {
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<div class="bx-im-dialog-chat__pin-header_opened">
				<div v-html="title"></div>
			<button
				class="bx-im-messenger__cross-icon"
				@click="$emit('toggleList')"
			></button>
		</div>
	`
	};

	// @vue/component
	const CounterControl = {
		name: 'CounterControl',
		props: {
			messagePosition: {
				type: Number,
				required: true
			},
			totalPinCounter: {
				type: Number,
				required: true
			}
		},
		emits: ['toggleList'],
		template: `
		<button
			@click="$emit('toggleList')"
			class="bx-im-dialog-chat__pinned_counter_control"
		>
			<span class="bx-im-dialog-chat__pinned_icon-dropdown"></span>
			<span>
				{{ messagePosition }}
				<span class="bx-im-dialog-chat__pinned_counter_control-total">
					/ {{ totalPinCounter }}
				</span>
			</span>
		</button>
	`
	};

	// @vue/component
	const HeaderPin = {
		name: 'HeaderPin',
		components: {
			CounterControl
		},
		props: {
			message: {
				type: Object,
				required: true
			},
			messagePosition: {
				type: Number,
				required: true
			},
			showUnpinIcon: {
				type: Boolean,
				required: true
			},
			totalPinCounter: {
				type: Number,
				required: true
			},
			contextDialogId: {
				type: String,
				required: true
			}
		},
		emits: ['toggleList', 'messageUnpin', 'messageClick'],
		computed: {
			typedMessage() {
				return this.message;
			},
			isSinglePin() {
				return this.totalPinCounter === 1;
			},
			authorId() {
				return this.typedMessage.authorId;
			},
			author() {
				return this.$store.getters['users/get'](this.authorId);
			},
			text() {
				return im_v2_lib_parser.Parser.purifyMessage(this.typedMessage);
			},
			isCommentChatContext() {
				const dialog = this.$store.getters['chats/get'](this.contextDialogId, true);
				return dialog.type === im_v2_const.ChatType.comment;
			},
			title() {
				if (this.isCommentChatContext) {
					return this.loc('IM_DIALOG_CHAT_PINNED_TITLE_IN_CHANNEL');
				}
				return this.loc(this.isSinglePin ? 'IM_DIALOG_CHAT_PINNED_TITLE' : 'IM_DIALOG_CHAT_PINNED_TITLE_MULTIPLE');
			}
		},
		methods: {
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-dialog-chat__pin-header">
			<div
				class="bx-im-dialog-chat__pin-header_wrapper"
				@click="$emit('messageClick', typedMessage.id)"
			>
				<div class="bx-im-dialog-chat__pin-header_title">
					{{ title }}
				</div>
				<div class="bx-im-dialog-chat__pin-header_content">
					<div v-if="author" class="bx-im-dialog-chat__pin-header_user">
						{{ author.name + ':' }}
					</div>
					<div class="bx-im-dialog-chat__pin-header_text --ellipsis">
						{{ text }}
					</div>
				</div>
			</div>

			<div class="bx-im-dialog-chat__pin-header_controls">
				<button
					v-if="showUnpinIcon && isSinglePin"
					class="bx-im-dialog-chat__pinned_icon-header-unpin"
					@click="$emit('messageUnpin', typedMessage.id)"
				></button>
				<CounterControl
					v-else-if="!isSinglePin"
					:messagePosition="messagePosition"
					:totalPinCounter="totalPinCounter"
					@toggleList="$emit('toggleList')"
				/>
			</div>
		</div>
	`
	};

	// @vue/component
	const PinnedHeader = {
		name: 'PinnedHeader',
		components: {
			HeaderTitle,
			HeaderPin
		},
		props: {
			message: {
				type: Object,
				required: true
			},
			messagePosition: {
				type: Number,
				required: true
			},
			showUnpinIcon: {
				type: Boolean,
				required: true
			},
			totalPinCounter: {
				type: Number,
				required: true
			},
			isListOpened: {
				type: Boolean,
				required: true
			},
			contextDialogId: {
				type: String,
				required: true
			}
		},
		emits: ['toggleList', 'messageUnpin', 'messageClick'],
		computed: {
			typedMessage() {
				return this.message;
			}
		},
		template: `
		<div class="bx-im-dialog-chat__pinned_header">
			<HeaderTitle
				v-if="isListOpened"
				:totalPinCounter="totalPinCounter"
				@toggleList="$emit('toggleList')"
			/>
			<HeaderPin
				v-else
				:message="typedMessage"
				:contextDialogId="contextDialogId"
				:messagePosition="messagePosition"
				:totalPinCounter="totalPinCounter"
				:showUnpinIcon="showUnpinIcon"
				@toggleList="$emit('toggleList')"
				@messageUnpin="$emit('messageUnpin', typedMessage.id)"
				@messageClick="$emit('messageClick', typedMessage.id)"
			/>
		</div>
	`
	};

	// @vue/component
	const PinnedMessages = {
		name: 'PinnedMessages',
		components: {
			PinnedMessage,
			PinnedHeader
		},
		props: {
			dialogId: {
				type: String,
				required: true
			},
			messages: {
				type: Array,
				required: true
			}
		},
		emits: ['messageClick', 'messageUnpin'],
		data() {
			return {
				isListOpened: false,
				upcomingMessageIndex: 0
			};
		},
		computed: {
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			sortedPinnedMessages() {
				return [...this.messages].sort((a, b) => b.id - a.id);
			},
			totalPinCounter() {
				return this.messages.length;
			},
			canUnpin() {
				return im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByRole(im_v2_const.ActionByRole.pinMessage, this.dialogId);
			},
			showUnpinIcon() {
				return !this.isCommentChat && this.canUnpin;
			},
			isCommentChat() {
				return this.dialog.type === im_v2_const.ChatType.comment;
			},
			upcomingMessage() {
				return this.sortedPinnedMessages[this.upcomingMessageIndex];
			},
			upcomingMessageDisplayPosition() {
				return this.upcomingMessageIndex + 1;
			}
		},
		watch: {
			messages(newValue) {
				if (newValue.length === 1) {
					this.toggleList(false);
				}
				if (this.shouldResetIndex(this.upcomingMessageIndex)) {
					this.resetHeaderIndex();
				}
			}
		},
		methods: {
			toggleList(flag) {
				this.isListOpened = main_core.Type.isUndefined(flag) ? !this.isListOpened : flag;
			},
			incrementHeaderIndex() {
				const nextIndex = this.upcomingMessageIndex + 1;
				if (this.shouldResetIndex(nextIndex)) {
					this.resetHeaderIndex();
				} else {
					this.upcomingMessageIndex = nextIndex;
				}
			},
			resetHeaderIndex() {
				this.upcomingMessageIndex = 0;
			},
			shouldResetIndex(index) {
				return index >= this.totalPinCounter;
			},
			clickOnHeaderMessage() {
				this.emitMessageClick(this.sortedPinnedMessages[this.upcomingMessageIndex].id);
				this.incrementHeaderIndex();
			},
			clickOnHeaderMessageFromList(index) {
				// manually setting the next index because the item is selected directly from the list
				const nextIndex = index + 1;
				this.upcomingMessageIndex = this.shouldResetIndex(nextIndex) ? 0 : nextIndex;
				this.emitMessageClick(this.sortedPinnedMessages[index].id);
			},
			emitMessageClick(messageId) {
				this.$emit('messageClick', messageId);
			}
		},
		template: `
		<div class="bx-im-dialog-chat__pinned_container">
			<PinnedHeader
				:message="upcomingMessage"
				:messagePosition="upcomingMessageDisplayPosition"
				:showUnpinIcon="showUnpinIcon"
				:totalPinCounter="totalPinCounter"
				:isListOpened="isListOpened"
				:contextDialogId="dialogId"
				@toggleList="toggleList"
				@messageUnpin="$emit('messageUnpin', upcomingMessage.id)"
				@messageClick="clickOnHeaderMessage"
			/>
			<transition name="pinned-list">
				<div v-if="isListOpened" class="bx-im-dialog-chat__pinned_list">
					<PinnedMessage
						v-for="(message, index) in sortedPinnedMessages"
						:key="message.id"
						:message="message"
						:showUnpinIcon="showUnpinIcon"
						@messageUnpin="$emit('messageUnpin', message.id)"
						@click="clickOnHeaderMessageFromList(index)"
					/>
				</div>
			</transition>
		</div>
	`
	};

	const CONTAINER_HEIGHT = 44;
	const CONTAINER_WIDTH = 60;
	const MESSAGE_TEXT_NODE_CLASS = '.bx-im-message-text-content__container';
	const POPUP_ID = 'im-quote-button-popup';

	// @vue/component
	const QuoteButton = {
		name: 'QuoteButton',
		components: {
			MessengerPopup: im_v2_component_elements_popup.MessengerPopup
		},
		props: {
			dialogId: {
				type: String,
				default: ''
			},
			targetPosition: {
				type: Object,
				required: true,
				validator(value) {
					return main_core.Type.isNumber(value.left) && main_core.Type.isNumber(value.top);
				}
			}
		},
		data() {
			return {
				text: '',
				message: null
			};
		},
		computed: {
			POPUP_ID: () => POPUP_ID,
			config() {
				const {
					top,
					left
				} = this.targetPosition;
				const offsetLeftForCenteredPopup = left - CONTAINER_WIDTH / 2;
				return {
					bindElement: {
						top,
						left: offsetLeftForCenteredPopup
					},
					className: 'bx-im-dialog-chat__quote-button_scope',
					background: 'transparent',
					bindOptions: {
						position: 'top'
					},
					animation: 'fading-slide',
					width: CONTAINER_WIDTH,
					height: CONTAINER_HEIGHT,
					autoHide: true,
					padding: 0,
					focusTrap: false
				};
			}
		},
		mounted() {
			main_core.Event.bind(window, 'mousedown', this.onMouseDown);
		},
		methods: {
			onMessageMouseUp(message, event) {
				if (event.button === 2) {
					return;
				}
				this.prepareSelectedText();
				this.message = message;
			},
			onMouseDown(event) {
				const container = this.$refs.container;
				if (!container || container.contains(event.target)) {
					return;
				}
				this.$emit('close');
			},
			prepareSelectedText() {
				if (im_v2_lib_utils.Utils.browser.isFirefox()) {
					this.text = window.getSelection().toString();
					return;
				}
				const range = window.getSelection().getRangeAt(0);
				const rangeContents = range.cloneContents();
				let nodesToIterate = rangeContents.childNodes;
				const messageNode = rangeContents.querySelector(MESSAGE_TEXT_NODE_CLASS);
				if (messageNode) {
					nodesToIterate = messageNode.childNodes;
				}
				for (const node of nodesToIterate) {
					if (this.isImage(node)) {
						this.text += node.getAttribute('data-code') ?? node.getAttribute('alt');
					} else if (this.isLineBreak(node)) {
						this.text += '\n';
					} else {
						this.text += node.textContent;
					}
				}
			},
			isImage(node) {
				if (!(node instanceof HTMLElement)) {
					return false;
				}
				return node.tagName.toLowerCase() === 'img';
			},
			isLineBreak(node) {
				return node.nodeName.toLowerCase() === 'br';
			},
			isText(node) {
				return node.nodeName === '#text';
			},
			onQuoteClick() {
				const text = im_v2_lib_quote.Quote.prepareInlineMessageQuote(this.message, this.text);
				im_v2_lib_quote.Quote.sendQuoteEvent({
					text,
					dialogId: this.dialogId,
					context: {
						emitter: this.getEmitter()
					}
				});
				this.$emit('close');
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			}
		},
		template: `
		<MessengerPopup
			:id="POPUP_ID"
			:config="config"
			@close="$emit('close')"
		>
			<div ref="container" @click="onQuoteClick" class="bx-im-dialog-chat__quote-button">
				<div class="bx-im-dialog-chat__quote-icon"></div>
				<div class="bx-im-dialog-chat__quote-icon --hover"></div>
			</div>
		</MessengerPopup>
	`
	};

	function findUniqueNumbers(arr1, arr2) {
		const set1 = new Set(arr1);
		const set2 = new Set(arr2);
		return [...arr1.filter(num => !set2.has(num)), ...arr2.filter(num => !set1.has(num))];
	}

	const sharedQueues = new Map();

	/**
	 * @description
	 * Adds a delay between calls to the fn function.
	 * Calls with the same function execute this function in the same sequence
	 * @param fn
	 * @param delay
	 * @param context
	 * @returns Function
	 */
	function sequentializeShared(fn, delay, context = null) {
		if (sharedQueues.has(fn)) {
			return sharedQueues.get(fn);
		}
		const wrapped = sequentialize(fn, delay, context);
		sharedQueues.set(fn, wrapped);
		return wrapped;
	}
	function sequentialize(fn, delay, context = null) {
		const queue = [];
		let isRunning = false;
		async function run() {
			if (isRunning) {
				return;
			}
			isRunning = true;
			const task = queue.shift();
			if (!task) {
				isRunning = false;
				return;
			}
			const result = fn.apply(context, task.args);
			await wait(delay);
			task.resolve(result);
			isRunning = false;
			run();
		}
		return (...args) => {
			return new Promise(resolve => {
				queue.push({
					args,
					resolve
				});
				run();
			});
		};
	}
	function wait(ms) {
		return new Promise(resolve => {
			setTimeout(resolve, ms);
		});
	}

	// @vue/component
	const ChatDialog = {
		name: 'ChatDialog',
		components: {
			MessageList: im_v2_component_messageList.MessageList,
			PinnedMessages,
			QuoteButton,
			FloatButtons,
			PullStatus: pull_vue3_status.PullStatus,
			ForwardPopup: im_v2_component_entitySelector.ForwardPopup,
			GuestNamePopup: im_v2_component_elements_guestNamePopup.GuestNamePopup
		},
		props: {
			dialogId: {
				type: String,
				default: ''
			},
			saveScrollOnExit: {
				type: Boolean,
				default: true
			},
			reloadOnExit: {
				type: Boolean,
				default: true
			},
			clearOnExit: {
				type: Boolean,
				default: false
			},
			directForward: {
				type: Boolean,
				default: false
			}
		},
		data() {
			return {
				forwardPopup: {
					show: false,
					messagesIds: []
				},
				contextMode: {
					active: false,
					messageIsLoaded: false
				},
				isScrolledUp: false,
				windowFocused: false,
				showQuoteButton: false,
				isJumpingToAnchor: false,
				messagesToRead: new Set(),
				containerHeight: 0,
				quoteButtonPosition: {},
				shouldShowGuestNamePopup: false,
				scrollPinEnabled: false,
				scrollPinSpacerHeight: 0,
				scrollPinSpacerAnimated: false,
				scrollPinMessageStyles: {}
			};
		},
		computed: {
			layout() {
				return this.$store.getters['application/getLayout'];
			},
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			isChatOpenedInWidget() {
				return this.$store.getters['copilot/isChatOpenedInWidget'](this.dialogId);
			},
			shouldForwardDirectly() {
				return this.directForward || this.isChatOpenedInWidget;
			},
			dialogInited() {
				return this.dialog.inited;
			},
			messageCollection() {
				return this.$store.getters['messages/getByChatId'](this.dialog.chatId);
			},
			pinnedMessages() {
				return this.$store.getters['messages/pin/getPinned'](this.dialog.chatId);
			},
			chatCounter() {
				return this.$store.getters['counters/getCounterByChatId'](this.dialog.chatId);
			},
			isOpened() {
				const openedDialogId = this.$store.getters['application/getLayout'].entityId;
				return this.dialogId === openedDialogId;
			},
			isGuest() {
				return this.dialog.role === im_v2_const.UserRole.guest;
			},
			isCurrentUserGuest() {
				return this.$store.getters['users/isGuest'](im_v2_application_core.Core.getUserId());
			},
			debouncedScrollHandler() {
				const SCROLLING_DEBOUNCE_DELAY = 100;
				return main_core.Runtime.debounce(this.getScrollManager().onScroll, SCROLLING_DEBOUNCE_DELAY, this.getScrollManager());
			},
			debouncedReadHandler() {
				const READING_DEBOUNCE_DELAY = 50;
				return main_core.Runtime.debounce(this.readQueuedMessages, READING_DEBOUNCE_DELAY, this);
			},
			sequentiallyHighlightMessageHandler() {
				return sequentializeShared(this.highlightMessage, 300, this);
			},
			showScrollButton() {
				return this.isScrolledUp || this.dialog.hasNextPage;
			},
			anchorMessages() {
				return this.$store.getters['messages/anchors/getChatMessageIdsWithAnchors'](this.dialog.chatId);
			},
			hasCommentsOnTop() {
				return this.$store.getters['messages/comments/areOpenedForChannel'](this.dialogId);
			}
		},
		watch: {
			anchorMessages(newValue, oldValue) {
				const newMessageIdsWithAnchor = findUniqueNumbers(newValue, oldValue);
				const visibleMessageIds = this.getVisibleMessagesManager().getVisibleMessages();
				newMessageIdsWithAnchor.forEach(messageId => {
					if (visibleMessageIds.includes(messageId)) {
						this.getAnchorService().debouncedReadMessageAnchors(messageId);
					}
				});
			},
			dialogInited(newValue, oldValue) {
				if (!newValue || oldValue) {
					return;
				}
				// first opening
				this.getPullWatchManager().subscribe();
				this.onChatInited();
			},
			hasCommentsOnTop: {
				handler(newValue) {
					const commentsWereClosed = newValue === false;
					if (!commentsWereClosed) {
						return;
					}
					this.readVisibleMessages();
				},
				flush: 'post'
			}
		},
		created() {
			im_v2_lib_logger.Logger.warn('Dialog: Chat created', this.dialogId);
			// the jumps to a message context of this chat: the one asked for last wins, so they are
			// numbered and the number decides wherever a jump would touch the list - see
			// goToMessageContext()
			this.messageContextGeneration = 0;
			// how many of them are loading right now: the loading bar belongs to all of them at once
			this.messageContextLoads = 0;
			this.initContextMode();
		},
		async mounted() {
			await this.$nextTick();
			this.containerHeight = this.$refs.container.clientHeight;
			this.shouldShowGuestNamePopup = im_v2_lib_guest.GuestManager.getInstance().getGuestNamePopupState();
			this.getScrollManager().setContainer(this.getContainer());
			this.getScrollManager().observeResize();
			if (isScrollPinApplicable(this.dialogId)) {
				this.scrollPinEnabled = true;
				this.getScrollPinController().attach();
				this.getScrollManager().setScrollPinHooks({
					getSpacerHeight: () => this.scrollPinController?.getSpacerHeight() ?? 0,
					isPinActive: () => this.scrollPinController?.isActive() ?? false,
					onContainerHeightChange: () => this.scrollPinController?.onHeightChange(ScrollPinRegion.container)
				});
			}
			if (this.dialogInited) {
				// second+ opening
				this.getPullWatchManager().subscribe();
				this.onChatInited();
			}
			// there are P&P messages
			else if (!this.dialogInited && this.messageCollection.length > 0) {
				this.scrollOnStart();
			}
			this.windowFocused = document.hasFocus();
			this.subscribeToEvents();
		},
		beforeUnmount() {
			this.unsubscribeFromEvents();
			this.getScrollManager().destroy();
			if (this.dialogInited) {
				this.saveScrollPosition();
				void this.handleMessagesOnExit();
			}
			// destroy the pin controller after saving: saveScrollPosition() reads its active
			// state, and destroy() would reset it
			this.scrollPinController?.destroy();
			this.getPullWatchManager().unsubscribe();
			this.closeDialogPopups();
			this.forwardPopup.show = false;
			this.readAllAnchors();
			this.getEmitter().emit(im_v2_const.EventType.dialog.onCloseChat, {
				dialogId: this.dialogId
			});
		},
		methods: {
			async scrollOnStart() {
				await this.$nextTick();
				const positionBeforeStartScroll = this.getContainer()?.scrollTop ?? 0;
				this.applyStartScroll();
				// the feed holds the position the start scroll chose until the user moves it away, so a
				// container shrinking in the same frame does not drag it off the New messages mark
				this.getScrollManager().markStartScrollPosition(positionBeforeStartScroll);
			},
			applyStartScroll() {
				// a question sent from the draft empty state before this feed mounted (AC-005/006):
				// it takes priority over the whole start-scroll chain and pins instantly
				if (this.scrollPinEnabled) {
					const pending = consumePendingAnchor(this.dialogId);
					if (pending) {
						this.getScrollPinController().pinFromStart(pending.messageId);
						return;
					}
				}

				// we loaded chat with context
				if (this.contextMode.active && this.contextMode.messageIsLoaded) {
					this.getScrollManager().scrollToMessage(this.layout.contextId);
					void this.$nextTick(() => {
						this.highlightMessage(this.layout.contextId);
					});
					return;
				}

				// chat was loaded before
				if (this.contextMode.active && !this.contextMode.messageIsLoaded) {
					this.goToMessageContext(this.layout.contextId);
					return;
				}

				// marked message
				if (this.dialog.markedId) {
					this.getScrollManager().scrollToMessage(im_v2_const.DialogBlockType.newMessages);
					return;
				}

				// saved position
				if (this.dialog.savedPositionMessageId && !this.isGuest) {
					im_v2_lib_logger.Logger.warn('Dialog: saved scroll position, scrolling to', this.dialog.savedPositionMessageId);
					this.getScrollManager().scrollToMessage(this.dialog.savedPositionMessageId, {
						withDateOffset: false
					});
					return;
				}
				const lastReadId = this.$store.getters['chats/getLastReadId'](this.dialogId);
				const isLastMessageId = lastReadId === this.dialog.lastMessageId;
				// unread messages and read messages before them
				if (lastReadId > 0 && !isLastMessageId) {
					im_v2_lib_logger.Logger.warn('Dialog: scroll to "New messages" mark, lastReadId -', lastReadId, 'lastMessageId', this.dialog.lastMessageId);
					this.getScrollManager().scrollToMessage(im_v2_const.DialogBlockType.newMessages);
					return;
				}

				// new chat, unread messages without read messages before them
				const hasUnread = this.$store.getters['messages/getFirstUnread'](this.dialog.chatId);
				if (lastReadId === 0 || hasUnread) {
					this.getScrollManager().setStartScrollNeeded(false);
					im_v2_lib_logger.Logger.warn('Dialog: dont scroll, hasUnread -', hasUnread, 'lastReadId', lastReadId);
					return;
				}

				// no unread messages
				this.getScrollManager().scrollToBottom();
			},
			showLoadingBar() {
				this.getEmitter().emit(im_v2_const.EventType.dialog.showLoadingBar, {
					dialogId: this.dialogId
				});
			},
			hideLoadingBar() {
				this.getEmitter().emit(im_v2_const.EventType.dialog.hideLoadingBar, {
					dialogId: this.dialogId
				});
			},
			/**
			 * Loading a context replaces the whole message collection, and the request behind it cannot
			 * be called back: two jumps at once would leave the list on whichever answer came back last,
			 * which is not the message asked for last. So the jumps are numbered, and the number is asked
			 * at every point where a jump would touch the list - the collection included, through the
			 * `isActual` of the load.
			 *
			 * The number and not a queue: a jump made to wait out the request of the one before it makes
			 * the last thing the user did the slowest thing on screen, for as long as a request nobody
			 * wants any more takes to time out. They run side by side instead, and only the current one
			 * is allowed to move anything.
			 *
			 * Everything a jump is announced by is announced from HERE and not from the handler of the
			 * event that asks for one: the event is one way of asking among several - the comments button
			 * of a channel and a chat opened on a message context call this method by ref, the pinned bar
			 * and the context mode of the layout from inside the chat - and a side that heard only about
			 * the jumps asked for by event would keep waiting for something the user has already replaced.
			 */
			goToMessageContext(messageId, params = {}) {
				// an explicit navigation cancels the pin before its own scroll; the spacer stays
				// frozen so the content bottom holds until the next send (AC-008)
				this.scrollPinController?.freeze();
				this.messageContextGeneration += 1;
				// the generation alone stops the jump before this one only where it asks - and an animated
				// scroll asks nothing until it lands, so it would go on moving the list all the while this
				// jump loads its context. Cut short here, it leaves the list where the user replaced it
				this.getScrollManager().cancelAnimatedScroll();
				const {
					date = '',
					jumpId = 0
				} = params;
				const jump = {
					dialogId: this.dialogId,
					messageId,
					date,
					jumpId
				};
				this.getEmitter().emit(im_v2_const.EventType.dialog.messageContextJumpStarted, jump);
				if (date) {
					// after the jump itself and before the loading: the sides waiting for this jump learn
					// of it from the announcement above, and what they are told here is that its bounds
					// can come off - so the two are sent in this order and from the same place, instead
					// of depending on who subscribed to what first
					this.getEmitter().emit(im_v2_const.EventType.dialog.dateNavigationContextApplying, {
						dialogId: this.dialogId,
						jumpId
					});
				}
				const applying = this.applyMessageContext(messageId, params, this.messageContextGeneration);
				// most callers start a jump and walk away from the promise; a rejection with nobody
				// listening is an unhandled rejection in the console and nothing more useful than that
				applying.catch(() => {});
				if (date) {
					void this.reportDateNavigationContextApplied(applying, jump);
				}
				return applying;
			},
			async applyMessageContext(messageId, params, generation) {
				const {
					position = ScrollManager.scrollPosition.messageTop,
					withMessageHighlight = true
				} = params;
				// asked back after every wait: a jump the user has replaced must move nothing, neither
				// the collection nor the scroll of a list that belongs to the jump after it now
				const isActual = () => generation === this.messageContextGeneration;
				const hasMessage = this.$store.getters['messages/hasMessage']({
					chatId: this.dialog.chatId,
					messageId
				});
				if (hasMessage) {
					im_v2_lib_logger.Logger.warn('Dialog: we have this message, scrolling to it', messageId);
					await this.getScrollManager().animatedScrollToMessage(messageId, {
						position
					});
					if (withMessageHighlight && isActual()) {
						this.highlightMessage(messageId);
					}
					return;
				}
				const {
					hasAccess,
					errorCode
				} = await im_v2_lib_access.MessageAccessManager.checkMessageAccess(messageId);
				if (!isActual()) {
					im_v2_lib_logger.Logger.warn('Dialog: the jump to', messageId, 'is superseded by a later one');
					return;
				}
				if (!hasAccess && errorCode === im_v2_const.ErrorCode.message.accessDeniedByTariff) {
					im_v2_lib_analytics.Analytics.getInstance().historyLimit.onGoToContextLimitExceeded({
						dialogId: this.dialogId
					});
					im_v2_lib_feature.TariffManager.chatHistory.openFeatureSlider();
					return;
				}
				this.showContextLoadingBar();
				try {
					await this.getMessageService().loadContext(messageId, {
						isActual
					});
					await this.$nextTick();
				} finally {
					this.hideContextLoadingBar();
				}
				if (!isActual()) {
					im_v2_lib_logger.Logger.warn('Dialog: the jump to', messageId, 'is superseded by a later one');
					return;
				}
				this.getScrollManager().scrollToMessage(messageId, {
					position
				});
				await this.$nextTick();
				if (withMessageHighlight) {
					this.highlightMessage(messageId);
				}
			},
			/**
			 * The bar of a context load, raised by the first jump loading one and lowered by the last:
			 * several of them run side by side, and a jump superseded on the way must not take down the
			 * bar of the jump that replaced it - nor leave one standing when it is the last to finish.
			 * Kept in balance by the caller pairing the two around a `finally`.
			 */
			showContextLoadingBar() {
				this.messageContextLoads += 1;
				if (this.messageContextLoads === 1) {
					this.showLoadingBar();
				}
			},
			hideContextLoadingBar() {
				this.messageContextLoads -= 1;
				if (this.messageContextLoads === 0) {
					this.hideLoadingBar();
				}
			},
			highlightMessage(messageId) {
				const HIGHLIGHT_CLASS = 'bx-im-dialog-chat__highlighted-message';
				const HIGHLIGHT_DURATION = 2000;
				const message = this.getScrollManager().getDomElementById(messageId);
				if (!message) {
					return;
				}
				main_core.Dom.addClass(message, HIGHLIGHT_CLASS);
				setTimeout(() => {
					main_core.Dom.removeClass(message, HIGHLIGHT_CLASS);
				}, HIGHLIGHT_DURATION);
			},
			saveScrollPosition() {
				if (!this.saveScrollOnExit) {
					return;
				}
				let savedPositionMessageId = this.getVisibleMessagesManager().getFirstMessageId();
				// an active pin sits at the content bottom; record "was at the bottom" so the chat
				// reopens by the usual rules, not glued to a stale pinned message (AC-016)
				if (this.getScrollManager().isAtBottomUnlessUserLeft() || this.isScrollPinActive()) {
					savedPositionMessageId = 0;
				}
				this.$store.dispatch('chats/update', {
					dialogId: this.dialogId,
					fields: {
						savedPositionMessageId
					}
				});
			},
			async handleMessagesOnExit() {
				if (this.clearOnExit) {
					void this.getChatService().clearChat(this.dialogId);
					return;
				}
				await this.getChatService().readChatQueuedMessages(this.dialog.chatId);
				if (this.reloadOnExit) {
					const LOAD_MESSAGES_ON_EXIT_DELAY = 200;
					setTimeout(async () => {
						this.getMessageService().reloadMessageList();
					}, LOAD_MESSAGES_ON_EXIT_DELAY);
				}
			},
			/* region Reading */
			readQueuedMessages() {
				if (!this.messagesCanBeRead()) {
					return;
				}
				[...this.messagesToRead].forEach(messageId => {
					this.getChatService().readMessage(this.dialog.chatId, messageId);
					this.messagesToRead.delete(messageId);
				});
			},
			readVisibleMessages() {
				if (!this.messagesCanBeRead()) {
					return;
				}
				const visibleMessages = this.getVisibleMessagesManager().getVisibleMessages();
				visibleMessages.forEach(messageId => {
					const message = this.$store.getters['messages/getById'](messageId);
					if (!message || message.viewed) {
						return;
					}
					this.getChatService().readMessage(this.dialog.chatId, messageId);
				});
			},
			readAllAnchors() {
				if (this.$store.getters['messages/anchors/isChatHasAnchors'](this.dialog.chatId)) {
					this.getAnchorService().readChatAnchors(this.dialog.chatId);
				}
			},
			messagesCanBeRead() {
				if (!this.dialogInited || !this.isChatVisible()) {
					return false;
				}
				const permissionManager = im_v2_lib_permission.PermissionManager.getInstance();
				return permissionManager.canPerformActionByRole(im_v2_const.ActionByRole.readMessage, this.dialogId);
			},
			/* endregion Reading */
			/* region Event handlers */
			onChatInited() {
				this.scrollOnStart();
				this.readVisibleMessages();
				void this.$nextTick(() => {
					this.getChatService().clearDialogMark(this.dialogId);
				});
				this.sendInitEvents();
				this.sendGuestIdentifiedEvent();
			},
			async onScrollTriggerUp() {
				if (!this.dialogInited || !this.getContainer()) {
					return;
				}
				im_v2_lib_logger.Logger.warn('Dialog: scroll triggered UP');
				const container = this.getContainer();
				const oldHeight = container.scrollHeight - container.clientHeight;

				// Insert messages if there are some
				if (this.getMessageService().hasPreparedHistoryMessages()) {
					await this.getMessageService().drawPreparedHistoryMessages();
					this.getScrollManager().adjustScrollOnHistoryAddition(oldHeight);
					return;
				}

				// check if already loading or no more history
				if (this.getMessageService().isLoading() || !this.dialog.hasPrevPage) {
					return;
				}

				// Load messages and save them
				this.showLoadingBar();
				await this.getMessageService().loadHistory();
				this.hideLoadingBar();
				// Messages loaded and we are at the top
				if (this.getScrollManager().isAtTheTop()) {
					im_v2_lib_logger.Logger.warn('Dialog: we are at the top after history request, inserting messages');
					await this.getMessageService().drawPreparedHistoryMessages();
					this.getScrollManager().adjustScrollOnHistoryAddition(oldHeight);
				}
			},
			async onScrollTriggerDown() {
				if (!this.dialogInited || !this.getContainer()) {
					return;
				}
				im_v2_lib_logger.Logger.warn('Dialog: scroll triggered DOWN');
				// Insert messages if there are some
				if (this.getMessageService().hasPreparedUnreadMessages()) {
					await this.getMessageService().drawPreparedUnreadMessages();
					return;
				}

				// check if already loading or no more history
				if (this.getMessageService().isLoading() || !this.dialog.hasNextPage) {
					return;
				}

				// Load messages and save them
				this.showLoadingBar();
				await this.getMessageService().loadUnread();
				this.hideLoadingBar();
				// Messages loaded and we are at the bottom
				if (this.getScrollManager().isAtOrBelowContentBottom()) {
					im_v2_lib_logger.Logger.warn('Dialog: we are at the bottom after unread request, inserting messages');
					await this.getMessageService().drawPreparedUnreadMessages();
					this.getScrollManager().checkIfChatIsScrolledUp();
				}
			},
			async onScrollToBottom(event) {
				const {
					chatId,
					threshold = im_v2_const.DialogScrollThreshold.halfScreenUp,
					animation = true
				} = event.getData();
				if (this.dialog.chatId !== chatId) {
					return;
				}

				// while a question is pinned every "to bottom" input is ignored (streaming,
				// pull, force scroll, textarea growth); only the pin event changes the position
				if (this.isScrollPinActive()) {
					return;
				}
				if (!this.windowFocused || this.hasVisibleCall()) {
					const firstUnreadId = this.$store.getters['messages/getFirstUnread'](this.dialog.chatId);
					if (firstUnreadId) {
						await this.$nextTick();
						this.getScrollManager().scrollToMessage(firstUnreadId);
						return;
					}
				}
				im_v2_lib_logger.Logger.warn('Dialog: scroll to bottom', chatId, threshold);
				if (threshold === im_v2_const.DialogScrollThreshold.halfScreenUp && this.isScrolledUp) {
					return;
				}
				if (threshold === im_v2_const.DialogScrollThreshold.nearTheBottom && !this.getScrollManager().shouldFollowNewContent()) {
					return;
				}
				await this.$nextTick();
				if (animation) {
					this.getScrollManager().animatedScrollToBottom();
					return;
				}
				this.getScrollManager().scrollToBottom();
			},
			onGoToMessageContext(event) {
				const {
					dialogId,
					messageId,
					date,
					jumpId,
					withMessageHighlight
				} = event.getData();
				if (this.dialog.dialogId !== dialogId) {
					return;
				}

				// the fields of a jump by date travel on into the jump instead of being acted upon here:
				// what is said about a jump is said by the jump itself, so that a jump started by a
				// direct call is announced the same way as one asked for by this event
				this.goToMessageContext(messageId, {
					withMessageHighlight,
					date,
					jumpId
				});
			},
			/**
			 * Settled and not succeeded: a context that failed to load and a jump whose answer was refused
			 * as superseded both leave the list where it is, which is exactly what the message list has
			 * to tell from an anchor still on its way. The report is carried back under the identifier the
			 * jump arrived with and nothing of it is reinterpreted here - the side that started the jump
			 * is the one that names it, and the message list answers only for the jump it is waiting for.
			 */
			async reportDateNavigationContextApplied(applying, jump) {
				await applying.catch(() => {});
				this.getEmitter().emit(im_v2_const.EventType.dialog.dateNavigationContextApplied, jump);
			},
			onPinnedMessageClick(messageId) {
				this.goToMessageContext(messageId);
			},
			onPinnedMessageUnpin(messageId) {
				this.getMessageService().unpinMessage(this.dialog.chatId, messageId);
				im_v2_lib_analytics.Analytics.getInstance().messagePins.onUnpin({
					dialogId: this.dialogId
				});
			},
			onScroll(event) {
				this.closeDialogPopups();
				// the gesture is classified here, not in the debounced handler: 100ms later the
				// programmatic-scroll flag is already cleared and the pin's own moves read as manual
				this.getScrollManager().onRawScroll();
				this.debouncedScrollHandler(event);
			},
			async onScrollButtonClick() {
				// the down button is an explicit cancel: drop the spacer (with compensation) and
				// scroll to the content bottom
				if (this.scrollPinController && (this.scrollPinController.isActive() || this.scrollPinController.getSpacerHeight() > 0)) {
					this.scrollPinController.release({
						compensate: true
					});
					this.getScrollManager().scrollToBottom();
					return;
				}
				if (this.getScrollManager().scrollButtonClicked) {
					void this.handleSecondScrollButtonClick();
					return;
				}
				this.getScrollManager().scrollButtonClicked = true;
				if (this.chatCounter === 0) {
					this.showLoadingBar();
					await this.getMessageService().loadInitialMessages();
					this.hideLoadingBar();
					this.getScrollManager().scrollToBottom();
					return;
				}
				const firstUnreadId = this.$store.getters['messages/getFirstUnread'](this.dialog.chatId);
				if (!firstUnreadId) {
					this.showLoadingBar();
					await this.getMessageService().loadInitialMessages();
					this.hideLoadingBar();
					await this.getScrollManager().animatedScrollToMessage(firstUnreadId);
				}
				await this.getScrollManager().animatedScrollToMessage(firstUnreadId);
			},
			async onMentionsButtonClick() {
				if (this.isJumpingToAnchor) {
					return;
				}
				this.isJumpingToAnchor = true;
				await this.goToNearestMessageWithAnchor(im_v2_const.AnchorType.mention);
				this.isJumpingToAnchor = false;
			},
			async onReactionsButtonClick() {
				if (this.isJumpingToAnchor) {
					return;
				}
				this.isJumpingToAnchor = true;
				await this.goToNearestMessageWithAnchor(im_v2_const.AnchorType.reaction);
				this.isJumpingToAnchor = false;
			},
			async goToNearestMessageWithAnchor(anchorType) {
				const nextMessage = this.$store.getters['messages/anchors/getNextMessageIdWithAnchorType'](this.dialog.chatId, anchorType);
				if (nextMessage) {
					await this.goToMessageContext(nextMessage, {
						position: ScrollManager.scrollPosition.messageTop
					});
				}
			},
			onWindowFocus() {
				this.windowFocused = true;
				this.readVisibleMessages();
			},
			onWindowBlur() {
				this.windowFocused = false;
			},
			onCallFold() {
				const callDialogId = im_v2_lib_call.CallManager.getInstance().getCurrentCallDialogId();
				if (callDialogId !== this.dialogId) {
					return;
				}
				this.readVisibleMessages();
			},
			async onShowQuoteButton(event) {
				const {
					message,
					event: $event
				} = event.getData();
				const permissionManager = im_v2_lib_permission.PermissionManager.getInstance();
				if (!permissionManager.canPerformActionByRole(im_v2_const.ActionByRole.send, this.dialogId)) {
					return;
				}
				this.showQuoteButton = true;
				this.quoteButtonPosition = {
					left: $event.pageX,
					top: $event.pageY
				};
				await this.$nextTick();
				this.$refs.quoteButton.onMessageMouseUp(message, $event);
			},
			async handleSecondScrollButtonClick() {
				this.scrollPinController?.freeze();
				this.getScrollManager().scrollButtonClicked = false;
				if (this.dialog.hasNextPage) {
					this.showLoadingBar();
					await this.getMessageService().loadContext(this.dialog.lastMessageId);
					this.hideLoadingBar();
					main_core_events.EventEmitter.emit(im_v2_const.EventType.dialog.scrollToBottom, {
						chatId: this.dialog.chatId
					});
					return;
				}
				void this.getScrollManager().animatedScrollToMessage(this.dialog.lastMessageId, {
					withDateOffset: false
				});
			},
			onShowForwardPopup(event) {
				const {
					messagesIds
				} = event.getData();
				this.forwardPopup.messagesIds = messagesIds;
				this.forwardPopup.show = true;
			},
			onCloseForwardPopup() {
				this.forwardPopup.messagesIds = [];
				this.forwardPopup.show = false;
			},
			onMessageIsVisible(event) {
				const {
					messageId,
					dialogId
				} = event.getData();
				if (dialogId !== this.dialogId) {
					return;
				}
				this.getVisibleMessagesManager().setMessageAsVisible(messageId);
				if (this.isChatVisible() === false) {
					return;
				}
				if (this.$store.getters['messages/anchors/isMessageHasAnchors'](messageId)) {
					this.readAnchorsIfMessageVisibleLongEnough(messageId);
				}
				const message = this.$store.getters['messages/getById'](messageId);
				if (!message.viewed) {
					this.messagesToRead.add(messageId);
					this.debouncedReadHandler();
				}
			},
			readAnchorsIfMessageVisibleLongEnough(messageId) {
				const messageVisibilityTimeThreshold = 200;
				if (this.getScrollManager().isScrolling) {
					this.readMessageAnchorsAfterVisibilityThreshold(messageId, messageVisibilityTimeThreshold);
				} else {
					this.getAnchorService().debouncedReadMessageAnchors(messageId);
				}
			},
			readMessageAnchorsAfterVisibilityThreshold(messageId, messageVisibilityTimeThreshold) {
				setTimeout(() => {
					if (this.getVisibleMessagesManager().getVisibleMessages().includes(messageId)) {
						this.sequentiallyHighlightMessageHandler(messageId);
						this.getAnchorService().debouncedReadMessageAnchors(messageId);
					}
				}, messageVisibilityTimeThreshold);
			},
			onMessageIsNotVisible(event) {
				const {
					messageId,
					dialogId
				} = event.getData();
				if (dialogId !== this.dialogId) {
					return;
				}
				this.getVisibleMessagesManager().setMessageAsNotVisible(messageId);
			},
			/* endregion Event handlers */
			/* region Init methods */
			initContextMode() {
				const layoutManager = im_v2_lib_layout.LayoutManager.getInstance();
				if (!layoutManager.isChatContextAvailable(this.dialogId)) {
					return;
				}
				this.contextMode.active = true;
				// chat was loaded before, we didn't load context specifically
				// if chat wasn't loaded before - we load it with context
				this.contextMode.messageIsLoaded = !this.dialogInited;
			},
			getMessageService() {
				if (!this.messageService) {
					this.messageService = new im_v2_provider_service_message.MessageService({
						chatId: this.dialog.chatId
					});
				}
				return this.messageService;
			},
			getChatService() {
				if (!this.chatService) {
					this.chatService = new im_v2_provider_service_chat.ChatService();
				}
				return this.chatService;
			},
			getAnchorService() {
				if (!this.anchorService) {
					this.anchorService = new AnchorService();
				}
				return this.anchorService;
			},
			getScrollManager() {
				if (!this.scrollManager) {
					this.scrollManager = new ScrollManager();
					this.scrollManager.subscribe(ScrollManager.events.onScrollTriggerUp, this.onScrollTriggerUp);
					this.scrollManager.subscribe(ScrollManager.events.onScrollTriggerDown, this.onScrollTriggerDown);
					this.scrollManager.subscribe(ScrollManager.events.onScrollThresholdPass, event => {
						this.isScrolledUp = event.getData();
					});
				}
				return this.scrollManager;
			},
			getScrollPinController() {
				if (!this.scrollPinController) {
					this.scrollPinController = new ScrollPinController({
						dialogId: this.dialogId,
						store: this.$store,
						getContainer: () => this.getContainer(),
						getScrollManager: () => this.getScrollManager(),
						onSpacerHeightChange: (height, animate = false) => {
							if (animate) {
								this.scrollPinSpacerAnimated = true;
							}
							this.scrollPinSpacerHeight = height;
						},
						onAnchorGapChange: (messageId, height) => {
							this.onScrollPinAnchorGapChange(messageId, height);
						}
					});
				}
				return this.scrollPinController;
			},
			isScrollPinActive() {
				return this.scrollPinController?.isActive() === true;
			},
			onScrollPinSpacerRiseEnd() {
				this.scrollPinSpacerAnimated = false;
				this.scrollPinController?.onSpacerRiseEnd();
			},
			onScrollPinAnchorGapChange(messageId, height) {
				this.scrollPinMessageStyles = messageId === null ? {} : {
					[messageId]: {
						marginTop: `${height}px`
					}
				};
			},
			getPullWatchManager() {
				if (!this.pullWatchManager) {
					this.pullWatchManager = new PullWatchManager(this.dialogId);
				}
				return this.pullWatchManager;
			},
			getVisibleMessagesManager() {
				if (!this.visibleMessagesManager) {
					this.visibleMessagesManager = new VisibleMessagesManager();
				}
				return this.visibleMessagesManager;
			},
			/* endregion Init methods */
			isChatVisible() {
				return this.windowFocused && !this.hasVisibleCall() && !this.hasCommentsOnTop;
			},
			hasVisibleCall() {
				return im_v2_lib_call.CallManager.getInstance().hasVisibleCall();
			},
			closeDialogPopups() {
				this.showQuoteButton = false;
				main_popup.PopupManager.getPopupById(im_v2_const.PopupType.dialogAvatarMenu)?.close();
				main_popup.PopupManager.getPopupById(im_v2_const.PopupType.dialogMessageMenu)?.close();
				main_popup.PopupManager.getPopupById(im_v2_const.PopupType.dialogReactionUsers)?.close();
				main_popup.PopupManager.getPopupById(im_v2_const.PopupType.dialogReadUsers)?.close();
				main_popup.PopupManager.getPopupById(im_v2_const.PopupType.messageBaseFileMenu)?.close();
			},
			sendInitEvents() {
				const payload = {
					dialogId: this.dialogId,
					chat: this.dialog
				};
				main_core_events.EventEmitter.emit(im_v2_const.EventType.dialog.onDialogInited, payload);
				this.getEmitter().emit(im_v2_const.EventType.dialog.onDialogInited, payload);
			},
			sendGuestIdentifiedEvent() {
				// The first-visit case is signalled by the guest-name popup itself
				// via EventType.guest.onAfterGuestNamePopupClose; here we only handle
				// an already identified guest, for whom the popup will not be shown.
				if (!this.isCurrentUserGuest || im_v2_lib_guest.GuestManager.getInstance().getGuestNamePopupState()) {
					return;
				}
				main_core_events.EventEmitter.emit(im_v2_const.EventType.guest.onInitialChatOpen, {
					dialogId: this.dialogId
				});
			},
			subscribeToEvents() {
				main_core_events.EventEmitter.subscribe(im_v2_const.EventType.dialog.scrollToBottom, this.onScrollToBottom);
				main_core_events.EventEmitter.subscribe(im_v2_const.EventType.call.onFold, this.onCallFold);
				this.getEmitter().subscribe(im_v2_const.EventType.dialog.onMessageIsVisible, this.onMessageIsVisible);
				this.getEmitter().subscribe(im_v2_const.EventType.dialog.onMessageIsNotVisible, this.onMessageIsNotVisible);
				this.getEmitter().subscribe(im_v2_const.EventType.dialog.goToMessageContext, this.onGoToMessageContext);
				this.getEmitter().subscribe(im_v2_const.EventType.dialog.showForwardPopup, this.onShowForwardPopup);
				this.getEmitter().subscribe(im_v2_const.EventType.dialog.showQuoteButton, this.onShowQuoteButton);
				main_core.Event.bind(window, 'focus', this.onWindowFocus);
				main_core.Event.bind(window, 'blur', this.onWindowBlur);
			},
			unsubscribeFromEvents() {
				main_core_events.EventEmitter.unsubscribe(im_v2_const.EventType.dialog.scrollToBottom, this.onScrollToBottom);
				main_core_events.EventEmitter.unsubscribe(im_v2_const.EventType.call.onFold, this.onCallFold);
				this.getEmitter().unsubscribe(im_v2_const.EventType.dialog.onMessageIsVisible, this.onMessageIsVisible);
				this.getEmitter().unsubscribe(im_v2_const.EventType.dialog.onMessageIsNotVisible, this.onMessageIsNotVisible);
				this.getEmitter().unsubscribe(im_v2_const.EventType.dialog.goToMessageContext, this.onGoToMessageContext);
				this.getEmitter().unsubscribe(im_v2_const.EventType.dialog.showForwardPopup, this.onShowForwardPopup);
				this.getEmitter().unsubscribe(im_v2_const.EventType.dialog.showQuoteButton, this.onShowQuoteButton);
				main_core.Event.unbind(window, 'focus', this.onWindowFocus);
				main_core.Event.unbind(window, 'blur', this.onWindowBlur);
			},
			getContainer() {
				return this.$refs.container;
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			},
			closeGuestNamePopup() {
				this.shouldShowGuestNamePopup = false;
				im_v2_lib_guest.GuestManager.getInstance().setGuestNamePopupState(false);
			}
		},
		template: `
		<div class="bx-im-dialog-chat__block bx-im-dialog-chat__scope">
			<!-- Top -->
			<slot name="pinned-panel">
				<PinnedMessages
					v-if="pinnedMessages.length > 0"
					:dialogId="dialogId"
					:messages="pinnedMessages"
					@messageClick="onPinnedMessageClick"
					@messageUnpin="onPinnedMessageUnpin"
				/>
			</slot>
			<PullStatus/>
			<!-- Message list -->
			<div @scroll="onScroll" class="bx-im-dialog-chat__scroll-container" tabindex="-1" ref="container">
				<slot name="message-list">
					<MessageList
						:dialogId="dialogId"
						:containerHeight="containerHeight"
						:scrollPinEnabled="scrollPinEnabled"
						:spacerHeight="scrollPinSpacerHeight"
						:spacerAnimated="scrollPinSpacerAnimated"
						:messageStyles="scrollPinMessageStyles"
						@spacerRiseEnd="onScrollPinSpacerRiseEnd"
					/>
				</slot>
			</div>
			<FloatButtons
				:dialogId="dialogId"
				:isScrolledUp="isScrolledUp"
				@scrollButtonClick="onScrollButtonClick"
				@reactionsButtonClick="onReactionsButtonClick"
				@mentionsButtonClick="onMentionsButtonClick"
			>
				<template #additional-float-button><slot name="additional-float-button" /></template>
			</FloatButtons>
			<!-- Absolute elements -->
			<ForwardPopup
				v-if="forwardPopup.show"
				:messagesIds="forwardPopup.messagesIds"
				:dialogId="dialogId"
				:directForward="shouldForwardDirectly"
				@close="onCloseForwardPopup"
			/>
			<GuestNamePopup 
				v-if="dialogInited && shouldShowGuestNamePopup" 
				:dialogId="dialogId" 
				@close="closeGuestNamePopup" 
			/>
			<QuoteButton
				v-if="showQuoteButton"
				:targetPosition="quoteButtonPosition"
				:dialogId="dialogId"
				@close="showQuoteButton = false"
				ref="quoteButton"
			/>
		</div>
	`
	};

	exports.ChatDialog = ChatDialog;
	exports.FloatButton = FloatButton;
	exports.FloatButtonColor = FloatButtonColor;
	exports.FloatButtonIcon = FloatButtonIcon;
	exports.PinnedMessages = PinnedMessages;
	exports.ScrollManager = ScrollManager;

})(this.BX.Messenger.v2.Component.Dialog = this.BX.Messenger.v2.Component.Dialog || {}, BX, BX.Event, BX.Main, window, BX.Messenger.v2.Application, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Component.EntitySelector, BX.Messenger.v2.Component, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.Messenger.v2.Service, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.Elements);
//# sourceMappingURL=chat-dialog.bundle.js.map
