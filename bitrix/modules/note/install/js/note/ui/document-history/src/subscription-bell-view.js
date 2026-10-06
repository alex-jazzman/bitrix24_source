import { BIcon, Outline, Solid } from 'ui.icon-set.api.vue';
import 'ui.icon-set.solid';
import { Type } from 'main.core';
import { positionPopoverUnderTrigger, keepPopoverAnchored } from 'note.ui.popover-position';

// [P4.T1] Presentation half of the subscription bell: the trigger, the scope popover
// (self / subtree / off), the inherited/muted layouts and the keyboard model. It owns no
// transport and no loading - the state arrives as a prop (DTO-02 plus `inheritedTitle`) and the
// chosen action leaves as an event. Two hosts share it: the editor's own container
// (subscription-bell.js, which loads the state itself) and the row of the favorites block, whose
// state comes from the sidebar store. There is deliberately no second copy of this choice.
//
// [#10 rework] `role="menu"` with `menuitemradio`/`menuitem` rows and roving tabindex -
// same pattern as note.ui.avatar-stack's co-authors menu (onParticipantsMenuKeydown):
// Arrow Up/Down move the roving focus, Home/End jump to the ends, Enter/Space activate the
// focused row, Esc closes and returns focus to the bell, Tab closes and lets focus continue
// naturally (in place; teleported the popover is the last child of body, so there Tab hands
// focus back to the trigger and the browser's own move continues from it). A row is the menu
// item itself and holds no interactive descendant: the scope rows keep the native radio for
// what it draws, inert, and act on their own click, while "off"/"mute"/"resume" are native
// buttons.
//
// [#9] Selecting a mode still closes the popover (mirrors the mockup's showPop/closePop flow -
// see mockup lines 719-726) - that's a deliberate exception to "row click doesn't close" (#4 in
// the filter popover): here the click IS the completed action, not just a toggle.

// Module-level counter for a unique popover id + radio group name per instance
// (mirrors ViewsWidgetComponent / NoteAvatarStack).
let instanceCounter = 0;

const MODE_SELF = 'self';
const MODE_SUBTREE = 'subtree';

export const SubscriptionBellView = {
	name: 'NoteDocumentHistorySubscriptionBellView',
	components: {
		BIcon,
	},
	props: {
		// [DTO-02] `{ mode, subscribed, muted, inherited, inheritedSource }` plus the optional
		// `inheritedTitle` that names the covering source. An absent state reads as "nothing arrives".
		state: {
			type: Object,
			default: null,
		},
		// A write is on the wire: the rows are disabled so a second press cannot race the first.
		isSaving: {
			type: Boolean,
			default: false,
		},
		// The trigger looks like a control of its host, so its classes come from the host. The active
		// modifier is separate because the host's design system names it (`--on` in the activity line,
		// `is-on` in a sidebar row) while the state behind it is known only here.
		triggerClass: {
			type: String,
			default: 'note-activity-line__control --interactive',
		},
		activeClass: {
			type: String,
			default: '--on',
		},
		// Muting is a state of its own for a host that keeps the control on screen by class (a sidebar
		// row shows a bell only while it has something to say). Empty where the host does not need it.
		mutedClass: {
			type: String,
			default: '',
		},
		iconClass: {
			type: String,
			default: 'note-activity-line__control-icon',
		},
		// Where the popover is rendered. Empty - in place, right after the trigger (the activity line,
		// where nothing clips it). A selector - teleported there, which is what a host inside a
		// transformed and clipping subtree needs: a sidebar panel would otherwise cut the popover off
		// and place it against the panel instead of the viewport.
		teleportTo: {
			type: String,
			default: '',
		},
		// Classes for the teleported popover - the design-system context of the host, which the popover
		// no longer inherits once it renders outside the application subtree.
		popoverClass: {
			type: String,
			default: '',
		},
		messages: {
			type: Object,
			required: true,
		},
	},
	emits: ['select-mode', 'unsubscribe', 'mute', 'resume'],
	data()
	{
		return {
			isOpen: false,
			// [#10] Roving-tabindex cursor within the open popover's menu rows.
			activeIndex: 0,
		};
	},
	computed: {
		Outline: (): typeof Outline => Outline,
		Solid: (): typeof Solid => Solid,
		subscribed(): boolean
		{
			return this.state?.subscribed === true;
		},
		mode(): string | null
		{
			return this.subscribed ? String(this.state?.mode || '') : null;
		},
		// [inherited] Covered by an ancestor subtree / collection subscription (no direct row) -
		// the bell reads as active and the popover explains the source instead of offering a
		// redundant scope choice. `muted` is the per-document negative override of that coverage.
		inherited(): boolean
		{
			return this.state?.inherited === true;
		},
		inheritedSource(): string | null
		{
			return this.inherited ? String(this.state?.inheritedSource || '') : null;
		},
		// Title of the covering source (nearest subtree-subscribed ancestor, or the collection) -
		// names it in the info line ("within the "..." section") so the coverage isn't a vague "parent".
		inheritedTitle(): string
		{
			return this.inherited ? String(this.state?.inheritedTitle || '') : '';
		},
		// A mute is the negative override of coverage from above, so it only means anything while that
		// coverage is there. The row survives the covering subscription being switched off, and reading it
		// on its own would show a bell that suppresses nothing and a popover naming a source that is gone.
		muted(): boolean
		{
			return this.state?.muted === true && this.inherited;
		},
		// Four mutually exclusive popover layouts (see template):
		//   'direct'    - a direct self/subtree subscription on this document (scope chooser + off)
		//   'inherited' - covered by an ancestor subtree / collection, no direct row (info + "mute")
		//   'muted'     - this document is muted despite inherited coverage (info + "resume")
		//   'none'      - no subscription and no coverage (scope chooser to subscribe)
		popoverState(): string
		{
			if (this.muted)
			{
				return 'muted';
			}

			if (this.subscribed)
			{
				return 'direct';
			}

			return this.inherited ? 'inherited' : 'none';
		},
		// The bell is filled whenever the user effectively gets this document's notifications -
		// direct OR inherited - and not muted.
		effectiveOn(): boolean
		{
			return (this.subscribed || this.inherited) && !this.muted;
		},
		triggerClasses(): Array<string>
		{
			const classes = [this.triggerClass];
			if (this.effectiveOn)
			{
				classes.push(this.activeClass);
			}
			else if (this.muted && this.mutedClass !== '')
			{
				classes.push(this.mutedClass);
			}

			return classes;
		},
		iconName(): string
		{
			if (this.muted)
			{
				return Outline.NOTIFICATION_OFF;
			}

			return this.effectiveOn ? Solid.NOTIFICATION : Outline.NOTIFICATION;
		},
		inheritedInfoText(): string
		{
			const isCollection = this.inheritedSource === 'collection';
			const named = isCollection
				? this.messages.subscriptionInheritedCollection
				: this.messages.subscriptionInheritedSubtree;
			const generic = isCollection
				? this.messages.subscriptionInheritedCollectionGeneric
				: this.messages.subscriptionInheritedSubtreeGeneric;

			// Fall back to the source-less phrasing when the title is unknown (e.g. covering entity gone).
			if (!Type.isStringFilled(this.inheritedTitle) || !Type.isStringFilled(named))
			{
				return generic || named || '';
			}

			return named.replace('#TITLE#', this.inheritedTitle);
		},
		bellTitle(): string
		{
			switch (this.popoverState)
			{
				case 'muted':
					return this.messages.activityMuted;
				case 'direct':
					return this.mode === MODE_SUBTREE
						? this.messages.activitySubscribedSubtree
						: this.messages.activitySubscribedSelf;
				case 'inherited':
					return this.inheritedSource === 'collection'
						? this.messages.activitySubscribedInheritedCollection
						: this.messages.activitySubscribedInheritedSubtree;
				default:
					return this.messages.activitySubscribe;
			}
		},
		radioGroupName(): string
		{
			return `note-subscription-bell-scope-${this.instanceId}`;
		},
		// [#10] Actionable menu rows in DOM order - drives roving-tabindex indices and Enter/Space
		// activation. Differs per popoverState: the inherited/muted layouts expose a single action.
		menuOptionKeys(): Array<string>
		{
			switch (this.popoverState)
			{
				case 'direct':
					return [MODE_SELF, MODE_SUBTREE, 'off'];
				case 'inherited':
					return ['mute'];
				case 'muted':
					return ['resume'];
				default:
					return [MODE_SELF, MODE_SUBTREE];
			}
		},
	},
	created()
	{
		this.outsideClickHandler = null;
		this.popoverAnchorDispose = null;

		instanceCounter += 1;
		this.instanceId = instanceCounter;
		this.bellPopoverId = `note-subscription-bell-popover-${this.instanceId}`;
		this.bellTitleId = `note-subscription-bell-title-${this.instanceId}`;
	},
	beforeUnmount()
	{
		this.detachOutsideClick();
		this.detachPopoverAnchor();
	},
	methods: {
		toggleOpen(): void
		{
			if (this.isOpen)
			{
				this.closePopover();

				return;
			}

			this.isOpen = true;
			this.attachOutsideClick();

			// [#10] Roving focus starts on the checked option (or the first row when
			// unsubscribed) - mirrors the previous "focus the checked radio" behaviour, now
			// expressed as a menu row index. [#5] Position centered under the trigger.
			const startIndex = this.popoverState === 'direct' && this.mode === MODE_SUBTREE ? 1 : 0;
			this.activeIndex = startIndex;
			this.$nextTick(() => {
				positionPopoverUnderTrigger(this.$refs.bellTrigger, this.$refs.bellPopover);
				this.focusMenuItem(startIndex);
				this.popoverAnchorDispose = keepPopoverAnchored(
					this.$refs.bellTrigger,
					this.$refs.bellPopover,
					() => this.closePopover(),
				);
			});
		},
		// [#10] Menu rows in DOM order - mirrors note.ui.avatar-stack's menuItemElements().
		menuItemElements(): Array<HTMLElement>
		{
			const popover = this.$refs.bellPopover;

			return popover instanceof HTMLElement
				? [...popover.querySelectorAll('[role^="menuitem"]')]
				: [];
		},
		focusMenuItem(index: number): void
		{
			const items = this.menuItemElements();
			if (items.length === 0)
			{
				return;
			}

			const clamped = Math.max(0, Math.min(items.length - 1, index));
			this.activeIndex = clamped;
			items[clamped]?.focus();
		},
		activateMenuItem(key: string): void
		{
			if (key === 'off')
			{
				this.unsubscribe();

				return;
			}

			if (key === 'mute')
			{
				this.mute();

				return;
			}

			if (key === 'resume')
			{
				this.resume();

				return;
			}

			this.selectMode(key);
		},
		// [#10] Roving-tabindex menu keydown - same key set as note.ui.avatar-stack's
		// onParticipantsMenuKeydown, adapted to this popover's own row activation.
		onMenuKeydown(event: KeyboardEvent): void
		{
			const lastIndex = this.menuOptionKeys.length - 1;

			switch (event.key)
			{
				case 'ArrowDown':
					event.preventDefault();
					this.focusMenuItem(this.activeIndex + 1);
					break;
				case 'ArrowUp':
					event.preventDefault();
					this.focusMenuItem(this.activeIndex - 1);
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
					this.activateMenuItem(this.menuOptionKeys[this.activeIndex]);
					break;
				case 'Escape':
					event.preventDefault();
					this.closePopover(true);
					break;
				case 'Tab':
					// In place the popover sits right after the trigger, so focus may leave naturally.
					// Teleported it is the last child of body, and leaving from there would land on the first
					// control of the page: focus goes back to the trigger first - synchronously, before the
					// browser acts on this Tab - so the move it makes continues from the bell.
					this.closePopover(this.teleportTo !== '');
					break;
				default:
					break;
			}
		},
		closePopover(refocusTrigger: boolean = false): void
		{
			// Focus first, close second: a host that only shows the trigger while its row holds the focus
			// (a row of the sidebar) hides it the moment the focus leaves the popover, and a hidden element
			// cannot take the focus back. While the popover is still open the trigger is on screen.
			if (refocusTrigger)
			{
				this.$refs.bellTrigger?.focus?.();
			}

			this.isOpen = false;
			this.detachOutsideClick();
			this.detachPopoverAnchor();
		},
		// The popover may be teleported out of the component's own root, so "inside the control" is
		// the two nodes together, not the root alone.
		containsNode(node: mixed): boolean
		{
			const root = this.$refs.root;
			const popover = this.$refs.bellPopover;

			return (root instanceof HTMLElement && root.contains(node))
				|| (popover instanceof HTMLElement && popover.contains(node))
			;
		},
		handleFocusOut(event: FocusEvent): void
		{
			const nextFocus = event.relatedTarget;

			// [iOS] Close via focusout ONLY when focus moved to a real element (keyboard Tab). A
			// null/non-element relatedTarget is a tap-induced blur - iOS Safari doesn't focus <button>s
			// on tap, so closing here would race the trigger's own click and reopen the popover
			// ("second tap doesn't close"). Tap-outside/trigger re-tap are owned by the outside-click
			// listener and the toggle handler.
			if (!(nextFocus instanceof HTMLElement))
			{
				return;
			}

			if (!this.containsNode(nextFocus))
			{
				this.closePopover();
			}
		},
		attachOutsideClick(): void
		{
			if (this.outsideClickHandler)
			{
				return;
			}

			this.outsideClickHandler = (event) => {
				if (!this.containsNode(event.target))
				{
					this.closePopover();
				}
			};

			// Deferred so the opening click itself doesn't immediately close the popover.
			setTimeout(() => {
				document.addEventListener('click', this.outsideClickHandler, true);
			}, 0);
		},
		detachPopoverAnchor(): void
		{
			if (typeof this.popoverAnchorDispose === 'function')
			{
				this.popoverAnchorDispose();
				this.popoverAnchorDispose = null;
			}
		},
		detachOutsideClick(): void
		{
			if (this.outsideClickHandler)
			{
				document.removeEventListener('click', this.outsideClickHandler, true);
				this.outsideClickHandler = null;
			}
		},
		selectMode(mode: string): void
		{
			if (this.isSaving)
			{
				return;
			}

			this.closePopover(true);
			if (this.subscribed && this.mode === mode)
			{
				// [AC-043] The mode already in force is not re-sent: the press only closes the popover.
				return;
			}

			this.$emit('select-mode', mode);
		},
		unsubscribe(): void
		{
			if (this.isSaving)
			{
				return;
			}

			this.closePopover(true);
			this.$emit('unsubscribe');
		},
		mute(): void
		{
			if (this.isSaving)
			{
				return;
			}

			this.closePopover(true);
			this.$emit('mute');
		},
		resume(): void
		{
			if (this.isSaving)
			{
				return;
			}

			this.closePopover(true);
			this.$emit('resume');
		},
	},
	// language=Vue
	template: `
		<div ref="root" class="note-subscription-bell">
			<button
				ref="bellTrigger"
				type="button"
				:class="triggerClasses"
				:title="bellTitle"
				:aria-label="bellTitle"
				aria-haspopup="menu"
				:aria-expanded="isOpen ? 'true' : 'false'"
				:aria-controls="isOpen ? bellPopoverId : null"
				@click.stop="toggleOpen"
			>
				<BIcon :name="iconName" :class="iconClass" aria-hidden="true" />
			</button>
			<Teleport :to="teleportTo || 'body'" :disabled="teleportTo === ''">
			<div
				v-if="isOpen"
				:id="bellPopoverId"
				ref="bellPopover"
				class="note-subscription-bell__popover"
				:class="popoverClass"
				role="menu"
				:aria-labelledby="bellTitleId"
				@keydown="onMenuKeydown"
				@focusout="handleFocusOut"
			>
				<template v-if="popoverState === 'direct' || popoverState === 'none'">
					<div :id="bellTitleId" class="note-subscription-bell__popover-title">{{ messages.subscriptionTitle }}</div>
					<!-- [#10 a11y] The row is the menu item and nothing inside it is: a menuitemradio may hold no
					     interactive descendant, and the role itself is not allowed on a label. The native radio stays
					     for what it draws and is inert, so it takes neither focus nor pointer, and the choice is made
					     by the row (children of this role are presentational, so nothing is announced twice). -->
					<div
						class="note-subscription-bell__option"
						role="menuitemradio"
						:aria-checked="subscribed && mode === 'self' ? 'true' : 'false'"
						:aria-disabled="isSaving ? 'true' : null"
						:tabindex="activeIndex === 0 ? 0 : -1"
						@click="selectMode('self')"
					>
						<input
							type="radio"
							inert
							tabindex="-1"
							:name="radioGroupName"
							value="self"
							:checked="subscribed && mode === 'self'"
							:disabled="isSaving"
						/>
						<span class="note-subscription-bell__option-text">
							<span class="note-subscription-bell__option-title">{{ messages.subscriptionScopeSelf }}</span>
							<span class="note-subscription-bell__option-desc">{{ messages.subscriptionScopeSelfDesc }}</span>
						</span>
					</div>
					<div
						class="note-subscription-bell__option"
						role="menuitemradio"
						:aria-checked="subscribed && mode === 'subtree' ? 'true' : 'false'"
						:aria-disabled="isSaving ? 'true' : null"
						:tabindex="activeIndex === 1 ? 0 : -1"
						@click="selectMode('subtree')"
					>
						<input
							type="radio"
							inert
							tabindex="-1"
							:name="radioGroupName"
							value="subtree"
							:checked="subscribed && mode === 'subtree'"
							:disabled="isSaving"
						/>
						<span class="note-subscription-bell__option-text">
							<span class="note-subscription-bell__option-title">{{ messages.subscriptionScopeSubtree }}</span>
							<span class="note-subscription-bell__option-desc">{{ messages.subscriptionScopeSubtreeDesc }}</span>
						</span>
					</div>
					<template v-if="popoverState === 'direct'">
						<div class="note-subscription-bell__sep"></div>
						<button
							type="button"
							class="note-subscription-bell__off"
							role="menuitem"
							:tabindex="activeIndex === 2 ? 0 : -1"
							:disabled="isSaving"
							@click="unsubscribe"
						>
							<span class="note-subscription-bell__off-icon-col">
								<BIcon :name="Outline.NOTIFICATION_OFF" class="note-subscription-bell__off-icon" aria-hidden="true" />
							</span>
							{{ messages.subscriptionOff }}
						</button>
					</template>
				</template>
				<template v-else-if="popoverState === 'inherited'">
					<div :id="bellTitleId" class="note-subscription-bell__info">{{ inheritedInfoText }}</div>
					<div class="note-subscription-bell__sep"></div>
					<button
						type="button"
						class="note-subscription-bell__off"
						role="menuitem"
						:tabindex="activeIndex === 0 ? 0 : -1"
						:disabled="isSaving"
						@click="mute"
					>
						<span class="note-subscription-bell__off-icon-col">
							<BIcon :name="Outline.NOTIFICATION_OFF" class="note-subscription-bell__off-icon" aria-hidden="true" />
						</span>
						{{ messages.subscriptionMute }}
					</button>
				</template>
				<template v-else-if="popoverState === 'muted'">
					<div :id="bellTitleId" class="note-subscription-bell__info">{{ messages.subscriptionMutedInfo }}</div>
					<div class="note-subscription-bell__sep"></div>
					<button
						type="button"
						class="note-subscription-bell__off"
						role="menuitem"
						:tabindex="activeIndex === 0 ? 0 : -1"
						:disabled="isSaving"
						@click="resume"
					>
						<span class="note-subscription-bell__off-icon-col">
							<BIcon :name="Outline.NOTIFICATION" class="note-subscription-bell__off-icon" aria-hidden="true" />
						</span>
						{{ messages.subscriptionResume }}
					</button>
				</template>
			</div>
			</Teleport>
		</div>
	`,
};
