/* eslint-disable */
this.BX = this.BX || {};
this.BX.Note = this.BX.Note || {};
(function (exports, ui_iconSet_outline, main_core, ui_hint, ui_vue3_components_avatar) {
	'use strict';

	// Closed contract: exactly 5 avatars stay visible before the stack collapses into "+N" overflow.
	const MAX_VISIBLE_AVATARS = 5;

	// Fallback avatar background palette — shared so every place that renders a photoless avatar
	// (this stack, the views popover) derives the SAME stable color per user instead of each
	// component inventing its own (that mismatch is what made one person look differently colored
	// in different parts of the hub). Deterministic by user id.
	const AVATAR_FALLBACK_PALETTE = ['#1f86ff', '#f85e9e', '#37c5d8', '#19cc45', '#f5a623', '#8e6cef'];

	// Legible text color (dark on light backgrounds, white otherwise) for an initial rendered over a
	// fallback avatar background. The identity color now comes from the server (participant.color =
	// awareness caret color, an md5-derived per-user hue), so the background can be any brightness —
	// unlike the old curated palette, which was always dark enough for white text.
	function avatarInitialTextColor(background) {
		const raw = typeof background === 'string' ? background.trim().replace('#', '') : '';
		const hex = raw.length === 3 ? raw.split('').map(char => char + char).join('') : raw;
		if (hex.length !== 6) {
			return '#ffffff';
		}
		const r = parseInt(hex.slice(0, 2), 16);
		const g = parseInt(hex.slice(2, 4), 16);
		const b = parseInt(hex.slice(4, 6), 16);
		if ([r, g, b].some(value => Number.isNaN(value))) {
			return '#ffffff';
		}

		// Perceived luminance (ITU-R BT.601) — light backgrounds get dark text so the initial stays readable.
		const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
		return luminance > 0.6 ? '#1a1a1a' : '#ffffff';
	}
	function avatarFallbackColor(userId) {
		const id = Math.trunc(Number(userId));
		if (!Number.isFinite(id) || id <= 0) {
			return AVATAR_FALLBACK_PALETTE[0];
		}
		return AVATAR_FALLBACK_PALETTE[Math.abs(id) % AVATAR_FALLBACK_PALETTE.length];
	}

	// Module-level counter so every stack instance (preview meta + each version tile) gets a
	// unique menu id — the page can render many stacks at once, and a hardcoded id would collide
	// (duplicate DOM id, ambiguous aria-controls).
	let instanceCounter = 0;
	const NoteAvatarStack = {
		name: 'NoteAvatarStack',
		components: {
			Avatar: ui_vue3_components_avatar.Avatar
		},
		props: {
			participants: {
				type: Array,
				default: () => []
			},
			compact: {
				type: Boolean,
				default: false
			},
			// Row mode: a single avatar rendered inside a list row (viewers popover) rather than a
			// stack of overlapping ones. Drops the overlap margin, the separator ring and the entrance
			// animation — a list of rows must not pop on every open — but keeps the same avatar
			// rendering, so a row and a stack never draw the same person differently.
			inline: {
				type: Boolean,
				default: false
			},
			// Hover hint with the participant's name. Rows that already print the name next to the
			// avatar turn it off instead of showing the same text twice.
			showHints: {
				type: Boolean,
				default: true
			},
			showSingleName: {
				type: Boolean,
				default: false
			},
			viewingLabel: {
				type: String,
				default: ''
			},
			editingLabel: {
				type: String,
				default: ''
			},
			selfLabelTemplate: {
				type: String,
				default: '#NAME#'
			},
			menuAriaLabel: {
				type: String,
				default: ''
			},
			// When true, clicking an avatar (or a co-authors menu row) emits `avatar-click` with the
			// participant instead of the live-collaboration `activate` behaviour — the host decides
			// what to do (history/activity use it to open the user profile). Keeps this low-level
			// component free of any note.editor navigation dependency.
			avatarsClickable: {
				type: Boolean,
				default: false
			}
		},
		data() {
			return {
				participantsMenuOpen: false,
				outsideClickHandler: null,
				activeMenuIndex: 0,
				appearingIds: []
			};
		},
		beforeCreate() {
			// Non-reactive, set BEFORE created(): the `participants` watcher below is `immediate` and
			// Vue fires immediate watchers before created(), so these must already exist by then.
			this.knownParticipantIds = new Set();
			this.appearingTimers = new Map();
		},
		created() {
			instanceCounter += 1;
			this.menuId = `note-avatar-stack-menu-${instanceCounter}`;
		},
		mounted() {
			this.refreshHints();
		},
		updated() {
			this.refreshHints();
		},
		beforeUnmount() {
			this.detachOutsideClick();
			this.appearingTimers?.forEach(timer => clearTimeout(timer));
			this.appearingTimers?.clear();
		},
		watch: {
			participants: {
				immediate: true,
				handler(next) {
					// Flag only ids that weren't present last update so the entrance animation plays once
					// per real join — not on mode-toggle node re-creation or when the dropdown opens.
					const nextIds = new Set((Array.isArray(next) ? next : []).map(p => Number(p?.id)));
					const fresh = [...nextIds].filter(id => id && !this.knownParticipantIds.has(id));
					this.knownParticipantIds = nextIds;
					fresh.forEach(id => {
						if (!this.appearingIds.includes(id)) {
							this.appearingIds = [...this.appearingIds, id];
						}
						const existing = this.appearingTimers.get(id);
						if (existing) {
							clearTimeout(existing);
						}
						this.appearingTimers.set(id, setTimeout(() => {
							this.appearingIds = this.appearingIds.filter(value => value !== id);
							this.appearingTimers.delete(id);
						}, 220));
					});
				}
			}
		},
		computed: {
			normalizedParticipants() {
				return Array.isArray(this.participants) ? this.participants : [];
			},
			participantsTotal() {
				return this.normalizedParticipants.length;
			},
			hasParticipants() {
				return this.participantsTotal > 0;
			},
			compactCounter() {
				// Compact mode collapses everyone into a single counter puck; otherwise stack up to five.
				return this.compact;
			},
			showSingleParticipantName() {
				return this.showSingleName && !this.compactCounter && this.participantsTotal === 1;
			},
			visibleParticipants() {
				// Compact mode collapses everyone into the counter puck; otherwise stack up to five, then a puck.
				if (this.compactCounter) {
					return [];
				}
				return this.normalizedParticipants.slice(0, MAX_VISIBLE_AVATARS);
			},
			participantsCounter() {
				if (this.compactCounter) {
					return this.participantsTotal;
				}
				return this.participantsTotal > MAX_VISIBLE_AVATARS ? this.participantsTotal - MAX_VISIBLE_AVATARS : 0;
			},
			showParticipantsCounter() {
				return this.participantsCounter > 0;
			},
			menuParticipants() {
				// The dropdown lists only who isn't already shown: everyone in compact mode (no avatars),
				// or just the overflow beyond the visible stack on desktop.
				return this.compactCounter ? this.normalizedParticipants : this.normalizedParticipants.slice(MAX_VISIBLE_AVATARS);
			},
			counterText() {
				// Compact puck stands for everyone (plain count); stacked puck is the "+N beyond five" overflow.
				return this.compactCounter ? String(this.participantsCounter) : `+${this.participantsCounter}`;
			}
		},
		emits: ['activate', 'avatar-click'],
		methods: {
			refreshHints() {
				if (this.$el instanceof HTMLElement) {
					ui_hint.Hint.init(this.$el);
				}
			},
			participantActionLabel(participant) {
				// A participant without a mode (no live-presence context) shows no action line —
				// keeps the component portable to future non-live consumers (history, views).
				if (participant?.mode === 'edit') {
					return this.editingLabel;
				}
				if (participant?.mode === 'view') {
					return this.viewingLabel;
				}
				return '';
			},
			participantHint(participant) {
				// ui.hint renders data-hint as HTML — encode the user-controlled name, keep the localized action.
				const name = main_core.Text.encode(this.participantDisplayName(participant));
				const action = this.participantActionLabel(participant);
				const actionMarkup = action === '' ? '' : `<span class="note-avatar-stack__hint-action">${main_core.Text.encode(action)}</span>`;
				return `<span class="note-avatar-stack__hint-name">${name}</span>${actionMarkup}`;
			},
			participantDisplayName(participant) {
				const name = String(participant?.name || '').trim() || `#${Number(participant?.id) || 0}`;

				// Self chip localises via a "#NAME# (you)" template — replace the placeholder at render time.
				return participant?.isSelf ? this.selfLabelTemplate.replaceAll('#NAME#', name) : name;
			},
			// A visible avatar is interactive when the host opted into avatar clicks (history/activity open
			// the profile) or, in live collaboration, when it's an editing peer to jump to. Keyed to
			// `mode === 'edit'` (the visible green ring), NOT `hasCursor`: a peer who just entered edit mode
			// hasn't broadcast a caret yet (awareness only sends it on caret move), so gating on the caret
			// left editing avatars unfocusable while already showing as editing. scrollToParticipant
			// safely no-ops if no caret is in the DOM yet.
			isParticipantClickable(participant) {
				return this.avatarsClickable || !participant?.isSelf && participant?.mode === 'edit';
			},
			// In row mode the avatar sits right next to the printed name, so for a screen reader it is
			// decorative — announcing it would read the same name twice. A clickable avatar is never
			// hidden: it stays a real control and keeps its accessible name.
			isParticipantDecorative(participant) {
				return this.inline && !this.isParticipantClickable(participant);
			},
			// Accessible name for the avatar: name + optional action ("Ivanov, editing"). The hover
			// hint (data-hint) is mouse-only, so keyboard/screen-reader users get identity from here.
			participantAccessibleName(participant) {
				const name = this.participantDisplayName(participant);
				const action = this.participantActionLabel(participant);
				return action === '' ? name : `${name}, ${action}`;
			},
			participantInitial(participant) {
				const name = String(participant?.name || '').trim();
				return name === '' ? '?' : name.charAt(0).toUpperCase();
			},
			isParticipantAppearing(participant) {
				return !this.inline && this.appearingIds.includes(Number(participant?.id));
			},
			// Identity color from the server (participant.color = the awareness caret color, an
			// md5-derived per-user hue) so a user's avatar matches their editor cursor everywhere —
			// including the historical timeline, since the backend now stamps the same color onto every
			// author/viewer payload (see IdentityColor). avatarFallbackColor stays as a defensive
			// last resort for callers that don't supply a color. The initial's text color adapts to the
			// background brightness so it stays legible on any hue.
			//
			// Both land as CSS variables rather than as ui.avatar's `baseColor` option: the colors then
			// stay reactive without rebuilding the (imperative) avatar instance — see participantAvatarKey.
			participantAvatarStyle(participant) {
				// A photo keeps the plain wrapper background it always had. Userpics are routinely
				// circles on a transparent canvas, and an identity hue behind one shows through as a
				// colored rim around the picture.
				if (participant?.avatar) {
					return {};
				}
				const backgroundColor = String(participant?.color || avatarFallbackColor(participant?.id));
				return {
					'--note-avatar-stack-color': backgroundColor,
					'--note-avatar-stack-initial-color': avatarInitialTextColor(backgroundColor)
				};
			},
			// ui.avatar puts the photo into an SVG xlink:href, so a file name with spaces, parentheses
			// or quotes is safe here — the same URL in a CSS url() token silently drops the whole
			// declaration and leaves an empty grey circle.
			participantAvatarOptions(participant) {
				const avatar = participant?.avatar;
				return {
					// No `title`/`userName`: those would add a native tooltip on top of our hint and let
					// ui.avatar derive two-letter initials. No `size` either — the diameter comes from
					// --ui-avatar-size in CSS, which our --note-avatar-stack-size drives (so hosts can
					// keep resizing the stack through one variable).
					initials: this.participantInitial(participant),
					picPath: typeof avatar === 'string' && avatar !== '' ? avatar : undefined
				};
			},
			// ui.avatar builds its DOM once in created() and exposes no reactive props, so the wrapper is
			// keyed on everything it bakes in: a changed photo or initial re-creates the instance. Colors
			// are deliberately absent — they flow through CSS variables and need no rebuild.
			participantAvatarKey(participant) {
				return `${Number(participant?.id) || 0}:${participant?.avatar || ''}:${this.participantInitial(participant)}`;
			},
			toggleParticipantsMenu() {
				if (this.participantsMenuOpen) {
					this.closeParticipantsMenu();
					return;
				}
				this.participantsMenuOpen = true;
				this.activeMenuIndex = 0;
				this.attachOutsideClick();

				// Move focus into the menu (first item) once it renders — WAI-ARIA menu-button pattern.
				this.$nextTick(() => this.focusMenuItem(0));
			},
			closeParticipantsMenu(refocusTrigger = false) {
				this.participantsMenuOpen = false;
				this.detachOutsideClick();
				if (refocusTrigger) {
					this.$nextTick(() => this.$refs.participantsTrigger?.focus?.());
				}
			},
			handleParticipantClick(participant, refocusTrigger = false) {
				// Only editors expose a caret to jump to; viewers (and self) just close the menu. Match
				// isParticipantClickable — gate on the editing mode, not the (laggy) caret presence.
				if (participant && !participant.isSelf && participant.mode === 'edit') {
					this.$emit('activate', participant);
				}
				this.closeParticipantsMenu(refocusTrigger);
			},
			emitAvatarClick(participant) {
				const id = Number(participant?.id);
				if (Number.isInteger(id) && id > 0) {
					this.$emit('avatar-click', participant);
				}
			},
			// A row-avatar click: `avatar-click` when the host opted in (stop propagation so a
			// clickable ancestor — e.g. a history tile — doesn't also fire), else the default
			// live-collaboration caret jump.
			handleAvatarClick(participant, event) {
				if (this.avatarsClickable) {
					event?.stopPropagation?.();
					this.emitAvatarClick(participant);
					return;
				}
				this.handleParticipantClick(participant);
			},
			handleMenuItemClick(participant, refocusTrigger = false) {
				if (this.avatarsClickable) {
					this.emitAvatarClick(participant);
					this.closeParticipantsMenu(refocusTrigger);
					return;
				}
				this.handleParticipantClick(participant, refocusTrigger);
			},
			menuItemElements() {
				const menu = this.$refs.participantsMenu;
				return menu instanceof HTMLElement ? [...menu.querySelectorAll('.note-avatar-stack__menu-item')] : [];
			},
			focusMenuItem(index) {
				const items = this.menuItemElements();
				if (items.length === 0) {
					return;
				}
				const clamped = Math.max(0, Math.min(items.length - 1, index));
				this.activeMenuIndex = clamped;
				items[clamped]?.focus();
			},
			onParticipantsMenuKeydown(event) {
				const lastIndex = this.menuParticipants.length - 1;
				switch (event.key) {
					case 'ArrowDown':
						event.preventDefault();
						this.focusMenuItem(this.activeMenuIndex + 1);
						break;
					case 'ArrowUp':
						event.preventDefault();
						this.focusMenuItem(this.activeMenuIndex - 1);
						break;
					case 'Home':
						event.preventDefault();
						this.focusMenuItem(0);
						break;
					case 'End':
						event.preventDefault();
						this.focusMenuItem(lastIndex);
						break;
					case 'Enter':
					case ' ':
						event.preventDefault();
						this.handleMenuItemClick(this.menuParticipants[this.activeMenuIndex], true);
						break;
					case 'Escape':
						event.preventDefault();
						this.closeParticipantsMenu(true);
						break;
					case 'Tab':
						// Let focus leave naturally, but don't keep a detached menu open.
						this.closeParticipantsMenu();
						break;
				}
			},
			attachOutsideClick() {
				if (this.outsideClickHandler) {
					return;
				}
				this.outsideClickHandler = event => {
					const root = this.$refs.participantsRoot;
					if (root && !root.contains(event.target)) {
						this.closeParticipantsMenu();
					}
				};

				// Defer so the opening click itself doesn't immediately close the menu.
				setTimeout(() => {
					document.addEventListener('click', this.outsideClickHandler, true);
				}, 0);
			},
			detachOutsideClick() {
				if (this.outsideClickHandler) {
					document.removeEventListener('click', this.outsideClickHandler, true);
					this.outsideClickHandler = null;
				}
			}
		},
		// language=Vue
		template: `
		<div
			v-if="hasParticipants"
			ref="participantsRoot"
			class="note-avatar-stack"
			:class="{ '--inline': inline }"
		>
			<div class="note-avatar-stack__row">
				<component
					:is="isParticipantClickable(participant) ? 'button' : 'span'"
					v-for="(participant, index) in visibleParticipants"
					:key="(participant.id || index) + ':' + participant.mode"
					:type="isParticipantClickable(participant) ? 'button' : null"
					class="note-avatar-stack__avatar"
					:class="{ '--self': participant.isSelf, '--editing': participant.mode === 'edit', '--clickable': isParticipantClickable(participant), '--appearing': isParticipantAppearing(participant) }"
					:data-hint="showHints ? participantHint(participant) : null"
					data-hint-no-icon
					data-hint-html
					:role="isParticipantClickable(participant) || isParticipantDecorative(participant) ? null : 'img'"
					:aria-hidden="isParticipantDecorative(participant) ? 'true' : null"
					:aria-label="isParticipantDecorative(participant) ? null : participantAccessibleName(participant)"
					:tabindex="isParticipantClickable(participant) ? 0 : null"
					@click="handleAvatarClick(participant, $event)"
				>
					<span class="note-avatar-stack__avatar-image" :style="participantAvatarStyle(participant)">
						<Avatar :key="participantAvatarKey(participant)" :options="participantAvatarOptions(participant)" />
					</span>
				</component>
				<span v-if="showSingleParticipantName" class="note-avatar-stack__single-name">{{ participantDisplayName(visibleParticipants[0]) }}</span>
				<button
					v-if="showParticipantsCounter"
					ref="participantsTrigger"
					type="button"
					class="note-avatar-stack__counter"
					:class="{ '--compact': compactCounter, '--active': participantsMenuOpen }"
					:aria-label="menuAriaLabel"
					aria-haspopup="menu"
					:aria-controls="menuId"
					:aria-expanded="participantsMenuOpen ? 'true' : 'false'"
					@click="toggleParticipantsMenu"
				>
					<span v-if="compactCounter" class="ui-icon-set --o-person note-avatar-stack__counter-icon"></span>
					<span class="note-avatar-stack__counter-text">{{ counterText }}</span>
				</button>
			</div>
			<div v-if="participantsMenuOpen" class="note-avatar-stack__menu">
				<ul
					:id="menuId"
					ref="participantsMenu"
					class="note-avatar-stack__menu-list"
					role="menu"
					:aria-label="menuAriaLabel"
					@keydown="onParticipantsMenuKeydown"
				>
					<li
						v-for="(participant, index) in menuParticipants"
						:key="participant.id || index"
						class="note-avatar-stack__menu-item"
						role="menuitem"
						:tabindex="index === activeMenuIndex ? 0 : -1"
						@click="handleMenuItemClick(participant)"
					>
						<span class="note-avatar-stack__menu-item-text">
							<span class="note-avatar-stack__menu-item-name">{{ participantDisplayName(participant) }}</span>
							<span v-if="participantActionLabel(participant)" class="note-avatar-stack__menu-item-action" :class="{ '--editing': participant.mode === 'edit' }">{{ participantActionLabel(participant) }}</span>
						</span>
						<span
							class="note-avatar-stack__avatar --menu"
							:class="{ '--editing': participant.mode === 'edit' }"
						>
							<span class="note-avatar-stack__avatar-image" :style="participantAvatarStyle(participant)">
								<Avatar :key="participantAvatarKey(participant)" :options="participantAvatarOptions(participant)" />
							</span>
						</span>
					</li>
				</ul>
			</div>
		</div>
	`
	};

	exports.AVATAR_FALLBACK_PALETTE = AVATAR_FALLBACK_PALETTE;
	exports.MAX_VISIBLE_AVATARS = MAX_VISIBLE_AVATARS;
	exports.NoteAvatarStack = NoteAvatarStack;
	exports.avatarFallbackColor = avatarFallbackColor;
	exports.avatarInitialTextColor = avatarInitialTextColor;

})(this.BX.Note.Ui = this.BX.Note.Ui || {}, window, BX, BX.UI, BX.UI.Vue3.Components);
//# sourceMappingURL=avatar-stack.bundle.js.map
