import { useHistory } from 'ui.block-diagram';
import { mapState, mapWritableState, mapActions } from 'ui.vue3.pinia';
import { Outline } from 'ui.icon-set.api.vue';

import { FeatureCode } from 'bizprocdesigner.feature';

import { diagramStore as useDiagramStore } from '../../../entities/blocks';
import {
	useNodeSettingsStore,
	NodeSettingsPreview,
	getAllAncestorBlocks,
	getPortsSignature,
} from '../../../entities/node-settings';
import { EditNodeSettingsForm, AddSettingsItem, RelationsBlock, DataViewsSection } from '../../../features/node-settings';

import { useFeature } from '../../../shared/composables';
import { type Block, type Port } from '../../../shared/types';
import {
	NODE_SETTINGS_TABS,
	PORT_TYPES,
	isDataViewsAllowedBlockType,
	isPortRulesAllowedBlockType,
} from '../../../shared/constants';

// @vue/component
export const BasicNodeSettings = {
	name: 'BasicNodeSettings',
	components: {
		EditNodeSettingsForm,
		NodeSettingsPreview,
		AddSettingsItem,
		RelationsBlock,
		DataViewsSection,
	},
	setup(): { ruleIcon: string; makeSnapshot: () => void }
	{
		const { makeSnapshot } = useHistory();

		return {
			// '+ Add expert settings' link per mockup 935:82878 (node 935:82383)
			ruleIcon: Outline.PLUS_M,
			makeSnapshot,
		};
	},
	computed:
	{
		...mapState(useDiagramStore, ['connections']),
		...mapState(useNodeSettingsStore, ['block', 'nodeSettings', 'ports']),
		...mapWritableState(useNodeSettingsStore, ['selectedTabId']),
		isDataViewsSectionShown(): boolean
		{
			const { isFeatureAvailable } = useFeature();

			return isDataViewsAllowedBlockType(this.block?.type)
				&& isFeatureAvailable(FeatureCode.dataTables);
		},
		supportsPortRules(): boolean
		{
			return isPortRulesAllowedBlockType(this.block?.type);
		},
		/**
		 * A map instead of a call inside the template: the preview watches this prop, and a fresh array
		 * on every render of this widget would rebuild its captions on every keystroke in a condition.
		 * Keyed by the input ports alone — the form renders a preview for those (EditNodeSettingsForm
		 * rulePorts), and the relation ports are served by RelationsBlock with a map of its own, so a walk
		 * over the ancestors of any other port is spent on nobody.
		 */
		ancestorBlocksByPortId(): { [string]: Array<Block> }
		{
			return Object.fromEntries(
				(this.ports ?? [])
					.filter((port: Port) => port.type === PORT_TYPES.input)
					.map((port: Port) => [port.id, getAllAncestorBlocks(this.block, port.id)]),
			);
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
			'deleteConnectionByBlockIdAndPortId',
		]),
		onShowConstructions(port: Port): void
		{
			this.selectedTabId = NODE_SETTINGS_TABS.rules;
			this.setCurrentRule(port);
		},
		async deleteRule(ruleId: string): Promise<void>
		{
			const prevConnectionsCount = this.connections.length;
			const prevPortsSignature = getPortsSignature(this.ports);
			this.deletePort(ruleId);
			const { outputPortsToDelete } = this.deleteRuleSettings(ruleId);
			outputPortsToDelete.forEach((portId) => {
				this.deletePort(portId);
				this.deleteConnectionByBlockIdAndPortId(this.block.id, portId);
			});
			this.deleteConnectionByBlockIdAndPortId(this.block.id, ruleId);
			const isConnectionRemoved = this.connections.length < prevConnectionsCount;
			if (isConnectionRemoved)
			{
				await this.publicDraft();
			}
			const isCanvasChanged = getPortsSignature(this.ports) !== prevPortsSignature
				|| isConnectionRemoved;
			if (isCanvasChanged)
			{
				this.makeSnapshot();
			}
		},
	},
	template: `
		<EditNodeSettingsForm>
			<template #preview="{ port }">
				<NodeSettingsPreview
					:port="port"
					:block="block"
					:nodeSettings="nodeSettings"
					:connectedBlocks="ancestorBlocksByPortId[port.id] ?? []"
					:fixedPort="!supportsPortRules"
					@showConstructions="onShowConstructions(port)"
					@deletePreview="deleteRule(port.id)"
				>
					{{ port.title }}
				</NodeSettingsPreview>
			</template>

			<template #storages>
				<DataViewsSection v-if="isDataViewsSectionShown" :block="block"/>
			</template>

			<template #addSettingsItem="{ text, itemType }">
				<AddSettingsItem
					:itemType="itemType"
					:iconName="ruleIcon"
				>
					{{ text }}
				</AddSettingsItem>
			</template>
			<RelationsBlock />
		</EditNodeSettingsForm>
	`,
};
