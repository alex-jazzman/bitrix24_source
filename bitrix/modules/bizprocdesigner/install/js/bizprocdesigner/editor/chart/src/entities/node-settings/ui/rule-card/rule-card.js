import { BIcon, Outline } from 'ui.icon-set.api.vue';

import { useLoc } from '../../../../shared/composables';

import { CONSTRUCTION_GROUPS } from '../../constants/index';
import { type Construction, type TRuleCard } from '../../types';
import { getGroupConstructionName } from '../../utils/rules-surface';

import './style.css';

type GroupedConstructions = {
	conditions: Array<Construction>,
	actions: Array<Construction>,
	outputs: Array<Construction>,
};

// Sections of a group are always rendered in this order; an added construction is placed on the
// position of its own section (findConstructionInsertIndex), so the payload keeps the same order.
const GROUP_RENDER_ORDER = [
	CONSTRUCTION_GROUPS.conditions,
	CONSTRUCTION_GROUPS.actions,
	CONSTRUCTION_GROUPS.outputs,
];

// @vue/component
export const RuleCard = {
	name: 'RuleCard',
	components: { BIcon },
	props:
	{
		/** @type TRuleCard */
		ruleCard:
		{
			type: Object,
			required: true,
		},
		/**
		 * Group whose add button waits for an addition in flight (the prefill of an inherited action
		 * being resolved), or null while nothing is pending. Only that one button stops accepting
		 * presses: the other groups of the card add their constructions synchronously.
		 */
		pendingGroupName:
		{
			type: [String, null],
			default: null,
		},
	},
	emits: ['addConstruction', 'renameRuleCard'],
	setup(): {...}
	{
		const { getMessage } = useLoc();

		return {
			getMessage,
			iconColor: 'var(--ui-color-palette-gray-50)',
			iconSet: Outline,
		};
	},
	data(): { isRenaming: boolean, draftTitle: string }
	{
		return {
			isRenaming: false,
			draftTitle: '',
		};
	},
	computed:
	{
		/**
		 * Constructions of the card by group, keyed in GROUP_RENDER_ORDER: the section order
		 * must not depend on which type the user added first. Empty groups are left out, and
		 * base-settings and filters are absent on purpose: they are rendered above the groups
		 * by the rules layout.
		 */
		groupedConstructions(): GroupedConstructions
		{
			const grouped = this.ruleCard.constructions.reduce((acc, construction) => {
				const groupName = getGroupConstructionName(construction.type);
				if (!groupName)
				{
					return acc;
				}

				return {
					...acc,
					[groupName]: [...(acc[groupName] ?? []), construction],
				};
			}, {});

			return GROUP_RENDER_ORDER.reduce((acc, groupName) => {
				return grouped[groupName] ? { ...acc, [groupName]: grouped[groupName] } : acc;
			}, {});
		},
		/**
		 * Displayed group title: ruleCard.groupTitle if set, otherwise falls back to the localized default.
		 */
		displayTitle(): string
		{
			return this.ruleCard.groupTitle || this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RULE_CARD_TITLE');
		},
		/** Id of the group title the card is named by, both as a span and as the rename input. */
		titleId(): string
		{
			return `editor-chart-node-settings-rule-card-title-${this.ruleCard.id}`;
		},
		/** Group name in the label: several cards hold a rename button of their own. */
		renameAriaLabel(): string
		{
			return this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RENAME_GROUP_ARIA_LABEL', {
				'#GROUP#': this.displayTitle,
			});
		},
	},
	methods:
	{
		onAddConstruction(groupName: string): void
		{
			this.$emit('addConstruction', groupName);
		},
		getAddConstructionBtnTitle(groupName: string): string
		{
			return groupName === CONSTRUCTION_GROUPS.conditions
				? this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_TOOLBAR_ITEM')
				: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ACTION_TOOLBAR_ITEM')
			;
		},
		/**
		 * The visible chip text repeats across groups, so the group name goes into the label:
		 * a card button always adds to its own group, unlike the toolbar chip.
		 */
		getAddConstructionBtnAriaLabel(groupName: string): string
		{
			const messageId = groupName === CONSTRUCTION_GROUPS.conditions
				? 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ADD_CONDITION_TO_GROUP_ARIA_LABEL'
				: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ADD_ACTION_TO_GROUP_ARIA_LABEL'
			;

			return this.getMessage(messageId, { '#GROUP#': this.displayTitle });
		},
		/** True for the one group whose add button waits for the addition in flight. */
		isGroupAddPending(groupName: string): boolean
		{
			return this.pendingGroupName !== null && groupName === this.pendingGroupName;
		},
		isNotOutputsGroup(groupName: string): boolean
		{
			// Outputs are the only group without a user-initiated addition from within the card.
			return groupName !== CONSTRUCTION_GROUPS.outputs;
		},
		/**
		 * Activates the inline rename input.
		 */
		startRename(): void
		{
			this.draftTitle = this.ruleCard.groupTitle || '';
			this.isRenaming = true;
			this.$nextTick(() => {
				const input = this.$el?.querySelector('[data-role="group-title-input"]');
				if (input)
				{
					input.focus();
					input.select();
				}
			});
		},
		/**
		 * Confirms the rename and emits renameRuleCard event for the parent to persist via store.
		 */
		confirmRename(): void
		{
			if (!this.isRenaming)
			{
				return;
			}
			this.isRenaming = false;
			this.$emit('renameRuleCard', this.ruleCard, this.draftTitle);
		},
		/**
		 * Cancels rename without saving.
		 */
		cancelRename(): void
		{
			this.isRenaming = false;
			this.draftTitle = '';
		},
	},
	template: `
		<div
			data-name="rule-card"
			class="editor-chart-node-settings-rule-card"
			:data-test-id="$testId('complexNodeRuleSettingsRuleCard', ruleCard.id)"
			:data-id="ruleCard.id"
			role="group"
			:aria-labelledby="titleId"
			:aria-busy="pendingGroupName !== null"
		>
			<div class="editor-chart-node-settings-rule-card__top">
				<BIcon
					:name="iconSet.DRAG_M"
					class="editor-chart-node-settings-rule-card__dnd-icon"
					data-testid="bizprocdesigner-rule-card-drag-handle"
					draggable="true"
					:color="iconColor"
					:size="20"
				/>
				<template v-if="isRenaming">
					<input
						:id="titleId"
						class="editor-chart-node-settings-rule-card__top_title-input"
						:data-test-id="$testId('complexNodeRuleSettingsRenameRuleCard')"
						data-role="group-title-input"
						:aria-label="getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_GROUP_TITLE_INPUT_ARIA_LABEL')"
						v-model="draftTitle"
						@blur="confirmRename"
						@keyup.enter="confirmRename"
						@keyup.escape="cancelRename"
					/>
				</template>
				<template v-else>
					<span
						:id="titleId"
						class="editor-chart-node-settings-rule-card__top_title"
						data-testid="bizprocdesigner-rule-card-title"
					>
						{{ displayTitle }}
					</span>
					<button
						type="button"
						class="editor-chart-node-settings-rule-card__rename-btn"
						:data-test-id="$testId('complexNodeRuleSettingsRenameRuleCardBtn', ruleCard.id)"
						:aria-label="renameAriaLabel"
						@click.stop="startRename"
					>
						<BIcon
							:name="iconSet.EDIT_M"
							:size="20"
							:color="iconColor"
							aria-hidden="true"
						/>
					</button>
				</template>
				<slot name="deleteRuleCard" />
			</div>
			<div
				v-for="(group, groupName) in groupedConstructions"
				:key="groupName"
				:class="'--' + groupName"
				class="editor-chart-node-settings-rule-card__group"
				:data-testid="'bizprocdesigner-rule-card-group-' + groupName"
			>
				<slot
					v-for="construction in group"
					name="construction"
					:key="construction.id"
					:construction="construction"
				/>
				<button
					v-if="isNotOutputsGroup(groupName)"
					type="button"
					class="editor-chart-node-settings-rule-card__group_add-construction-btn"
					:class="{ '--pending': isGroupAddPending(groupName) }"
					:data-test-id="$testId('complexNodeRuleSettingsAddConstructionBtn', groupName)"
					:aria-label="getAddConstructionBtnAriaLabel(groupName)"
					:aria-disabled="isGroupAddPending(groupName)"
					@click="onAddConstruction(groupName)"
				>
					<BIcon
						:name="iconSet.PLUS_L"
						:size="18"
						aria-hidden="true"
					/>
					<span>
						{{ getAddConstructionBtnTitle(groupName) }}
					</span>
				</button>
			</div>
			<slot name="addConstructionButton" />
		</div>
	`,
};
