import { Type, Loc } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { markRaw } from 'ui.vue3';
import { defineStore } from 'ui.vue3.pinia';
import { MessageBox } from 'ui.dialogs.messagebox';
import { UI } from 'ui.notification';

import { editorAPI, type ApiError } from '../../../shared/api';
import { useToastStore } from '../../../shared/stores';
import { useNodeDataInspectorStore } from '../../../shared/stores/node-data-inspector-store';
import { useCatalogStore } from '../../catalog/stores';
import {
	getBlockMap,
	isBlockPropertiesDifferent,
	isTimestampMapChanged,
	parseItemsFromBlocksJson,
	buildContentBlockScope,
} from '../utils';
import { handleResponseError, getErrorCode } from '../../../shared/utils/response';
import { TEMPLATE_PUBLISH_STATUSES } from '../constants';
import { resolveVersionHistoryErrorMessage, useVersionHistoryStore } from './version-history';

import {
	type ActivityData,
	type Block,
	type BlockId,
	type Connection,
	type DiagramData,
	type DiagramGraphPublication,
	type DiagramState,
	type DiagramTemplate,
	type PilotState,
	type Port,
	type PortId,
	type TimestampMap,
} from '../../../shared/types';

export type PortType = 'input' | 'output' | 'aux' | 'top_aux' | 'inputRelation' | 'outputRelation';

const BLOCK_TYPES = {
	SetupTemplateActivity: 'SetupTemplateActivity',
};

const TEMPLATE_NOT_FOUND_ERROR_CODE = 'TEMPLATE_NOT_FOUND';
const RESTORE_UNDO_UNAVAILABLE_ERROR_CODE = 'TEMPLATE_RESTORE_UNDO_UNAVAILABLE';
const ACCESS_DENIED_ERROR_CODE = 'ACCESS_DENIED';
// The pilot an operation was aimed at is not there any more: it was stopped or replaced while this tab
// was open. The template itself is untouched, so this refusal locks nothing.
const PILOT_NOT_FOUND_ERROR_CODE = 'PILOT_NOT_FOUND';
const PILOT_CHANGED_ERROR_CODE = 'PILOT_CHANGED';

// Why the editor stopped accepting writes. The reason travels to the header so the hint names
// the real cause instead of the connection.
export const EDITOR_LOCK_REASONS = {
	TEMPLATE_DELETED: 'template-deleted',
	WRITE_ACCESS_LOST: 'write-access-lost',
};

export const SAVE_STATUSES = {
	IDLE: 'idle',
	SAVING: 'saving',
	SAVED: 'saved',
	ERROR: 'error',
};

const AUTOSAVE_MAX_ATTEMPTS = 3;

// The mode of a publication to an audience. An ordinary publication names no mode at all: the
// server reads its absence as a publication for everyone, and that is the behaviour that was here
// before the pilot existed.
const PILOT_PUBLISH_MODE = 'user';

// No pilot version and nothing to tell about its audience. The store starts here and comes back
// here for every answer that carries no pilot section - a portal with the feature switched off.
const NEUTRAL_PILOT_STATE = Object.freeze({
	hasPilot: false,
	pilotId: null,
	isCanvasPilot: false,
	publishedBy: null,
	publishedByName: null,
	publishedAt: null,
	audienceCount: null,
	hasCommonVersion: false,
	settingsFrozen: false,
});

// node.frame* — оформление подложки. Фиксированный allowlist: переносится напрямую по
// именам полей, без итерации по произвольным ключам, поэтому prototype pollution невозможен.
const FRAME_STYLE_KEYS = [
	'frameContent',
	'frameContentFiles',
	'frameColorName',
	'frameTextAlign',
	'frameSeparatorPosition',
];

// Array-valued frame keys are copied by value so the store never shares a mutable
// reference with the incoming agent payload.
const FRAME_ARRAY_KEYS = new Set(['frameContentFiles']);

// The server sends the draft save time as a unix timestamp in seconds, which is the same point in
// time as Date.now() reports. Storing it in milliseconds keeps lastSavedAt in one base with
// publicDraft(), so the relative label is correct in any time zone.
function toSavedAtMs(draftSavedAt: ?number): ?number
{
	if (!Type.isNumber(draftSavedAt) || draftSavedAt <= 0)
	{
		return null;
	}

	return draftSavedAt * 1000;
}

// The pilot section of the answer, field by field: a missing or malformed field falls back to its
// neutral value instead of travelling into the store as it came.
function readPilotState(pilot: ?PilotState): PilotState
{
	if (!Type.isPlainObject(pilot))
	{
		return {...NEUTRAL_PILOT_STATE };
	}

	return {
		hasPilot: pilot.hasPilot === true,
		pilotId: Type.isNumber(pilot.pilotId) ? pilot.pilotId : null,
		isCanvasPilot: pilot.isCanvasPilot === true,
		publishedBy: Type.isNumber(pilot.publishedBy) ? pilot.publishedBy : null,
		publishedByName: Type.isStringFilled(pilot.publishedByName) ? pilot.publishedByName : null,
		publishedAt: Type.isStringFilled(pilot.publishedAt) ? pilot.publishedAt : null,
		audienceCount: Type.isNumber(pilot.audienceCount) ? pilot.audienceCount : null,
		hasCommonVersion: pilot.hasCommonVersion === true,
		settingsFrozen: pilot.settingsFrozen === true,
	};
}

export const diagramStore = defineStore('bizprocdesigner-editor-diagram', {
	state: (): DiagramState => ({
		templateId: 0,
		draftId: 0,
		documentType: [],
		documentTypeSigned: '',
		companyName: '',
		template: {},
		blocks: [],
		connections: [],
		saveStatus: SAVE_STATUSES.IDLE,
		lastSavedAt: null,
		// Identifies the newest autosave chain: only it may write the terminal status.
		autosaveRunId: 0,
		// Tail of the draft save chain, see publicDraft(). markRaw: a promise is a handle, not data.
		draftSaveQueue: markRaw(Promise.resolve()),
		draftSavesInFlight: 0,
		blockCurrentTimestamps: {},
		blockSavedTimestamps: {},
		blockCurrentPublishErrors: {},
		connectionCurrentTimestamps: {},
		connectionSavedTimestamps: {},
		templatePublishStatus: TEMPLATE_PUBLISH_STATUSES.MAIN,
		canPublish: false,
		pilot: readPilotState(null),
		isPilotFeatureAvailable: false,
		// One warning per disappearance of the pilot: every next refusal of the same event describes
		// a pilot the editor already knows nothing about.
		isPilotGoneReported: false,
		isTemplateNotFound: false,
		isEditorReadonly: false,
		editorLockReason: null,
		isVersionViewMode: false,
		isVersionViewTransitionInProgress: false,
		isRestoreInProgress: false,
		isPublishing: false,
		canUndoRestore: false,
		graphRevision: 0,
	}),
	getters: {
		// Every write path shares one lock: a version snapshot on the canvas and a restore in
		// flight must never reach the draft - the first would overwrite it with a foreign graph,
		// the second would overwrite the backup copy the server has just made.
		isWriteLocked: (state): boolean => {
			return state.isEditorReadonly
				|| state.isVersionViewMode
				|| state.isVersionViewTransitionInProgress
				|| state.isRestoreInProgress
			;
		},
		diagramData(state): DiagramData
		{
			return {
				templateId: state.templateId,
				draftId: state.draftId,
				documentType: state.documentType,
				documentTypeSigned: state.documentTypeSigned,
				companyName: state.companyName,
				template: state.template,
				blocks: state.blocks,
				connections: state.connections,
				isOnline: this.isOnline,
				blockCurrentTimestamps: state.blockCurrentTimestamps,
				blockSavedTimestamps: state.blockSavedTimestamps,
				connectionCurrentTimestamps: state.connectionCurrentTimestamps,
				connectionSavedTimestamps: state.connectionSavedTimestamps,
			};
		},
		// Boolean facade over saveStatus for the existing header component and for the
		// draft payload field of the same name.
		isOnline(state): boolean
		{
			return state.saveStatus !== SAVE_STATUSES.ERROR;
		},
		contentBlockScope(state): { [string]: { [string]: string } }
		{
			return buildContentBlockScope(state.blocks, useCatalogStore().contentBlockProducers);
		},
		// The canvas carries something the published version does not, so a reload of the diagram data
		// would replace it.
		hasUnpublishedChanges(state): boolean
		{
			return isTimestampMapChanged(state.blockCurrentTimestamps, state.blockSavedTimestamps)
				|| isTimestampMapChanged(state.connectionCurrentTimestamps, state.connectionSavedTimestamps)
			;
		},
		// A pilot version is stored beside the row of the template, so a template that was never saved
		// has nothing to store it beside: the server refuses such a publication as a template that does
		// not exist, and the editor would read that refusal as a deleted template and lock itself.
		canPublishToPilotAudience(state): boolean
		{
			return state.isPilotFeatureAvailable && state.templateId > 0;
		},
	},
	actions:
	{
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
		getAllBlockAncestors(
			block: Block,
			targetPortId: ?PortId,
		): Array<{ block: Block, connections: Record<Port, PortId[]> }>
		{
			const stack = [];
			const ancestors = new Map([[block.id, { block, connections: {} }]]);
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
					if (!ancestors.has(b.id))
					{
						ancestors.set(b.id, {
							block: b,
							connections: {},
						});
						stack.push(...this.getInputConnections(b));
					}

					const currentAncestor = ancestors.get(b.id);
					if (inputs.includes(connection))
					{
						const { sourcePortId, targetPortId: targetId } = connection;
						currentAncestor.connections[sourcePortId] = [
							...(currentAncestor.connections[sourcePortId] ?? []),
							targetId,
						];

						return;
					}

					const prevAncestor = ancestors.get(connection.targetBlockId);
					currentAncestor.connections[connection.sourcePortId] = [
						...(currentAncestor.connections[connection.sourcePortId] ?? []),
						...Object.values(prevAncestor.connections).flat(),
					];
				});
			}

			ancestors.delete(block.id);

			return [...ancestors.values()];
		},
		async refreshDiagramData(
			params: {
				templateId: Number,
				documentType: ?Array,
				startTrigger: ?string,
			},
		): Promise<void>
		{
			let diagramData;
			try
			{
				diagramData = await editorAPI.getDiagramData(params);
			}
			catch (error)
			{
				// Only a confirmed TEMPLATE_NOT_FOUND code surfaces the "template
				// deleted" state; any other failure (network, unknown code) stays a
				// generic error handled by the caller.
				if (getErrorCode(error) === TEMPLATE_NOT_FOUND_ERROR_CODE)
				{
					this.isTemplateNotFound = true;
					// Nothing can be saved into a template that is not there, so the header
					// must not open the session with "Saved".
					this.saveStatus = SAVE_STATUSES.ERROR;

					return;
				}

				throw error;
			}

			this.isTemplateNotFound = false;
			this.templateId = diagramData?.templateId ?? 0;
			this.canPublish = diagramData?.canPublish ?? false;
			this.canUndoRestore = diagramData?.canUndoRestore === true;
			// The pilot may have been published, changed or stopped in another tab, so every load
			// rewrites the state instead of filling it once.
			this.setPilotState(diagramData?.pilot);
			// The mode of publication follows the pilot in force. Without the feature the menu has no
			// item to leave that mode with, so it is never entered.
			this.templatePublishStatus = this.isPilotFeatureAvailable && this.pilot.hasPilot
				? TEMPLATE_PUBLISH_STATUSES.USER
				: TEMPLATE_PUBLISH_STATUSES.MAIN
			;
			this.draftId = diagramData?.draftId ?? 0;
			// A known save time is not a save made in this session, so saveStatus stays as it is.
			this.lastSavedAt = toSavedAtMs(diagramData?.draftSavedAt);
			this.companyName = diagramData?.companyName ?? '';
			this.documentType = diagramData?.documentType ?? [];
			this.documentTypeSigned = diagramData?.documentTypeSigned ?? '';
			this.template = diagramData?.template ?? {};
			this.blocks = diagramData?.blocks ?? [];
			this.connections = diagramData?.connections ?? [];

			// The maps are replaced and never added to: a reload brings another graph, and the keys of the
			// previous one would stay behind. Their layers are compared as a whole, so a leftover key reads
			// as a change the canvas holds and the editor would report changes that were never made. The
			// data is loaded anew by handlePilotGone() among others - the first reload the editor does.
			const now = Date.now();
			const blockCurrentTimestamps = {};
			const blockSavedTimestamps = {};
			const connectionCurrentTimestamps = {};
			const connectionSavedTimestamps = {};

			for (const block of this.blocks)
			{
				blockCurrentTimestamps[block.id] = block.node.updated ?? now;
			}

			for (const block of diagramData?.publishedBlocks ?? [])
			{
				blockSavedTimestamps[block.id] = block.node.published ?? now;
			}

			for (const connection of this.connections)
			{
				connectionCurrentTimestamps[connection.id] = connection.createdAt ?? now;
			}

			for (const connection of diagramData?.publishedConnection ?? [])
			{
				connectionSavedTimestamps[connection.id] = connection.createdAt ?? now;
			}

			this.blockCurrentTimestamps = blockCurrentTimestamps;
			this.blockSavedTimestamps = blockSavedTimestamps;
			this.connectionCurrentTimestamps = connectionCurrentTimestamps;
			this.connectionSavedTimestamps = connectionSavedTimestamps;
		},
		getDeleteHandlerForBlockType(blockType: string): ?Function
		{
			if (blockType === BLOCK_TYPES.SetupTemplateActivity)
			{
				return this.handleDeletingConstants;
			}

			return null;
		},
		getSetupConstantIdsFromBlock(block: Block): string[]
		{
			const rawConstants = block.activity?.Properties?.blocks;

			return parseItemsFromBlocksJson(rawConstants)
				.filter((item) => item?.itemType === 'constant')
				.map((item) => item.id)
				.filter((constantId) => Type.isStringFilled(constantId))
			;
		},
		isConstantUsedBySetupBlocks(constantId: string, blocks: Block[]): boolean
		{
			return blocks.some((block: Block): boolean => {
				if (block.activity?.Type !== BLOCK_TYPES.SetupTemplateActivity)
				{
					return false;
				}

				return this.getSetupConstantIdsFromBlock(block).includes(constantId);
			});
		},
		handleDeletingConstants(block: Block, activeBlocks: Block[]): void
		{
			const constants = this.template?.CONSTANTS;

			if (!constants)
			{
				return;
			}

			this.getSetupConstantIdsFromBlock(block)
				.filter((constantId: string): boolean => constantId in constants)
				.forEach((constantId: string): void => {
					if (!this.isConstantUsedBySetupBlocks(constantId, activeBlocks))
					{
						delete constants[constantId];
					}
				});
		},
		handleDeletingBlocks(blocks: Block[], activeBlocks: Block[]): void
		{
			blocks.forEach((block: Block): void => {
				const handler = this.getDeleteHandlerForBlockType(block.activity?.Type);
				if (handler)
				{
					handler.call(this, block, activeBlocks);
				}
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
			const activeBlocks = this.blocks.filter((block: Block): boolean => block.id !== blockId);

			if (handler)
			{
				handler.call(this, blockToDelete, activeBlocks);
			}
			const ports: Array<Port> = Type.isArray(blockToDelete.ports) ? blockToDelete.ports : [];
			ports.forEach((port: Port): void => {
				this.deleteConnectionByBlockIdAndPortId(blockId, port.id);
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
			const nextBlockIds = new Set(blocks.map((block: Block): BlockId => block.id));
			const deletedBlocks = this.blocks.filter((block: Block): boolean => !nextBlockIds.has(block.id));

			this.handleDeletingBlocks(deletedBlocks, blocks);
			this.blocks = blocks;
		},
		setTemplateConstants(constants: { [string]: mixed }): void
		{
			this.template.CONSTANTS = JSON.parse(JSON.stringify(constants ?? {}));
		},
		setConnections(connections: []): void
		{
			this.connections = connections;
		},
		applyGraphPublication(publication: DiagramGraphPublication): DiagramGraphPublication
		{
			this.$patch((state) => {
				state.blocks = publication.blocks;
				state.connections = publication.connections;
				state.blockCurrentTimestamps = publication.blockCurrentTimestamps;
				state.connectionCurrentTimestamps = publication.connectionCurrentTimestamps;
			});

			return publication;
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
		/**
		 * records the per-subaction list of auto-filled field codes in Node.node.
		 * The key is the stable `construction.id`; an absent key / empty list means all values
		 * are manual. An empty list is never written for a key that does not exist yet, so
		 * plain-opening an old template stays a no-op. New codes are merged
		 * into the existing list; the key carries no runtime semantics.
		 */
		mergeAutoFilledFields(blockId: BlockId, constructionId: string, fields: Array<string>): void
		{
			if (!Type.isStringFilled(blockId) || !Type.isStringFilled(constructionId))
			{
				return;
			}

			const block = this.blocks.find((b) => b.id === blockId);
			if (!block?.node)
			{
				return;
			}

			const currentMap = Type.isPlainObject(block.node.autoFilledFields)
				? block.node.autoFilledFields
				: null;
			const existing = currentMap?.[constructionId] ?? null;

			if (!Type.isArrayFilled(fields) && !existing)
			{
				return;
			}

			if (!currentMap)
			{
				block.node.autoFilledFields = {};
			}

			block.node.autoFilledFields[constructionId] = [...new Set([...(existing ?? []), ...fields])];
		},
		/**
		 * replace-path used by relation-autofill recompute. Unlike
		 * mergeAutoFilledFields (union, apply path), recompute must be able to DROP fields whose
		 * auto-value vanished from the new map, so this overwrites the list outright and
		 * removes the key entirely when it becomes empty (absent key == all values manual).
		 */
		setAutoFilledFields(blockId: BlockId, constructionId: string, fields: Array<string>): void
		{
			if (!Type.isStringFilled(blockId) || !Type.isStringFilled(constructionId))
			{
				return;
			}

			const block = this.blocks.find((b) => b.id === blockId);
			if (!block?.node)
			{
				return;
			}

			const currentMap = Type.isPlainObject(block.node.autoFilledFields)
				? block.node.autoFilledFields
				: null;
			const unique = Type.isArrayFilled(fields) ? [...new Set(fields)] : [];

			if (unique.length === 0)
			{
				if (currentMap && constructionId in currentMap)
				{
					delete currentMap[constructionId];
				}

				return;
			}

			if (!currentMap)
			{
				block.node.autoFilledFields = {};
			}

			block.node.autoFilledFields[constructionId] = unique;
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
		// Locks the editor after a mutating action came back with a terminal server verdict.
		// Idempotent: shows the toast and flips the flag only once, so repeated actions never
		// stack notifications. The client lock is a UX cue; the real guarantee is the server.
		lockEditor(reason: string, toastMessageId: string): void
		{
			if (this.isEditorReadonly)
			{
				return;
			}

			this.isEditorReadonly = true;
			this.editorLockReason = reason;
			// The lock is terminal, so the status is terminal too: a save point that swallows
			// the refusal without an exception must not leave "Saved" on the screen. Retiring
			// the current run id keeps a chain that is still in flight from writing markSaved()
			// over this error once its late answer arrives.
			this.saveStatus = SAVE_STATUSES.ERROR;
			this.autosaveRunId++;
			useToastStore().addWarning(Loc.getMessage(toastMessageId) ?? '');
		},
		handleTemplateDeleted(): void
		{
			this.lockEditor(
				EDITOR_LOCK_REASONS.TEMPLATE_DELETED,
				'BIZPROCDESIGNER_EDITOR_TEMPLATE_DELETED_TOAST',
			);
		},
		// A refusal is as terminal as a deleted template: the server does not accept this writer,
		// so more attempts send the same doomed request and the connection is not at fault. The
		// server answers a non-admin with this code for a deleted template as well — it does not
		// reveal which of the two happened — so the wording names both instead of guessing one.
		handleWriteAccessLost(): void
		{
			this.lockEditor(
				EDITOR_LOCK_REASONS.WRITE_ACCESS_LOST,
				'BIZPROCDESIGNER_EDITOR_WRITE_ACCESS_LOST_TOAST',
			);
		},
		async updateTemplateData(data: DiagramTemplate)
		{
			if (this.isWriteLocked)
			{
				return;
			}

			try
			{
				await editorAPI.updateTemplateData({
					templateId: this.templateId,
					data,
				});
			}
			catch (e)
			{
				if (getErrorCode(e) === TEMPLATE_NOT_FOUND_ERROR_CODE)
				{
					this.handleTemplateDeleted();

					return;
				}

				throw e;
			}
		},
		async applyTemplateMetadata(data: DiagramTemplate)
		{
			if (this.isWriteLocked)
			{
				return;
			}

			Object.assign(this.template, data);
			await this.updateTemplateData(data);
		},
		// Tells whether the draft actually reached the server. A deleted template is
		// handled here without an exception, so callers that track the save status must
		// not read a swallowed failure as a successful save.
		async publicDraft(ignoreWriteLock: boolean = false): Promise<boolean>
		{
			if (this.isWriteLocked && !ignoreWriteLock)
			{
				return false;
			}

			const saveDraft = async (): Promise<boolean> => {
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

				try
				{
					const { templateDraftId } = await editorAPI.publicDiagramDataDraft(requestData);
					if (Type.isNumber(templateDraftId))
					{
						this.draftId = templateDraftId;
					}
				}
				catch (e)
				{
					const errorCode = getErrorCode(e);
					if (errorCode === TEMPLATE_NOT_FOUND_ERROR_CODE)
					{
						this.handleTemplateDeleted();

						return false;
					}

					// A coded refusal is a verdict, not a broken connection: without this branch the
					// caller retries a request the server will never accept and reports a network
					// failure the user cannot fix. A non-admin gets this code for a deleted template
					// too — the server hides which one — so both cases end up in the same lock.
					if (errorCode === ACCESS_DENIED_ERROR_CODE)
					{
						this.handleWriteAccessLost();

						return false;
					}

					throw e;
				}

				// Every draft save goes through here, including the points that write the draft
				// silently, so the hint time follows the draft on the server, not the header status.
				this.lastSavedAt = Date.now();

				return true;
			};

			// Draft saves run strictly one after another: a save started earlier must not land
			// after the graph the version history has just written. With nothing in flight the
			// request goes out at once, so a caller reading the status right after the call sees
			// the save already started. The chain keeps moving only because the draft request is
			// bounded by a transport timeout: a request that never answers would freeze every
			// later save.
			const request = this.draftSavesInFlight === 0 ? saveDraft() : this.draftSaveQueue.then(saveDraft);
			this.draftSavesInFlight++;
			this.draftSaveQueue = markRaw(request.then(() => {}, () => {}).then(() => {
				this.draftSavesInFlight--;
			}));

			return request;
		},
		// Single entry point of the automatic draft save: keeps the header status and the
		// manual retry on one code path.
		async autosave(): Promise<void>
		{
			const runId = this.beginSaveRun();
			// A later chain already owns the status, so a late answer of this one stays silent.
			const isOutdatedRun = (): boolean => this.autosaveRunId !== runId;

			let attempt = 0;
			while (attempt < AUTOSAVE_MAX_ATTEMPTS)
			{
				try
				{
					// eslint-disable-next-line no-await-in-loop
					const isDraftSaved = await this.publicDraft();
					if (isDraftSaved)
					{
						if (!isOutdatedRun())
						{
							this.markSaved();
						}

						return;
					}

					// A deleted template or a locked editor: more attempts cannot help, and the
					// connection is fine, so the network notification would name a wrong reason.
					if (!isOutdatedRun())
					{
						this.saveStatus = SAVE_STATUSES.ERROR;
					}

					return;
				}
				catch
				{
					attempt++;

					// A newer chain already owns the status, and a retry here would rebuild the
					// request from the CURRENT graph: its success is then discarded by the
					// arbitration, so the server can hold the fresh draft while the newer chain
					// runs out of attempts and reports "not saved" over a connection that
					// worked. Stopping leaves the terminal status to the chain that owns it.
					if (isOutdatedRun())
					{
						return;
					}
				}
			}

			if (isOutdatedRun())
			{
				return;
			}

			this.saveStatus = SAVE_STATUSES.ERROR;
			UI.Notification.Center.notify({
				content: Loc.getMessage('BIZPROCDESIGNER_EDITOR_TOP_PANEL_AUTOSAVE_STATUS_NOT_SAVED_HINT') ?? '',
				autoHideDelay: 4000,
			});
		},
		// The graph a publication sends. Every block carries one and the same publication moment, so
		// the timestamps of a published version never disagree between blocks.
		buildPublicationData(): DiagramData
		{
			const now = Date.now();

			return {
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
		},
		// A refusal of a publication, read the same way by both publication paths. Returns whether
		// the refusal is terminal: a deleted template locks the editor and the answer ends here,
		// any other one marks the blocks the server named and travels on to the caller.
		handlePublicationFailure(error: ApiError): boolean
		{
			if (getErrorCode(error) === TEMPLATE_NOT_FOUND_ERROR_CODE)
			{
				this.handleTemplateDeleted();

				return true;
			}

			if (Type.isArrayFilled(error.data?.activityErrors))
			{
				this.setBlocksErrorStatus(error.data.activityErrors);
			}

			return false;
		},
		// Returns whether the publication actually happened: a locked editor publishes nothing, and the
		// caller must not report a success that did not take place.
		async publicTemplate(): Promise<boolean>
		{
			// One publish at a time for every entry point (toolbar button, restore bar): a second
			// request on the same intent would add a second version to the history.
			if (this.isWriteLocked || this.isPublishing)
			{
				return false;
			}

			this.isPublishing = true;

			try
			{
				const { templateId, pilot } = await editorAPI.publicDiagramData(this.buildPublicationData());
				// The captured snapshot belongs to the previously published version.
				useNodeDataInspectorStore().resetLastValues();
				// A publication for everyone rewrites the live scheme and the server stops the pilot
				// over it, so the answer brings the state the editor has to show from now on.
				this.setPilotState(pilot);
				this.blockCurrentPublishErrors = {};
				if (Type.isNumber(templateId))
				{
					this.blockSavedTimestamps = { ...this.blockCurrentTimestamps };
					this.connectionSavedTimestamps = { ...this.connectionCurrentTimestamps };
					this.templateId = templateId;
					this.draftId = 0;
					// Publication drops every draft of the template, the restore backup included.
					this.canUndoRestore = false;
				}

				return true;
			}
			catch (e)
			{
				if (this.handlePublicationFailure(e))
				{
					return false;
				}

				throw e;
			}
			finally
			{
				this.isPublishing = false;
			}
		},
		// The publication to an audience. The pilot version is stored beside the live row, so this
		// path leaves the template, its draft and the layer of comparison alone - the canvas keeps
		// being compared with the common version - and renews only the state of the pilot.
		async publicPilotTemplate(
			{ audience, confirmations = [], scheme = null }: {
				audience: Array<string>,
				confirmations?: Array<string>,
				scheme?: ?DiagramData,
			},
		): Promise<void>
		{
			if (this.isEditorReadonly)
			{
				return;
			}

			const requestData = {
				// Every round of confirmations publishes one and the same scheme, so a caller that walks
				// them passes the graph it collected once instead of paying for the whole one per round.
				...(scheme ?? this.buildPublicationData()),
				publishMode: PILOT_PUBLISH_MODE,
				audience,
				confirmations,
			};

			try
			{
				const { templateId, pilot } = await editorAPI.publicDiagramData(requestData);
				// The captured snapshot belongs to the previously published version, and from now on the
				// scheme in force is the pilot one.
				useNodeDataInspectorStore().resetLastValues();
				this.blockCurrentPublishErrors = {};
				this.setPilotState(pilot);
				// The pilot version is stored beside the row of the template and leaves its id alone, but
				// the answer names the row the version belongs to: the editor follows it, the same way as
				// an ordinary publication does.
				if (Type.isNumber(templateId))
				{
					this.templateId = templateId;
				}
				// The mode of publication follows the pilot in force, the same way as after a load: it is
				// the accepted publication that changes it, never the choice of a menu item.
				if (this.pilot.hasPilot)
				{
					this.templatePublishStatus = TEMPLATE_PUBLISH_STATUSES.USER;
				}

				// The server deletes the draft it published, so its id must not travel any further:
				// the next autosave would be refused over a draft that is not there and lock the editor.
				this.setDraftId(0);
			}
			catch (e)
			{
				if (this.handlePublicationFailure(e))
				{
					return;
				}

				throw e;
			}
		},
		// The state of the pilot the whole editor reads: no component takes it from the answer of the
		// transport on its own. Nothing of it ever travels back - it is a read-model.
		setPilotState(pilot: ?PilotState): void
		{
			this.pilot = readPilotState(pilot);

			// A pilot is live again - either the same one that was read anew or a newly published one:
			// its own disappearance is a new event and has to be told about again.
			if (this.pilot.hasPilot)
			{
				this.isPilotGoneReported = false;
			}
		},
		// A refusal of an operation over the live pilot, read the same way by every surface that offers
		// one. Returns whether the refusal was handled here; anything else travels on to the caller and
		// is reported as usual.
		async handlePilotOperationFailure(error: ApiError): Promise<boolean>
		{
			const errorCode = getErrorCode(error);

			// The template a pilot belongs to may be gone as well, and that is terminal for the whole
			// editor and not only for the pilot: the operation ends the same way as every other request
			// that meets these codes, instead of a raw server message over the card. A non-admin gets
			// ACCESS_DENIED for a deleted template too - the server hides which one - so both codes lock
			// the editor rather than offering the operations again.
			if (errorCode === TEMPLATE_NOT_FOUND_ERROR_CODE)
			{
				this.handleTemplateDeleted();

				return true;
			}

			if (errorCode === ACCESS_DENIED_ERROR_CODE)
			{
				this.handleWriteAccessLost();

				return true;
			}

			if (![PILOT_NOT_FOUND_ERROR_CODE, PILOT_CHANGED_ERROR_CODE].includes(errorCode))
			{
				return false;
			}

			await this.handlePilotGone();

			return true;
		},
		/**
		 * The pilot was stopped or replaced elsewhere while this tab was open. Unlike a deleted template
		 * the editor is not locked: the template is there and stays writable, only the scheme in force
		 * has changed - and the canvas may still show the pilot version that no longer exists, so the
		 * data of the diagram is read anew together with the state of the pilot.
		 *
		 * The warning comes before the reload and tells apart the case when the canvas carries changes
		 * that were never published: they are about to be replaced by what the server holds.
		 */
		async handlePilotGone(): Promise<void>
		{
			if (this.isPilotGoneReported)
			{
				return;
			}

			this.isPilotGoneReported = true;
			useToastStore().addWarning(
				Loc.getMessage(
					this.hasUnpublishedChanges
						? 'BIZPROCDESIGNER_EDITOR_PILOT_GONE_UNPUBLISHED_TOAST'
						: 'BIZPROCDESIGNER_EDITOR_PILOT_GONE_TOAST',
				) ?? '',
			);
			this.setPilotState(null);

			try
			{
				await this.refreshDiagramData({ templateId: this.templateId });
			}
			catch (error)
			{
				// The pilot is gone either way; a failed reload only leaves the canvas as it was, and
				// the reason is reported the way every other failed request is.
				handleResponseError(error);
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
		// Status only: the save time belongs to publicDraft(), where the draft really
		// reaches the server.
		markSaved(): void
		{
			this.saveStatus = SAVE_STATUSES.SAVED;
		},
		// The AI agent writes the draft on the server itself, so the hint time has to follow
		// that save too — otherwise it keeps showing the previous one until the next local save.
		// The receipt moment stands for the save moment: pull delivery is far shorter than the
		// minute the relative label distinguishes. Status stays untouched: it describes a save
		// made by this editor, not by somebody else.
		markExternalDraftSave(): void
		{
			this.lastSavedAt = Date.now();
		},
		// Opens a save run: takes the run id and shows the process, so every save point reports
		// a slow save the same way. The caller passes the id back to updateStatus() once the
		// answer arrives, so a save started later owns the status and this one stays silent.
		beginSaveRun(): number
		{
			this.autosaveRunId++;
			this.saveStatus = SAVE_STATUSES.SAVING;

			return this.autosaveRunId;
		},
		// Boolean facade kept for the save points that report the status themselves. Called with
		// the id from beginSaveRun() it takes part in the same arbitration as autosave(): only
		// the newest run reaches the terminal status. Such a write also retires the runs still
		// in flight: their answer describes an older graph.
		updateStatus(isOnline: boolean, runId: ?number = null): void
		{
			if (Type.isNumber(runId) && this.autosaveRunId !== runId)
			{
				return;
			}

			this.autosaveRunId++;

			if (isOnline)
			{
				this.markSaved();

				return;
			}

			this.saveStatus = SAVE_STATUSES.ERROR;
		},
		updateBlockTimestamp(block)
		{
			this.blockCurrentTimestamps[block.id] = Date.now();
		},
		setDraftId(draftId: number, ignoreWriteLock: boolean = false): void
		{
			if (this.isWriteLocked && !ignoreWriteLock)
			{
				return;
			}

			this.draftId = draftId;
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
		async viewVersion(versionId: number): Promise<boolean>
		{
			if (this.isWriteLocked)
			{
				return false;
			}

			this.isVersionViewTransitionInProgress = true;
			try
			{
				await this.publicDraft(true);

				const versionHistoryStore = useVersionHistoryStore();
				const versionData = await versionHistoryStore.loadVersion(this.templateId, versionId);
				if (versionData === null)
				{
					useToastStore().addWarning(versionHistoryStore.errorMessage ?? '');

					return false;
				}

				this.isVersionViewMode = true;
				this.applyVersionGraph(versionData);

				return true;
			}
			catch (error)
			{
				handleResponseError(error);

				return false;
			}
			finally
			{
				this.isVersionViewTransitionInProgress = false;
			}
		},
		async exitVersionView(): Promise<void>
		{
			if (!this.isVersionViewMode)
			{
				return;
			}

			try
			{
				await this.reloadDiagram();
			}
			catch (error)
			{
				handleResponseError(error);

				return;
			}

			this.isVersionViewMode = false;
			useVersionHistoryStore().clearSelection();
		},
		applyVersionGraph(
			versionData: {
				template: ?DiagramTemplate,
				blocks: ?Array<Block>,
				connections: ?Array<Connection>,
			},
		): void
		{
			this.setDiagramData({
				templateId: this.templateId,
				documentType: this.documentType,
				companyName: this.companyName,
				template: versionData?.template ?? {},
				blocks: versionData?.blocks ?? [],
				connections: versionData?.connections ?? [],
			});

			// Both timestamp maps are rebuilt from the snapshot with equal values: everything in a
			// published version is published, so no block keeps the marker of the graph the user left.
			const now = Date.now();
			const blockTimestamps = Object.fromEntries(this.blocks.map((block) => [block.id, now]));
			const connectionTimestamps = Object.fromEntries(
				this.connections.map((connection) => [connection.id, now]),
			);

			this.setBlockCurrentTimestamps(blockTimestamps);
			this.setConnectionCurrentTimestamps(connectionTimestamps);
			this.blockSavedTimestamps = { ...blockTimestamps };
			this.connectionSavedTimestamps = { ...connectionTimestamps };
			this.blockCurrentPublishErrors = {};
			this.graphRevision++;
		},
		async reloadDiagram(): Promise<void>
		{
			// refreshDiagramData only adds keys to the timestamp maps, so the maps of the graph
			// being replaced are dropped first.
			this.setBlockCurrentTimestamps({});
			this.setConnectionCurrentTimestamps({});
			this.blockSavedTimestamps = {};
			this.connectionSavedTimestamps = {};

			await this.refreshDiagramData({
				templateId: this.templateId,
				documentType: this.documentType,
			});

			this.graphRevision++;
		},
		async restoreVersion(versionId: number): Promise<boolean>
		{
			if (this.isEditorReadonly || this.isRestoreInProgress || this.isVersionViewTransitionInProgress)
			{
				return false;
			}

			const shouldSaveDraft = !this.isVersionViewMode;
			this.isRestoreInProgress = true;
			try
			{
				if (shouldSaveDraft)
				{
					await this.publicDraft(true);
				}

				const data = await editorAPI.restoreTemplateVersion({ templateId: this.templateId, versionId });
				await this.applyRestoreResult(data?.draftId, true);

				return true;
			}
			catch (error)
			{
				this.handleVersionActionError(error);

				return false;
			}
			finally
			{
				this.isRestoreInProgress = false;
			}
		},
		async undoRestore(): Promise<boolean>
		{
			if (this.isEditorReadonly || this.isRestoreInProgress || !this.canUndoRestore)
			{
				return false;
			}

			this.isRestoreInProgress = true;
			try
			{
				const data = await editorAPI.undoTemplateRestore({ templateId: this.templateId });
				await this.applyRestoreResult(data?.draftId, false);

				return true;
			}
			catch (error)
			{
				this.handleVersionActionError(error);

				return false;
			}
			finally
			{
				this.isRestoreInProgress = false;
			}
		},
		async discardRestoreBackup(): Promise<boolean>
		{
			if (this.isEditorReadonly || this.isRestoreInProgress || !this.canUndoRestore)
			{
				return false;
			}

			this.isRestoreInProgress = true;
			try
			{
				await editorAPI.discardTemplateRestoreBackup({ templateId: this.templateId });
				this.canUndoRestore = false;

				return true;
			}
			catch (error)
			{
				this.handleVersionActionError(error);

				return false;
			}
			finally
			{
				this.isRestoreInProgress = false;
			}
		},
		// The draft the editor writes to is switched before the graph reload and before any
		// autosave can fire: the previous draft is now the backup copy.
		async applyRestoreResult(draftId: ?number, canUndoRestore: boolean): Promise<void>
		{
			this.setDraftId(draftId ?? 0, true);
			// The undo bar invites a click, so it appears only when the reload is over: until then every
			// write is locked and the actions offered next to it would silently do nothing.
			this.canUndoRestore = false;

			try
			{
				await this.reloadDiagram();
			}
			catch (error)
			{
				handleResponseError(error);
				this.handleRestoreReloadFailure();

				return;
			}

			this.canUndoRestore = canUndoRestore;
			this.isVersionViewMode = false;
			useVersionHistoryStore().clearSelection();
		},
		// The restore already happened on the server while the canvas still shows the graph it
		// replaced. The editor stays locked past the caller's finally, so no autosave writes the
		// stale graph back into the restored draft: only a page reload gets the user out.
		handleRestoreReloadFailure(): void
		{
			this.isEditorReadonly = true;

			MessageBox.alert(
				Loc.getMessage('BIZPROCDESIGNER_EDITOR_RESTORE_RELOAD_FAILED_MESSAGE') ?? '',
				Loc.getMessage('BIZPROCDESIGNER_EDITOR_RESTORE_RELOAD_FAILED_TITLE') ?? '',
				() => {
					window.location.reload();
				},
				Loc.getMessage('BIZPROCDESIGNER_EDITOR_RESTORE_RELOAD_FAILED_OK') ?? '',
			);
		},
		handleVersionActionError(error: Error): void
		{
			const errorCode = getErrorCode(error);
			if (errorCode === TEMPLATE_NOT_FOUND_ERROR_CODE)
			{
				this.handleTemplateDeleted();

				return;
			}

			if (errorCode === RESTORE_UNDO_UNAVAILABLE_ERROR_CODE)
			{
				this.canUndoRestore = false;
			}

			useToastStore().addWarning(resolveVersionHistoryErrorMessage(error));
		},
		// Applies incoming agent-graph data to EXISTING blocks: besides
		// Properties/title, position/dimensions are now applied too. The position can
		// change even when Properties did not (the agent shifts a neighboring block
		// when inserting a new one between two) — so coordinates are applied INDEPENDENTLY
		// of the isBlockPropertiesDifferent check. Called only from the agent
		// graph-apply callback (app.js); the agent coordinates must win.
		//
		// Returns the ids of the blocks whose properties differ from the stored ones. The single
		// pass here is the only place that can tell: the blocks are mutated in place, so no diff
		// taken by the caller afterwards would see the previous values.
		updateExistedBlockProperties(newBlocks: Block[]): Set<BlockId>
		{
			if (this.isWriteLocked)
			{
				// Nothing was applied, so nothing changed: the caller reads the returned set.
				return new Set();
			}

			const currentBlockMap: Map<BlockId, Block> = getBlockMap(this.blocks);
			const changedBlockIds: Set<BlockId> = new Set();
			for (const newBlock: Block of newBlocks)
			{
				const currentBlock: ?Block = currentBlockMap.get(newBlock.id);
				if (!currentBlock)
				{
					continue;
				}

				// Compared before anything below is written: node.title is one of the compared
				// fields and the merge overwrites it.
				const isPropertiesDifferent: boolean = isBlockPropertiesDifferent(currentBlock, newBlock);
				if (isPropertiesDifferent)
				{
					changedBlockIds.add(currentBlock.id);
				}

				// Assign a new position/dimensions object so the engine deep-watch
				// (props.blocks → RBush reload) picks up the new coordinate and
				// moves the block. Just in case: apply only when the data is present.
				if (newBlock.position)
				{
					currentBlock.position = { ...newBlock.position };
				}

				if (newBlock.dimensions)
				{
					currentBlock.dimensions = { ...newBlock.dimensions };
				}

				// Оформление подложки (node.frame*) меняется независимо от Properties — например,
				// агент правит только цвет или аннотацию рамки. Переносим его отдельно, как
				// position/dimensions, а не внутри проверки isBlockPropertiesDifferent.
				if (newBlock.node && currentBlock.node)
				{
					for (const key: string of FRAME_STYLE_KEYS)
					{
						if (newBlock.node[key] !== undefined)
						{
							currentBlock.node[key] = FRAME_ARRAY_KEYS.has(key)
								? [...newBlock.node[key]]
								: newBlock.node[key];
						}
					}
				}

				if (
					currentBlock.activity
					&& currentBlock.activity.Properties
					&& newBlock.activity?.Properties
					&& isPropertiesDifferent
				)
				{
					for (const [key: string] of Object.entries(newBlock.activity.Properties))
					{
						// Data comes from the external agent via pull — skip dangerous
						// keys to prevent prototype pollution.
						if (key === '__proto__' || key === 'constructor' || key === 'prototype')
						{
							continue;
						}

						currentBlock.activity.Properties[key] = newBlock.activity.Properties[key];
					}
					currentBlock.node.title = newBlock.node.title;
					currentBlock.activity.ContentBlock = newBlock.activity.ContentBlock;
				}
			}

			return changedBlockIds;
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
		async updateBlockPublishStatus(block: Block): Promise<void>
		{
			this.setBlockCurrentTimestamp(block);
			await this.autosave();
		},
		addBlock(block: Block): void
		{
			this.blocks.push(block);
		},
	},
});
