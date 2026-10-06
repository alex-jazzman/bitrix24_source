import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { HeadlineMd, TextLg } from 'ui.system.typography.vue';

import { useLoc } from '../../../../shared/composables';
import { PORT_TYPES } from '../../../../shared/constants';
import { CircuitBackdrop } from '../../../../shared/ui';
import { DragRuleEntity } from '../../directives/drag-rule-entity';
import { type TRuleCard, type OrderPayload } from '../../types';
import { splitRulesSurface, type HeadConstruction, type RulesSurface } from '../../utils/rules-surface';

import './style.css';

// Shared read-only fallback: a current rule with no entry left (the port was removed while the
// panel stayed open) leaves the layout with nothing to lay out instead of throwing.
const EMPTY_RULE_CARDS: Array<TRuleCard> = Object.freeze([]);

// @vue/component
export const NodeSettingsRulesLayout = {
	name: 'NodeSettingsRulesLayout',
	components: {
		BIcon,
		CircuitBackdrop,
		HeadlineMd,
		TextLg,
	},
	directives: { 'drag-construction': DragRuleEntity },
	props:
	{
		/** @type NodeSettings */
		nodeSettings:
		{
			type: Object,
			required: true,
		},
		/** @type Port | PortlessRule */
		currentRule:
		{
			type: [Object, null],
			required: true,
		},
		isSaving:
		{
			type: Boolean,
			required: true,
		},
	},
	emits: ['drop', 'scroll-layout'],
	setup(): { getMessage: () => string; iconSet: Outline }
	{
		const { getMessage } = useLoc();

		return {
			getMessage,
			iconSet: Outline,
		};
	},
	data(): { pinned: boolean }
	{
		return {
			pinned: false,
		};
	},
	computed:
	{
		ruleCards(): Array<TRuleCard>
		{
			// Relation rules are the only ones kept apart: an input port and the reserved container
			// of a node without input ports share the very same collection, exactly as the store
			// hands it out (currentSettingsItems).
			const rules = this.currentRule?.type === PORT_TYPES.inputRelation
				? this.nodeSettings.relations
				: this.nodeSettings.rules
			;

			return rules.get(this.currentRule?.id)?.ruleCards ?? EMPTY_RULE_CARDS;
		},
		rulesSurface(): RulesSurface
		{
			return splitRulesSurface(this.ruleCards);
		},
		/** Blocks living outside the groups: base-settings first, then the filters. */
		headConstructions(): Array<HeadConstruction>
		{
			return this.rulesSurface.headConstructions;
		},
		/** Cards rendered as groups. The head constructions are rendered above them. */
		groupCards(): Array<TRuleCard>
		{
			return this.rulesSurface.groupCards;
		},
		isEmpty(): boolean
		{
			return this.headConstructions.length === 0 && this.groupCards.length === 0;
		},
	},
	watch:
	{
		currentRule(): void
		{
			// the rules card is re-created when the current rule toggles
			this.$nextTick(() => this.observeRulesCard());
		},
	},
	created(): void
	{
		this.rulesCardResizeObserver = null;
		this.stickyThreshold = 0;
		this.pinnedRafId = null;
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
		onDrop(payload: OrderPayload): void
		{
			this.$emit('drop', payload);
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
			this.pinned = this.$el.scrollTop >= this.stickyThreshold - 1;
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
			this.stickyThreshold = stickyOffset + cardMarginTop;
			card.style.setProperty('--editor-chart-rules-card-sticky-offset', `${stickyOffset}px`);
			this.$el.style.setProperty('--editor-chart-rules-card-pinned-height', `${card.offsetHeight - stickyOffset}px`);
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
			<template v-if="currentRule">
				<!-- Rules card per mockup 1383:21594: header → description → port select → divider → chips toolbar -->
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
								<BIcon :name="iconSet.DATA_READING" :size="24"/>
								<span>{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RULE_SECTION_TITLE') }}</span>
							</div>
							<span class="editor-chart-node-settings-rules-layout__rules-card-description">
								{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RULE_SECTION_DESCRIPTION_MSGVER_1') }}
							</span>
						</div>
						<slot name="portSelector" />
					</div>
					<div
						ref="rulesCardDivider"
						class="editor-chart-node-settings-rules-layout__rules-card-divider"
					></div>
					<slot name="addConstructionToolbar" />
				</div>
				<div
					class="editor-chart-node-settings-rules-layout__content"
					data-testid="bizprocdesigner-rules-layout-content"
					v-drag-construction="onDrop"
				>
					<!-- Head blocks per mockup: base-settings, then filters, always above the groups -->
					<slot
						v-for="{ ruleCard, construction } in headConstructions"
						:key="construction.id"
						:ruleCard="ruleCard"
						:construction="construction"
						name="headConstruction"
					/>
					<slot
						v-for="ruleCard in groupCards"
						:key="ruleCard.id"
						:ruleCard="ruleCard"
						name="ruleCard"
					/>
				</div>
				<!-- Empty state per mockup 935:83190: centered head/text over the shared circuit backdrop -->
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
			</template>
		</div>
	`,
};
