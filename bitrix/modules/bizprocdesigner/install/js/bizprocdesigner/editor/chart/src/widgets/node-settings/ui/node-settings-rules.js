import { LiveAnnouncer } from 'ui.a11y';
import { EventEmitter } from 'main.core.events';
import { mapState, mapWritableState, mapActions } from 'ui.vue3.pinia';

import { useLoc } from '../../../shared/composables';
import { isPortRulesAllowedBlockType } from '../../../shared/constants';
import { type Port } from '../../../shared/types';
import { SaveSettingsButton, CancelSettingsButton } from '../../../shared/ui';

import { diagramStore as useDiagramStore } from '../../../entities/blocks';
import {
	useNodeSettingsStore,
	NodeSettingsRulesLayout,
	RuleCard,
	RuleConstruction,
	CONSTRUCTION_TYPES,
	CONSTRUCTION_GROUPS,
	CONSTRUCTION_LABELS,
	EVENT_NAMES,
	resolveRuleCollection,
	type TRuleCard,
} from '../../../entities/node-settings';
import {
	EditActionExpression,
	EditConditionExpression,
	AddConstruction,
	DeleteConstruction,
	SelectBooleanType,
	DeleteRuleCard,
	EditExtendedAction,
	EditOutputExpression,
	EditFilterExpression,
	EditBaseSettings,
	SelectRulePort,
} from '../../../features/node-settings';

// Shared empty list of ports: a panel without a node loaded hands the layout this very array instead
// of a fresh literal, so the prop keeps its identity across renders.
const EMPTY_PORTS: Array<Port> = Object.freeze([]);

// @vue/component
export const NodeSettingsRules = {
	name: 'NodeSettingsRules',
	components: {
		CancelSettingsButton,
		SaveSettingsButton,
		NodeSettingsRulesLayout,
		RuleCard,
		EditActionExpression,
		EditOutputExpression,
		EditConditionExpression,
		AddConstruction,
		DeleteConstruction,
		RuleConstruction,
		SelectBooleanType,
		DeleteRuleCard,
		EditExtendedAction,
		EditFilterExpression,
		EditBaseSettings,
		SelectRulePort,
	},
	setup(): { getMessage: () => string }
	{
		const { getMessage } = useLoc();

		return { getMessage };
	},
	computed:
	{
		...mapState(useNodeSettingsStore, [
			'nodeSettings',
			'currentRule',
			'ports',
			'toolbarRulePort',
			'block',
			'isResolvingActionPrefill',
			'expandedRulePortIds',
			'collapsedRuleCardIds',
			'revealedRulePortIds',
			'isRelationsSurfaceShown',
		]),
		...mapWritableState(useNodeSettingsStore, ['isSaving']),
		...mapState(useDiagramStore, ['documentType', 'template']),
		/**
		 * Ports of the node as the layout takes them. The shared empty list keeps the identity of the
		 * prop while the panel has no node loaded: a literal would be a new array on every render.
		 */
		layoutPorts(): Array<Port>
		{
			return this.ports ?? EMPTY_PORTS;
		},
		/**
		 * Whether the inputs of the node are a list the user works with: only the universal node lets
		 * them be added and deleted, and only there is an input a unit of the list the tab lays out.
		 */
		managesInputs(): boolean
		{
			return isPortRulesAllowedBlockType(this.block?.type);
		},
		/**
		 * Group whose add button waits for an addition in flight, or null. Only an action resolves
		 * anything, so the "+ condition" button of the very same card stays live meanwhile.
		 */
		pendingAddGroupName(): string | null
		{
			return this.isResolvingActionPrefill ? CONSTRUCTION_GROUPS.actions : null;
		},
	},
	methods:
	{
		...mapActions(useNodeSettingsStore, [
			'toggleRule',
			'toggleRuleCard',
			'reorder',
			'addConstruction',
			'renameRuleCard',
			'resolveActionPrefill',
			'setSelectedRulePort',
		]),
		/**
		 * One event per scroll event, and no state of its own: the surfaces that have to close on a
		 * scroll listen for it. A reactive flag raised and dropped again would instead re-render every
		 * editor of every rule of the node twice per scroll event.
		 */
		onScroll(): void
		{
			EventEmitter.emit(EVENT_NAMES.SCROLL_EVENT);
		},
		async onAddConstruction(groupName: string, ruleCard: TRuleCard, rulePort: Port): Promise<void>
		{
			// A condition is added synchronously: it inherits nothing, so its button waits for no
			// addition in flight and is answered before the guard below.
			if (groupName === CONSTRUCTION_GROUPS.conditions)
			{
				const condition = this.addConstruction(
					ruleCard,
					CONSTRUCTION_TYPES.CONDITION.AND_CONDITION,
					null,
					rulePort,
				);
				if (condition)
				{
					this.announceConstructionAdded(CONSTRUCTION_TYPES.CONDITION.AND_CONDITION, condition);
				}

				return;
			}

			// The action button pressed again while a previous action is still resolving its prefill does
			// nothing: the pending add is the one the user asked for (same guard as in the toolbar chip).
			// The dimmed button is out of the mouse's reach (pointer-events) but not out of the
			// keyboard's, so the press is answered.
			if (this.isResolvingActionPrefill)
			{
				this.announceAddPending();

				return;
			}

			// The action form renders from the store, so what the action inherits must be in place
			// before the construction is inserted.
			const actionPrefill = await this.resolveActionPrefill();
			if (!this.isInsertionTargetAlive(rulePort, ruleCard))
			{
				return;
			}

			const action = this.addConstruction(ruleCard, CONSTRUCTION_TYPES.ACTION, actionPrefill, rulePort);
			if (action)
			{
				this.announceConstructionAdded(CONSTRUCTION_TYPES.ACTION, action);
			}
		},
		/**
		 * The card path gives the insertion no other confirmation: the focus stays on the button and
		 * the new block takes none (same as the toolbar path). Announced only once the insertion has
		 * happened, so a context left behind mid-resolve is never described.
		 */
		announceConstructionAdded(constructionType: string, construction: Object): void
		{
			const labelKey = CONSTRUCTION_LABELS[constructionType];
			if (!labelKey)
			{
				return;
			}

			// An action added to a node with base settings arrives with its type and its settings
			// already filled in — the announcement says so. Read off the construction actually
			// inserted and not off canInheritBaseSettings: empty base settings, and a normalization
			// degraded to the internal values, seed the action binding alone and leave activityData
			// null (buildDefaultActionExpression), so there is nothing filled in to announce.
			const isPrefilled = constructionType === CONSTRUCTION_TYPES.ACTION
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
		 * Answers a press made while an addition is in flight: the add buttons only look disabled
		 * (aria-disabled keeps them focusable), so without this the press ends in silence.
		 */
		announceAddPending(): void
		{
			LiveAnnouncer.announce(this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ADD_PENDING_ANNOUNCE'));
		},
		/**
		 * True while the card captured on click still belongs to the rule of its own row. Only the
		 * add buttons are disabled during the resolve round-trip: the card deletion and the node
		 * selection stay live, so the captured card may already be gone (the action would be
		 * invisible yet saved) or belong to a node left behind - a load rebuilds the cards, so the
		 * captured one is then no longer among the rendered ones.
		 */
		isInsertionTargetAlive(rulePort: Port | null, ruleCard: TRuleCard): boolean
		{
			const rule = this.resolveRule(rulePort);

			return rule ? rule.ruleCards.includes(ruleCard) : false;
		},
		/** Rule a port addresses, read through the very resolver the store operations use. */
		resolveRule(rulePort: Port | null): Object | null
		{
			if (!rulePort)
			{
				return null;
			}

			return resolveRuleCollection(this.nodeSettings, rulePort)?.get(rulePort.id) ?? null;
		},
		onRenameRuleCard(ruleCard: TRuleCard, title: string, rulePort: Port): void
		{
			this.renameRuleCard(ruleCard, title, rulePort);
		},
		onSelectRulePort(rulePort: Port): void
		{
			this.setSelectedRulePort(rulePort.id);
		},
	},
	template: `
		<NodeSettingsRulesLayout
			:nodeSettings="nodeSettings"
			:currentRule="currentRule"
			:ports="layoutPorts"
			:toolbarRulePort="toolbarRulePort"
			:isSaving="isSaving"
			:expandedRulePortIds="expandedRulePortIds"
			:collapsedRuleCardIds="collapsedRuleCardIds"
			:revealedRulePortIds="revealedRulePortIds"
			:managesInputs="managesInputs"
			:isRelationsSurface="isRelationsSurfaceShown"
			@drop="(payload, rulePort) => reorder(payload, rulePort)"
			@scroll-layout="onScroll"
			@select-rule-port="onSelectRulePort"
			@toggle-rule="toggleRule"
			@toggle-rule-card="toggleRuleCard"
		>
			<template #portSelector>
				<SelectRulePort />
			</template>

			<template #addConstructionToolbar="{ rulePort }">
				<AddConstruction :rulePort="rulePort" />
			</template>

			<template #headConstruction="{ ruleCard, construction, rulePort, isLive }">
				<RuleConstruction
					:ruleCardId="ruleCard.id"
					:construction="construction"
				>
					<template #deleteConstructionButton>
						<DeleteConstruction
							:ruleCard="ruleCard"
							:construction="construction"
							:rulePort="rulePort"
						/>
					</template>

					<!-- Base settings bound to a node action are edited by the very block that edits an
					action, only with the plain action list: the classification of the catalog shapes the
					selector of a rule action and has nothing to say about the settings of the node. The
					block keeps its own green scheme (rule-construction .--base-settings). Base settings
					with no action of their own are the form of the node itself and stay with the scaffold
					that renders it. -->
					<template #base-settings="{ isExpertMode }">
						<EditActionExpression
							v-if="construction.expression?.actionId"
							:construction="construction"
							:isExpertMode="isExpertMode"
							:isGrouped="false"
							:isLive="isLive"
							:ruleCard="ruleCard"
							:rulePort="rulePort"
						>
							<template #default="{ actionId, activityData, selectedDocument }">
								<EditExtendedAction
									v-if="actionId"
									:actionId="actionId"
									:activityData="activityData"
									:construction="construction"
									:documentType="documentType"
									:rulePort="rulePort"
									:template="template"
									:selectedDocument="selectedDocument"
								/>
							</template>
						</EditActionExpression>
						<EditBaseSettings
							v-else
							:construction="construction"
							:documentType="documentType"
							:ruleCard="ruleCard"
							:rulePort="rulePort"
							:template="template"
						/>
					</template>

					<!-- The filter editor renders the legacy condition surface and asks the server for its
					metadata, so it waits for the rule to be reached (isSectionLive). The card itself is
					rendered either way: its header, its delete control and the frame of the construction
					are drawn by this editor and by nothing else -->
					<template #filter>
						<EditFilterExpression
							:isLive="isLive"
							:construction="construction"
							:documentType="documentType"
							:ruleCard="ruleCard"
							:rulePort="rulePort"
							:template="template"
						/>
					</template>
				</RuleConstruction>
			</template>

			<template #ruleCard="{ ruleCard, rulePort, isLive, isExpanded, onToggle }">
				<RuleCard
					:ruleCard="ruleCard"
					:isExpanded="isExpanded"
					:pendingGroupName="pendingAddGroupName"
					@addConstruction="(groupName) => onAddConstruction(groupName, ruleCard, rulePort)"
					@renameRuleCard="(rc, title) => onRenameRuleCard(rc, title, rulePort)"
					@toggle="onToggle"
				>
					<template #deleteRuleCard>
						<DeleteRuleCard
							:ruleCard="ruleCard"
							:rulePort="rulePort"
						/>
					</template>

					<template #construction="{ construction }">
						<RuleConstruction
							:ruleCardId="ruleCard.id"
							:construction="construction"
						>
							<template #deleteConstructionButton>
								<DeleteConstruction
									:ruleCard="ruleCard"
									:construction="construction"
									:rulePort="rulePort"
								/>
							</template>

							<template #action="{ isExpertMode }">
								<!-- The settings form of the action is the costliest block of a rule (one request
								and one property dialog each), so it waits for the rule to be reached -->
								<EditActionExpression
									:construction="construction"
									:isExpertMode="isExpertMode"
									:isLive="isLive"
									:rulePort="rulePort"
								>
									<template #default="{ actionId, activityData, selectedDocument }">
										<EditExtendedAction
											v-if="actionId"
											:actionId="actionId"
											:activityData="activityData"
											:construction="construction"
											:documentType="documentType"
											:rulePort="rulePort"
											:template="template"
											:selectedDocument="selectedDocument"
										/>
									</template>
								</EditActionExpression>
							</template>

							<template #booleanTypeSwitcher>
								<SelectBooleanType :construction="construction" />
							</template>

							<!-- The value control of a condition renders a legacy control synchronously, and an
							output editor copies the output ports of the node and watches the scroll: both wait
							for the rule to be reached (isSectionLive), showing their committed values until then -->
							<template #condition>
								<EditConditionExpression
									:construction="construction"
									:isLive="isLive"
									:rulePort="rulePort"
								/>
							</template>

							<template #output>
								<EditOutputExpression
									:construction="construction"
									:isLive="isLive"
									:rulePort="rulePort"
								/>
							</template>
						</RuleConstruction>
					</template>
				</RuleCard>
			</template>
		</NodeSettingsRulesLayout>
	`,
};
