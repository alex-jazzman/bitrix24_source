import { mapState, mapWritableState, mapActions } from 'ui.vue3.pinia';

import { useLoc } from '../../../shared/composables';
import { PORT_TYPES } from '../../../shared/constants';

import { diagramStore as useDiagramStore } from '../../../entities/blocks';
import {
	NodeSettingsLayout,
	useNodeSettingsStore,
	NodeSettingsVariable,
	NodeSettingsRule,
} from '../../../entities/node-settings';
import { useAppStore } from '../../../entities/app';
import {
	EditNodeSettingsForm,
	AddSettingsItem,
	CancelSettingsButton,
	SaveSettingsButton,
} from '../../../features/node-settings';
import type { Block } from '../../../shared/types';

// @vue/component
export const NodeSettings = {
	name: 'NodeSettings',
	components: {
		NodeSettingsLayout,
		EditNodeSettingsForm,
		CancelSettingsButton,
		SaveSettingsButton,
		NodeSettingsVariable,
		NodeSettingsRule,
		AddSettingsItem,
	},
	setup(): { getMessage: () => string; }
	{
		const { getMessage } = useLoc();

		return {
			getMessage,
		};
	},
	computed:
	{
		...mapState(useDiagramStore, ['documentType']),
		...mapState(useNodeSettingsStore, [
			'block',
			'isShown',
			'isRuleSettingsShown',
			'nodeSettings',
			'isLoading',
			'isSaving',
			'savedBlockInputPorts',
		]),
		...mapWritableState(useNodeSettingsStore, ['isSaving']),
	},
	methods:
	{
		...mapActions(useNodeSettingsStore, [
			'toggleVisibility',
			'toggleRuleSettingsVisibility',
			'reset',
			'setCurrentRuleId',
			'deleteRuleSettings',
			'saveForm',
			'discardFormSettings',
			'updateSettings',
		]),
		...mapActions(useDiagramStore, [
			'updateNodeTitle',
			'addRulePort',
			'addConnectionPort',
			'deletePort',
			'publicDraft',
			'updateBlockActivityField',
			'setInputPorts',
			'getBlockAncestorsByInputPortId',
		]),
		...mapActions(useAppStore, [
			'hideRightPanel',
		]),
		onShowRuleConstructions(ruleId: string): void
		{
			this.toggleRuleSettingsVisibility(true);
			this.setCurrentRuleId(ruleId);
		},
		onAddRule(ruleId: string): void
		{
			this.addRulePort(this.block.id, ruleId, PORT_TYPES.input);
		},
		onDeleteRule(ruleId: string): void
		{
			this.deletePort(this.block.id, ruleId);
			const { outputPortsToAdd, outputPortsToDelete } = this.deleteRuleSettings(ruleId);
			outputPortsToAdd.values().forEach(({ portId, title }) => {
				this.addRulePort(this.block, portId, PORT_TYPES.output, title);
			});
			outputPortsToDelete.keys().forEach((portId) => {
				this.deletePort(this.block.id, portId, PORT_TYPES.output);
			});
		},
		onAddConnection(connectionId: string): void
		{
			this.addConnectionPort(this.block.id, connectionId, PORT_TYPES.input);
		},
		async onSaveForm(): Promise<void>
		{
			try
			{
				this.isSaving = true;
				const activityData = await this.saveForm(this.documentType);
				this.updateBlockActivityField(this.block.id, activityData);
				await this.publicDraft();
				this.hideSettings();
			}
			catch (e)
			{
				console.error(e);
			}
			finally
			{
				this.isSaving = false;
			}
		},
		hideSettings(): void
		{
			this.hideRightPanel();
			this.toggleVisibility(false);
			this.reset();
		},
		onClose(): void
		{
			this.discardFormSettings();
			const { title } = this.nodeSettings;
			this.updateNodeTitle(this.block, title);
			this.setInputPorts(this.block, this.savedBlockInputPorts);
			this.hideSettings();
		},
		onUpdateTitle(block: Block, title: string): void
		{
			this.updateNodeTitle(block, title);
			this.updateSettings({ title });
		},
		onUpdateDescription(description: string): void
		{
			this.updateSettings({ description });
		},
	},
	template: `
		<NodeSettingsLayout
			:isLoading="isLoading"
			:isSaving="isSaving"
			:isShown="isShown"
			@close="onClose"
		>
			<template #default>
				<EditNodeSettingsForm
					:block="block"
					@updateTitle="onUpdateTitle(block, $event)"
					@updateDescription="onUpdateDescription($event)"
				>
					<!--
					<template #variable="{ variableName, variableValue }">
						<NodeSettingsVariable
							:variableName="variableName"
							:variableValue="variableValue"
						/>
					</template>
					<template #addElement="{ itemType }">
						<AddSettingsItem :itemType="itemType">
							{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ITEM_ELEMENT') }}
						</AddSettingsItem>
					</template>
					-->

					<template #rule="{ port }">
						<NodeSettingsRule
							:port="port"
							:nodeSettings="nodeSettings"
							:connectedBlocks="getBlockAncestorsByInputPortId(block, port.id)"
							@showRuleConstructions="onShowRuleConstructions"
							@deleteRule="onDeleteRule"
						/>
					</template>
					<template #addRule="{ itemType }">
						<AddSettingsItem
							:itemType="itemType"
							@addItem="onAddRule"
						>
							{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ITEM_RULE') }}
						</AddSettingsItem>
					</template>
					<template #addConnection="{ itemType }">
						<AddSettingsItem
							:itemType="itemType"
							@addItem="onAddConnection"
						>
							{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ITEM_CONNECTION') }}
						</AddSettingsItem>
					</template>
				</EditNodeSettingsForm>
			</template>

			<template #actions>
				<SaveSettingsButton
					:isSaving="isSaving"
					:data-test-id="$testId('complexNodeSettingsSave')"
					@click="onSaveForm"
				/>
				<CancelSettingsButton
					:data-test-id="$testId('complexNodeSettingsDiscard')"
					@click="onClose"
				/>
			</template>
		</NodeSettingsLayout>
		<slot v-if="isShown" />
	`,
};
