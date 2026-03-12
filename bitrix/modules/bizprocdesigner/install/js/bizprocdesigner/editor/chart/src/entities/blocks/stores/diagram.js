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
	TimestampMap,
} from '../../../shared/types';

export type PortType = 'input' | 'output' | 'aux' | 'top_aux';

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
		blockCurrentPublishErrors: {},
		connectionCurrentTimestamps: {},
		connectionSavedTimestamps: {},
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
			connectionCurrentTimestamps: state.connectionCurrentTimestamps,
			connectionSavedTimestamps: state.connectionSavedTimestamps,
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
			this.blocks = diagramData?.blocks ?? [];
			this.connections = diagramData?.connections ?? [];

			const now = Date.now();
			for (const block of this.blocks)
			{
				this.blockCurrentTimestamps[block.id] = block.node.updated ?? now;
			}

			for (const block of diagramData.publishedBlocks)
			{
				this.blockSavedTimestamps[block.id] = block.node.published ?? now;
			}

			for (const connection of this.connections)
			{
				this.connectionCurrentTimestamps[connection.id] = connection.createdAt ?? now;
			}

			for (const connection of diagramData.publishedConnection)
			{
				this.connectionSavedTimestamps[connection.id] = connection.createdAt ?? now;
			}
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
			delete this.blockCurrentTimestamps[blockId];
		},
		setBlockCurrentTimestamp(block: Block): void
		{
			this.blockCurrentTimestamps[block.id] = Date.now();
		},
		setConnectionCurrentTimestamp(connectionId: string): void
		{
			this.connectionCurrentTimestamps[connectionId] = Date.now();
		},
		updateBlockActivityField(id: string, activity: ActivityData): void
		{
			const block = this.blocks.find((b) => b.id === id);
			if (block)
			{
				block.activity = activity;
			}
			this.updateBlockTimestamp(block);
			this.clearBlockErrorStatus(id);
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
		setPorts(blockId: BlockId, ports: Array<Port>): void
		{
			const block = this.blocks.find((b) => b.id === blockId);
			if (!block)
			{
				return;
			}

			block.ports = ports;
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
					},
				})),
				connections: this.connections.map((connection) => ({
					...connection,
					createdAt: this.connectionCurrentTimestamps[connection.id],
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
			const now = Date.now();
			const requestData = {
				...this.diagramData,
				blocks: this.blocks.map((block) => ({
					...block,
					node: {
						...block.node,
						updated: now,
						published: now,
					},
				})),
				connections: this.connections.map((connection) => ({
					...connection,
					createdAt: this.connectionCurrentTimestamps[connection.id],
				})),
			};

			try
			{
				const { templateId } = await editorAPI.publicDiagramData(requestData);
				this.blockCurrentPublishErrors = {};
				if (Type.isNumber(templateId))
				{
					this.blockSavedTimestamps = { ...this.blockCurrentTimestamps };
					this.connectionSavedTimestamps = { ...this.connectionCurrentTimestamps };
					this.templateId = templateId;
					this.draftId = 0;
				}
			}
			catch (e)
			{
				if (Type.isArrayFilled(e.data?.activityErrors))
				{
					this.setBlocksErrorStatus(e.data.activityErrors);
				}

				throw e;
			}
		},
		setBlocksErrorStatus(activityErrors: Array<{ code: string, activityName: string, message: string }>)
		{
			this.blockCurrentPublishErrors = {};

			activityErrors.forEach((error) => {
				const { activityName, code } = error;
				if (!Type.isStringFilled(activityName))
				{
					return;
				}

				this.blockCurrentPublishErrors[activityName] = { code };
			});
		},
		clearBlockErrorStatus(blockId: BlockId): void
		{
			delete this.blockCurrentPublishErrors[blockId];
		},
		updateStatus(isOnline: boolean)
		{
			this.isOnline = isOnline;
		},
		updateBlockTimestamp(block)
		{
			this.blockCurrentTimestamps[block.id] = Date.now();
		},
		setBlockCurrentTimestamps(blockCurrentTimestamps: ?TimestampMap): void
		{
			Object.keys(this.blockCurrentTimestamps).forEach((key) => delete this.blockCurrentTimestamps[key]);
			Object.assign(this.blockCurrentTimestamps, blockCurrentTimestamps ?? {});
		},
		setConnectionCurrentTimestamps(connectionCurrentTimestamps: ?TimestampMap): void
		{
			Object.keys(this.connectionCurrentTimestamps).forEach((key) => delete this.connectionCurrentTimestamps[key]);
			Object.assign(this.connectionCurrentTimestamps, connectionCurrentTimestamps ?? {});
		},
		setDiagramData(diagramData: DiagramData): void
		{
			this.templateId = diagramData.templateId;
			this.documentType = diagramData.documentType;
			this.companyName = diagramData.companyName;
			this.template = diagramData.template;
			this.blocks = diagramData.blocks;
			this.connections = diagramData.connections;
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
		updateNodeTitle(blockId: BlockId, title: string): void
		{
			const block = this.blocks.find((b) => b.id === blockId);
			if (!block)
			{
				return;
			}

			block.node.title = title;
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
			const actionLabel =	newActivatedState === 'N'
				? (Loc.getMessage('BIZPROCDESIGNER_STORES_DIAGRAM_ACTIVATE_OFF') ?? '')
				: (Loc.getMessage('BIZPROCDESIGNER_STORES_DIAGRAM_ACTIVATE_ON') ?? '')
			;
			const applyChanges = () => {
				block.activity.Activated = newActivatedState;
				this.updateBlockActivityField(blockId, block.activity);
				UI.Notification.Center.notify({
					content: actionLabel,
					autoHideDelay: 4000,
				});
			};

			if (skipDraft)
			{
				applyChanges();

				return;
			}

			try
			{
				applyChanges();
				await this.publicDraft();
			}
			catch (error)
			{
				handleResponseError(error);
			}
		},
		updateBlockPublishStatus(block: Block): void
		{
			try
			{
				this.setBlockCurrentTimestamp(block);
				this.publicDraft();
				this.updateStatus(true);
			}
			catch
			{
				this.updateStatus(false);
			}
		},
		addBlock(block: Block): void
		{
			this.blocks.push(block);
		},
		updateFrameColorName(blockId: BlockId, colorName: string): void
		{
			const block = this.blocks.find((b) => b.id === blockId);
			if (!block)
			{
				return;
			}

			block.node.frameColorName = colorName;
		},
	},
});
