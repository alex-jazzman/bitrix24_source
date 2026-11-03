/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports, main_core) {
	'use strict';

	const SPACE_CODE = 'Space';
	const INPUT_TAG = 'INPUT';
	const TEXTAREA_TAG = 'TEXTAREA';
	const ACTIVATABLE_TAGS = new Set(['BUTTON', 'SELECT', 'SUMMARY']);
	const ACTIVATABLE_INPUT_TYPES = new Set(['button', 'submit', 'reset', 'checkbox', 'radio', 'image', 'file']);
	const ACTIVATABLE_ROLES = new Set(['button', 'checkbox', 'radio', 'switch', 'option', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'tab', 'treeitem', 'combobox']);
	const MEDIA_TAGS = new Set(['VIDEO', 'AUDIO']);
	const LISTENER_OPTIONS = {
		capture: true
	};
	function hasModifier(event) {
		return event.ctrlKey || event.altKey || event.metaKey || event.shiftKey;
	}
	function isTextEntry(element) {
		if (element.tagName === TEXTAREA_TAG || element.isContentEditable) {
			return true;
		}
		return element.tagName === INPUT_TAG && !ACTIVATABLE_INPUT_TYPES.has(element.type);
	}
	class DocumentKeyboardAdapter {
		#targetDocument;
		#keyCycle;
		#onKeyDown;
		#onKeyUp;
		constructor(targetDocument, keyCycle, config) {
			this.#targetDocument = targetDocument;
			this.#keyCycle = keyCycle;
			this.#onKeyDown = config.onKeyDown;
			this.#onKeyUp = config.onKeyUp;
		}
		start() {
			main_core.Event.bind(this.#targetDocument, 'keydown', this.#handleKeyDown, LISTENER_OPTIONS);
			main_core.Event.bind(this.#targetDocument, 'keyup', this.#handleKeyUp, LISTENER_OPTIONS);
		}
		stop() {
			main_core.Event.unbind(this.#targetDocument, 'keydown', this.#handleKeyDown, LISTENER_OPTIONS);
			main_core.Event.unbind(this.#targetDocument, 'keyup', this.#handleKeyUp, LISTENER_OPTIONS);
		}
		#handleKeyDown = event => {
			if (event.code !== SPACE_CODE || event.isComposing) {
				return;
			}
			if (!event.repeat) {
				this.#keyCycle.begin(hasModifier(event));
			}
			if (this.#keyCycle.isForeign()) {
				return;
			}
			const target = this.#resolveTarget(event);
			if (this.#isTypingTarget(target)) {
				return;
			}
			if (this.#onKeyDown(event.repeat, this.#activatesOnSpace(target))) {
				event.preventDefault();
			}
		};
		#handleKeyUp = event => {
			if (event.code !== SPACE_CODE) {
				return;
			}
			if (this.#keyCycle.isForeign()) {
				this.#keyCycle.end();
				return;
			}
			if (this.#onKeyUp()) {
				event.preventDefault();
			}
		};
		#resolveTarget(event) {
			return event.composedPath()[0] ?? event.target;
		}
		#isTypingTarget(target) {
			return main_core.Type.isElementNode(target) && isTextEntry(target);
		}
		#activatesOnSpace(target) {
			if (!main_core.Type.isElementNode(target)) {
				return false;
			}
			if (ACTIVATABLE_ROLES.has(target.getAttribute('role') ?? '')) {
				return true;
			}
			if (target.tagName === INPUT_TAG) {
				return ACTIVATABLE_INPUT_TYPES.has(target.type);
			}
			if (MEDIA_TAGS.has(target.tagName)) {
				return target.controls;
			}
			return ACTIVATABLE_TAGS.has(target.tagName);
		}
	}

	const HOLD_INDICATION_ATTRIBUTE = 'data-bx-call-push-to-talk-hold';
	const FALSE_FOCUS_RING_ATTRIBUTE = 'data-bx-call-push-to-talk-false-focus-ring';
	const FOCUS_LOSS_EVENT = 'focusout';
	const FOCUS_GAIN_EVENT = 'focusin';
	class HoldIndicationAdapter {
		#callWindowDocument;
		#clock;
		#pipDocument = null;
		#holding = false;
		#ringBearer = null;
		#previousBearer = null;
		#scheduled = null;
		constructor(config) {
			this.#callWindowDocument = config.callWindowDocument;
			this.#clock = config.clock;
		}
		setHolding(holding) {
			this.#holding = holding;
			if (holding) {
				this.#takeRingFrom(this.#focusedBearer());
			}
			this.#markHold(this.#callWindowDocument(), holding);
			this.#markHold(this.#pipDocument, holding);
		}
		setPipDocument(pipDocument) {
			this.#markHold(this.#pipDocument, false);
			this.#bindZoneFocus(false);
			this.#endHandOver();
			if (this.#ringBearer?.zoneDocument === this.#pipDocument) {
				this.#takeRingFrom(null);
			}
			this.#pipDocument = pipDocument;
			this.#markHold(pipDocument, this.#holding);
			this.#watchZoneFocus();
		}
		stop() {
			this.setHolding(false);
			this.#takeRingFrom(null);
			this.#pipDocument = null;
		}
		#focusedBearer() {
			const zoneDocument = [this.#callWindowDocument(), this.#pipDocument].find(candidate => candidate?.hasFocus() === true);
			const element = zoneDocument?.activeElement;
			if (main_core.Type.isNil(zoneDocument) || main_core.Type.isNil(element) || this.#keepsItsRing(zoneDocument, element)) {
				return null;
			}
			return {
				element,
				zoneDocument
			};
		}
		#keepsItsRing(zoneDocument, focused) {
			if (focused === zoneDocument.documentElement || focused === zoneDocument.body) {
				return true;
			}
			return isTextEntry(focused);
		}
		#takeRingFrom(bearer) {
			this.#endHandOver();
			if (this.#ringBearer !== null) {
				this.#ringBearer.element.removeAttribute(FALSE_FOCUS_RING_ATTRIBUTE);
				main_core.Event.unbind(this.#ringBearer.element, FOCUS_LOSS_EVENT, this.#handleRingLoss);
			}
			this.#ringBearer = bearer;
			if (bearer !== null) {
				bearer.element.setAttribute(FALSE_FOCUS_RING_ATTRIBUTE, '');
				main_core.Event.bind(bearer.element, FOCUS_LOSS_EVENT, this.#handleRingLoss);
			}
			this.#watchZoneFocus();
		}
		#handleRingLoss = () => {
			const formerBearer = this.#ringBearer?.element ?? null;
			this.#takeRingFrom(null);
			this.#previousBearer = formerBearer;
			this.#scheduled = this.#clock.after(0, () => {
				this.#scheduled = null;
				this.#previousBearer = null;
				this.#watchZoneFocus();
			});
			this.#watchZoneFocus();
		};
		#handleZoneFocusIn = () => {
			const bearerWasDropped = this.#previousBearer !== null && !this.#previousBearer.isConnected;
			this.#endHandOver();
			if (bearerWasDropped) {
				this.#takeRingFrom(this.#focusedBearer());
			}
			this.#watchZoneFocus();
		};
		#endHandOver() {
			this.#previousBearer = null;
			if (this.#scheduled !== null) {
				this.#clock.cancel(this.#scheduled);
				this.#scheduled = null;
			}
		}
		#watchZoneFocus() {
			this.#bindZoneFocus(this.#ringBearer !== null || this.#previousBearer !== null);
		}
		#bindZoneFocus(watching) {
			[this.#callWindowDocument(), this.#pipDocument].forEach(zoneDocument => {
				if (main_core.Type.isNil(zoneDocument)) {
					return;
				}
				main_core.Event.unbind(zoneDocument, FOCUS_GAIN_EVENT, this.#handleZoneFocusIn);
				if (watching) {
					main_core.Event.bind(zoneDocument, FOCUS_GAIN_EVENT, this.#handleZoneFocusIn);
				}
			});
		}
		#markHold(targetDocument, holding) {
			const root = targetDocument?.documentElement;
			if (main_core.Type.isNil(root)) {
				return;
			}
			if (holding) {
				root.setAttribute(HOLD_INDICATION_ATTRIBUTE, '');
				return;
			}
			root.removeAttribute(HOLD_INDICATION_ATTRIBUTE);
		}
	}

	class KeyCycleOwnership {
		#foreign = false;
		begin(foreign) {
			this.#foreign = foreign;
		}
		end() {
			this.#foreign = false;
		}
		isForeign() {
			return this.#foreign;
		}
	}

	const GRACE_INTERVALS = 3;
	const MIN_GRACE_MS = 750;
	class KeyLivenessAdapter {
		#onKeyLivenessLost;
		#clock;
		#lastRepeatAt = null;
		#scheduled = null;
		constructor(config) {
			this.#onKeyLivenessLost = config.onKeyLivenessLost;
			this.#clock = config.clock;
		}
		stop() {
			this.#disarm();
		}
		onKeyDown(repeat) {
			if (!repeat) {
				this.#disarm();
				return;
			}
			const now = this.#clock.now();
			const grace = this.#lastRepeatAt === null ? MIN_GRACE_MS : Math.max(GRACE_INTERVALS * (now - this.#lastRepeatAt), MIN_GRACE_MS);
			this.#lastRepeatAt = now;
			this.#cancelScheduled();
			this.#scheduled = this.#clock.after(grace, () => {
				this.#scheduled = null;
				this.#lastRepeatAt = null;
				this.#onKeyLivenessLost();
			});
		}
		onKeyUp() {
			this.#disarm();
		}
		#disarm() {
			this.#cancelScheduled();
			this.#lastRepeatAt = null;
		}
		#cancelScheduled() {
			if (this.#scheduled !== null) {
				this.#clock.cancel(this.#scheduled);
				this.#scheduled = null;
			}
		}
	}

	const SILENCE_LIMIT_MS = 60 * 1000;
	const SPEECH_SUSPENSION_LIMIT_MS = 3 * SILENCE_LIMIT_MS;
	class SpeechSilenceAdapter {
		#localUserId;
		#onSilenceLimit;
		#clock;
		#scheduled = null;
		#speaking = false;
		constructor(config) {
			this.#localUserId = config.localUserId;
			this.#onSilenceLimit = config.onSilenceLimit;
			this.#clock = config.clock;
		}
		stop() {
			this.#cancelScheduled();
		}
		onMicrophoneCommand(muted) {
			if (muted) {
				this.#cancelScheduled();
				return;
			}
			this.#restart();
		}
		onExternalMicrophoneChange(muted) {
			if (muted) {
				this.#cancelScheduled();
			}
		}
		onSpeechSignal(signal, speaking) {
			if (this.#scheduled === null || !this.#isLocal(signal)) {
				return;
			}
			if (speaking) {
				this.#suspend();
				return;
			}
			this.#restart();
		}
		#isLocal(signal) {
			return signal.local === true || signal.userId === this.#localUserId();
		}
		#suspend() {
			if (this.#speaking) {
				return;
			}
			this.#cancelScheduled();
			this.#speaking = true;
			this.#scheduled = this.#clock.after(SPEECH_SUSPENSION_LIMIT_MS, () => {
				this.#scheduled = null;
				this.#restart();
			});
		}
		#restart() {
			this.#cancelScheduled();
			this.#scheduled = this.#clock.after(SILENCE_LIMIT_MS, () => {
				this.#scheduled = null;
				this.#onSilenceLimit();
			});
		}
		#cancelScheduled() {
			this.#speaking = false;
			if (this.#scheduled !== null) {
				this.#clock.cancel(this.#scheduled);
				this.#scheduled = null;
			}
		}
	}

	const FOCUS_GAP_GRACE_MS = 150;
	class ZoneFocusAdapter {
		#callWindowDocument;
		#isFolded;
		#onZoneFocusChanged;
		#clock;
		#pipDocument = null;
		#zoneFocused = false;
		#scheduled = null;
		constructor(config) {
			this.#callWindowDocument = config.callWindowDocument;
			this.#isFolded = config.isFolded;
			this.#onZoneFocusChanged = config.onZoneFocusChanged;
			this.#clock = config.clock;
		}
		start() {
			this.#bind(this.#callWindowDocument());
			this.#bind(this.#pipDocument);
			this.#recompute();
		}
		stop() {
			this.#unbind(this.#callWindowDocument());
			this.#unbind(this.#pipDocument);
			this.#pipDocument = null;
			this.#cancelScheduled();
		}
		setPipDocument(pipDocument) {
			const closed = pipDocument === null && this.#pipDocument !== null;
			this.#unbind(this.#pipDocument);
			this.#pipDocument = pipDocument;
			this.#bind(this.#pipDocument);
			if (closed && this.#zoneDocuments().length > 0) {
				this.#scheduleRecompute();
				return;
			}
			this.#recompute();
		}
		onFoldChanged() {
			this.#recompute();
		}
		#zoneDocuments() {
			const documents = [];
			if (!this.#isFolded()) {
				documents.push(this.#callWindowDocument());
			}
			if (this.#pipDocument !== null) {
				documents.push(this.#pipDocument);
			}
			return documents;
		}
		#recompute() {
			const next = this.#zoneDocuments().some(zoneDocument => zoneDocument.hasFocus());
			if (next === this.#zoneFocused) {
				return;
			}
			this.#zoneFocused = next;
			this.#onZoneFocusChanged(next);
		}
		#scheduleRecompute() {
			this.#cancelScheduled();
			this.#scheduled = this.#clock.after(FOCUS_GAP_GRACE_MS, () => {
				this.#scheduled = null;
				this.#recompute();
			});
		}
		#handleBlur = () => {
			this.#scheduleRecompute();
		};
		#handleFocus = () => {
			this.#cancelScheduled();
			this.#recompute();
		};
		#handlePageHide = () => {
			this.#recompute();
		};
		#bind(zoneDocument) {
			const view = zoneDocument?.defaultView;
			if (main_core.Type.isNil(view)) {
				return;
			}
			main_core.Event.bind(view, 'blur', this.#handleBlur);
			main_core.Event.bind(view, 'focus', this.#handleFocus);
			main_core.Event.bind(view, 'pagehide', this.#handlePageHide);
		}
		#unbind(zoneDocument) {
			const view = zoneDocument?.defaultView;
			if (main_core.Type.isNil(view)) {
				return;
			}
			main_core.Event.unbind(view, 'blur', this.#handleBlur);
			main_core.Event.unbind(view, 'focus', this.#handleFocus);
			main_core.Event.unbind(view, 'pagehide', this.#handlePageHide);
		}
		#cancelScheduled() {
			if (this.#scheduled !== null) {
				this.#clock.cancel(this.#scheduled);
				this.#scheduled = null;
			}
		}
	}

	const HOLD_MS = 250;
	const Owner = {
		none: 'none',
		external: 'external',
		ptt: 'ptt'
	};
	class PushToTalkPolicy {
		#isAvailable;
		#isMicrophoneMuted;
		#isMicrophoneActionable;
		#isModalBlocked;
		#setMicrophone;
		#onShortPress;
		#onHoldChanged;
		#clock;
		#owner = Owner.none;
		#pending = null;
		#zoneFocused = false;
		#keyDown = false;
		#rearm = false;
		#armedOnActivatable = false;
		#firedInCycle = false;
		constructor(config) {
			this.#isAvailable = config.isAvailable;
			this.#isMicrophoneMuted = config.isMicrophoneMuted;
			this.#isMicrophoneActionable = config.isMicrophoneActionable;
			this.#isModalBlocked = config.isModalBlocked;
			this.#setMicrophone = config.setMicrophone;
			this.#onShortPress = config.onShortPress;
			this.#onHoldChanged = config.onHoldChanged;
			this.#clock = config.clock;
		}
		stop() {
			this.#cancelPending();
			if (this.#owner === Owner.ptt) {
				this.#release();
			}
		}
		onKeyDown(repeat, targetActivatesOnSpace) {
			const inZone = this.#isAvailable() && this.#zoneFocused && !this.#isModalBlocked();
			const suppress = inZone && !targetActivatesOnSpace && this.#canOperate();
			if (repeat) {
				return suppress;
			}
			this.#keyDown = true;
			this.#firedInCycle = false;
			if (this.#rearm || !inZone) {
				return suppress;
			}
			if (!this.#isMicrophoneActionable()) {
				return suppress;
			}
			if (this.#owner !== Owner.none || !this.#isMicrophoneMuted()) {
				return suppress;
			}
			this.#armedOnActivatable = targetActivatesOnSpace;
			this.#cancelPending();
			this.#pending = this.#clock.after(HOLD_MS, () => this.#grab());
			return suppress;
		}
		onKeyUp() {
			this.#keyDown = false;
			this.#rearm = false;
			const wasArmed = this.#pending !== null;
			const fired = this.#firedInCycle;
			this.#firedInCycle = false;
			this.#cancelPending();
			if (this.#owner === Owner.ptt) {
				this.#release();
				return true;
			}
			if (fired) {
				return true;
			}
			if (wasArmed && !this.#armedOnActivatable && this.#isMicrophoneMuted()) {
				this.#onShortPress();
			}
			return false;
		}
		onExternalMicrophoneChange(muted) {
			if (muted) {
				this.#setOwner(Owner.none);
				return;
			}
			if (this.#owner !== Owner.ptt) {
				this.#setOwner(Owner.external);
			}
		}
		onKeyLivenessLost() {
			this.#keyDown = false;
			this.#cancelPending();
			if (this.#owner === Owner.ptt) {
				this.#release();
			}
		}
		onZoneFocusChanged(focused) {
			this.#zoneFocused = focused;
			if (!focused) {
				this.onZoneLeft();
			}
		}
		onZoneLeft() {
			this.#abortHold();
		}
		onSilenceLimit() {
			this.#abortHold();
		}
		onConnectionLost() {
			this.#abortHold();
		}
		onBroadcastRightLost() {
			this.#abortHold();
		}
		#canOperate() {
			if (this.#owner === Owner.ptt) {
				return true;
			}
			return this.#owner === Owner.none && this.#isMicrophoneMuted() && this.#isMicrophoneActionable();
		}
		#abortHold() {
			this.#cancelPending();
			if (this.#keyDown) {
				this.#rearm = true;
			}
			if (this.#owner === Owner.ptt) {
				this.#release();
			}
		}
		#grab() {
			this.#pending = null;
			if (this.#owner !== Owner.none || !this.#isMicrophoneMuted() || !this.#isMicrophoneActionable()
			|| this.#isModalBlocked()) {
				return;
			}
			this.#setOwner(Owner.ptt);
			this.#firedInCycle = true;
			this.#setMicrophone(false, 'push_to_talk');
		}
		#release() {
			this.#setOwner(Owner.none);
			this.#setMicrophone(true, 'push_to_talk');
		}
		#setOwner(next) {
			const wasHolding = this.#owner === Owner.ptt;
			const holding = next === Owner.ptt;
			this.#owner = next;
			if (holding !== wasHolding) {
				this.#onHoldChanged(holding);
			}
		}
		#cancelPending() {
			if (this.#pending !== null) {
				this.#clock.cancel(this.#pending);
				this.#pending = null;
			}
		}
	}

	class PushToTalkCoordinator {
		#policy;
		#zoneFocusAdapter;
		#keyLivenessAdapter;
		#keyCycle;
		#speechSilenceAdapter;
		#holdIndicationAdapter;
		#callWindowDocument;
		#callWindowKeyboardAdapter = null;
		#pipKeyboardAdapter = null;
		#stopped = false;
		constructor(config) {
			this.#callWindowDocument = config.callWindowDocument;
			this.#speechSilenceAdapter = new SpeechSilenceAdapter({
				localUserId: config.localUserId,
				onSilenceLimit: () => this.#policy.onSilenceLimit(),
				clock: config.clock
			});
			this.#holdIndicationAdapter = new HoldIndicationAdapter({
				callWindowDocument: config.callWindowDocument,
				clock: config.clock
			});
			this.#policy = new PushToTalkPolicy({
				...config,
				setMicrophone: (muted, source) => {
					this.#speechSilenceAdapter.onMicrophoneCommand(muted);
					config.setMicrophone(muted, source);
				},
				onHoldChanged: holding => this.#holdIndicationAdapter.setHolding(holding)
			});
			this.#keyLivenessAdapter = new KeyLivenessAdapter({
				onKeyLivenessLost: () => this.#policy.onKeyLivenessLost(),
				clock: config.clock
			});
			this.#keyCycle = new KeyCycleOwnership();
			this.#zoneFocusAdapter = new ZoneFocusAdapter({
				callWindowDocument: config.callWindowDocument,
				isFolded: config.isFolded,
				onZoneFocusChanged: focused => this.#policy.onZoneFocusChanged(focused),
				clock: config.clock
			});
		}
		start() {
			if (this.#callWindowKeyboardAdapter !== null) {
				return;
			}
			this.#stopped = false;
			this.#zoneFocusAdapter.start();
			this.#callWindowKeyboardAdapter = this.#createKeyboardAdapter(this.#callWindowDocument());
			this.#callWindowKeyboardAdapter.start();
		}
		stop() {
			this.#stopped = true;
			this.#callWindowKeyboardAdapter?.stop();
			this.#callWindowKeyboardAdapter = null;
			this.#pipKeyboardAdapter?.stop();
			this.#pipKeyboardAdapter = null;
			this.#zoneFocusAdapter.stop();
			this.#keyLivenessAdapter.stop();
			this.#speechSilenceAdapter.stop();
			this.#policy.stop();
			this.#holdIndicationAdapter.stop();
		}
		setPipDocument(pipDocument) {
			if (this.#stopped) {
				return;
			}
			this.#pipKeyboardAdapter?.stop();
			this.#pipKeyboardAdapter = null;
			if (pipDocument !== null) {
				this.#pipKeyboardAdapter = this.#createKeyboardAdapter(pipDocument);
				this.#pipKeyboardAdapter.start();
			}
			this.#zoneFocusAdapter.setPipDocument(pipDocument);
			this.#holdIndicationAdapter.setPipDocument(pipDocument);
		}
		onFoldChanged() {
			this.#zoneFocusAdapter.onFoldChanged();
		}
		onConnectionLost() {
			this.#policy.onConnectionLost();
		}
		onBroadcastRightLost() {
			this.#policy.onBroadcastRightLost();
		}
		onExternalMicrophoneChange(muted) {
			this.#speechSilenceAdapter.onExternalMicrophoneChange(muted);
			this.#policy.onExternalMicrophoneChange(muted);
		}
		onSpeechSignal(signal, speaking) {
			this.#speechSilenceAdapter.onSpeechSignal(signal, speaking);
		}
		#createKeyboardAdapter(targetDocument) {
			return new DocumentKeyboardAdapter(targetDocument, this.#keyCycle, {
				onKeyDown: (repeat, targetActivatesOnSpace) => {
					this.#keyLivenessAdapter.onKeyDown(repeat);
					return this.#policy.onKeyDown(repeat, targetActivatesOnSpace);
				},
				onKeyUp: () => {
					this.#keyLivenessAdapter.onKeyUp();
					return this.#policy.onKeyUp();
				}
			});
		}
	}

	exports.FALSE_FOCUS_RING_ATTRIBUTE = FALSE_FOCUS_RING_ATTRIBUTE;
	exports.HOLD_INDICATION_ATTRIBUTE = HOLD_INDICATION_ATTRIBUTE;
	exports.PushToTalkCoordinator = PushToTalkCoordinator;

})(this.BX.Call.Lib = this.BX.Call.Lib || {}, BX);
//# sourceMappingURL=push-to-talk.bundle.js.map
