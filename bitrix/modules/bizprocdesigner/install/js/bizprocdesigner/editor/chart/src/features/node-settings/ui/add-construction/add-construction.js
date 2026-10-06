import { Tag, Text } from 'main.core';
import { MenuManager } from 'main.popup';
import { LiveAnnouncer } from 'ui.a11y';
import { Icon } from 'ui.icon-set.api.core';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
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

// @vue/component
export const AddConstruction = {
	name: 'AddConstruction',
	components: { BIcon },
	props:
	{
		/** @type TRuleCard */
		ruleCard:
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
	data(): { isMoreMenuOpen: boolean }
	{
		return {
			isMoreMenuOpen: false,
		};
	},
	created(): void
	{
		// menu instance must stay non-reactive (main.popup Menu)
		this.menu = null;
	},
	beforeUnmount(): void
	{
		this.closeMoreMenu();
	},
	computed:
	{
		...mapState(useNodeSettingsStore, [
			'nodeSettings',
			'currentRule',
			'hasBaseSettings',
			'isResolvingActionPrefill',
		]),
		/**
		 * All toolbar descriptors split into primary buttons (placement:'button')
		 * and 'more' menu items (placement:'more').
		 */
		allActions(): Array
		{
			const availableBlocks = this.nodeSettings?.availableBlocks ?? {};
			const currentRuleType = this.currentRule?.type ?? '';

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
		 * Primary toolbar buttons — placement:'button' (condition / action / filter / output),
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
			const isOwnRules = isNodeRuleType(this.currentRule?.type ?? '');
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
		 * Items for the three-dot 'more' menu — placement:'more' (e.g. group).
		 */
		moreActions(): Array
		{
			return this.allActions.filter((a) => a.placement === 'more');
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

			// The port and the node the chip was pressed on: the context the prefill below belongs
			// to, checked again once the wait is over (isInsertionContextAlive).
			const insertionContext = {
				rule: this.currentRule ?? null,
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

			// The port and the node shown when the chip was pressed are the ones the base settings were
			// resolved for, and both selectors stay live during the round trip: a switch made meanwhile
			// would land the action in a card of the new context carrying the prefill of the old one.
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
				? this.resolveHeadRuleCard()
				: this.resolveGroupRuleCard(actionId)
			;
			// No card means the current rule has no entry left (e.g. the port was removed while the
			// toolbar was open): the chip then does nothing instead of throwing.
			if (!targetCard)
			{
				return;
			}

			const construction = this.addConstruction(targetCard, actionId, actionPrefill);
			if (!construction)
			{
				// The head card is resolved (and created when missing) before the insertion, so a
				// rejected one must not stay behind: the layout renders a card without constructions
				// as a group, and this one would show up under the default group name.
				if (targetCard.constructions.length === 0)
				{
					this.deleteRuleCard(targetCard);
				}

				return;
			}

			this.announceConstructionAdded(actionId, construction);
			this.scrollToConstruction(construction, targetCard);
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
		 * True while the port captured on the press is still the one the panel shows, on the same node.
		 * Only the add controls are disabled during the resolve round-trip: the port selector, the
		 * card deletion and the node selection stay live, so the card the chip resolves after the
		 * wait may already belong to another port than the prefill was computed for, or to another
		 * node altogether.
		 * The port is compared by reference and the node by its id, because port ids are local to a
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

			return this.currentRule === context.rule
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
			// No card means the current rule has no entry left, same as in onAddConstruction:
			// the menu item then does nothing instead of throwing.
			const ruleCard = this.addRuleCard();
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
			// The trigger itself never waits: its items (the group) are added synchronously, and an item
			// that would dispatch an action hits the guard in onAddConstruction on its own.
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
					dataset: action.dataset?.testId ? { testId: action.dataset.testId } : null,
					onclick: () => {
						this.closeMoreMenu();
						this.onMoreAction(action);
					},
				})),
				closeByEsc: true,
				autoHide: true,
				cacheable: false,
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
			class="editor-chart-node-settings-add-construction-toolbar"
			:data-test-id="$testId('complexNodeRuleSettingsAddConstructionToolbar')"
			:aria-busy="isResolvingActionPrefill"
		>
			<button
				v-for="action in buttonActions"
				type="button"
				class="editor-chart-node-settings-add-construction-toolbar__item"
				:class="['--' + action.className, { '--pending': isChipPending(action.id) }]"
				:key="action.id"
				:data-test-id="action.dataset && action.dataset.testId"
				:aria-disabled="isChipPending(action.id)"
				@click="onAddConstruction(action.id)"
			>
				<BIcon
					:name="iconSet.PLUS_M"
					:size="16"
				/>
				<span>{{ action.text }}</span>
			</button>

			<button
				v-if="moreActions.length > 0"
				type="button"
				class="editor-chart-node-settings-add-construction-toolbar__more-trigger"
				:aria-label="getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_TOOLBAR_MORE_ARIA_LABEL')"
				aria-haspopup="true"
				:aria-expanded="isMoreMenuOpen"
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
