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
		...mapState(useNodeSettingsStore, ['nodeSettings', 'currentRule', 'block']),
		...mapWritableState(useNodeSettingsStore, ['isSaving']),
		...mapState(useDiagramStore, ['documentType', 'template']),
	},
	methods:
	{
		...mapActions(useNodeSettingsStore, ['reorder', 'addConstruction']),
		onScroll(): void
		{
			this.isScrolling = true;
			this.$nextTick(() => {
				this.isScrolling = false;
			});
		},
		onAddConstruction(groupName: string, ruleCard: TRuleCard): void
		{
			if (groupName === CONSTRUCTION_GROUPS.conditions)
			{
				this.addConstruction(ruleCard, CONSTRUCTION_TYPES.CONDITION.AND_CONDITION);

				return;
			}

			this.addConstruction(ruleCard, CONSTRUCTION_TYPES.ACTION);
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
			<template #addConstructionToolbar>
				<AddConstruction />
			</template>

			<template #ruleCard="{ ruleCard }">
				<RuleCard
					:ruleCard="ruleCard"
					@addConstruction="(groupName) => onAddConstruction(groupName, ruleCard)"
				>
					<template #deleteRuleCard>
						<DeleteRuleCard :ruleCard="ruleCard" />
					</template>

					<template #construction="{ construction }">
						<RuleConstruction
							:ruleCardId="ruleCard.id"
							:construction="construction"
						>
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

							<template #filter>
								<EditFilterExpression
									:construction="construction"
									:documentType="documentType"
									:ruleCard="ruleCard"
									:template="template"
								/>
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
