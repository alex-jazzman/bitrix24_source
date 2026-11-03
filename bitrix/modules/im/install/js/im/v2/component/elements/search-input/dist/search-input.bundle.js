/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, ui_iconSet_api_vue, im_v2_const, im_v2_lib_utils, im_v2_lib_a11y, im_v2_lib_escManager, im_v2_component_elements_loader) {
	'use strict';

	const ICON_SIZE = 24;
	// Fallback reset for the keyup guard: the matching activation keyup normally clears it within a frame,
	// but if that keyup is lost (e.g. window blur between keydown and keyup) self-heal after this delay so a
	// later Enter/Space in the field is not swallowed.
	const IGNORE_KEYUP_RESET_DELAY = 500;
	// Owners of the keyboard focus: everything a Tab walk can land on. Anything else holding it was given it
	// programmatically or as the nearest container of a node that went away.
	const FOCUS_CLAIMANT_SELECTOR = 'a[href], button, input, select, textarea, [contenteditable], [tabindex]:not([tabindex^="-"])';
	// Frames the handover waits for an unreachable pill: long enough for an overlay to finish leaving the screen.
	const PILL_REACH_ATTEMPTS = 30;

	// @vue/component
	const SearchInput = {
		name: 'SearchInput',
		components: {
			Spinner: im_v2_component_elements_loader.Spinner,
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			placeholder: {
				type: String,
				default: ''
			},
			searchMode: {
				type: Boolean,
				default: true
			},
			withIcon: {
				type: Boolean,
				default: true
			},
			withLoader: {
				type: Boolean,
				default: false
			},
			isLoading: {
				type: Boolean,
				default: false
			},
			delayForFocusOnStart: {
				type: Number || null,
				default: null
			},
			autofocusOnTrapActivation: {
				type: Boolean,
				default: false
			},
			activateOnEnter: {
				type: Boolean,
				default: false
			},
			// Semantics of a field whose results are walked with the keyboard: aria-autocomplete and aria-expanded.
			// The role and the list itself are named by the attribute props below, as every consumer names them.
			withResultsNavigation: {
				type: Boolean,
				default: false
			},
			ariaActiveDescendantId: {
				type: String,
				default: null
			},
			withGlobalEscapeHandling: {
				type: Boolean,
				default: true
			},
			clearButtonLabel: {
				type: String,
				default: null
			},
			// The three props below address the input itself: attributes the component does not declare
			// land on the outer wrapper, so passing them through as plain attributes would not work.
			inputRole: {
				type: String,
				default: null
			},
			inputControlsId: {
				type: String,
				default: null
			},
			inputDescribedById: {
				type: String,
				default: null
			}
		},
		emits: ['queryChange', 'inputFocus', 'inputBlur', 'keyPressed', 'rawKeyDown', 'close', 'closeByEsc'],
		// The only methods a consumer may call by ref; the rest of the mechanics stays the element's own.
		// Both hand the focus over: one asks for it back, the other gives up the start focus the field was
		// promised - and only the consumer knows that something else took it in the meantime.
		expose: ['returnFocusToPill', 'cancelFocusOnStart'],
		data() {
			return {
				query: '',
				hasFocus: false,
				ignoreNextKeyUp: false
			};
		},
		computed: {
			SpinnerSize: () => im_v2_component_elements_loader.SpinnerSize,
			SpinnerColor: () => im_v2_component_elements_loader.SpinnerColor,
			Outline: () => ui_iconSet_api_vue.Outline,
			ICON_SIZE: () => ICON_SIZE,
			isEmptyQuery() {
				return this.query.length === 0;
			},
			// Collapsed search acts as a focusable button (Tab -> pill, Enter/Space/click opens).
			// Gated on !hasFocus too: searchMode syncs from the parent asynchronously, so hasFocus
			// makes the button inert the instant the input focuses, keeping the close icon clickable.
			collapsedButtonMode() {
				return this.activateOnEnter && !this.searchMode && !this.hasFocus;
			},
			// A permanent name for the field, taken from the text the consumer already localised. An
			// empty placeholder yields no attribute: a blank one would wipe the name instead of leaving
			// it computable.
			ariaLabel() {
				return this.placeholder || null;
			},
			// An opted-in consumer gets a keyboard-reachable clear button instead of the close icon. The
			// label is what opts in: a nameless button would be worse than the icon it replaces, so a
			// missing phrase degrades to the icon rather than to an unnamed control.
			hasClearButtonLabel() {
				return Boolean(this.clearButtonLabel);
			},
			showClearButton() {
				return this.hasClearButtonLabel && !this.isEmptyQuery;
			},
			showCloseIcon() {
				return !this.hasClearButtonLabel && this.hasFocus;
			}
		},
		watch: {
			searchMode(newValue) {
				if (newValue === true) {
					this.focus();
				} else {
					// Read before blur(): it drops the focus onto <body>, and this is the last moment that still
					// tells whether the search owned the focus when it was closed.
					const wasFocusOurs = this.ownsFocus();
					this.query = '';
					this.blur();
					if (wasFocusOurs) {
						this.returnFocusToPill();
					}
				}
			}
		},
		created() {
			// The key of an activation that is not over yet. The press starts on the pill and ends in the input
			// the focus lands in, so everything it sends in between still belongs to the activation. Kept out of
			// data(): the template knows nothing of it.
			this.pendingActivationKey = null;
			this.ignoreKeyUpResetTimer = null;
			this.focusOnStartTimer = null;

			// Opted out when Escape belongs to an enclosing owner (a popup closing by Esc): handling it here
			// too would clear the query first and cost the user a second keystroke to close.
			if (this.withGlobalEscapeHandling) {
				this.getEmitter().subscribe(im_v2_const.EventType.key.onBeforeEscape, this.onBeforeEscape);
			}
		},
		beforeUnmount() {
			clearTimeout(this.ignoreKeyUpResetTimer);
			this.cancelFocusOnStart();
			if (this.withGlobalEscapeHandling) {
				this.getEmitter().unsubscribe(im_v2_const.EventType.key.onBeforeEscape, this.onBeforeEscape);
			}
		},
		mounted() {
			if (this.delayForFocusOnStart === 0) {
				this.focus();
			} else if (this.delayForFocusOnStart > 0) {
				this.focusOnStartTimer = setTimeout(() => {
					this.focusOnStartTimer = null;
					this.focus();
				}, this.delayForFocusOnStart);
			}
		},
		methods: {
			onBeforeEscape() {
				if (!this.hasFocus) {
					return im_v2_lib_escManager.EscEventAction.ignored;
				}
				if (this.isEmptyQuery) {
					this.closeByEsc();
				} else {
					this.onClearInput();
				}
				return im_v2_lib_escManager.EscEventAction.handled;
			},
			onInputUpdate() {
				this.$emit('queryChange', this.query);
			},
			onFocus() {
				this.focus();
				this.$emit('inputFocus');
			},
			// The mirror of onFocus, for subscribers that act on the keys of this field: once it no longer holds
			// the focus, no key of theirs can arrive. `hasFocus` is deliberately left alone - it drives the pill
			// and the close icon, and a focus that merely moved to a neighbour must not collapse the search.
			onBlur() {
				// A focus that left the field ends the activation as surely as the release of its key does - and
				// when that release is the one lost together with the focus (the window switched away mid-press),
				// this is the only thing that ends it.
				this.pendingActivationKey = null;
				this.$emit('inputBlur');
			},
			activate() {
				// The input is display:none while collapsed; leaving button mode reveals it, then we
				// focus it once the DOM updates. onFocus then sets hasFocus and emits inputFocus.
				this.hasFocus = true;
				this.$nextTick(() => {
					this.$refs.searchInput.focus();
				});
			},
			onPillKeydown(event) {
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault();
					event.stopPropagation();
					// Hold on to this very key until it is released: the focus is about to leave for the input,
					// and whatever the held key keeps sending there is still this activation - not a keystroke of
					// the field.
					this.pendingActivationKey = event.key;
					// The keystroke that expands the search goes into the same raw channel as the ones typed in
					// the field: it is the only sign the results get that the search was entered from the
					// keyboard and not with the mouse (a click on the pill produces no keydown at all). It
					// navigates nothing - the results are not open yet at this point.
					this.$emit('rawKeyDown', event);
					this.activate();
				}
			},
			onCloseClick() {
				this.query = '';
				this.hasFocus = false;
				this.$emit('queryChange', this.query);
				this.$emit('close');
			},
			onClearInput() {
				this.query = '';
				this.focus();
				this.$emit('queryChange', this.query);
			},
			// Raw keydown channel: subscribers that navigate the search results need the key before the field
			// acts on it, and only they know whether it is a navigation key - so preventDefault() is theirs to
			// call, not ours. The native event is passed on untouched so they can. The emit is named apart from
			// the native `keydown`, which bubbles out of the field to the root node on its own: a listener
			// written for one and bound to the other would work while going past the guards below.
			onKeyDown(event) {
				// Auto-repeat of the pill activation keeps arriving here for as long as the key is held, and its
				// native default has to be cancelled along with it: a held Space would otherwise type spaces into
				// a field the user is not looking at (the query is invisible, the placeholder hidden), and the
				// first Esc would clear that query instead of closing the search.
				if (event.key === this.pendingActivationKey) {
					event.preventDefault();
					return;
				}

				// Escape belongs to EscManager (onBeforeEscape), never to search-result subscribers.
				if (im_v2_lib_utils.Utils.key.isCombination(event, 'Escape')) {
					return;
				}
				this.$emit('rawKeyDown', event);
			},
			onClearButtonKeydown(event) {
				// A native button activates on Enter keydown, so onClearInput() has already moved the
				// focus into the field by the time the matching keyup arrives - and it arrives there.
				// Swallow it, otherwise it reaches keyPressed and the consumer picks the first result.
				// Space needs no guard: it activates on keyup, which still lands on the button.
				if (event.key === 'Enter') {
					this.armIgnoreNextKeyUp();
				}
			},
			armIgnoreNextKeyUp() {
				this.ignoreNextKeyUp = true;
				// Self-heal if the matching keyup never arrives (e.g. the window loses focus between keydown
				// and keyup), so a later, unrelated Enter/Space in the field is not swallowed.
				clearTimeout(this.ignoreKeyUpResetTimer);
				this.ignoreKeyUpResetTimer = setTimeout(() => {
					this.ignoreNextKeyUp = false;
				}, IGNORE_KEYUP_RESET_DELAY);
			},
			clearIgnoreNextKeyUp() {
				this.ignoreNextKeyUp = false;
				clearTimeout(this.ignoreKeyUpResetTimer);
			},
			// A press shorter than the tick the focus moves in is released on the pill, not in the field. Bound on
			// the container so the release is seen wherever it lands: a guard left armed swallows the next key.
			onActivationKeyRelease(event) {
				if (event.key === this.pendingActivationKey) {
					this.pendingActivationKey = null;
				}
			},
			onKeyUp(event) {
				// The release that ends the activation: swallowed, or it would open the highlighted chat the very
				// instant the search opened. It ends the guard as well - from here on the key is the field's own.
				if (event.key === this.pendingActivationKey) {
					this.pendingActivationKey = null;
					return;
				}
				if (this.ignoreNextKeyUp) {
					this.clearIgnoreNextKeyUp();
					if (event.key === 'Enter' || event.key === ' ') {
						return;
					}
				}
				if (im_v2_lib_utils.Utils.key.isCombination(event, 'Escape')) {
					return;
				}
				this.$emit('keyPressed', event);
			},
			closeByEsc() {
				this.query = '';
				this.hasFocus = false;
				// Move focus off the input immediately so it cannot re-autofocus after Esc. Focus does not stay
				// here: the parent flips searchMode, and the watcher lands it on the pill.
				this.$refs.searchContainer.focus();
				this.$emit('queryChange', this.query);
				this.$emit('closeByEsc');
			},
			// Every way out of the expanded search ends with the parent flipping searchMode: opening an item with
			// Enter, the close icon, a click outside, Esc. So the return of the focus lives in the watcher alone -
			// otherwise blur() drops it on <body> and the next Tab restarts from the top of the header.
			// Public as well: the consumer that knows the search is owed the focus back (the chat opened from the
			// results has been exited) has no other way to hand it over, and the pill is not its element to focus.
			returnFocusToPill() {
				if (!this.activateOnEnter || im_v2_lib_a11y.isFocusOwnedByPopup()) {
					return;
				}

				// Pill mode: the collapsed search is a button that carries the focus ring, and it only exists
				// after the re-render - land focus on it then, instead of leaving focus on the ringless
				// tabindex=-1 wrapper (reads as "focus lost" until Tab).
				this.$nextTick(() => {
					this.focusPillWhenReachable(PILL_REACH_ATTEMPTS);
				});
			},
			// None of the three conditions is settled here: the pill appears with a re-render of its header, its
			// `inert` is dropped in a render of the overlay above it, and the focus can still be held for a frame
			// by a control of the surface leaving the screen. Engines settle them in different order, so they are
			// waited out rather than trusted. `inert` is checked in code because engines without support for it
			// ignore the attribute, and the focus would land on a pill the user cannot see.
			focusPillWhenReachable(attemptsLeft) {
				const pill = this.$refs.searchPill;
				const isReachable = Boolean(pill?.isConnected) && !pill.closest('[inert]') && this.isFocusFree();
				if (!isReachable) {
					if (attemptsLeft > 0) {
						requestAnimationFrame(() => {
							this.focusPillWhenReachable(attemptsLeft - 1);
						});
					}
					return;
				}
				pill.focus();
			},
			// Whoever has taken the keyboard focus during the wait for the re-render owns it now. The one that
			// always does is the input of the chat just opened from the results: it autofocuses in this very
			// update cycle, and the pill must not pull the focus back out of the chat the user asked for. Focus
			// left on <body> is nobody's - that is the case where the opened chat has no input to take it.
			isFocusFree() {
				const focused = document.activeElement;
				if (!focused || focused === document.body || focused === document.documentElement || this.ownsFocus()) {
					return true;
				}

				// Where the focus lands when its node is removed differs by engine: Chromium drops it on the body,
				// Firefox hands it to the page container. A node no Tab can reach counts as nobody either way.
				return !focused.matches(FOCUS_CLAIMANT_SELECTOR);
			},
			// The search owns the focus while it is either in the field or on the tabindex=-1 wrapper (where Esc
			// parks it). Anything else means the focus has already gone elsewhere and is not ours to move.
			ownsFocus() {
				return Boolean(this.$refs.searchContainer?.contains(document.activeElement));
			},
			// The delayed start focus belongs to the owner of the field: something opened together with
			// the field can take the focus first (a dialog of the panel), and then the pending focus has
			// to be dropped instead of pulling the focus back out of it.
			cancelFocusOnStart() {
				clearTimeout(this.focusOnStartTimer);
				this.focusOnStartTimer = null;
			},
			focus() {
				this.hasFocus = true;
				this.$refs.searchInput.focus();
			},
			blur() {
				this.hasFocus = false;
				this.$refs.searchInput.blur();
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			}
		},
		template: `
		<div
			class="bx-im-search-input__scope bx-im-search-input__container"
			ref="searchContainer"
			tabindex="-1"
			:class="{'--has-focus': hasFocus, '--button-mode': collapsedButtonMode}"
			@keyup="onActivationKeyRelease"
		>
			<div
				v-if="collapsedButtonMode"
				class="bx-im-search-input__pill --focus-visible"
				data-testid="im-search-input-pill"
				ref="searchPill"
				role="button"
				tabindex="0"
				:aria-label="placeholder"
				:aria-expanded="searchMode"
				@keydown="onPillKeydown"
				@click="activate"
			>
				<div class="bx-im-search-input__search-icon">
					<BIcon :name="Outline.SEARCH" :size="ICON_SIZE" />
				</div>
				<span class="bx-im-search-input__pill-text">{{ placeholder }}</span>
			</div>
			<div v-if="!isLoading && !collapsedButtonMode" class="bx-im-search-input__search-icon">
				<BIcon :name="Outline.SEARCH" :size="ICON_SIZE" />
			</div>
			<Spinner
				v-if="withLoader && isLoading && !collapsedButtonMode"
				:size="SpinnerSize.XXS"
				:color="SpinnerColor.grey"
				class="bx-im-search-input__loader"
			/>
			<input
				@focus="onFocus"
				@blur="onBlur"
				@input="onInputUpdate"
				@keydown="onKeyDown"
				@keyup="onKeyUp"
				v-model="query"
				class="bx-im-search-input__element"
				:class="{'--with-icon': withIcon}"
				:placeholder="placeholder"
				:aria-label="ariaLabel"
				:role="inputRole"
				:aria-controls="inputControlsId"
				:aria-describedby="inputDescribedById"
				:aria-autocomplete="withResultsNavigation ? 'list' : null"
				:aria-expanded="withResultsNavigation ? searchMode : null"
				:aria-activedescendant="withResultsNavigation && ariaActiveDescendantId
					? ariaActiveDescendantId
					: null"
				:tabindex="collapsedButtonMode ? -1 : null"
				:data-autofocus="autofocusOnTrapActivation ? '' : null"
				data-testid="im-search-input-field"
				ref="searchInput"
			/>
			<button
				v-if="showClearButton"
				type="button"
				class="bx-im-search-input__close-icon"
				data-testid="im-search-input-clear-button"
				tabindex="0"
				:aria-label="clearButtonLabel"
				@keydown="onClearButtonKeydown"
				@click="onClearInput"
			></button>
			<div
				v-if="showCloseIcon"
				class="bx-im-search-input__close-icon"
				data-testid="im-search-input-close"
				@click="onCloseClick"
			></div>
		</div>
	`
	};

	exports.SearchInput = SearchInput;

})(this.BX.Messenger.v2.Component.Elements = this.BX.Messenger.v2.Component.Elements || {}, BX.UI.IconSet, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.Elements);
//# sourceMappingURL=search-input.bundle.js.map
