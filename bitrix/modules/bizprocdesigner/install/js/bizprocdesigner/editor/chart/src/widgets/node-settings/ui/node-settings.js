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
			'ports',
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
			'addRulePort',
			'deletePort',
		]),
		...mapActions(useDiagramStore, [
			'updateNodeTitle',
			'publicDraft',
			'updateBlockActivityField',
			'setPorts',
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
		onDeleteRule(ruleId: string): void
		{
			this.deletePort(ruleId);
			const { outputPortsToAdd, outputPortsToDelete } = this.deleteRuleSettings(ruleId);
			outputPortsToAdd.values().forEach(({ portId, title }) => {
				this.addRulePort(portId, PORT_TYPES.output, title);
			});
			outputPortsToDelete.keys().forEach((portId) => {
				this.deletePort(portId);
			});
		},
		async onSaveForm(): Promise<void>
		{
			try
			{
				this.isSaving = true;
				const activityData = await this.saveForm(this.documentType);
				this.updateBlockActivityField(this.block.id, activityData);
				this.setPorts(this.block.id, this.ports);
				this.updateNodeTitle(this.block.id, this.nodeSettings.title);
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
			this.hideSettings();
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
					:ports="ports"
				>
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
						>
							{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ITEM_RULE') }}
						</AddSettingsItem>
					</template>
					<template #addConnection="{ itemType }">
						<AddSettingsItem
							:itemType="itemType"
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
