import { EventEmitter } from 'main.core.events';
import { mapState, mapWritableState, mapActions } from 'ui.vue3.pinia';
import { Type, Text } from 'main.core';
import { MessageBox } from 'ui.dialogs.messagebox';

import { useLoc } from '../../../shared/composables';
import { PORT_TYPES } from '../../../shared/constants';

import { EditOutputExpression } from '../../../features/node-settings/ui/edit-output-expression/edit-output-expression';

import { diagramStore as useDiagramStore } from '../../../entities/blocks';
import {
	useNodeSettingsStore,
	NodeSettingsRulesLayout,
	RuleCard,
	RuleConstruction, EVENT_NAMES,
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
	EditExtandedAction,
} from '../../../features/node-settings';

// eslint-disable-next-line no-unused-vars
import type { Block } from '../../../shared/types';

// @vue/component
export const NodeSettingsRules = {
	name: 'node-settings-rules',
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
		EditExtandedAction,
	},
	setup(): { getMessage: () => string; }
	{
		const { getMessage } = useLoc();

		return {
			getMessage,
		};
	},
	data(): Object
	{
		return {
			scrolling: false,
		};
	},
	computed:
	{
		...mapState(useNodeSettingsStore, ['nodeSettings', 'currentRuleId', 'block', 'isRuleSettingsShown']),
		...mapWritableState(useNodeSettingsStore, ['isSaving']),
		...mapState(useDiagramStore, ['documentTypeSigned', 'documentType', 'template']),
		documentTypeForActionSettings(): Array
		{
			if (Type.isArrayFilled(this.nodeSettings.fixedDocumentType))
			{
				return this.nodeSettings.fixedDocumentType;
			}

			return this.documentType;
		},
	},
	methods:
	{
		...mapActions(useNodeSettingsStore, [
			'toggleRuleSettingsVisibility',
			'reorder',
			'saveRule',
			'discardRuleSettings',
		]),
		...mapActions(useDiagramStore, ['addRulePort', 'deletePort']),
		onRulesLayoutClose(): void
		{
			this.discardRuleSettings();
			this.toggleRuleSettingsVisibility(false);
		},
		async onSaveRule(): Promise<void>
		{
			try
			{
				this.isSaving = true;

				await EventEmitter.emitAsync(EVENT_NAMES.BEFORE_SUBMIT_EVENT);
				const { outputPortsToAdd, outputPortsToDelete } = await this.saveRule(this.documentType);
				outputPortsToAdd.values().forEach(({ portId, title }) => {
					this.addRulePort(this.block.id, portId, PORT_TYPES.output, title);
				});
				outputPortsToDelete.keys().forEach((portId) => {
					this.deletePort(this.block.id, portId, PORT_TYPES.output);
				});
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
		onScroll(): void
		{
			this.scrolling = true;
			this.$nextTick(() => {
				this.scrolling = false;
			});
		},
	},
	template: `
		<NodeSettingsRulesLayout
			:isRuleSettingsShown="isRuleSettingsShown"
			:nodeSettings="nodeSettings"
			:currentRuleId="currentRuleId"
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
									<template #default="{ actionId, activityData }">
										<EditExtandedAction
											v-if="actionId"
											:actionId="actionId"
											:activityData="activityData"
											:construction="construction"
											:documentType="documentTypeForActionSettings"
											:template="template"
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
									:scrolling="scrolling"
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
					class="add-rule-card"
					:data-test-id="$testId('complexNodeRuleSettingsAddRuleCard')"
				>
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ADD_RULE_CARD_LABEL') }}
				</AddConstruction>
			</template>

			<template #actions>
				<SaveSettingsButton
					:isSaving="isSaving"
					:data-test-id="$testId('complexNodeRuleSettingsSave')"
					@click="onSaveRule"
				/>
				<CancelSettingsButton
					:data-test-id="$testId('complexNodeRuleSettingsDiscard')"
					@click="onRulesLayoutClose"
				/>
			</template>
		</NodeSettingsRulesLayout>
	`,
};
