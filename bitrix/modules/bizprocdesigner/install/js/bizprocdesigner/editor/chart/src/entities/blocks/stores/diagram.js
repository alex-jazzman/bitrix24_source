import { Type, Loc } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { defineStore } from 'ui.vue3.pinia';
import { UI } from 'ui.notification';

import { editorAPI } from '../../../shared/api';
import { getBlockMap, isBlockPropertiesDifferent } from '../utils';
import { handleResponseError } from '../../../shared/utils';
import { TEMPLATE_PUBLISH_STATUSES } from '../constants';
import { parseItemsFromBlocksJson } from '../utils/constant-helpers';

import type {
	ActivityData,
	Block,
	BlockId,
	DiagramData,
	Connection,
	PortId,
	Port,
	DiagramTemplate,
} from '../../../shared/types';
import { PORT_TYPES } from '../../../shared/constants';

export type PortType = 'input' | 'output' | 'aux' | 'top_aux';

type PortParams = {
	portId: PortId,
	type: PortType,
	label: string,
	portTitle?: string,
};

const PORT_LABELS = Object.freeze({
	input: 'G',
	output: 'E',
});

const PORT_POSITIONS = Object.freeze({
	left: 'left',
	right: 'right',
});

const BLOCK_TYPES = {
	SetupTemplateActivity: 'SetupTemplateActivity',
};

export const diagramStore = defineStore('bizprocdesigner-editor-diagram', {
	state: (): DiagramData => ({
		templateId: 0,
		draftId: 0,
		documentType: [],
		documentTypeSigned: '',
		companyName: '',
		template: {},
		blocks: [],
		connections: [],
		isOnline: true,
		blockCurrentTimestamps: {},
		blockSavedTimestamps: {},
		templatePublishStatus: TEMPLATE_PUBLISH_STATUSES.MAIN,
	}),
	getters: {
		diagramData: (state): DiagramData => ({
			templateId: state.templateId,
			draftId: state.draftId,
			documentType: state.documentType,
			documentTypeSigned: state.documentTypeSigned,
			companyName: state.companyName,
			template: state.template,
			blocks: state.blocks,
			connections: state.connections,
			isOnline: state.isOnline,
			blockCurrentTimestamps: state.blockCurrentTimestamps,
			blockSavedTimestamps: state.blockSavedTimestamps,
		}),
	},
	actions: {
		initEventListeners(): void
		{
			EventEmitter.subscribe(
				'Bizproc:onConstantsUpdated',
				this.updateTemplateConstants.bind(this),
			);
		},
		getBlockAncestors(block: Block): Array<Block>
		{
			const inputs = this.getInputConnections(block);

			return inputs.map(
				(connection) => this.blocks.find((b) => b.id === connection.sourceBlockId),
			);
		},
		getBlockAncestorsByInputPortId(block: Block, portId: PortId): Array<Block>
		{
			return this.getInputConnections(block)
				.filter((connection) => connection.targetPortId === portId)
				.map((connection) => this.blocks.find((b) => b.id === connection.sourceBlockId))
			;
		},
		getInputConnections(block: Block): Array<Connection>
		{
			return this.connections.filter((connection) => connection.targetBlockId === block.id);
		},
		getAllBlockAncestors(block: Block, targetPortId: ?PortId): Array<Block>
		{
			const stack = [];
			const blocks = new Map([[block.id, block]]);
			let inputs = this.getInputConnections(block);
			if (targetPortId)
			{
				inputs = inputs.filter((connection) => connection.targetPortId === targetPortId);
			}
			stack.push(...inputs);

			while (stack.length > 0)
			{
				const connection = stack.shift();
				this.blocks.filter((b) => b.id === connection.sourceBlockId).forEach((b) => {
					if (!blocks.has(b.id))
					{
						blocks.set(b.id, b);
						stack.push(...this.getInputConnections(b));
					}
				});
			}

			blocks.delete(block.id);

			return [...blocks.values()];
		},
		async refreshDiagramData(
			params: {
				templateId: Number,
				documentType: ?Array,
				startTrigger: ?string,
			},
		): Promise<void>
		{
			const diagramData = await editorAPI.getDiagramData(params);
			this.templateId = diagramData?.templateId ?? 0;
			this.draftId = diagramData?.draftId ?? 0;
			this.companyName = diagramData?.companyName ?? '';
			this.documentType = diagramData?.documentType ?? [];
			this.documentTypeSigned = diagramData?.documentTypeSigned ?? '';
			this.template = diagramData?.template ?? {};
			this.blocks = this.normalyzeBlocks(diagramData?.blocks ?? []);
			this.setConnections(diagramData?.connections ?? []);

			for (const block of this.blocks)
			{
				const now = Date.now();
				this.blockCurrentTimestamps[block.id] = block.node.updated ?? now;
				this.blockSavedTimestamps[block.id] = block.node.published ?? now;
			}
		},
		normalyzeBlocks(blocks: Array<Block>): Array<Block>
		{
			return blocks.map((block) => {
				const groupedPorts = Object.entries(block.ports)
					.reduce((portsMap, [type, ports]) => {
						portsMap[type] = ports?.map((port) => ({ ...port, type })) ?? [];

						return portsMap;
					}, {});

				return {
					...block,
					ports: groupedPorts,
				};
			});
		},
		getDeleteHandlerForBlockType(blockType: string): ?Function
		{
			if (blockType === BLOCK_TYPES.SetupTemplateActivity)
			{
				return this.handleDeletingConstants;
			}

			return null;
		},
		handleDeletingConstants(block: Block): void
		{
			const rawConstants = block.activity?.Properties?.blocks;
			const constants = this.template?.CONSTANTS;

			if (!constants)
			{
				return;
			}

			const items = parseItemsFromBlocksJson(rawConstants);

			items
				.filter((item) => item?.itemType === 'constant' && item.id in constants)
				.forEach((item) => {
					delete constants[item.id];
				});
		},
		deleteConnectionByBlockIdAndPortId(blockId, portId): void
		{
			this.connections = this.connections.filter((connection) => {
				const {
					sourceBlockId,
					sourcePortId,
					targetBlockId,
					targetPortId,
				} = connection;
				const isSource = sourceBlockId === blockId && sourcePortId === portId;
				const isTarget = targetBlockId === blockId && targetPortId === portId;

				return !isSource && !isTarget;
			});
		},
		deleteBlockById(blockId): void
		{
			const blockIndex = this.blocks.findIndex((block) => block.id === blockId);

			if (blockIndex === -1)
			{
				return;
			}

			const blockToDelete = this.blocks[blockIndex];
			const blockType = blockToDelete.activity?.Type;

			const handler = this.getDeleteHandlerForBlockType(blockType);

			if (handler)
			{
				handler.call(this, blockToDelete);
			}
			Object.values(this.blocks[blockIndex].ports)
				.filter((ports): boolean => Type.isArray(ports))
				.forEach((ports: Array<Port>): void => {
					ports.forEach(({ id }): void => {
						this.deleteConnectionByBlockIdAndPortId(blockId, id);
					});
				});

			this.blocks.splice(blockIndex, 1);
		},
		setBlockCurrentTimestamp(block: Block): void
		{
			this.blockCurrentTimestamps[block.id] = Date.now();
		},
		updateBlockActivityField(id: string, activity: ActivityData): void
		{
			const block = this.blocks.find((b) => b.id === id);
			if (block)
			{
				block.activity = activity;
			}
			this.updateBlockTimestamp(block);
		},
		updateBlockId(oldId: string, newId: string): void
		{
			if (oldId === newId)
			{
				return;
			}

			const block = this.blocks.find((b) => b.id === oldId);

			if (block)
			{
				this.blockCurrentTimestamps[newId] = this.blockCurrentTimestamps[block.id];
				this.blockSavedTimestamps[newId] = this.blockSavedTimestamps[block.id];

				delete this.blockCurrentTimestamps[block.id];
				delete this.blockSavedTimestamps[block.id];

				block.id = newId;
			}

			this.connections.forEach((connection, index) => {
				let updated = false;

				if (connection.sourceBlockId === oldId)
				{
					this.connections[index].sourceBlockId = newId;
					updated = true;
				}

				if (connection.targetBlockId === oldId)
				{
					this.connections[index].targetBlockId = newId;
					updated = true;
				}

				if (updated)
				{
					this.connections[index].id = `${this.connections[index].sourceBlockId}_${this.connections[index].targetBlockId}`;
				}
			});
		},
		updateTitle(newTitle: string): void
		{
			this.template.NAME = newTitle;
		},
		updateDescription(newDescription: string): void
		{
			this.template.DESCRIPTION = newDescription;
		},
		updateTemplateId(templateId: number): void
		{
			this.templateId = templateId;
		},
		setBlocks(blocks: Block[]): void
		{
			this.blocks = blocks;
		},
		setConnections(connections: []): void
		{
			this.connections = connections;
		},
		setBlockUnpublished(needBlock: Block)
		{
			const blockIndex = this.blocks.findIndex((block) => block.id === needBlock.id);

			if (blockIndex === -1)
			{
				return;
			}

			this.blocks[blockIndex].node.publicationState = false;
		},
		setInputPorts(block: Block, inputPorts: Array<Port>): void
		{
			Object.assign(block.ports, { input: inputPorts });
		},
		async updateTemplateData(data: DiagramTemplate)
		{
			await editorAPI.updateTemplateData({
				templateId: this.templateId,
				data,
			});
		},
		async publicDraft()
		{
			const requestData = {
				...this.diagramData,
				blocks: this.blocks.map((block) => ({
					...block,
					node: {
						...block.node,
						updated: this.blockCurrentTimestamps[block.id],
						published: this.blockSavedTimestamps[block.id],
					},
				})),
			};

			const { templateDraftId } = await editorAPI.publicDiagramDataDraft(requestData);
			if (Type.isNumber(templateDraftId))
			{
				this.draftId = templateDraftId;
			}
		},
		async publicTemplate()
		{
			const requestData = {
				...this.diagramData,
				blocks: this.blocks.map((block) => ({
					...block,
					node: {
						...block.node,
						updated: null,
						published: null,
					},
				})),
			};

			const { templateId } = await editorAPI.publicDiagramData(requestData);
			if (Type.isNumber(templateId))
			{
				this.blockSavedTimestamps = { ...this.blockCurrentTimestamps };
				this.templateId = templateId;
				this.draftId = 0;
			}
		},
		updateStatus(isOnline: boolean)
		{
			this.isOnline = isOnline;
		},
		updateBlockTimestamp(block)
		{
			this.blockCurrentTimestamps[block.id] = Date.now();
		},
		setBlockCurrentTimestamps(blockCurrentTimestamps)
		{
			Object.assign(this.blockCurrentTimestamps, blockCurrentTimestamps);
		},
		updateExistedBlockProperties(newBlocks: Block[]): void
		{
			const currentBlockMap: Map<BlockId, Block> = getBlockMap(this.blocks);
			for (const newBlock: Block of newBlocks)
			{
				const currentBlock: ?Block = currentBlockMap.get(newBlock.id);
				if (
					currentBlock
					&& currentBlock.activity
					&& currentBlock.activity.Properties
					&& isBlockPropertiesDifferent(currentBlock, newBlock)
				)
				{
					for (const [key: string] of Object.entries(newBlock.activity.Properties))
					{
						currentBlock.activity.Properties[key] = newBlock.activity.Properties[key];
					}
					currentBlock.node.title = newBlock.node.title;
				}
			}
		},
		updateNodeTitle(block: Block, title: string): void
		{
			Object.assign(block.node, { title });
		},
		createPort(ports: Array<Port>, { portId, type, label, portTitle }: PortParams): Port
		{
			const lastPort = ports[ports.length - 1] ?? null;
			const [, count] = (lastPort?.title?.split(label) ?? []);
			const title = portTitle ?? `${label}${Number(count ?? 0) + 1}`;

			return {
				id: portId,
				title,
				type,
				position: type === PORT_TYPES.input ? PORT_POSITIONS.left : PORT_POSITIONS.right,
			};
		},
		addRulePort(blockId: BlockId, portId: string, type: PortType, portTitle: ?string): void
		{
			const block = this.blocks.find((b) => b.id === blockId);
			if (!block)
			{
				return;
			}

			const { ports } = block;
			let currentPorts = ports.input;
			let label = PORT_LABELS.input;
			if (type === PORT_TYPES.output)
			{
				currentPorts = ports.output;
				label = PORT_LABELS.output;
			}

			const rulePorts = currentPorts.filter((p) => !p.isConnectionPort);
			const port = this.createPort(rulePorts, { portId, type, label, portTitle });
			currentPorts.push(port);
		},
		addConnectionPort(blockId: BlockId, portId: string, type: PortType): void
		{
			const block = this.blocks.find((b) => b.id === blockId);
			if (!block)
			{
				return;
			}

			const { ports } = block;
			const currentPorts = type === PORT_TYPES.input ? ports.input : ports.output;
			const connectionPorts = currentPorts.filter((p) => p.isConnectionPort);
			const port = this.createPort(connectionPorts, { portId, type, label: 'NG' });
			currentPorts.push({ ...port, isConnectionPort: true });
		},
		deletePort(blockId: BlockId, portId: string, type?: PortType): void
		{
			const block = this.blocks.find((b) => b.id === blockId);
			if (!block)
			{
				return;
			}

			const { ports } = block;
			const currentPorts = type === PORT_TYPES.output ? ports.output : ports.input;

			const deletedPort = currentPorts.find((port) => portId === port.id);
			currentPorts.splice(currentPorts.indexOf(deletedPort), 1);
		},
		updateTemplateConstants(event): void
		{
			const { constantsToUpdate, deletedConstantIds } = event.getData();

			if (!this.template.CONSTANTS)
			{
				this.template.CONSTANTS = {};
			}

			let updatedConstants = { ...this.template.CONSTANTS };

			if (Type.isArrayFilled(deletedConstantIds))
			{
				for (const id of deletedConstantIds)
				{
					delete updatedConstants[id];
				}
			}
			updatedConstants = {
				...updatedConstants,
				...constantsToUpdate,
			};

			this.template.CONSTANTS = updatedConstants;
		},
		setSizeAutosizedBlock(blockId: string, width: number, height: number): void
		{
			const blockIndex = this.blocks.findIndex((block) => block.id === blockId);

			if (blockIndex < 0)
			{
				return;
			}

			this.blocks[blockIndex].dimensions.width = width;
			this.blocks[blockIndex].dimensions.height = height;
		},
		async toggleBlockActivation(blockId: BlockId, skipDraft: boolean = false): Promise<void>
		{
			const block = this.blocks.find((b) => b.id === blockId);
			if (!block)
			{
				return;
			}

			const newActivatedState = block.activity.Activated === 'Y' ? 'N' : 'Y';
			const applyChanges = () => {
				block.activity.Activated = newActivatedState;
				this.updateBlockActivityField(blockId, block.activity);
			};

			if (skipDraft)
			{
				applyChanges();

				return;
			}

			const actionLabel = newActivatedState === 'N'
				? (Loc.getMessage('BIZPROCDESIGNER_STORES_DIAGRAM_ACTIVATE_OFF') ?? '')
				: (Loc.getMessage('BIZPROCDESIGNER_STORES_DIAGRAM_ACTIVATE_ON') ?? '');
			try
			{
				applyChanges();
				await this.publicDraft();
				UI.Notification.Center.notify({
					content: actionLabel,
					autoHideDelay: 4000,
				});
			}
			catch (error)
			{
				handleResponseError(error);
			}
		},
	},
});
