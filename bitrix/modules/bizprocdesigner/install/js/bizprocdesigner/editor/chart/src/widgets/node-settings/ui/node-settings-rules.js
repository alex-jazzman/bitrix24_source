import { LiveAnnouncer } from 'ui.a11y';
import { EventEmitter } from 'main.core.events';
import { mapState, mapWritableState, mapActions } from 'ui.vue3.pinia';

import { useLoc } from '../../../shared/composables';
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
	data(): { isScrolling: boolean }
	{
		return {
			isScrolling: false,
		};
	},
	computed:
	{
		...mapState(useNodeSettingsStore, [
			'nodeSettings',
			'currentRule',
			'currentSettingsItems',
			'block',
			'isResolvingActionPrefill',
		]),
		...mapWritableState(useNodeSettingsStore, ['isSaving']),
		...mapState(useDiagramStore, ['documentType', 'template']),
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
			'reorder',
			'addConstruction',
			'renameRuleCard',
			'resolveActionPrefill',
		]),
		onScroll(): void
		{
			EventEmitter.emit('Bizproc.NodeSettings:onScroll');
			this.isScrolling = true;
			this.$nextTick(() => {
				this.isScrolling = false;
			});
		},
		async onAddConstruction(groupName: string, ruleCard: TRuleCard): Promise<void>
		{
			// A condition is added synchronously: it inherits nothing, so its button waits for no
			// addition in flight and is answered before the guard below.
			if (groupName === CONSTRUCTION_GROUPS.conditions)
			{
				const condition = this.addConstruction(ruleCard, CONSTRUCTION_TYPES.CONDITION.AND_CONDITION);
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
			const ruleId = this.currentRule?.id ?? null;
			const actionPrefill = await this.resolveActionPrefill();
			if (!this.isInsertionTargetAlive(ruleId, ruleCard))
			{
				return;
			}

			const action = this.addConstruction(ruleCard, CONSTRUCTION_TYPES.ACTION, actionPrefill);
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
		 * True while the card captured on click still belongs to the rule of the port shown now.
		 * Only the add buttons are disabled during the resolve round-trip: the port selector, the
		 * card deletion and the node selection stay live, so the captured card may already belong to
		 * a left port (the action would be invisible yet saved), to a relation port (addConstruction
		 * would bind relationAction instead) or to a detached object.
		 */
		isInsertionTargetAlive(ruleId: string | null, ruleCard: TRuleCard): boolean
		{
			if (ruleId === null || this.currentRule?.id !== ruleId)
			{
				return false;
			}

			const rule = this.currentSettingsItems.get(ruleId);

			return rule ? rule.ruleCards.includes(ruleCard) : false;
		},
		onRenameRuleCard(ruleCard: TRuleCard, title: string): void
		{
			this.renameRuleCard(ruleCard, title);
		},
	},
	template: `
		<NodeSettingsRulesLayout
			:nodeSettings="nodeSettings"
			:currentRule="currentRule"
			:isSaving="isSaving"
			@drop="reorder"
			@scroll-layout="onScroll"
		>
			<template #portSelector>
				<SelectRulePort />
			</template>

			<template #addConstructionToolbar>
				<AddConstruction />
			</template>

			<template #headConstruction="{ ruleCard, construction }">
				<RuleConstruction
					:ruleCardId="ruleCard.id"
					:construction="construction"
				>
					<template #deleteConstructionButton>
						<DeleteConstruction
							:ruleCard="ruleCard"
							:construction="construction"
						/>
					</template>

					<template #base-settings>
						<EditBaseSettings
							:construction="construction"
							:documentType="documentType"
							:ruleCard="ruleCard"
							:template="template"
						/>
					</template>

					<template #filter>
						<EditFilterExpression
							:construction="construction"
							:documentType="documentType"
							:ruleCard="ruleCard"
							:template="template"
						/>
					</template>
				</RuleConstruction>
			</template>

			<template #ruleCard="{ ruleCard }">
				<RuleCard
					:ruleCard="ruleCard"
					:pendingGroupName="pendingAddGroupName"
					@addConstruction="(groupName) => onAddConstruction(groupName, ruleCard)"
					@renameRuleCard="(rc, title) => onRenameRuleCard(rc, title)"
				>
					<template #deleteRuleCard>
						<DeleteRuleCard :ruleCard="ruleCard" />
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
								/>
							</template>

							<template #action="{ isExpertMode }">
								<EditActionExpression
									:construction="construction"
									:isExpertMode="isExpertMode"
									:isScrolling="isScrolling"
								>
									<template #default="{ actionId, activityData, selectedDocument }">
										<EditExtendedAction
											v-if="actionId"
											:actionId="actionId"
											:activityData="activityData"
											:construction="construction"
											:documentType="documentType"
											:template="template"
											:selectedDocument="selectedDocument"
										/>
									</template>
								</EditActionExpression>
							</template>

							<template #booleanTypeSwitcher>
								<SelectBooleanType :construction="construction" />
							</template>

							<template #condition>
								<EditConditionExpression :construction="construction" />
							</template>

							<template #output>
								<EditOutputExpression
									:construction="construction"
									:isScrolling="isScrolling"
								/>
							</template>
						</RuleConstruction>
					</template>
				</RuleCard>
			</template>
		</NodeSettingsRulesLayout>
	`,
};
