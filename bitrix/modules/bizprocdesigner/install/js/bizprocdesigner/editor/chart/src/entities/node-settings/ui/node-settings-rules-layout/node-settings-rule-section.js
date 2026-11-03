import { Loc } from 'main.core';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { TextSm } from 'ui.system.typography.vue';

import { useLoc } from '../../../../shared/composables';
import { type Port } from '../../../../shared/types';
import { CONSTRUCTION_TYPES } from '../../constants';
import { DragRuleEntity } from '../../directives/drag-rule-entity';
import { type TRuleCard, type OrderPayload, type Construction } from '../../types';
import { type HeadConstruction } from '../../utils/rules-surface';

// One rule as the tab lays it out: its own port and the blocks of that rule, already split into
// the head area and the group cards.
export type RuleSection = {
	port: Port,
	headConstructions: Array<HeadConstruction>,
	groupCards: Array<TRuleCard>,
};

/** True for a rule with nothing in it: no head block and no group card. */
export const isRuleSectionEmpty = (section: RuleSection): boolean => {
	return section.headConstructions.length === 0 && section.groupCards.length === 0;
};

/**
 * One rule of the node on the rules tab: the row naming it, and - while it is expanded - the head
 * blocks and the group cards. A component of its own, and not markup inside the layout, so that
 * naming another rule as the target of the add panel rebuilds the two sections whose state really
 * changed instead of the block subtrees of every rule of the node.
 */
// @vue/component
export const NodeSettingsRuleSection = {
	name: 'NodeSettingsRuleSection',
	components: { BIcon, TextSm },
	directives: { 'drag-construction': DragRuleEntity },
	props:
	{
		/** @type RuleSection */
		section:
		{
			type: Object,
			required: true,
		},
		/** True while the tab shows every rule of the node: only then a section has a row of its own */
		isOverview:
		{
			type: Boolean,
			required: true,
		},
		/** True for the rule the add panel works on */
		isTarget:
		{
			type: Boolean,
			default: false,
		},
		/** True while the forms of the blocks of this rule are mounted (see isSectionLive) */
		isLive:
		{
			type: Boolean,
			default: true,
		},
		/** True while the user keeps this input open. A single rule shown alone is always open. */
		isExpanded:
		{
			type: Boolean,
			default: false,
		},
		/** @type Set<string> - group cards the user has collapsed; the rest are open */
		collapsedRuleCardIds:
		{
			type: Set,
			default: () => new Set(),
		},
	},
	emits: ['select-rule-port', 'toggle', 'toggle-rule-card', 'drop', 'reached'],
	setup(): { getMessage: () => string, iconSet: Outline }
	{
		const { getMessage } = useLoc();

		return { getMessage, iconSet: Outline };
	},
	computed:
	{
		isEmpty(): boolean
		{
			return isRuleSectionEmpty(this.section);
		},
		/** The single rule shown alone has no row to expand: its content is the whole tab. */
		isContentShown(): boolean
		{
			return !this.isOverview || this.isExpanded;
		},
		/**
		 * What the collapsed row says about the input: how many groups it holds. A head block is not
		 * counted - the row answers "how many groups", and an object or a filter is no answer to that.
		 */
		summary(): string
		{
			const count = this.section.groupCards.length;
			if (count === 0)
			{
				return this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RULE_ROW_NO_RULES');
			}

			return Loc.getMessagePlural('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RULE_ROW_GROUPS', count, {
				'#COUNT#': count,
			});
		},
		/**
		 * Name of the collapse control, which holds nothing but a chevron. The rule goes into the name
		 * because the tab shows one such control per input, and the button beside it is named by that
		 * very rule while doing something else entirely - naming it as the target of the add panel.
		 */
		toggleLabel(): string
		{
			const messageId = this.isExpanded
				? 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RULE_SECTION_COLLAPSE'
				: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RULE_SECTION_EXPAND'
			;

			return this.getMessage(messageId, { '#RULE#': this.section.port.title });
		},
	},
	methods:
	{
		onDrop(payload: OrderPayload): void
		{
			this.$emit('drop', payload);
		},
		/**
		 * A section reached by the pointer or by the keyboard is one the user works in, so the forms of
		 * its blocks are mounted from here on (see isSectionLive): each of them costs a request, and
		 * the ones worth paying for are the ones being worked in. The row naming the input is left out
		 * of this: it lives above the body and answers with its own events.
		 */
		onInteraction(): void
		{
			this.$emit('reached');
		},
		/** A group is open inside an expanded input unless the user has closed it. */
		isRuleCardExpanded(ruleCard: TRuleCard): boolean
		{
			return !this.collapsedRuleCardIds.has(ruleCard.id);
		},
		ruleCardTitle(ruleCard: TRuleCard): string
		{
			return ruleCard.groupTitle
				|| this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RULE_CARD_TITLE');
		},
		/**
		 * Output of a group as its collapsed row names it: the first one, plus the count of the rest.
		 * Empty while the group leads nowhere yet.
		 */
		ruleCardOutput(ruleCard: TRuleCard): string
		{
			const outputs = (ruleCard.constructions ?? []).filter(
				(construction: Construction) => construction.type === CONSTRUCTION_TYPES.OUTPUT,
			);
			const title = outputs[0]?.expression?.title;
			if (!title)
			{
				return '';
			}

			if (outputs.length === 1)
			{
				return title;
			}

			return Loc.getMessagePlural(
				'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RULE_CARD_ROW_OUTPUT_MORE',
				outputs.length - 1,
				{ '#OUTPUT#': title, '#COUNT#': outputs.length - 1 },
			);
		},
	},
	template: `
		<div
			class="editor-chart-node-settings-rules-layout__rule-section"
			:class="{ '--active': isTarget, '--expanded': isExpanded }"
			:data-rule-port-id="section.port.id"
			:data-test-id="$testId('complexNodeRuleSettingsSection', section.port.id)"
		>
			<!-- Row naming the rule: expands it, and names it as the rule the add panel works on -->
			<div
				v-if="isOverview"
				class="editor-chart-node-settings-rules-layout__rule-section-row"
			>
				<button
					type="button"
					class="editor-chart-node-settings-rules-layout__rule-section-toggle"
					:aria-expanded="isExpanded"
					:aria-label="toggleLabel"
					:data-test-id="$testId('complexNodeRuleSettingsSectionToggle', section.port.id)"
					@click="$emit('toggle')"
				>
					<BIcon :name="isExpanded ? iconSet.CHEVRON_DOWN_M : iconSet.CHEVRON_RIGHT_M" :size="18"/>
				</button>
				<button
					type="button"
					class="editor-chart-node-settings-rules-layout__rule-section-header"
					:aria-pressed="isTarget"
					:data-test-id="$testId('complexNodeRuleSettingsSectionHeader', section.port.id)"
					@click="$emit('select-rule-port')"
				>
					<span class="editor-chart-node-settings-rules-layout__rule-section-title">
						{{ section.port.title }}
					</span>
					<TextSm :className="'editor-chart-node-settings-rules-layout__rule-section-summary'">
						{{ summary }}
					</TextSm>
				</button>
			</div>
			<!-- Collapsing hides the body instead of dropping it: the values typed into the forms of
			its blocks live in the controls, not in the data a rebuilt form reads -->
			<!-- Reaching the body mounts the forms of the blocks: the pointer and the keyboard are
			answered alike, so a section is never reachable without being live -->
			<div
				v-show="isContentShown"
				class="editor-chart-node-settings-rules-layout__rule-section-body"
				:class="{ '--empty': isEmpty }"
				:data-test-id="$testId('complexNodeRuleSettingsSectionBody', section.port.id)"
				v-drag-construction="onDrop"
				@click="onInteraction"
				@focusin="onInteraction"
			>
				<!-- Head blocks per mockup: base-settings, then filters, always above the groups.
				They have no collapsing of their own - an expanded input always shows them in full -->
				<slot
					v-for="{ ruleCard, construction } in section.headConstructions"
					:key="construction.id"
					:ruleCard="ruleCard"
					:construction="construction"
					:rulePort="section.port"
					:isLive="isLive"
					name="headConstruction"
				/>
				<template v-for="ruleCard in section.groupCards" :key="ruleCard.id">
					<div
						v-if="!isRuleCardExpanded(ruleCard)"
						class="editor-chart-node-settings-rules-layout__rule-card-row"
						:data-test-id="$testId('complexNodeRuleCardRow', ruleCard.id)"
					>
						<button
							type="button"
							class="editor-chart-node-settings-rules-layout__rule-card-toggle"
							:aria-expanded="false"
							:aria-label="getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RULE_CARD_EXPAND')"
							:data-test-id="$testId('complexNodeRuleCardRowToggle', ruleCard.id)"
							@click="$emit('toggle-rule-card', ruleCard.id)"
						>
							<BIcon :name="iconSet.CHEVRON_RIGHT_M" :size="18"/>
						</button>
						<button
							type="button"
							class="editor-chart-node-settings-rules-layout__rule-card-name"
							:aria-expanded="false"
							:data-test-id="$testId('complexNodeRuleCardRowName', ruleCard.id)"
							@click="$emit('toggle-rule-card', ruleCard.id)"
						>
							<span class="editor-chart-node-settings-rules-layout__rule-card-title">
								{{ ruleCardTitle(ruleCard) }}
							</span>
						</button>
						<TextSm
							v-if="ruleCardOutput(ruleCard)"
							:className="'editor-chart-node-settings-rules-layout__rule-card-output'"
						>
							{{ ruleCardOutput(ruleCard) }}
						</TextSm>
					</div>
					<!-- A collapsed group is hidden by the card itself and not dropped, exactly as a
					collapsed input is: the values typed into the forms of its blocks live in the controls
					of the form, and a rebuilt form comes back showing the values from before the edit.
					Hence isExpanded goes into the slot instead of a wrapper here: the card is a direct
					child of the body, and dropping one group onto another needs the two to be neighbours -->
					<slot
						:ruleCard="ruleCard"
						:rulePort="section.port"
						:isLive="isLive"
						:isExpanded="isRuleCardExpanded(ruleCard)"
						:onToggle="() => $emit('toggle-rule-card', ruleCard.id)"
						name="ruleCard"
					/>
				</template>
			</div>
		</div>
	`,
};
