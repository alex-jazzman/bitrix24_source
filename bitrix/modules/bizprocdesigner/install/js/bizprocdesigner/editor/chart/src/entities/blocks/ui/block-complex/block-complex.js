import { Text } from 'ui.system.typography.vue';
import { useBlockDiagram } from 'ui.block-diagram';
import { useLoc } from '../../../../shared/composables';
import { PORT_TYPES, COMPLEX_NODE_PORT_LABELS, MAX_AUX_COUNT } from '../../../../shared/constants';
import { createUniqueId, parsePortTitle } from '../../../../shared/utils';
import {
	buildComplexNodeRuleRows,
	createComplexNodePlaceholderId,
	findFirstComplexNodePlaceholderIndex,
	getComplexNodeMinRuleItemsCount,
	normalyzeAuxConnection,
} from '../../utils';
import { useNodeSettingsStore } from '../../../node-settings/stores/node-settings-store';

import './style.css';

import type { Port as TPort } from '../../../../shared/types';

type BlockComplexSetup = {
	updatePort: () => void;
	updatePortRect: () => void;
	updatePortSegmentSizes: () => void;
	getMessage: () => string;
};

type Placeholder = {
	id: string;
	title: string;
};

type RuleType = {
	id: string;
	label: string;
	items: Array<TPort | Placeholder>;
	position: string;
	classList: Array<string>;
};

const BLOCK_COMPLEX_CLASS_NAMES = {
	base: 'block-complex',
	deactivated: '--deactivated',
};

// @vue/component
export const BlockComplexContent = {
	name: 'BlockComplexContent',
	components: {
		BxText: Text,
	},
	props:
	{
		/** @type Block */
		block:
		{
			type: Object,
			required: true,
		},
		/** @type Array<TPort> */
		ports:
		{
			type: Array,
			required: true,
		},
		title:
		{
			type: String,
			required: true,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		deactivated: {
			type: Boolean,
			default: false,
		},
		minRuleItemsCount: {
			type: Number,
			default: getComplexNodeMinRuleItemsCount(),
		},
	},
	setup(): BlockComplexSetup
	{
		const {
			updatePort,
			updatePortRect,
			updatePortSegmentSizes,
			newConnection,
			addConnection,
		} = useBlockDiagram();
		const { getMessage } = useLoc();
		const nodeSettingsStore = useNodeSettingsStore();

		return {
			updatePort,
			updatePortRect,
			updatePortSegmentSizes,
			newConnection,
			addConnection,
			getMessage,
			nodeSettingsStore,
		};
	},
	computed:
	{
		blockComplexClassNames(): { [string]: boolean }
		{
			return {
				[BLOCK_COMPLEX_CLASS_NAMES.base]: true,
				[BLOCK_COMPLEX_CLASS_NAMES.deactivated]: this.deactivated,
			};
		},
		outputPorts(): Array<TPort>
		{
			return this.ports
				.filter((port) => port.type === PORT_TYPES.output);
		},
		rulePorts(): Array<TPort>
		{
			return this.ports.filter((port) => port.type === PORT_TYPES.input);
		},
		relationPorts(): Array<TPort>
		{
			return this.ports.filter((port) => port.type === PORT_TYPES.inputRelation);
		},
		outputRelationPorts(): Array<TPort>
		{
			return this.ports.filter((port) => port.type === PORT_TYPES.outputRelation);
		},
		portsGeometryGroups(): Array<Array<TPort | Placeholder>>
		{
			return [
				this.allInputRules,
				this.allOutputRules,
				this.relationPorts,
				this.outputRelationPorts,
				this.auxPortItems,
			];
		},
		portsGeometrySignature(): string
		{
			return this.portsGeometryGroups
				.map((ports) => {
					return ports
						.map((port, index) => (port.type ? `${index}:${port.id}` : ''))
						.filter(Boolean)
						.join(',')
					;
				})
				.join(';');
		},
		auxPorts(): Array<TPort>
		{
			return this.block.ports.filter((port) => port.type === PORT_TYPES.aux);
		},
		auxPortItems(): Array<TPort | Placeholder>
		{
			if (this.block.node?.shouldShowAuxPorts !== true)
			{
				return [];
			}

			const realPorts = this.auxPorts.filter((port) => port.isActive !== false);
			const items = [];
			for (let i = 1; i <= MAX_AUX_COUNT; i++)
			{
				const title = `${COMPLEX_NODE_PORT_LABELS.aux}${i}`;
				const port = realPorts.find((p) => p.title === title);
				items.push(port ?? { id: createUniqueId(), title });
			}

			return items;
		},
		showRelationSection(): boolean
		{
			return this.isRelationFeatureAvailable
				&& this.block.node?.shouldShowAuxPorts !== true;
		},
		showAuxSection(): boolean
		{
			return this.block.node?.shouldShowAuxPorts === true;
		},
		/**
		 * Gate for the canvas relation section: the server verdict on the block itself, so the gate
		 * is the same whether or not the node settings are open (no flicker for unified nodes).
		 * A block whose data carries no verdict is answered by the store while it is selected - the
		 * store holds the descriptor loaded for the very same node - and has no relations otherwise:
		 * relations exist only where the server declares them.
		 */
		isRelationFeatureAvailable(): boolean
		{
			const nodeRelationsAvailable = this.block.node?.relationsAvailable;
			if (nodeRelationsAvailable !== null && nodeRelationsAvailable !== undefined)
			{
				return nodeRelationsAvailable === true;
			}

			if (
				this.nodeSettingsStore.block?.id === this.block.id
				&& this.nodeSettingsStore.isCurrentBlock(this.block.id)
			)
			{
				return this.nodeSettingsStore.isBlockAvailable('relations');
			}

			return false;
		},
		reservedInputRules(): Array<TPort | Placeholder>
		{
			return buildComplexNodeRuleRows({
				blockId: this.block.id,
				ports: this.rulePorts,
				portType: PORT_TYPES.input,
				label: COMPLEX_NODE_PORT_LABELS.inputRule,
				minRuleItemsCount: this.minRuleItemsCount,
			}).reservedRows;
		},
		restInputRules(): Array<TPort>
		{
			return buildComplexNodeRuleRows({
				blockId: this.block.id,
				ports: this.rulePorts,
				portType: PORT_TYPES.input,
				label: COMPLEX_NODE_PORT_LABELS.inputRule,
				minRuleItemsCount: this.minRuleItemsCount,
			}).restPorts;
		},
		lastInputRulePlaceholder(): Placeholder
		{
			return buildComplexNodeRuleRows({
				blockId: this.block.id,
				ports: this.rulePorts,
				portType: PORT_TYPES.input,
				label: COMPLEX_NODE_PORT_LABELS.inputRule,
				minRuleItemsCount: this.minRuleItemsCount,
			}).trailingPlaceholder;
		},
		allInputRules(): Array<TPort | Placeholder>
		{
			return buildComplexNodeRuleRows({
				blockId: this.block.id,
				ports: this.rulePorts,
				portType: PORT_TYPES.input,
				label: COMPLEX_NODE_PORT_LABELS.inputRule,
				minRuleItemsCount: this.minRuleItemsCount,
			}).rows;
		},
		firstInputPlaceholderIndex(): number
		{
			return findFirstComplexNodePlaceholderIndex(this.allInputRules);
		},
		relationPlaceholder(): Placeholder
		{
			const lastRelationPort = this.relationPorts[this.relationPorts.length - 1];
			const { label, id } = parsePortTitle(lastRelationPort?.title)
				?? { label: COMPLEX_NODE_PORT_LABELS.relation, id: 0 };
			const title = `${label}${id + 1}`;

			return {
				id: createComplexNodePlaceholderId(this.block.id, title),
				title,
			};
		},
		reservedOutputRules(): Array<TPort | Placeholder>
		{
			return buildComplexNodeRuleRows({
				blockId: this.block.id,
				ports: this.outputPorts,
				portType: PORT_TYPES.output,
				label: COMPLEX_NODE_PORT_LABELS.outputRule,
				minRuleItemsCount: this.minRuleItemsCount,
			}).reservedRows;
		},
		restOutputRules(): Array<TPort>
		{
			return buildComplexNodeRuleRows({
				blockId: this.block.id,
				ports: this.outputPorts,
				portType: PORT_TYPES.output,
				label: COMPLEX_NODE_PORT_LABELS.outputRule,
				minRuleItemsCount: this.minRuleItemsCount,
			}).restPorts;
		},
		lastOutputRulePlaceholder(): Placeholder
		{
			return buildComplexNodeRuleRows({
				blockId: this.block.id,
				ports: this.outputPorts,
				portType: PORT_TYPES.output,
				label: COMPLEX_NODE_PORT_LABELS.outputRule,
				minRuleItemsCount: this.minRuleItemsCount,
			}).trailingPlaceholder;
		},
		allOutputRules(): Array<TPort | Placeholder>
		{
			return buildComplexNodeRuleRows({
				blockId: this.block.id,
				ports: this.outputPorts,
				portType: PORT_TYPES.output,
				label: COMPLEX_NODE_PORT_LABELS.outputRule,
				minRuleItemsCount: this.minRuleItemsCount,
			}).rows;
		},
		firstOutputPlaceholderIndex(): number
		{
			return findFirstComplexNodePlaceholderIndex(this.allOutputRules);
		},
		ruleTypes(): Array<RuleType>
		{
			return [
				{
					id: 'input-rules',
					items: this.allInputRules,
					label: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_BLOCK_RULES_INPUT_TITLE'),
					position: 'left',
				},
				{
					id: 'output-rules',
					items: this.allOutputRules,
					label: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_BLOCK_RULES_OUTPUT_TITLE'),
					position: 'right',
					classList: ['--right'],
				},
			];
		},
	},
	watch:
	{
		portsGeometrySignature(): void
		{
			this.updatePortsGeometry();
		},
		auxPorts(newAuxPorts: Array<TPort>, oldAuxPorts: Array<TPort>): void
		{
			if (!this.newConnection)
			{
				return;
			}

			const oldPortsIds = new Set(oldAuxPorts.map((port) => port.id));
			const addedPort = newAuxPorts.find((port) => !oldPortsIds.has(port.id));
			if (addedPort)
			{
				this.addConnection(normalyzeAuxConnection({
					...this.newConnection,
					targetBlockId: this.block.id,
					targetPort: addedPort,
					targetPortId: addedPort.id,
				}));
			}
		},
	},
	methods:
	{
		updatePortsGeometry(): void
		{
			this.$nextTick(() => {
				let isBlockGeometryUpdated = false;
				this.portsGeometryGroups.forEach((ports) => {
					isBlockGeometryUpdated = this.updatePortsGroupGeometry(ports, isBlockGeometryUpdated);
				});
			});
		},
		updatePortsGroupGeometry(ports: Array<TPort | Placeholder>, isBlockGeometryUpdated: boolean): boolean
		{
			let hasBlockGeometryUpdated = isBlockGeometryUpdated;
			ports.forEach((port, index) => {
				if (!port.type)
				{
					return;
				}

				if (!hasBlockGeometryUpdated)
				{
					// updatePort refreshes the block rect before recalculating this port.
					this.updatePort(this.block.id, port.id, index);
					hasBlockGeometryUpdated = true;

					return;
				}

				this.updatePortRect(this.block.id, port.id);
				this.updatePortSegmentSizes(this.block.id, port.id, index);
			});

			return hasBlockGeometryUpdated;
		},
	},
	template: `
		<div
			:class="blockComplexClassNames"
			:data-test-id="$testId('blockComplex', block.id)"
		>
			<slot
				name="header"
				:title="title"
			/>
			<div class="block-complex__content">
				<div class="block-complex__content_row block-complex__content_rules">
					<div
						v-for="ruleType in ruleTypes"
						:key="ruleType.id"
						class="block-complex__content_col"
						:class="ruleType.classList"
					>
						<span class="block-complex__content_label">
							{{ ruleType.label }}
						</span>
						<div
							v-for="(item, index) in ruleType.items"
							:key="item.id"
							class="block-complex__content_col-value"
						>
							<slot
								:name="item.type ? 'port' : 'portPlaceholder'"
								:item="item"
								:index="index"
								:disabled="disabled"
								:position="ruleType.position"
								:isOutput="ruleType.id === 'output-rules'"
								:isInputDroppable="ruleType.id === 'input-rules' && index === firstInputPlaceholderIndex"
								:isOutputDroppable="ruleType.id === 'output-rules' && index === firstOutputPlaceholderIndex"
							/>
						</div>
					</div>
				</div>
				<div
					v-if="showRelationSection"
					class="block-complex__content_connections"
				>
					<span class="block-complex__content_label">
						{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_BLOCK_CONNECTIONS_TITLE') }}
					</span>
					<div class="block-complex__content_row">
						<div class="block-complex__content_col">
							<div
								v-for="(port, index) in relationPorts"
								:key="port.id"
								class="block-complex__content_col-value"
							>
								<slot
									name="port"
									:item="port"
									:index="index"
									:disabled="disabled"
									position="left"
								/>
							</div>
							<div
								class="block-complex__content_col-value"
								:key="relationPlaceholder.id"
							>
								<slot
									name="portPlaceholder"
									:item="relationPlaceholder"
									:index="relationPorts.length"
									:disabled="disabled"
									:isRelationDroppable="true"
								/>
							</div>
						</div>
						<div
							class="block-complex__content_col --right"
							:data-test-id="$testId('complexNodeOutputRelationPorts', block.id)"
						>
							<div
								v-for="(port, index) in outputRelationPorts"
								:key="port.id"
								class="block-complex__content_col-value"
							>
								<slot
									name="port"
									:item="port"
									:index="index"
									:disabled="disabled"
									position="right"
								/>
							</div>
						</div>
					</div>
				</div>
				<div
					v-if="showAuxSection"
					class="block-complex__aux-section"
				>
					<slot name="auxSectionLabel" />
					<div class="block-complex__aux-ports">
						<div
							v-for="(item, index) in auxPortItems"
							:key="item.id"
							class="block-complex__aux-port-item"
							:class="{ '--inactive': !item.type || item.isActive === false }"
						>
							<BxText
								size='sm'
								class="block-complex__aux-port-title"
							>
								{{ item.title }}
							</BxText>
							<div class="block-complex__aux-port-point">
								<slot
									:name="item.type ? 'auxPort' : 'auxPortPlaceholder'"
									:item="item"
									:index="index"
									:disabled="disabled"
									:isActive="item.isActive !== false"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
};
