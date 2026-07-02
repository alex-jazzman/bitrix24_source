import { mapState, mapWritableState, mapActions } from 'ui.vue3.pinia';
import { Text } from 'main.core';
import { MessageBox } from 'ui.dialogs.messagebox';

import { useLoc } from '../../../shared/composables';
import { PORT_TYPES } from '../../../shared/constants';

import { EditOutputExpression } from '../../../features/node-settings/ui/edit-output-expression/edit-output-expression';

import { diagramStore as useDiagramStore } from '../../../entities/blocks';
import {
	useNodeSettingsStore,
	NodeSettingsRulesLayout,
	RuleCard,
	RuleConstruction,
} from '../../../entities/node-settings';
import {
	EditActionExpression,
	EditConditionExpression,
	AddConstruction,
	DeleteConstruction,
	CancelSettingsButton,
	SaveSettingsButton,
	SelectBooleanType,
	SelectRule,
	DeleteRuleCard,
	EditExtendedAction,
} from '../../../features/node-settings';

// @vue/component
export const NodeSettingsRelations = {
	name: 'NodeSettingsRelations',
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
		SelectRule,
		DeleteRuleCard,
		EditExtendedAction,
	},
	setup(): { getMessage: () => string; }
	{
		const { getMessage } = useLoc();

		return {
			getMessage,
		};
	},
	data(): { isScrolling: boolean }
	{
		return {
			isScrolling: false,
		};
	},
	computed:
	{
		...mapState(useNodeSettingsStore, ['nodeSettings', 'currentRule', 'block', 'isRuleSettingsShown']),
		...mapWritableState(useNodeSettingsStore, ['isSaving']),
		...mapState(useDiagramStore, ['documentType', 'template']),
		isShown(): boolean
		{
			return this.isRuleSettingsShown && this.currentRule.type === PORT_TYPES.inputRelation;
		},
	},
	methods:
	{
		...mapActions(useNodeSettingsStore, [
			'toggleRuleSettingsVisibility',
			'reorder',
			'discardRuleSettings',
			'saveRelation',
		]),
		async onSaveRelation(): Promise<void>
		{
			try
			{
				this.isSaving = true;

				await this.saveRelation();
			}
			catch (error)
			{
				if (error.errors && error.errors[0] && error.errors[0].message)
				{
					MessageBox.alert(Text.encode(error.errors[0].message));
				}
			}
			finally
			{
				this.isSaving = false;
			}
		},
		onRulesLayoutClose(): void
		{
			this.discardRuleSettings();
			this.toggleRuleSettingsVisibility(false);
		},
		onScroll(): void
		{
			this.isScrolling = true;
			this.$nextTick(() => {
				this.isScrolling = false;
			});
		},
	},
	template: `
		<NodeSettingsRulesLayout
			:isShown="isShown"
			:nodeSettings="nodeSettings"
			:currentRule="currentRule"
			:isSaving="isSaving"
			@close="onRulesLayoutClose"
			@drop="reorder"
			@scroll-layout="onScroll"
		>
			<template #rules-dropdown>
				<SelectRule :block="block" />
			</template>

			<template #ruleCard="{ ruleCard }">
				<RuleCard :ruleCard="ruleCard">
					<template #deleteRuleCard>
						<DeleteRuleCard :ruleCard="ruleCard" />
					</template>

					<template #default="{ construction, position }">
						<RuleConstruction
							:ruleCardId="ruleCard.id"
							:construction="construction"
							:position="position"
						>
							<template #addConstructionButton>
								<AddConstruction
									:position="position"
									:ruleCard="ruleCard"
									:data-test-id="$testId('complexNodeRuleSettingsAddConstruction')"
								/>
							</template>

							<template #deleteConstructionButton="{ iconColor }">
								<DeleteConstruction
									:iconColor="iconColor"
									:ruleCard="ruleCard"
									:construction="construction"
								/>
							</template>

							<template #action="{ isExpertMode }">
								<EditActionExpression
									:construction="construction"
									:isExpertMode="isExpertMode"
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

					<template #addConstructionButton>
						<AddConstruction
							:ruleCard="ruleCard"
							:data-test-id="$testId('complexNodeRuleSettingsAddConstruction')"
						/>
					</template>
				</RuleCard>
			</template>

			<template #addRuleCardButton>
				<AddConstruction
					class="editor-chart-node-settings-add-rule-card"
					:data-test-id="$testId('complexNodeRuleSettingsAddRuleCard')"
				>
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ADD_RULE_CARD_LABEL') }}
				</AddConstruction>
			</template>

			<template #actions>
				<SaveSettingsButton
					:isSaving="isSaving"
					:data-test-id="$testId('complexNodeRelationSettingsSave')"
					@click="onSaveRelation"
				/>
				<CancelSettingsButton
					:data-test-id="$testId('complexNodeRelationSettingsDiscard')"
					@click="onRulesLayoutClose"
				/>
			</template>
		</NodeSettingsRulesLayout>
	`,
};
