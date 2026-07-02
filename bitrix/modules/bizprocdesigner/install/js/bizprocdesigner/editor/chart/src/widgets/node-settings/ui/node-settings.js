import { mapState, mapWritableState, mapActions } from 'ui.vue3.pinia';

import { PORT_TYPES } from '../../../shared/constants';

import { diagramStore as useDiagramStore } from '../../../entities/blocks';
import {
	NodeSettingsLayout,
	useNodeSettingsStore,
	NodeSettingsPreview,
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
		NodeSettingsPreview,
		AddSettingsItem,
	},
	computed:
	{
		...mapState(useDiagramStore, ['documentType', 'connections']),
		...mapState(useNodeSettingsStore, [
			'block',
			'isShown',
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
			'setCurrentRule',
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
			'deleteConnectionByBlockIdAndPortId',
		]),
		...mapActions(useAppStore, [
			'hideRightPanel',
		]),
		onShowConstructions(port: Port): void
		{
			this.toggleRuleSettingsVisibility(true);
			this.setCurrentRule(port);
		},
		async deleteRule(ruleId: string): Promise<void>
		{
			const connections = [...this.connections];
			this.deletePort(ruleId);
			const { outputPortsToAdd, outputPortsToDelete } = this.deleteRuleSettings(ruleId);
			outputPortsToAdd.forEach(({ portId, title }) => {
				this.addRulePort(portId, PORT_TYPES.output, title);
			});
			outputPortsToDelete.forEach((portId) => {
				this.deletePort(portId);
				this.deleteConnectionByBlockIdAndPortId(this.block.id, portId);
			});
			this.deleteConnectionByBlockIdAndPortId(this.block.id, ruleId);
			if (this.connections.length < connections.length)
			{
				await this.publicDraft();
			}
		},
		deleteRelation(relationId: string): void
		{
			this.deletePort(relationId);
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
					<template #preview="{ port }">
						<NodeSettingsPreview
							:port="port"
							:nodeSettings="nodeSettings"
							:connectedBlocks="getBlockAncestorsByInputPortId(block, port)"
							@showConstructions="onShowConstructions(port)"
							@deletePreview="deleteRule(port.id)"
						>
							{{ port.title }}
						</NodeSettingsPreview>
					</template>

					<template #addSettingsItem="{ text, itemType }">
						<AddSettingsItem
							:itemType="itemType"
						>
							{{ text }}
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
		<slot
			v-if="isShown"
		/>
	`,
};
