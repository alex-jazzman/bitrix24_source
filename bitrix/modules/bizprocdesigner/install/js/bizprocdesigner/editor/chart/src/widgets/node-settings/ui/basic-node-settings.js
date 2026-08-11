import { mapState, mapWritableState, mapActions } from 'ui.vue3.pinia';
import { Outline } from 'ui.icon-set.api.vue';

import { diagramStore as useDiagramStore } from '../../../entities/blocks';
import { useNodeSettingsStore, NodeSettingsPreview } from '../../../entities/node-settings';
import { EditNodeSettingsForm, AddSettingsItem } from '../../../features/node-settings';

import { type Port } from '../../../shared/types';
import { NODE_SETTINGS_TABS } from '../../../shared/constants';

const ADD_ITEM_ICONS = {
	rule: Outline.EDIT_M,
	relation: Outline.PLUS_M,
};

// @vue/component
export const BasicNodeSettings = {
	name: 'BasicNodeSettings',
	components: {
		EditNodeSettingsForm,
		NodeSettingsPreview,
		AddSettingsItem,
	},
	computed:
	{
		...mapState(useDiagramStore, ['connections']),
		...mapState(useNodeSettingsStore, ['block', 'nodeSettings']),
		...mapWritableState(useNodeSettingsStore, ['selectedTabId']),
		addItemIcons(): { [string]: string }
		{
			return ADD_ITEM_ICONS;
		},
	},
	methods:
	{
		...mapActions(useNodeSettingsStore, [
			'setCurrentRule',
			'deleteRuleSettings',
			'deletePort',
		]),
		...mapActions(useDiagramStore, [
			'publicDraft',
			'getBlockAncestorsByInputPortId',
			'deleteConnectionByBlockIdAndPortId',
		]),
		onShowConstructions(port: Port): void
		{
			this.selectedTabId = NODE_SETTINGS_TABS.rules;
			this.setCurrentRule(port);
		},
		async deleteRule(ruleId: string): Promise<void>
		{
			const connections = [...this.connections];
			this.deletePort(ruleId);
			const { outputPortsToDelete } = this.deleteRuleSettings(ruleId);
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
	},
	template: `
		<EditNodeSettingsForm>
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
					:iconName="addItemIcons[itemType]"
				>
					{{ text }}
				</AddSettingsItem>
			</template>
		</EditNodeSettingsForm>
	`,
};
