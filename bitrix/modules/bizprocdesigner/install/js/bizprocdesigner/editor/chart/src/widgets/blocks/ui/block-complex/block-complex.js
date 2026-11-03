import { type MenuItemOptions } from 'ui.vue3.components.menu';

import { MoveableBlock, Port, useBlockDiagram } from 'ui.block-diagram';

import { IconDivider, IconButton } from '../../../../shared/ui';
import {
	BlockContainer,
	BlockLayout,
	BlockHeader,
	BlockIcon,
	BlockComplexContent,
	BlockComplexPortPlaceholder,
	OutputUnreachableMark,
	PortsLayout,
	BlockTopTitle,
	getBlockUserTitle,
	validationInputOutputRule,
	normalyzeInputOutputConnection,
	validationAuxRule,
	normalyzeAuxConnection,
	shouldAnimateBlock,
	getComplexNodeMinRuleItemsCount,
} from '../../../../entities/blocks';
import {
	DeleteBlockIconBtn,
	UpdatePublishedStatusLabel,
	ChangeActivationTopBtn,
} from '../../../../features/blocks';
import { getUnreachableOutputPortIds, useNodeSettingsStore } from '../../../../entities/node-settings';
import { BlockLayoutWidget } from '../block-layout/block-layout';

import { BlockMediator } from '../../lib';

import { PORT_TYPES, MAX_AUX_COUNT } from '../../../../shared/constants';
import { useLoc } from '../../../../shared/composables';
import { type Block, type BlockId, type Port as TPort, type PortId } from '../../../../shared/types';

const DEFAULT_BLOCK_WIDTH = 260;
const SWITCH_NODE_ACTIVITY = 'SwitchNode';
const SWITCH_NODE_WIDTH = 180;

type Props = {
	block: Block,
};

type Setup = {
	blockMediator: BlockMediator,
	getMessage: () => string,
	addConnection: (connection: Object) => void,
};

// @vue/component
export const BlockComplex = {
	name: 'block-complex',
	components: {
		MoveableBlock,
		BlockContainer,
		BlockLayout,
		BlockLayoutWidget,
		BlockHeader,
		BlockIcon,
		DeleteBlockIconBtn,
		IconDivider,
		IconButton,
		PortsLayout,
		BlockComplexContent,
		BlockComplexPortPlaceholder,
		OutputUnreachableMark,
		UpdatePublishedStatusLabel,
		BlockTopTitle,
		Port,
		ChangeActivationTopBtn,
	},
	props: {
		/** @type Block */
		block: {
			type: Object,
			required: true,
		},
	},
	setup(props: Props): Setup
	{
		const { getMessage } = useLoc();
		const { addConnection } = useBlockDiagram();
		const nodeSettingsStore = useNodeSettingsStore();

		return {
			blockMediator: new BlockMediator(),
			nodeSettingsStore,
			// Stable prop references for the virtual <Port> slots so they do not
			// re-render on every BlockComplex render (all of them live outside
			// reactive state: the rules array keeps its identity, a cache entry is
			// per item.id). Input rules, output rules and the relation entry point are
			// droppable at the same time, so they keep separate caches and never evict
			// each other.
			virtualPortValidationRules: [validationInputOutputRule],
			virtualInputPortCache: new Map(),
			virtualOutputPortCache: new Map(),
			virtualRelationPortCache: new Map(),
			virtualAuxPortCache: new Map(),
			validationInputOutputRule,
			normalyzeInputOutputConnection,
			validationAuxRule,
			normalyzeAuxConnection,
			getMessage,
			shouldAnimateBlock,
			addConnection,
		};
	},
	computed:
	{
		userTitle(): ?string
		{
			return getBlockUserTitle(this.block);
		},
		auxPortsCount(): number
		{
			return this.block.ports.filter((port) => {
				return port.type === PORT_TYPES.aux && port.isActive !== false;
			}).length;
		},
		isSwitchNode(): boolean
		{
			return this.block.activity?.Type === SWITCH_NODE_ACTIVITY;
		},
		blockWidth(): number
		{
			if (this.isSwitchNode)
			{
				return SWITCH_NODE_WIDTH;
			}

			return this.block.dimensions?.width ?? DEFAULT_BLOCK_WIDTH;
		},
		minRuleItemsCount(): number
		{
			if (this.block)
			{
				return getComplexNodeMinRuleItemsCount(this.block);
			}

			return getComplexNodeMinRuleItemsCount(
				this.isSwitchNode ? { activity: { Type: SWITCH_NODE_ACTIVITY } } : undefined,
			);
		},
		contextMenuItems(): Array<MenuItemOptions>
		{
			return this.blockMediator.getCommonBlockMenuOptions(this.block);
		},
		/**
		 * Answered once per block: the sources are assembled here and every output port of the
		 * column reads its state off the resulting set.
		 *
		 * Once the settings panel of this block has loaded, its rules are the only source - an output
		 * whose "Output" construction has just been dropped is unreachable right away, before the save.
		 */
		unreachableOutputPortIds(): Set<PortId>
		{
			const settings = this.nodeSettingsStore;
			const areSettingsLoaded = this.blockMediator.areSettingsLoadedForBlock(this.block.id);

			const outputPortIds = this.blockMediator.getComplexBlockPorts(this.block)
				.filter((port: TPort) => port.type === PORT_TYPES.output)
				.map((port: TPort) => port.id);

			return new Set(getUnreachableOutputPortIds(outputPortIds, {
				settingsRules: areSettingsLoaded ? (settings.nodeSettings?.rules ?? null) : null,
				activityProperties: this.block.activity?.Properties ?? null,
			}));
		},
	},
	methods:
	{
		// The port slot is shared by input rules, outputs and relation ports, so the mark is created only
		// where it can show up at all: relation outputs live outside the rule and no construction points at them.
		isOutputUnreachable(port: TPort): boolean
		{
			return port.type === PORT_TYPES.output && this.unreachableOutputPortIds.has(port.id);
		},
		onMaterializeInputDrop(item: { title: string }, connection: Object): void
		{
			const portId = this.blockMediator.addComplexBlockPort(this.block, item.title);
			if (!portId || !connection)
			{
				return;
			}

			this.addConnection({
				...this.normalyzeInputOutputConnection(connection),
				targetBlockId: this.block.id,
				targetPortId: portId,
			});
		},
		// The dropped connection starts at an input port of another node, so normalyzation
		// already turns this block into its source: only the placeholder id has to be
		// replaced with the id of the materialized port.
		onMaterializeOutputDrop(item: { title: string }, connection: Object): void
		{
			const portId = this.blockMediator.addComplexBlockOutputPort(this.block, item.title);
			if (!portId || !connection)
			{
				return;
			}

			this.addConnection({
				...this.normalyzeInputOutputConnection(connection),
				sourceBlockId: this.block.id,
				sourcePortId: portId,
			});
		},
		virtualInputPort(item: { id: string, title: string }): Object
		{
			return this.getVirtualPortEntry(this.virtualInputPortCache, item, PORT_TYPES.input).port;
		},
		virtualInputDrop(item: { id: string, title: string }): (connection: Object) => void
		{
			return this.getVirtualPortEntry(this.virtualInputPortCache, item, PORT_TYPES.input).onDrop;
		},
		virtualOutputPort(item: { id: string, title: string }): Object
		{
			return this.getVirtualPortEntry(this.virtualOutputPortCache, item, PORT_TYPES.output).port;
		},
		virtualOutputDrop(item: { id: string, title: string }): (connection: Object) => void
		{
			return this.getVirtualPortEntry(this.virtualOutputPortCache, item, PORT_TYPES.output).onDrop;
		},
		virtualRelationPort(item: { id: string, title: string }): Object
		{
			return this.getVirtualPortEntry(this.virtualRelationPortCache, item, PORT_TYPES.inputRelation).port;
		},
		virtualRelationDrop(item: { id: string, title: string }): (connection: Object) => void
		{
			return this.getVirtualPortEntry(this.virtualRelationPortCache, item, PORT_TYPES.inputRelation).onDrop;
		},
		virtualAuxPort(item: { id: string, title: string }): Object
		{
			return this.getVirtualPortEntry(this.virtualAuxPortCache, item, PORT_TYPES.aux).port;
		},
		virtualAuxDrop(item: { id: string, title: string }): (connection: Object) => void
		{
			return this.getVirtualPortEntry(this.virtualAuxPortCache, item, PORT_TYPES.aux).onDrop;
		},
		getVirtualPortEntry(cache: Map, item: { id: string, title: string }, type: string): Object
		{
			const cached = cache.get(item.id);
			if (cached && cached.title === item.title)
			{
				return cached;
			}

			if (type === PORT_TYPES.aux)
			{
				cache.delete(item.id);
			}
			else
			{
				// Only one slot per non-AUX column is droppable at a time.
				cache.clear();
			}
			// The port type tells which column the slot belongs to, and the column
			// decides both the side the port sticks out of and what a drop materializes.
			const isOutput = type === PORT_TYPES.output;
			const isAux = type === PORT_TYPES.aux;
			const entry = {
				title: item.title,
				port: {
					id: item.id,
					title: item.title,
					type,
					position: isOutput ? 'right' : (isAux ? 'bottom' : 'left'),
				},
				onDrop: (connection: Object) => {
					if (isAux)
					{
						this.onAddAuxPort({ title: item.title, connection });
					}
					else if (isOutput)
					{
						this.onMaterializeOutputDrop(item, connection);
					}
					else
					{
						this.onMaterializeInputDrop(item, connection);
					}
				},
			};
			cache.set(item.id, entry);

			return entry;
		},
		onAddAuxPort({ title, connection }: { title: string, connection?: Object }): void
		{
			const existingAuxPort = this.block.ports.find((port) => port.type === PORT_TYPES.aux && port.title === title);
			if (this.auxPortsCount >= MAX_AUX_COUNT && !existingAuxPort)
			{
				return;
			}

			if (connection)
			{
				const nextTargetPort = existingAuxPort ?? {
					id: connection.targetPortId,
					title,
					type: PORT_TYPES.aux,
					position: 'bottom',
				};
				if (!this.validationAuxRule({ ...connection, targetPort: { ...nextTargetPort, isActive: true } }))
				{
					return;
				}
			}

			const portId = this.blockMediator.addAuxPort(this.block, title);
			if (!portId || !connection)
			{
				return;
			}

			const targetPort = this.block.ports.find((port) => port.id === portId) ?? {
				id: portId,
				title,
				type: PORT_TYPES.aux,
				position: 'bottom',
			};

			this.addConnection(this.normalyzeAuxConnection({
				...connection,
				targetBlockId: this.block.id,
				targetPortId: portId,
				targetPort,
			}));
		},
		onDeletedBlock(blockId: BlockId): void
		{
			this.blockMediator.hideCurrentBlockSettings(blockId);
			if (this.blockMediator.isCurrentComplexBlock(blockId))
			{
				this.blockMediator.resetComplexBlockSettings();
			}
		},
	},
	template: `
		<MoveableBlock :block="block">
			<template #default="{ isHighlighted, isDragged, isDisabled, isMakeNewConnection }">
				<BlockContainer
					:block="block"
					:width="blockWidth"
					:contextMenuItems="contextMenuItems"
					:highlighted="isHighlighted && !isDragged"
					:disabled="isDisabled"
					:hoverable="!isMakeNewConnection"
					@mouseup="blockMediator.handleMouseUp($event, block)"
					@mousedown="blockMediator.handleMouseDown($event)"
				>
					<template #default="{ isBlockActivated }">
						<BlockLayoutWidget
							:block="block"
							:moreMenuItems="contextMenuItems"
							:dragged="isDragged"
							:disabled="isDisabled"
							:hoverable="!isMakeNewConnection"
						>
							<template #top-menu-title>
								<BlockTopTitle
									:title="userTitle"
									:description="block.activity.Properties.EditorComment"
								/>
							</template>
							<template #top-menu>
								<DeleteBlockIconBtn
									:blockId="block.id"
									:disabled="isDisabled"
									@deletedBlock="onDeletedBlock($event)"
								/>
								<IconDivider/>
								<ChangeActivationTopBtn :block="block"/>
							</template>

							<template #header>
								<BlockHeader
									:block="block"
									:deactivated="!isBlockActivated"
								>
									<template #icon>
										<BlockIcon
											:iconName="block.node.icon"
											:iconColorIndex="block.node.colorIndex"
											:deactivated="!isBlockActivated"
											:blockId="block.id"
											:animate="shouldAnimateBlock(block)"
										/>
									</template>
								</BlockHeader>
							</template>

							<template #default>
								<BlockComplexContent
									:block="block"
									:ports="blockMediator.getComplexBlockPorts(block)"
									:title="blockMediator.getComplexBlockTitle(block)"
									:disabled="isDisabled"
									:deactivated="!isBlockActivated"
									:minRuleItemsCount="minRuleItemsCount"
								>
									<template #header="{ title }">
									</template>
									<template #portPlaceholder="{ item, isOutput, isInputDroppable, isOutputDroppable, isRelationDroppable, index, disabled }">
										<template v-if="isInputDroppable || isRelationDroppable">
											<Port
												:block="block"
												:port="isRelationDroppable ? virtualRelationPort(item) : virtualInputPort(item)"
												:index="index"
												:disabled="disabled"
												:validationRules="virtualPortValidationRules"
												:position="'left'"
												:isVirtual="true"
												:onVirtualDrop="isRelationDroppable ? virtualRelationDrop(item) : virtualInputDrop(item)"
											/>
											<span class="complex-block-port-placeholder-title">
												{{ item.title }}
											</span>
										</template>
										<template v-else-if="isOutputDroppable">
											<Port
												:block="block"
												:port="virtualOutputPort(item)"
												:index="index"
												:disabled="disabled"
												:validationRules="virtualPortValidationRules"
												:position="'right'"
												:isVirtual="true"
												:onVirtualDrop="virtualOutputDrop(item)"
											/>
											<span
												class="complex-block-port-placeholder-title --output"
												:data-testid="'bizprocdesigner-block-complex-output-port-droppable-' + item.title"
											>
												{{ item.title }}
											</span>
										</template>
										<BlockComplexPortPlaceholder
											v-else
											:title="item.title"
											:isOutput="isOutput"
										/>
									</template>
									<template #port="{ item, disabled, position, index }">
										<Port
											:block="block"
											:port="item"
											:index="index"
											:disabled="disabled"
											:validationRules="[validationInputOutputRule]"
											:normalyzeConnectionFn="normalyzeInputOutputConnection"
											:position="position"
										/>
										<OutputUnreachableMark
											v-if="isOutputUnreachable(item)"
											:portTitle="item.title"
											unreachable
										/>
										<span class="block-complex__content_col-value-text">
											{{ item.title }}
										</span>
									</template>
									<template #auxSectionLabel>
										<div class="block-complex__aux-section-label">
											<span class="block-complex__aux-section-label-text">
												{{ getMessage('BIZPROCDESIGNER_EDITOR_COMPLEX_NODE_AUX_LAYOUT_TITLE') }}
											</span>
										</div>
									</template>
									<template #auxPort="{ item, index }">
										<Port
											:block="block"
											:port="item"
											:disabled="isDisabled"
											:styled="false"
											:validationRules="[validationAuxRule]"
											:normalyzeConnectionFn="normalyzeAuxConnection"
											:index="index"
											position="bottom"
										/>
									</template>
									<template #auxPortPlaceholder="{ item, index }">
										<Port
											:block="block"
											:port="virtualAuxPort(item)"
											:index="index"
											:disabled="isDisabled"
											:validationRules="[validationAuxRule]"
											:position="'bottom'"
											:isVirtual="true"
											:onVirtualDrop="virtualAuxDrop(item)"
										/>
									</template>
								</BlockComplexContent>
							</template>

							<template #status>
								<UpdatePublishedStatusLabel :block="block"/>
							</template>
						</BlockLayoutWidget>
					</template>
				</BlockContainer>
			</template>
		</MoveableBlock>
	`,
};
