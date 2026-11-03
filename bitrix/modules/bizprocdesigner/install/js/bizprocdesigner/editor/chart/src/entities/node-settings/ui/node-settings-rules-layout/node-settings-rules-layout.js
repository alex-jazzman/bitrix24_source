import { LiveAnnouncer } from 'ui.a11y';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { HeadlineMd, TextLg } from 'ui.system.typography.vue';

import { useLoc } from '../../../../shared/composables';
import { PORT_TYPES } from '../../../../shared/constants';
import { type Port } from '../../../../shared/types';
import { CircuitBackdrop } from '../../../../shared/ui';
// Direct path, not the barrel of the layer: the barrel re-exports this very component.
import { resolveRuleCollection } from '../../stores/node-settings-store';
import { type TRuleCard, type OrderPayload } from '../../types';
import { splitRulesSurface } from '../../utils/rules-surface';
import { NodeSettingsRuleSection, isRuleSectionEmpty, type RuleSection } from './node-settings-rule-section';

import './style.css';

// Shared read-only fallback: a rule with no entry left (the port was removed while the panel
// stayed open) leaves the layout with nothing to lay out instead of throwing.
const EMPTY_RULE_CARDS: Array<TRuleCard> = Object.freeze([]);
// Covers the vertical flow change of the pinned card while its size animation is running.
const PINNED_RELEASE_SCROLL_OFFSET = 32;


// @vue/component
export const NodeSettingsRulesLayout = {
	name: 'NodeSettingsRulesLayout',
	components: {
		BIcon,
		CircuitBackdrop,
		HeadlineMd,
		NodeSettingsRuleSection,
		TextLg,
	},
	props:
	{
		/** @type NodeSettings */
		nodeSettings:
		{
			type: Object,
			required: true,
		},
		/** @type Port | PortlessRule - null while every rule of the node is shown at once */
		currentRule:
		{
			type: [Object, null],
			required: true,
		},
		/** @type Array<Port> - ports of the node, the source of the sections shown at once */
		ports:
		{
			type: Array,
			required: true,
		},
		/** @type Port | PortlessRule - rule the add panel works on (store: toolbarRulePort) */
		toolbarRulePort:
		{
			type: [Object, null],
			required: true,
		},
		isSaving:
		{
			type: Boolean,
			required: true,
		},
		/** @type Array<PortId> - expanded rules: every input of the node until the user collapses one */
		expandedRulePortIds:
		{
			type: Array,
			required: true,
		},
		/** @type Array<string> - group cards the user has collapsed; the rest are open */
		collapsedRuleCardIds:
		{
			type: Array,
			required: true,
		},
		/**
		 * @type Array<PortId> - rules the panel has led the user into by address (store:
		 * revealedRulePortIds). Their forms are mounted whether the user has ever been there or not:
		 * a rule never reached keeps no row of its blocks to lead to (see isSectionLive).
		 */
		revealedRulePortIds:
		{
			type: Array,
			default: () => [],
		},
		/**
		 * Whether the inputs of the node are a list the user works with. Only the universal node has
		 * one; everywhere else the set of ports is fixed by the node itself, and the tab lays the
		 * rules out straight away (see hasInputLevel).
		 */
		managesInputs:
		{
			type: Boolean,
			required: true,
		},
		/** True while the tab lays out the relations of the node instead of the rules of its inputs */
		isRelationsSurface:
		{
			type: Boolean,
			required: true,
		},
	},
	emits: ['drop', 'scroll-layout', 'select-rule-port', 'toggle-rule', 'toggle-rule-card'],
	setup(): { getMessage: () => string; iconSet: Outline }
	{
		const { getMessage } = useLoc();

		return {
			getMessage,
			iconSet: Outline,
		};
	},
	data(): { pinned: boolean, liveRulePortIds: Array<string>, mountedExtraRulePorts: Array<Port> }
	{
		return {
			pinned: false,
			// Rules whose editors are mounted in the overview. The target rule of the add panel is live on
			// its own; a rule the user has reached - opened by hand, or pointed at with the pointer or
			// the keyboard - or that the panel has shown alone stays live while the node is open (see
			// isSectionLive).
			liveRulePortIds: [],
			// Rules the panel has shown alone that the overview does not list (a relation rule, the
			// reserved container of a portless node): their sections stay rendered while the node is open,
			// hidden instead of unmounted (see renderedRuleSections).
			mountedExtraRulePorts: [],
		};
	},
	computed:
	{
		/** Icon of the card: the tab names the surface it shows, and the relations carry their own. */
		cardIcon(): string
		{
			return this.isRelationsSurface ? this.iconSet.LINK : this.iconSet.DATA_READING;
		},
		cardTitle(): string
		{
			return this.isRelationsSurface
				? this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RELATIONS_SECTION_TITLE')
				: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RULE_SECTION_TITLE')
			;
		},
		cardDescription(): string
		{
			return this.isRelationsSurface
				? this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RELATIONS_SECTION_DESCRIPTION')
				: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RULE_SECTION_DESCRIPTION_MSGVER_1')
			;
		},
		/** True while the tab shows the rules of the whole node instead of a single one. */
		isAllRulesMode(): boolean
		{
			return this.currentRule === null;
		},
		/**
		 * True while the tab lays the rules out as a list of inputs: a row per input, its own
		 * collapsing and the gutter beside it. Only a node whose inputs the user manages has that
		 * level - for every other one an input is not a unit of anything, so its rules are laid out
		 * straight away, exactly as the reserved container of a node without input ports is.
		 */
		hasInputLevel(): boolean
		{
			return this.isAllRulesMode && (this.isRelationsSurface || this.managesInputs);
		},
		/**
		 * Sections of the rules overview: every rule of an input in port order. A relation never joins
		 * that list - the relations of a node are a surface of their own (relationsSections) and are
		 * never mixed with the rules of its inputs.
		 */
		rulesSections(): Array<RuleSection>
		{
			if (!this.nodeSettings)
			{
				return [];
			}

			// Every input port of the node, whether a connection leads into it or not and whether it
			// holds anything or not: the same set the short form of the basic tab lists
			// (getRulesSectionRows), so the two never disagree about the inputs a node has.
			return (this.ports ?? [])
				.filter((port) => port.type === PORT_TYPES.input && this.nodeSettings.rules.has(port.id))
				.map((port) => this.buildRuleSection(port, this.nodeSettings.rules.get(port.id).ruleCards))
			;
		},
		/**
		 * Sections of the relations overview: every relation of the node in port order, a single one
		 * included - it is a row of a list of one and not the whole content of the tab, exactly as a
		 * single input is.
		 */
		relationsSections(): Array<RuleSection>
		{
			if (!this.nodeSettings)
			{
				return [];
			}

			return (this.ports ?? [])
				.filter((port) => port.type === PORT_TYPES.inputRelation
					&& this.nodeSettings.relations.has(port.id))
				.map((port) => this.buildRuleSection(
					port,
					this.nodeSettings.relations.get(port.id).ruleCards,
				))
			;
		},
		/** Sections of the surface the tab shows: the rules of the inputs, or the relations. */
		overviewSections(): Array<RuleSection>
		{
			return this.isRelationsSurface ? this.relationsSections : this.rulesSections;
		},
		/**
		 * Ids of the sections carrying the second colour of the vertical rule. Counted inside the list
		 * a section belongs to, so the alternation of the relations starts over instead of continuing
		 * the count of the inputs.
		 */
		alternateSectionIds(): Set<string>
		{
			const ids = new Set();
			[this.rulesSections, this.relationsSections].forEach((sections: Array<RuleSection>) => {
				sections.forEach((section: RuleSection, index: number) => {
					if (index % 2 === 1)
					{
						ids.add(section.port.id);
					}
				});
			});

			return ids;
		},
		/**
		 * Rules laid out on the tab: the current one alone, or every rule of the node in port order
		 * while they are shown at once.
		 */
		ruleSections(): Array<RuleSection>
		{
			if (!this.nodeSettings)
			{
				return [];
			}

			if (this.currentRule)
			{
				// Through the one reading of the collection there is (resolveRuleCollection): relation
				// rules are the only ones kept apart, while an input port and the reserved container of
				// a node without input ports share the very same collection.
				const rules = resolveRuleCollection(this.nodeSettings, this.currentRule);

				return [this.buildRuleSection(this.currentRule, rules?.get(this.currentRule.id)?.ruleCards)];
			}

			return this.overviewSections;
		},
		/**
		 * Sections the tab lays out: every rule of the node, empty ones included. A single still empty
		 * rule is a row of its own here and not a reason to hide the list - the short form of the basic
		 * tab lists that very input, and the two forms must never disagree about them.
		 */
		visibleRuleSections(): Array<RuleSection>
		{
			return this.ruleSections;
		},
		/**
		 * True while the tab has nothing to lay out: no section to show at all, or nothing in any of
		 * the sections it shows. Counted over the whole list and never over its first entry: without
		 * the input level the tab lays out every rule of the node at once just the same, so one empty
		 * rule among filled ones is no reason for the placeholder. On the input level an empty rule is
		 * not one of these cases either - it keeps its row and stays compact.
		 */
		isEmpty(): boolean
		{
			if (this.visibleRuleSections.length === 0)
			{
				return true;
			}

			return !this.hasInputLevel
				&& this.visibleRuleSections.every((section: RuleSection) => this.isSectionEmpty(section))
			;
		},
		/**
		 * Sections kept in the DOM: the ones the overview would show, plus every rule the panel has
		 * shown alone. A section leaving the DOM unmounts the forms of its blocks together with the
		 * values being typed into them - they live in the controls of the form and in rawActivityData,
		 * never in the activityData a rebuilt form reads - so switching between the overview and a
		 * single rule hides sections (isSectionShown) instead of dropping them. A rule shown alone that
		 * the overview does not list (a relation rule, the reserved container of a portless node) is
		 * kept as long as it has anything mounted; one gone from the node, or empty, has no form to
		 * keep and leaves.
		 */
		renderedRuleSections(): Array<RuleSection>
		{
			if (!this.nodeSettings)
			{
				return [];
			}

			// Both surfaces at once: the one the tab shows and the one it does not. A section leaving the
			// DOM would unmount the forms of its blocks, so switching between the rules of the inputs
			// and the relations hides sections (isSectionShown) instead of dropping them.
			const sections = [...this.rulesSections, ...this.relationsSections];
			const renderedIds = new Set(sections.map((section) => section.port.id));

			const extraPorts = [...this.mountedExtraRulePorts];
			if (this.currentRule && !extraPorts.some((port) => port.id === this.currentRule.id))
			{
				// The watcher remembers the current rule on its own; this covers the very first render.
				extraPorts.push(this.currentRule);
			}
			for (const port of extraPorts)
			{
				if (renderedIds.has(port.id))
				{
					continue;
				}

				const isCurrent = port.id === this.currentRule?.id;
				const entry = resolveRuleCollection(this.nodeSettings, port)?.get(port.id);
				if (!isCurrent && !entry)
				{
					continue;
				}

				const section = this.buildRuleSection(port, entry?.ruleCards);
				if (!isCurrent && this.isSectionEmpty(section))
				{
					continue;
				}

				renderedIds.add(port.id);
				sections.push(section);
			}

			return sections;
		},
		/**
		 * Ids of the sections the current mode shows; the other rendered ones stay hidden. While the
		 * placeholder stands for the whole tab (isEmpty) it stands there alone: the sections behind it
		 * hold nothing to show and would only push it down by the gap of the flow.
		 */
		shownSectionIds(): Set<string>
		{
			if (this.isEmpty)
			{
				return new Set();
			}

			return new Set(this.visibleRuleSections.map((section) => section.port.id));
		},
		/**
		 * The state of the sections as sets, and never read out of the lists themselves: the template
		 * asks about every section on every render, so a lookup through the list would be a walk of
		 * the whole list per section - the work of the render would grow with the square of the number
		 * of inputs.
		 */
		expandedIds(): Set<string>
		{
			return new Set(this.expandedRulePortIds);
		},
		collapsedIds(): Set<string>
		{
			return new Set(this.collapsedRuleCardIds);
		},
		liveSectionIds(): Set<string>
		{
			return new Set(this.liveRulePortIds);
		},
		revealedSectionIds(): Set<string>
		{
			return new Set(this.revealedRulePortIds);
		},
	},
	watch:
	{
		currentRule:
		{
			immediate: true,
			handler(rule: ?Port): void
			{
				// A rule shown alone mounts its editors, so it is live from here on, and its section is
				// kept rendered across mode switches - the values typed into its forms survive a return
				// to the overview.
				if (rule)
				{
					this.rememberExtraRulePort(rule);
					this.rememberLiveRule(rule.id);
				}

				// the rules card is re-created when the current rule toggles
				this.resetStickyState();
				this.$nextTick(() => this.observeRulesCard());
			},
		},
		toolbarRulePort:
		{
			immediate: true,
			handler(port: ?Port): void
			{
				// Naming a rule as the target of the add panel mounts nothing by itself: what mounts the
				// forms of a rule is its expansion (see expandedRulePortIds).

				// The target the user asked for is the one the store accepted: announced from here, and
				// only here, so a refused choice is never announced (see onSelectRulePort). The target
				// moving on its own - a deleted rule hands it over - carries no pending choice and stays
				// silent, and so does the first, immediate call of this watcher. Either way the choice is
				// answered by this move and is not left waiting for a later one.
				const askedFor = this.pendingTargetPortId;
				this.pendingTargetPortId = null;
				if (port && port.id === askedFor)
				{
					this.announceTargetRule(port);
				}
			},
		},
		'nodeSettings.blockId'(): void
		{
			// Another node: its rules share nothing with the ones mounted for the previous one, and a
			// choice made in the previous one is not waiting to be announced any more.
			this.liveRulePortIds = [];
			this.mountedExtraRulePorts = [];
			this.pendingTargetPortId = null;
			this.resetStickyState();
		},
	},
	created(): void
	{
		this.rulesCardResizeObserver = null;
		this.stickyThreshold = 0;
		this.pinnedReleaseThreshold = 0;
		this.pinnedRafId = null;
		// Rule the user has just named as the target of the add panel, waiting for the store to accept
		// it (see onSelectRulePort). Deliberately not reactive: nothing on screen is drawn from it.
		this.pendingTargetPortId = null;
	},
	mounted(): void
	{
		this.observeRulesCard();
	},
	beforeUnmount(): void
	{
		this.rulesCardResizeObserver?.disconnect();
		this.rulesCardResizeObserver = null;
		if (this.pinnedRafId !== null)
		{
			cancelAnimationFrame(this.pinnedRafId);
			this.pinnedRafId = null;
		}
	},
	methods:
	{
		buildRuleSection(port: Port, ruleCards: ?Array<TRuleCard>): RuleSection
		{
			const { headConstructions, groupCards } = splitRulesSurface(ruleCards ?? EMPTY_RULE_CARDS);

			return { port, headConstructions, groupCards };
		},
		isSectionEmpty(section: RuleSection): boolean
		{
			return isRuleSectionEmpty(section);
		},
		/** True for the section the add panel works on. A single rule shown is not marked out. */
		isTargetSection(section: RuleSection): boolean
		{
			return this.hasInputLevel && this.toolbarRulePort?.id === section.port.id;
		},
		/**
		 * True for the rule the add panel works on, marked out on screen or not: what is added lands
		 * there, so the forms of that rule are the ones mounted from the start.
		 */
		isToolbarSection(section: RuleSection): boolean
		{
			return this.toolbarRulePort?.id === section.port.id;
		},
		/**
		 * True while the editors of the blocks of a section are mounted. The rule shown alone mounts
		 * them as the single view always did. Otherwise they are mounted for the rule the add panel
		 * works on and for every rule the user has already reached - by opening it, by pointing at it
		 * with the pointer or the keyboard (onSectionReached), or because the panel has led them there
		 * by address (revealedRulePortIds). Being expanded is not one of those: each block form
		 * of a rule costs a request of its own, and a node opens with every input expanded, so
		 * mounting the forms of an expanded rule would make opening the tab linear in the number of
		 * inputs - a number the user, not the code, decides. The section, its cards and its blocks -
		 * their names, hints, selectors and delete controls - are laid out either way: only the block
		 * forms wait for the rule to be reached. A section hidden by the mode (isSectionShown) keeps
		 * the liveness it earned: dropping it would unmount the forms whose values the section is
		 * being kept for.
		 */
		isSectionLive(section: RuleSection): boolean
		{
			// A section that has been live once stays live: its forms hold what was typed into them.
			if (this.liveSectionIds.has(section.port.id) || this.revealedSectionIds.has(section.port.id))
			{
				return true;
			}

			// A section the other surface of the tab keeps hidden is not paid for: it is rendered only
			// so that its forms survive a switch, and it has none until it has been shown.
			if (!this.isSectionShown(section))
			{
				return false;
			}

			return this.currentRule?.id === section.port.id || this.isToolbarSection(section);
		},
		/** True while the user keeps this input open. */
		isSectionExpanded(section: RuleSection): boolean
		{
			return this.expandedIds.has(section.port.id);
		},
		/** True for the sections of the current mode: the rule shown alone, or the list of the overview. */
		isSectionShown(section: RuleSection): boolean
		{
			return this.shownSectionIds.has(section.port.id);
		},
		/**
		 * Second colour of the vertical rule as one value and not as an object built per render: an
		 * object is a new one every time, and Vue would then rebuild every section of the node on any
		 * render of the layout instead of the ones whose own state has changed.
		 */
		sectionClass(section: RuleSection): string | null
		{
			return this.alternateSectionIds.has(section.port.id) ? '--alternate' : null;
		},
		/**
		 * A section the user has reached is the one they read or edit, so the forms of its blocks are
		 * mounted from here on: opened by hand, or reached with the pointer or the keyboard. The target
		 * rule of the add panel is left alone: naming it is what its header does, and a click inside
		 * another section must not move the add panel.
		 */
		onSectionReached(section: RuleSection): void
		{
			this.rememberLiveRule(section.port.id);
		},
		/**
		 * Opening an input asks to see what is in it, so it is reached by that very press. Collapsing
		 * one asks for the opposite and mounts nothing: a section never reached stays as it was.
		 */
		onToggleRuleSection(section: RuleSection): void
		{
			if (!this.isSectionExpanded(section))
			{
				this.onSectionReached(section);
			}

			this.$emit('toggle-rule', section.port.id);
		},
		rememberLiveRule(portId: string): void
		{
			if (!this.liveRulePortIds.includes(portId))
			{
				this.liveRulePortIds.push(portId);
			}
		},
		rememberExtraRulePort(port: Port): void
		{
			if (!this.mountedExtraRulePorts.some((known) => known.id === port.id))
			{
				this.mountedExtraRulePorts.push(port);
			}
		},
		/**
		 * A click on the header names the rule the add panel works on. It changes nothing else: the
		 * tab keeps showing every rule of the node.
		 */
		onSelectRulePort(port: Port): void
		{
			// The store has the last word: setSelectedRulePort silently refuses a port that is not an input
			// one. So the rule is only remembered as the one asked for here, and the announcement is made
			// from the toolbarRulePort watcher once the store has really moved the target onto it.
			this.pendingTargetPortId = port.id;
			this.$emit('select-rule-port', port);
		},
		/**
		 * The new target is shown by the colour of the section title and the pressed state of its
		 * header, so a user who does not see the sections gets nothing on activation: it is announced.
		 */
		announceTargetRule(port: Port): void
		{
			LiveAnnouncer.announce(
				this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RULE_TARGET_ANNOUNCE', {
					'#RULE#': port.title,
				}),
			);
		},
		onDrop(payload: OrderPayload, rulePort: Port): void
		{
			this.$emit('drop', payload, rulePort);
		},
		onScrollLayout(): void
		{
			// coalesce scrollTop reads into one per frame to avoid layout thrash on fast scroll
			if (this.pinnedRafId === null)
			{
				this.pinnedRafId = requestAnimationFrame(() => {
					this.pinnedRafId = null;
					this.updatePinned();
				});
			}
			this.$emit('scroll-layout');
		},
		updatePinned(): void
		{
			const scrollTop = this.$el.scrollTop;

			this.pinned = this.pinned
				? scrollTop >= this.pinnedReleaseThreshold
				: scrollTop >= this.stickyThreshold - 1
			;
		},
		resetStickyState(): void
		{
			this.pinned = false;
			this.stickyThreshold = 0;
			this.pinnedReleaseThreshold = 0;
		},
		observeRulesCard(): void
		{
			this.rulesCardResizeObserver?.disconnect();
			if (!this.$refs.rulesCard)
			{
				return;
			}

			this.rulesCardResizeObserver ??= new ResizeObserver(() => {
				this.updateStickyMetrics();
			});
			this.rulesCardResizeObserver.observe(this.$refs.rulesCard);
			this.updateStickyMetrics();
		},
		updateStickyMetrics(): void
		{
			const card = this.$refs.rulesCard;
			const divider = this.$refs.rulesCardDivider;
			if (!card || !divider)
			{
				return;
			}

			// distance from the card top to its pinned bottom part (divider + chips toolbar)
			const stickyOffset = Math.round(divider.getBoundingClientRect().top - card.getBoundingClientRect().top);
			const cardMarginTop = Number.parseFloat(getComputedStyle(card).marginTop);
			if (!this.pinned)
			{
				this.stickyThreshold = stickyOffset + cardMarginTop;
				this.pinnedReleaseThreshold = Math.max(0, this.stickyThreshold - PINNED_RELEASE_SCROLL_OFFSET);
				card.style.setProperty('--editor-chart-rules-card-sticky-offset', `${stickyOffset}px`);
				this.$el.style.setProperty('--editor-chart-rules-card-pinned-height', `${card.offsetHeight - stickyOffset}px`);
			}
			this.updatePinned();
		},
	},
	template: `
		<div
			class="editor-chart-node-settings-rules-layout"
			:class="{ '--saving': isSaving }"
			:data-test-id="$testId('complexNodeRuleSettingsLayout')"
			@scroll="onScrollLayout"
		>
			<template v-if="nodeSettings">
				<!-- Rules card per mockup 1383:21594, top down: header, description, port select, divider, chips -->
				<div
					ref="rulesCard"
					class="editor-chart-node-settings-rules-layout__rules-card"
					:class="{ '--pinned': pinned }"
					data-testid="bizprocdesigner-rules-layout-card"
				>
					<div class="editor-chart-node-settings-rules-layout__rules-card-metrics">
						<div class="editor-chart-node-settings-rules-layout__rules-card-header">
							<div
								class="editor-chart-node-settings-rules-layout__rules-card-title"
								data-testid="bizprocdesigner-rules-layout-card-title"
							>
								<BIcon :name="cardIcon" :size="24"/>
								<span>{{ cardTitle }}</span>
							</div>
							<span class="editor-chart-node-settings-rules-layout__rules-card-description">
								{{ cardDescription }}
							</span>
						</div>
						<slot name="portSelector" />
					</div>
					<div
						ref="rulesCardDivider"
						class="editor-chart-node-settings-rules-layout__rules-card-divider"
					></div>
					<!-- The panel adds to one rule: without a target rule there is nothing to add to -->
					<slot
						v-if="toolbarRulePort"
						name="addConstructionToolbar"
						:rulePort="toolbarRulePort"
					/>
				</div>
				<div
					class="editor-chart-node-settings-rules-layout__content"
					:class="{
						'--all-rules': hasInputLevel,
						'--empty': isEmpty,
					}"
					data-testid="bizprocdesigner-rules-layout-content"
				>
					<!-- Sections of the other mode stay rendered and merely hidden (renderedRuleSections):
					unmounting them would drop the forms of their blocks with the values being typed -->
					<!-- The second colour of the vertical rule marks every other section of its own list
					(alternateSectionIds), so that one input is told from the next -->
					<NodeSettingsRuleSection
						v-for="section in renderedRuleSections"
						v-show="isSectionShown(section)"
						:key="section.port.id"
						:class="sectionClass(section)"
						:section="section"
						:isOverview="hasInputLevel"
						:isTarget="isTargetSection(section)"
						:isLive="isSectionLive(section)"
						:isExpanded="isSectionExpanded(section)"
						:collapsedRuleCardIds="collapsedIds"
						@select-rule-port="onSelectRulePort(section.port)"
						@toggle="onToggleRuleSection(section)"
						@toggle-rule-card="(ruleCardId) => $emit('toggle-rule-card', ruleCardId)"
						@drop="(payload) => onDrop(payload, section.port)"
						@reached="onSectionReached(section)"
					>
						<template #headConstruction="slotProps">
							<slot name="headConstruction" v-bind="slotProps" />
						</template>
						<template #ruleCard="slotProps">
							<slot name="ruleCard" v-bind="slotProps" />
						</template>
					</NodeSettingsRuleSection>
					<!-- Empty state per mockup 935:83190: centered head/text over the shared circuit backdrop.
					It stands for the whole flow of the tab, so it lives in that flow: a node whose single rule
					is still empty shows it instead of a section of its own -->
					<div
						v-if="isEmpty"
						class="editor-chart-node-settings-rules-layout__empty"
						:data-test-id="$testId('complexNodeRuleSettingsEmptyState')"
					>
						<CircuitBackdrop />
						<div class="editor-chart-node-settings-rules-layout__empty-content">
							<HeadlineMd
								align="center"
								:className="'editor-chart-node-settings-rules-layout__empty-head'"
							>
								{{ getMessage('BIZPROCDESIGNER_EDITOR_COMPLEX_NODE_SETTINGS_EMPTY_STATE_HEAD') }}
							</HeadlineMd>
							<TextLg
								align="center"
								:className="'editor-chart-node-settings-rules-layout__empty-text'"
							>
								{{ getMessage('BIZPROCDESIGNER_EDITOR_COMPLEX_NODE_SETTINGS_EMPTY_STATE_TEXT') }}
							</TextLg>
						</div>
					</div>
				</div>
			</template>
		</div>
	`,
};
