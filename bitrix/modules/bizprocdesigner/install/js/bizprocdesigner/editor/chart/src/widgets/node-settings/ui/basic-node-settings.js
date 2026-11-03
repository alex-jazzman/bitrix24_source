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
import {
	EditNodeSettingsForm,
	getRulesSectionRows,
	AddSettingsItem,
	RelationsBlock,
	DataViewsSection,
	UnreachableOutputsAlert,
	BrokenLinksAlert,
} from '../../../features/node-settings';

import { useFeature, useLoc } from '../../../shared/composables';
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
		UnreachableOutputsAlert,
		BrokenLinksAlert,
	},
	setup(): { getMessage: () => string; ruleIcon: string; makeSnapshot: () => void }
	{
		const { makeSnapshot } = useHistory();
		const { getMessage } = useLoc();

		return {
			getMessage,
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
		 * Keyed by the rows the form renders a preview for (getRulesSectionRows) - the relation ports are
		 * served by RelationsBlock with a map of its own, so a walk over the ancestors of any other port
		 * is spent on nobody. The reserved rules container of a node without input ports is walked by its
		 * own key, exactly as the rules tab walks it.
		 */
		ancestorBlocksByPortId(): { [string]: Array<Block> }
		{
			return Object.fromEntries(
				getRulesSectionRows(this.ports, this.block)
					.map((row) => [row.id, getAllAncestorBlocks(this.block, row.id)]),
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
			'saveDraftWithStatus',
			'getBlockAncestorsByInputPortId',
			'deleteConnectionByBlockIdAndPortId',
		]),
		/**
		 * Caption of a rules row. The reserved container of a node without input ports is not a port
		 * and carries no title of its own (PORTLESS_RULE), and a row with no name says nothing about
		 * what it leads to, so it falls back to the same phrase the rule switcher falls back to
		 * (SelectRulePort.currentPortTitle).
		 */
		rowTitle(port: Port): string
		{
			return port.title
				|| this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_BLOCK_RULES_INPUT_TITLE');
		},
		onShowConstructions(port: Port): void
		{
			this.selectedTabId = NODE_SETTINGS_TABS.rules;
			this.setCurrentRule(port);
		},
		// A plain output materialized from the canvas is bound to no rule, so the rule-to-output
		// invariant alone reads it as an orphan. It survives while it still carries connections.
		isConnectedOutputPort(portId: string): boolean
		{
			const port = this.ports.find((p) => p.id === portId);
			if (port?.type !== PORT_TYPES.output)
			{
				return false;
			}

			return this.connections.some((connection) => {
				return connection.sourceBlockId === this.block.id && connection.sourcePortId === portId;
			});
		},
		async deleteRule(ruleId: string): Promise<void>
		{
			const prevConnectionsCount = this.connections.length;
			const prevPortsSignature = getPortsSignature(this.ports);
			this.deletePort(ruleId);
			const { outputPortsToDelete } = this.deleteRuleSettings(ruleId);
			outputPortsToDelete.forEach((portId) => {
				if (this.isConnectedOutputPort(portId))
				{
					return;
				}

				this.deletePort(portId);
				this.deleteConnectionByBlockIdAndPortId(this.block.id, portId);
			});
			this.deleteConnectionByBlockIdAndPortId(this.block.id, ruleId);
			const isConnectionRemoved = this.connections.length < prevConnectionsCount;
			if (isConnectionRemoved)
			{
				await this.saveDraftWithStatus();
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
			<template #generalNotice>
				<BrokenLinksAlert section="general"/>
			</template>

			<template #rulesNotice>
				<UnreachableOutputsAlert/>
				<BrokenLinksAlert section="rules"/>
			</template>

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
					{{ rowTitle(port) }}
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
			<RelationsBlock>
				<template #notice>
					<BrokenLinksAlert section="relations"/>
				</template>
			</RelationsBlock>
		</EditNodeSettingsForm>
	`,
};
