import { useHistory } from 'ui.block-diagram';
import { mapState, mapWritableState, mapActions } from 'ui.vue3.pinia';
import { BIcon, Outline } from 'ui.icon-set.api.vue';

import { diagramStore as useDiagramStore } from '../../../../entities/blocks';
import {
	useNodeSettingsStore,
	NodeSettingsPreview,
	getAllAncestorBlocks,
	getPortsSignature,
} from '../../../../entities/node-settings';
import { AddSettingsItem } from '../add-settings-item/add-settings-item';
import { useLoc } from '../../../../shared/composables';
import { PORT_TYPES, NODE_SETTINGS_TABS } from '../../../../shared/constants';
import { type Block, type Port } from '../../../../shared/types';

import './style.css';

// @vue/component
export const RelationsBlock = {
	name: 'RelationsBlock',
	components: {
		NodeSettingsPreview,
		AddSettingsItem,
		BIcon,
	},
	setup(): { getMessage: () => string; iconSet: Outline; makeSnapshot: () => void }
	{
		const { getMessage } = useLoc();
		const { makeSnapshot } = useHistory();

		return {
			getMessage,
			iconSet: Outline,
			makeSnapshot,
		};
	},
	computed:
	{
		...mapState(useDiagramStore, ['connections']),
		...mapState(useNodeSettingsStore, ['block', 'ports', 'nodeSettings', 'isBlockAvailable']),
		...mapWritableState(useNodeSettingsStore, ['selectedTabId']),
		/**
		 * Gate for the Relations block — driven by the availableBlocks descriptor.
		 * Constraint: node must not have aux ports (shouldShowAuxPorts !== true).
		 * Legacy fallback is handled inside normalizeAvailableBlocks — already resolves to
		 * complexNodeConnections when the server did not send an explicit descriptor.
		 */
		isVisible(): boolean
		{
			return this.block?.node?.shouldShowAuxPorts !== true
				&& this.isBlockAvailable('relations');
		},
		relationPorts(): Array<Port>
		{
			return this.ports
				? this.ports.filter((port) => port.type === PORT_TYPES.inputRelation)
				: [];
		},
		// Same reason as in BasicNodeSettings: the preview watches this prop, so its value must keep
		// its identity between renders of this block.
		ancestorBlocksByPortId(): { [string]: Array<Block> }
		{
			return Object.fromEntries(
				this.relationPorts.map((port: Port) => [port.id, getAllAncestorBlocks(this.block, port.id)]),
			);
		},
	},
	methods:
	{
		...mapActions(useNodeSettingsStore, ['deletePort', 'deleteRuleSettings', 'setCurrentRule']),
		...mapActions(useDiagramStore, [
			'publicDraft',
			'deleteConnectionByBlockIdAndPortId',
		]),
		onShowRelationConstructions(port: Port): void
		{
			this.selectedTabId = NODE_SETTINGS_TABS.rules;
			this.setCurrentRule(port);
		},
		async deleteRelation(relationId: string): Promise<void>
		{
			const prevConnectionsCount = this.connections.length;
			const prevPortsSignature = getPortsSignature(this.ports);
			this.deletePort(relationId);
			const { outputPortsToDelete } = this.deleteRuleSettings(relationId);
			outputPortsToDelete.forEach((portId) => {
				this.deletePort(portId);
				this.deleteConnectionByBlockIdAndPortId(this.block.id, portId);
			});
			this.deleteConnectionByBlockIdAndPortId(this.block.id, relationId);
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
		<div
			v-if="isVisible"
			class="editor-chart-node-settings-form__section --relations"
			:data-test-id="$testId('complexNodeSettingsRelationsBlock')"
		>
			<div class="editor-chart-node-settings-form__section-header">
				<div class="editor-chart-node-settings-form__section-header-main">
					<BIcon :name="iconSet.LINK" :size="24"/>
					<span class="editor-chart-node-settings-form__section-title">
						{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RELATIONS_SECTION_TITLE') }}
					</span>
				</div>
				<span class="editor-chart-node-settings-form__section-description">
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RELATIONS_SECTION_DESCRIPTION') }}
				</span>
			</div>
			<NodeSettingsPreview
				v-for="port in relationPorts"
				:key="port.id"
				:port="port"
				:block="block"
				:nodeSettings="nodeSettings"
				:connectedBlocks="ancestorBlocksByPortId[port.id] ?? []"
				@showConstructions="onShowRelationConstructions(port)"
				@deletePreview="deleteRelation(port.id)"
			>
				{{ port.title }}
			</NodeSettingsPreview>
			<div class="editor-chart-node-settings-form__add-buttons">
				<AddSettingsItem
					itemType="relation"
					iconName="plus-m"
				>
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ADD_ENTRY_POINT_BUTTON') }}
				</AddSettingsItem>
			</div>
		</div>
	`,
};
