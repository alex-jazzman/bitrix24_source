import { Event, Tag, Text, Type } from 'main.core';
import { MenuManager } from 'main.popup';
import { LiveAnnouncer } from 'ui.a11y';
import { Icon } from 'ui.icon-set.api.core';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { hint } from 'ui.vue3.directives.hint';
import { mapActions, mapState } from 'ui.vue3.pinia';

import {
	CONSTRUCTION_LABELS,
	CONSTRUCTION_TYPES,
	NODE_BLOCK_TYPES,
	useNodeSettingsStore,
	getAvailableBlockDescriptors,
	isHeadConstructionType,
	isNodeRuleType,
} from '../../../../entities/node-settings';
import { useLoc } from '../../../../shared/composables';

import './style.css';

const CHIP_SELECTOR = '.editor-chart-node-settings-add-construction-toolbar__item';
// Label of a chip: the plus icon renders as a div (ui.icon-set.api.vue), so the span is the text.
const CHIP_LABEL_SELECTOR = 'span';

// Popup of the hint carries it, and style.css narrows the inset of the content through it.
const HINT_POPUP_CLASS = 'editor-chart-node-settings-add-construction-hint';

// Receivers of a focus handed over by a control that leaves the row.
const FOCUS_HANDOVER_MORE_TRIGGER = 'moreTrigger';
const FOCUS_HANDOVER_LAST_CHIP = 'lastChip';

const isSameIdList = (ids: Array<string>, otherIds: Array<string>): boolean => {
	return ids.length === otherIds.length && ids.every((id, index) => id === otherIds[index]);
};

// @vue/component
export const AddConstruction = {
	name: 'AddConstruction',
	components: { BIcon },
	directives: { hint },
	props:
	{
		/** @type TRuleCard */
		ruleCard:
		{
			type: [Object, null],
			default: null,
		},
		/**
		 * @type Port | PortlessRule
		 * Rule the row adds to. Without it the row works on the target rule of the store, which is
		 * the very same rule while the panel shows a single one.
		 */
		rulePort:
		{
			type: [Object, null],
			default: null,
		},
	},
	setup(): { getMessage: () => string; iconSet: Outline }
	{
		const { getMessage } = useLoc();

		return {
			getMessage,
			iconSet: Outline,
		};
	},
	data(): { isMoreMenuOpen: boolean, visibleChipCount: number | null, truncatedChipIds: Array<string> }
	{
		return {
			isMoreMenuOpen: false,
			// null until the row is measured: every chip is shown, none is moved to the menu yet
			visibleChipCount: null,
			// chips whose label does not fit their own box - measured together with the row
			truncatedChipIds: [],
		};
	},
	created(): void
	{
		// menu instance must stay non-reactive (main.popup Menu)
		this.menu = null;
		this.resizeObserver = null;
		this.overflowRafId = null;
		this.isOverflowUpdatePending = false;
		// last width the row was measured at, to tell a real resize from a change of its height
		this.observedToolbarWidth = null;
		// bound once, so the same reference subscribes to document.fonts and unsubscribes from it
		this.onFontsLoadingDone = () => this.requestOverflowUpdate();
	},
	mounted(): void
	{
		this.observeToolbarWidth();
		this.watchFontMetrics();
	},
	beforeUnmount(): void
	{
		this.closeMoreMenu();
		Event.unbind(document.fonts, 'loadingdone', this.onFontsLoadingDone);
		this.resizeObserver?.disconnect();
		this.resizeObserver = null;
		if (this.overflowRafId !== null)
		{
			cancelAnimationFrame(this.overflowRafId);
			this.overflowRafId = null;
		}
	},
	watch:
	{
		// A changed set of chips is a changed row: it is measured again once it is rendered. Both
		// collections are built from the same descriptor and change together, so the request they make
		// is coalesced - one changed row is one measurement, not one per collection.
		buttonActions: 'requestOverflowUpdateOnNextTick',
		menuOnlyActions: 'requestOverflowUpdateOnNextTick',
		/**
		 * The menu is built once, at the moment it is shown, so a set of items changed under it no
		 * longer matches what it offers: a chip that has just left the row would be missing from both.
		 * It is closed instead, and the user reopens it on the current set.
		 */
		moreActions(actions: Array, previousActions: Array): void
		{
			if (this.menu && this.hasMenuContentChanged(actions, previousActions))
			{
				this.closeMoreMenu();
			}
		},
		/**
		 * An emptied menu takes the trigger off the row together with the focus the closing popup
		 * has just given back to it. The popup may be long closed by then - the click of its last
		 * item closes it before the store answers - so the rescue watches the hiding itself, not
		 * the menu. Checked before the row is redrawn, while the trigger still holds the focus:
		 * a focus resting elsewhere is not ours to move.
		 */
		isMoreTriggerHidden(isHidden: boolean): void
		{
			if (isHidden && document.activeElement === this.$refs.moreTrigger)
			{
				this.$nextTick(() => this.rescueFocusFromHiddenTrigger());
			}
		},
	},
	computed:
	{
		...mapState(useNodeSettingsStore, [
			'nodeSettings',
			'toolbarRulePort',
			'hasBaseSettings',
			'isResolvingActionPrefill',
		]),
		/**
		 * Rule every control of the row works on: the one it was given, or the target rule the store
		 * keeps. Null while the node has no rule at all - the row then adds to nothing.
		 */
		targetRulePort(): Object | null
		{
			return this.rulePort ?? this.toolbarRulePort;
		},
		/**
		 * All toolbar descriptors split into primary buttons (placement:'button')
		 * and 'more' menu items (placement:'more').
		 */
		allActions(): Array
		{
			const availableBlocks = this.nodeSettings?.availableBlocks ?? {};
			const currentRuleType = this.targetRulePort?.type ?? '';

			const descriptors = getAvailableBlockDescriptors(availableBlocks, {
				surface: 'rules',
				currentRuleType,
			});

			return descriptors
				.filter((d) => d.toolbar)
				.map((d) => ({
					id: d.toolbar.constructionType,
					type: d.type,
					text: this.getMessage(d.toolbar.labelMessageCode),
					dataset: { testId: d.toolbar.testId },
					className: d.toolbar.className,
					placement: d.toolbar.placement ?? 'button',
				}));
		},
		/**
		 * Primary toolbar buttons - placement:'button' (condition / action / output / filter),
		 * plus the base-settings chip (last, truncated on the mockup 935:82879) when applicable.
		 */
		buttonActions(): Array
		{
			const items = this.allActions.filter((a) => a.placement === 'button');

			// Re-add chip is a primary chip per mockup 935:82879. Hidden when hasBaseSettings (uniqueness).
			// Defense in depth: also require rules the node keeps for itself. Base-settings lives in
			// the rules of an input port and in the container of a node without input ports, never in
			// relations. The registry answers that with the very same predicate (isNodeRuleType), so
			// the chip and the block descriptor cannot read the context differently.
			const baseSettingsAvailable = (this.nodeSettings?.availableBlocks?.[NODE_BLOCK_TYPES.BASE_SETTINGS]?.available) === true;
			const isOwnRules = isNodeRuleType(this.targetRulePort?.type ?? '');
			if (baseSettingsAvailable && isOwnRules && !this.hasBaseSettings)
			{
				items.push({
					id: CONSTRUCTION_TYPES.BASE_SETTINGS,
					type: CONSTRUCTION_TYPES.BASE_SETTINGS,
					text: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_BASE_SETTINGS_TOOLBAR_ITEM'),
					dataset: { testId: 'complexNodeRuleSettingsToolbarItemBaseSettings' },
					className: 'base-settings',
					placement: 'button',
				});
			}

			return items;
		},
		/**
		 * Registry items that never appear as a chip - placement:'more' (e.g. group).
		 */
		menuOnlyActions(): Array
		{
			return this.allActions.filter((a) => a.placement === 'more');
		},
		/**
		 * Chips the row has no width for. They stay in the DOM (their natural width is what the
		 * fit is computed from) but out of sight, and the user reaches them in the menu.
		 */
		overflowActions(): Array
		{
			if (this.visibleChipCount === null)
			{
				return [];
			}

			return this.buttonActions.slice(this.visibleChipCount);
		},
		/**
		 * Items of the three-dot menu: the chips that did not fit come first, in their row order,
		 * then the items that are menu-only by registration.
		 */
		moreActions(): Array
		{
			return [...this.overflowActions, ...this.menuOnlyActions];
		},
		hasAnyAction(): boolean
		{
			return this.buttonActions.length > 0 || this.menuOnlyActions.length > 0;
		},
		/**
		 * The trigger leaves the row when it has nothing to offer, but never while its menu is open:
		 * a live popup bound to an invisible element leaves aria-expanded="true" on a control nobody
		 * can reach.
		 */
		isMoreTriggerHidden(): boolean
		{
			return this.moreActions.length === 0 && !this.isMoreMenuOpen;
		},
		/**
		 * The wait of a chip that left the row, shown on the trigger: the chip itself is out of sight,
		 * so on a narrow panel this is the only place an addition in flight is visible at all.
		 * Indication only - the trigger keeps opening its menu (style.css).
		 */
		isMorePending(): boolean
		{
			return this.overflowActions.some((action) => this.isChipPending(action.id));
		},
		/**
		 * How many actions the menu holds is part of the name of the trigger: chips move into it as the
		 * panel narrows, and the name is the only place that says so.
		 */
		moreTriggerLabel(): string
		{
			if (this.moreActions.length === 0)
			{
				return this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_TOOLBAR_MORE_ARIA_LABEL');
			}

			return this.getMessage(
				'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_TOOLBAR_MORE_ARIA_LABEL_WITH_COUNT',
				{ '#COUNT#': String(this.moreActions.length) },
			);
		},
	},
	methods:
	{
		...mapActions(useNodeSettingsStore, [
			'addConstruction',
			'addRuleCard',
			'deleteRuleCard',
			'resolveActionPrefill',
			'resolveGroupRuleCard',
			'resolveHeadRuleCard',
		]),
		async onAddConstruction(actionId: string): Promise<void>
		{
			// The action chip pressed again while its prefill is still being resolved does nothing:
			// the pending add is the one the user asked for, a second one would only duplicate it.
			// The dimmed chip is out of the mouse's reach (pointer-events) but not out of the
			// keyboard's, so such a press is answered instead of leaving the user without feedback.
			// Only that chip waits for anything — see isChipPending.
			if (this.isChipPending(actionId))
			{
				this.announceAddPending();

				return;
			}

			// The rule and the node the chip was pressed on: the context the prefill below belongs
			// to, checked again once the wait is over (isInsertionContextAlive).
			const insertionContext = {
				rule: this.targetRulePort ?? null,
				blockId: this.nodeSettings?.blockId ?? null,
			};

			// An action inherits the node's base settings, and its form renders them from the store:
			// the prefill is resolved before the insertion, because the form does not follow later
			// activityData writes. Resolved before the card is resolved as well, so a group created
			// for the action does not sit empty on the screen for the whole round trip.
			// Every other chip stays synchronous: nothing is awaited on its path.
			const actionPrefill = actionId === CONSTRUCTION_TYPES.ACTION
				? await this.resolveActionPrefill()
				: null
			;

			// The rule and the node shown when the chip was pressed are the ones the base settings were
			// resolved for, and both the port selector and the section pick stay live during the round
			// trip: a switch made meanwhile would land the action in a card of the new context carrying
			// the prefill of the old one.
			// Same context guard as the card path (isInsertionTargetAlive in node-settings-rules.js).
			if (!this.isInsertionContextAlive(insertionContext))
			{
				return;
			}

			// Head blocks (base-settings re-add, filter) go to the head card above the groups;
			// base-settings uniqueness is enforced by addConstruction (hasBaseSettings guard).
			// A group chip extends the last group only while it holds no construction of that
			// group yet, so a repeated type starts a new group (mockup CardSettingsRules.addCard).
			const targetCard = isHeadConstructionType(actionId)
				? this.resolveHeadRuleCard(this.targetRulePort)
				: this.resolveGroupRuleCard(actionId, this.targetRulePort)
			;
			// No card means the target rule has no entry left (e.g. the port was removed while the
			// toolbar was open): the chip then does nothing instead of throwing.
			if (!targetCard)
			{
				return;
			}

			const construction = this.addConstruction(targetCard, actionId, actionPrefill, this.targetRulePort);
			if (!construction)
			{
				// The head card is resolved (and created when missing) before the insertion, so a
				// rejected one must not stay behind: the layout renders a card without constructions
				// as a group, and this one would show up under the default group name.
				if (targetCard.constructions.length === 0)
				{
					this.deleteRuleCard(targetCard, this.targetRulePort);
				}

				return;
			}

			this.announceConstructionAdded(actionId, construction);
			this.scrollToConstruction(construction, targetCard);
		},
		observeToolbarWidth(): void
		{
			if (this.$refs.toolbar && Type.isFunction(window.ResizeObserver))
			{
				this.resizeObserver ??= new window.ResizeObserver((entries) => this.onToolbarResize(entries));
				this.resizeObserver.observe(this.$refs.toolbar);
			}

			this.updateOverflow();
		},
		/**
		 * The fit depends on the text metrics of the chips as much as on the width of the row: a web
		 * font applied late re-sizes the chips while the content box of the toolbar stays as it was,
		 * so the resize observer never hears of it. The settled font set asks for one more
		 * measurement (a cheap one when nothing changed), and every font load after that does the
		 * same.
		 */
		watchFontMetrics(): void
		{
			document.fonts?.ready?.then(() => this.requestOverflowUpdate());
			Event.bind(document.fonts, 'loadingdone', this.onFontsLoadingDone);
		},
		// Only a changed width is a new decision: the height of the row changes on its own (taller
		// trigger box, top inset of the pinned strip) and would cost a forced layout read for nothing.
		onToolbarResize(entries: Array<ResizeObserverEntry>): void
		{
			const width = entries?.[0]?.contentRect?.width ?? null;
			if (width !== null && width === this.observedToolbarWidth)
			{
				return;
			}

			this.observedToolbarWidth = width;
			this.requestOverflowUpdate();
		},
		// One measurement per re-rendered row: one descriptor change invalidates several of the
		// collections the row is built from.
		requestOverflowUpdateOnNextTick(): void
		{
			if (this.isOverflowUpdatePending)
			{
				return;
			}

			this.isOverflowUpdatePending = true;
			this.$nextTick(() => {
				this.isOverflowUpdatePending = false;
				this.updateOverflow();
			});
		},
		/**
		 * Deferred to the next frame, and one frame holds one recalculation: taking a chip off the row
		 * brings the taller trigger in, so the row would resize inside the observer's own notification
		 * and the browser aborts the delivery loop instead of calling back.
		 */
		requestOverflowUpdate(): void
		{
			if (this.overflowRafId !== null)
			{
				return;
			}

			this.overflowRafId = requestAnimationFrame(() => {
				this.overflowRafId = null;
				this.updateOverflow();
			});
		},
		updateOverflow(): void
		{
			const count = this.measureVisibleChipCount();
			if (count === null)
			{
				return;
			}

			// Read in the same pass, before anything is written back: both answers are about the row as
			// it is laid out right now, and every trigger of a remeasure is a trigger of this one too.
			// Kept ahead of the count check: a clipped label changes on its own, with the same chips.
			this.updateTruncatedChips();
			if (count === this.visibleChipCount)
			{
				return;
			}

			const handover = this.resolveFocusHandover(count);
			this.visibleChipCount = count;

			if (handover !== null)
			{
				this.$nextTick(() => this.applyFocusHandover(handover));
			}
		},
		// Read before the count is applied - afterwards the focus of a hidden element is already on the
		// body - and applied after the row is redrawn, when the trigger is focusable at all.
		resolveFocusHandover(nextCount: number): string | null
		{
			const toolbar = this.$refs.toolbar;
			const active = document.activeElement;
			if (!toolbar || !active || !toolbar.contains(active))
			{
				return null;
			}

			if (active === this.$refs.moreTrigger)
			{
				return this.willHideMoreTrigger(nextCount) ? FOCUS_HANDOVER_LAST_CHIP : null;
			}

			const chipIndex = [...toolbar.querySelectorAll(CHIP_SELECTOR)].indexOf(active);

			return chipIndex >= nextCount ? FOCUS_HANDOVER_MORE_TRIGGER : null;
		},
		applyFocusHandover(handover: string): void
		{
			const trigger = this.$refs.moreTrigger ?? null;
			if (handover === FOCUS_HANDOVER_MORE_TRIGGER)
			{
				trigger?.focus({ preventScroll: true });

				return;
			}

			const chips = [...(this.$refs.toolbar?.querySelectorAll(CHIP_SELECTOR) ?? [])];
			const lastVisible = chips[(this.visibleChipCount ?? chips.length) - 1] ?? null;

			(lastVisible ?? trigger)?.focus({ preventScroll: true });
		},
		/**
		 * True when the row drawn with `nextCount` chips leaves the trigger with nothing to offer. An
		 * open menu keeps it on the row whatever the count is.
		 */
		willHideMoreTrigger(nextCount: number): boolean
		{
			return !this.isMoreMenuOpen
				&& this.menuOnlyActions.length === 0
				&& nextCount >= this.buttonActions.length
			;
		},
		hasMenuContentChanged(actions: Array, previousActions: Array): boolean
		{
			return actions.length !== previousActions.length
				|| actions.some((action, index) => action.id !== previousActions[index].id)
			;
		},
		/**
		 * Takes the focus off the trigger the row is about to hide, and only from there: the focus of a
		 * user working elsewhere on the page is never taken away.
		 */
		rescueFocusFromHiddenTrigger(): void
		{
			const active = document.activeElement;
			if (active === null || active === document.body || active === this.$refs.moreTrigger)
			{
				this.applyFocusHandover(FOCUS_HANDOVER_LAST_CHIP);
			}
		},
		// null while the row has no layout to measure (a closed panel), so the last decision stands
		// instead of collapsing to zero chips.
		measureVisibleChipCount(): number | null
		{
			const toolbar = this.$refs.toolbar;
			if (!toolbar)
			{
				return null;
			}

			// The row is laid out in the content box, while clientWidth counts the side padding that
			// holds the focus ring inside the clipping box (style.css): the fit is computed against the
			// content box, otherwise the row is offered room the chips never get.
			const styles = getComputedStyle(toolbar);
			const sidePadding = (Number.parseFloat(styles.paddingLeft) || 0)
				+ (Number.parseFloat(styles.paddingRight) || 0)
			;
			const available = Math.floor(toolbar.clientWidth - sidePadding);
			if (available <= 0)
			{
				return null;
			}

			// Every chip is measured, the hidden ones too: they are laid out at their max-content width
			// (style.css), which is the width they take on the row.
			const widths = [...toolbar.querySelectorAll(CHIP_SELECTOR)]
				.map((chip) => Math.ceil(chip.getBoundingClientRect().width))
			;
			const gap = Math.ceil(Number.parseFloat(styles.columnGap)) || 0;
			const triggerWidth = Math.ceil(this.$refs.moreTrigger?.getBoundingClientRect().width ?? 0);

			const fitCount = (reserveTrigger: boolean): number => {
				const limit = available - (reserveTrigger ? triggerWidth + gap : 0);
				let used = 0;
				let count = 0;

				for (const width of widths)
				{
					const next = used + (count > 0 ? gap : 0) + width;
					if (next > limit)
					{
						break;
					}

					used = next;
					count += 1;
				}

				return count;
			};

			// The trigger takes its room only when it is on the row: with menu-only items it always is,
			// otherwise the second pass answers what the first one found - a chip left out brings the
			// trigger in, and the room it needs is taken off the same line.
			const count = fitCount(this.menuOnlyActions.length > 0);

			return count === widths.length ? count : fitCount(true);
		},
		isChipOverflown(index: number): boolean
		{
			return this.visibleChipCount !== null && index >= this.visibleChipCount;
		},
		/**
		 * Chips the row shows with a clipped label. A chip keeps its natural width on the row
		 * (flex: none), so this is about the box of the chip itself: the base-settings one is capped
		 * by a max-width and ellipsised (style.css). Nothing here is bound to that chip - a label
		 * short enough for its box is not clipped and asks for no hint.
		 */
		updateTruncatedChips(): void
		{
			const toolbar = this.$refs.toolbar;
			if (!toolbar)
			{
				return;
			}

			const chips = [...toolbar.querySelectorAll(CHIP_SELECTOR)];
			const truncated = this.buttonActions
				.filter((action, index) => this.isChipLabelClipped(chips[index]))
				.map((action) => action.id)
			;

			// Written only when it changed: the row is measured on every resize frame, and a new array
			// of the same ids would redraw it for nothing.
			if (!isSameIdList(truncated, this.truncatedChipIds))
			{
				this.truncatedChipIds = truncated;
			}
		},
		isChipLabelClipped(chip: HTMLElement | null): boolean
		{
			const label = chip?.querySelector(CHIP_LABEL_SELECTOR) ?? null;

			return label !== null && label.scrollWidth > label.clientWidth;
		},
		/**
		 * Hint of a chip with a clipped label - the only place its full phrase can be read. A chip
		 * that fits gets none, and one that left the row is read in the menu instead, where the item
		 * carries the whole phrase itself.
		 */
		chipHint(action: Object, index: number): Object | null
		{
			if (this.isChipOverflown(index) || !this.truncatedChipIds.includes(action.id))
			{
				return null;
			}

			return {
				text: action.text,
				popupOptions: { className: HINT_POPUP_CLASS },
			};
		},
		/**
		 * True while the chip of this construction type is waiting for an addition in flight. Only the
		 * action chip ever does: it is the one resolving a prefill, every other type is added
		 * synchronously and its chip stays live during the wait.
		 */
		isChipPending(actionId: string): boolean
		{
			return actionId === CONSTRUCTION_TYPES.ACTION && this.isResolvingActionPrefill;
		},
		/**
		 * True while the rule captured on the press is still the one the row adds to, on the same node.
		 * Only the add controls are disabled during the resolve round-trip: the port selector, the
		 * section pick, the card deletion and the node selection stay live, so the card the chip
		 * resolves after the wait may already belong to another rule than the prefill was computed
		 * for, or to another node altogether.
		 * The rule is compared by reference and the node by its id, because port ids are local to a
		 * node: 'i1' is the first input port of nearly every one of them, so an id alone does not tell
		 * the captured port from the same-numbered port of another node. A reload of the same node is
		 * caught by the reference, as it rebuilds the ports the selection points at.
		 */
		isInsertionContextAlive(context: Object | null): boolean
		{
			if (!context?.rule)
			{
				return false;
			}

			return this.targetRulePort === context.rule
				&& (this.nodeSettings?.blockId ?? null) === context.blockId;
		},
		/**
		 * The insertion is confirmed visually by the scroll only, so it is announced as well:
		 * focus stays on the chip and the new block gets no focus of its own.
		 */
		announceConstructionAdded(actionId: string, construction: Object): void
		{
			const labelKey = CONSTRUCTION_LABELS[actionId];
			if (!labelKey)
			{
				return;
			}

			// An action added to a node with base settings arrives with its type and its settings
			// already filled in: on the screen this is plain to see after the scroll, in the
			// announcement it has to be said. Read off the construction actually inserted and not
			// off canInheritBaseSettings: empty base settings, and a normalization degraded to the
			// internal values, seed the action binding alone and leave activityData null
			// (buildDefaultActionExpression), so there is nothing filled in to announce.
			const isPrefilled = actionId === CONSTRUCTION_TYPES.ACTION
				&& Boolean(construction?.expression?.activityData);
			const messageId = isPrefilled
				? 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONSTRUCTION_ADDED_PREFILLED_ANNOUNCE'
				: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONSTRUCTION_ADDED_ANNOUNCE'
			;

			LiveAnnouncer.announce(
				this.getMessage(messageId, {
					'#BLOCK#': this.getMessage(labelKey),
				}),
			);
		},
		/**
		 * Answers a press made while an addition is in flight: the add controls only look disabled
		 * (aria-disabled keeps them focusable), so without this the press ends in silence.
		 */
		announceAddPending(): void
		{
			LiveAnnouncer.announce(this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ADD_PENDING_ANNOUNCE'));
		},
		/**
		 * Handles 'more' menu item click.
		 * Group (type === 'group', no constructionType) calls addRuleCard() only.
		 * Other 'more' items dispatch to onAddConstruction as fallback.
		 */
		onMoreAction(action: Object): void
		{
			if (action.type === 'group')
			{
				this.onCreateGroup();

				return;
			}

			if (action.id)
			{
				this.onAddConstruction(action.id);
			}
		},
		/**
		 * Creates a new empty group (RuleCard) — always a new empty one.
		 */
		onCreateGroup(): void
		{
			// No card means the target rule has no entry left, same as in onAddConstruction:
			// the menu item then does nothing instead of throwing.
			const ruleCard = this.addRuleCard(this.targetRulePort);
			if (!ruleCard)
			{
				return;
			}

			LiveAnnouncer.announce(this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_GROUP_ADDED_ANNOUNCE'));
			this.scrollToRuleCard(ruleCard.id);
		},
		/**
		 * Scrolls to the freshly added construction row so the user lands exactly on the new
		 * block, falling back to the whole card when the row itself cannot be addressed.
		 */
		scrollToConstruction(construction: Object | null, ruleCard: Object | null): void
		{
			const constructionId = construction?.id ?? null;
			if (!constructionId)
			{
				this.scrollToRuleCard(ruleCard?.id);

				return;
			}

			this.scrollIntoLayout(
				`.editor-chart-node-settings-rule-construction[data-id="${CSS.escape(constructionId)}"]`,
			);
		},
		scrollToRuleCard(ruleCardId: string): void
		{
			if (!ruleCardId)
			{
				return;
			}

			this.scrollIntoLayout(
				`.editor-chart-node-settings-rule-card[data-id="${CSS.escape(ruleCardId)}"]`,
			);
		},
		scrollIntoLayout(selector: string): void
		{
			// 'start' + the layout's scroll-padding-top (measured to the pinned header height)
			// lands the new block right below the sticky header, consistently — 'nearest' was
			// unstable, aligning to top or bottom depending on block height vs. viewport.
			this.$nextTick(() => {
				const container = this.$el?.closest('.editor-chart-node-settings-rules-layout');
				container?.querySelector(selector)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
			});
		},
		// Never equal to the id of the chip it stands for: an overflown chip waits in the DOM with its
		// own id, and a shared one would address two elements at once.
		getMoreMenuItemDataset(action: Object): { testId: string } | null
		{
			const chipTestId = action.dataset?.testId ?? '';

			return chipTestId ? { testId: this.$testId(chipTestId, 'menuItem') } : null;
		},
		renderMoreMenuItemContent(action: Object): HTMLElement
		{
			const classes = ['editor-chart-node-settings-add-construction-menu-item'];
			if (action.className)
			{
				classes.push(`--${action.className}`);
			}
			const icon = new Icon({ icon: this.iconSet.PLUS_M, size: 18 }).render();

			return Tag.render`
				<span class="${classes.join(' ')}">${icon}<span>${Text.encode(action.text)}</span></span>
			`;
		},
		onShowMoreMenu({ currentTarget }: PointerEvent): void
		{
			// The wait the trigger shows (isMorePending) never closes the menu: it is indication of one
			// item, while the others (the group) are added synchronously, and the waiting one hits the
			// guard in onAddConstruction on its own.
			if (this.menu)
			{
				this.closeMoreMenu();

				return;
			}

			this.menu = MenuManager.create({
				id: 'add-construction-more-menu',
				bindElement: currentTarget,
				items: this.moreActions.map((action) => ({
					id: String(action.type),
					html: this.renderMoreMenuItemContent(action),
					dataset: this.getMoreMenuItemDataset(action),
					onclick: () => {
						this.closeMoreMenu();
						this.onMoreAction(action);
					},
				})),
				closeByEsc: true,
				autoHide: true,
				cacheable: false,
				// Explicit trap, not the default one: the default is only put on when the installation
				// has ui.a11y.useFocusTrapInDialogs turned on, and without it the keyboard never gets
				// into the menu - which is the only way left to the actions the row has no width for.
				focusTrap: { initialFocus: 'container' },
				events: {
					onClose: () => {
						this.isMoreMenuOpen = false;
						this.menu = null;
					},
				},
			});
			this.isMoreMenuOpen = true;
			this.menu.show();
		},
		closeMoreMenu(): void
		{
			this.menu?.close();
		},
	},
	template: `
		<div
			ref="toolbar"
			class="editor-chart-node-settings-add-construction-toolbar"
			:data-test-id="$testId('complexNodeRuleSettingsAddConstructionToolbar')"
			:aria-busy="isResolvingActionPrefill"
		>
			<button
				v-for="(action, index) in buttonActions"
				type="button"
				v-hint="chipHint(action, index)"
				class="editor-chart-node-settings-add-construction-toolbar__item"
				:class="[
					'--' + action.className,
					{
						'--pending': isChipPending(action.id),
						'--offscreen': isChipOverflown(index),
					},
				]"
				:key="action.id"
				:data-test-id="action.dataset && action.dataset.testId"
				:aria-disabled="isChipPending(action.id)"
				:aria-hidden="isChipOverflown(index) ? 'true' : null"
				@click="onAddConstruction(action.id)"
			>
				<BIcon
					:name="iconSet.PLUS_M"
					:size="16"
				/>
				<span>{{ action.text }}</span>
			</button>

			<button
				v-if="hasAnyAction"
				ref="moreTrigger"
				type="button"
				class="editor-chart-node-settings-add-construction-toolbar__more-trigger"
				:class="{
					'--offscreen': isMoreTriggerHidden,
					'--pending': isMorePending,
				}"
				:aria-label="moreTriggerLabel"
				aria-haspopup="true"
				:aria-expanded="isMoreMenuOpen"
				:aria-hidden="isMoreTriggerHidden ? 'true' : null"
				:data-test-id="$testId('complexNodeRuleSettingsToolbarMoreTrigger')"
				@click="onShowMoreMenu"
			>
				<BIcon
					:name="iconSet.MORE_M"
					:size="24"
				/>
			</button>
		</div>
	`,
};
