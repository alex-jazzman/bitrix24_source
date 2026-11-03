import { Type, Loc, Text, Event } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { LiveAnnouncer } from 'ui.a11y';
import { markRaw } from 'ui.vue3';
import { defineStore } from 'ui.vue3.pinia';
import { MessageBox } from 'ui.dialogs.messagebox';
import { UI } from 'ui.notification';

import { editorAPI, type ApiError } from '../../../shared/api';
import { isTemplateEditLockAvailable } from '../../../shared/composables/feature';
import { useToastStore } from '../../../shared/stores';
import { useNodeDataInspectorStore } from '../../../shared/stores/node-data-inspector-store';
import { useCatalogStore } from '../../catalog/stores';
import { findProcessDataPublicationError } from '../../../shared/utils/process-data-publication-errors';
import { PROCESS_DATA_EVENTS } from '../../../shared/constants';
import {
	getBlockMap,
	isBlockPropertiesDifferent,
	isTimestampMapChanged,
	parseItemsFromBlocksJson,
	buildContentBlockScope,
} from '../utils';
import { handleResponseError, getErrorCode, getErrorCustomData } from '../../../shared/utils/response';
import { isPortalAdmin } from '../../../shared/utils/portal-admin';
import { BLOCK_TOAST_TYPES, DIAGRAM_EVENTS, TEMPLATE_PUBLISH_STATUSES } from '../constants';
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
const TEMPLATE_DRAFT_CONFLICT_ERROR_CODE = 'TEMPLATE_DRAFT_CONFLICT';
const RESTORE_UNDO_UNAVAILABLE_ERROR_CODE = 'TEMPLATE_RESTORE_UNDO_UNAVAILABLE';
const ACCESS_DENIED_ERROR_CODE = 'ACCESS_DENIED';
// Somebody else is editing the template right now. Reversible, unlike the two codes above.
const TEMPLATE_LOCKED_ERROR_CODE = 'TEMPLATE_LOCKED';
// The draft this tab writes to has moved on without it, or is gone entirely.
const DRAFT_REVISION_CONFLICT_ERROR_CODE = 'DRAFT_REVISION_CONFLICT';
const DRAFT_NOT_FOUND_ERROR_CODE = 'DRAFT_NOT_FOUND';

// The writes that reach the server outside the queue of the draft saves: the publication and the
// rename. The server takes the lease for them too, so a release that does not wait for them is
// undone by the very write it overtook — and the template stays held by a session that gave it back.
const writesOutsideDraftQueue: Set<Promise<void>> = new Set();
// The change of the person still waiting out the debounce of the autosave. It stands in no queue yet,
// so the release of the lease has to start it rather than wait for something that never comes.
let pendingSaveFlush: ?() => void = null;
// The reload started by an outdated draft, while it is running. A promise is not data, so it stays out
// of the reactive state next to the queue of the saves.
let outdatedDraftReload: ?Promise<void> = null;

// One editor lives on the page, so the lease it holds is kept alive by one timer and one set of
// listeners. They stay out of the reactive state: nothing on the screen depends on them.
const LEASE_RENEW_TICK_MS = 60 * 1000;
// What counts as the person acting in the editor. A visible tab alone is not enough: a tab left open on
// a visible monitor would hold the template forever, which is the very risk the lease removes.
const USER_ACTIVITY_EVENTS = ['pointerdown', 'keydown'];
let leaseRenewTimerId = null;
let leaseListeners = null;
let hasSeenUserActivity = false;

// Marks a write going around the queue of the draft saves for as long as it is on its way to the
// server. Returns the way to unmark it, which the caller runs in a finally.
function beginWriteOutsideDraftQueue(): () => void
{
	let finish = null;
	const write = new Promise((resolve) => {
		finish = resolve;
	});
	writesOutsideDraftQueue.add(write);

	return (): void => {
		writesOutsideDraftQueue.delete(write);
		finish();
	};
}

// Waits for the writes of the template to stop coming: the queue and the set alike can grow while they
// are awaited, and a lease given up before the last change of the person would leave that change without
// a writer.
async function waitForTemplateWrites(store: Object): Promise<void>
{
	let awaited = null;
	while (awaited !== store.draftSaveQueue || writesOutsideDraftQueue.size > 0)
	{
		awaited = store.draftSaveQueue;
		// eslint-disable-next-line no-await-in-loop
		await Promise.all([awaited, ...writesOutsideDraftQueue]);
	}
}

// The pilot an operation was aimed at is not there any more: it was stopped or replaced while this tab
// was open. The template itself is untouched, so this refusal locks nothing.
const PILOT_NOT_FOUND_ERROR_CODE = 'PILOT_NOT_FOUND';
const PILOT_CHANGED_ERROR_CODE = 'PILOT_CHANGED';

export function createConnectionId(connection: Connection): string
{
	return [
		connection.sourceBlockId,
		connection.sourcePortId,
		connection.targetBlockId,
		connection.targetPortId,
	].join('_');
}

// Why the editor stopped accepting writes. The reason travels to the header so the hint names
// the real cause instead of the connection.
export const EDITOR_LOCK_REASONS = {
	TEMPLATE_DELETED: 'template-deleted',
	WRITE_ACCESS_LOST: 'write-access-lost',
	// Unlike the two above this one is reversible: the template comes back to this session once the
	// lease is free again and the schema is reloaded.
	TEMPLATE_BUSY: 'template-busy',
};

// What brought the editor into the reading mode. The owner does not tell it: a refused write names
// nobody once the lease is gone by the time the server reads the row, and the event of a released
// lease names whoever took the template over. So the caller says why, and the words follow the way.
export const BUSY_ENTRY_REASONS = {
	// The schema arrived with a lease of somebody else: nothing was taken from the person.
	SCHEMA_LOAD: 'schema-load',
	// The person gave the template back themselves through the menu of the editor.
	OWN_RELEASE: 'own-release',
	// The server refused the write of this session: somebody else is editing the template.
	WRITE_REFUSED: 'write-refused',
	// The lease of this session was released for it — by an administrator or by another tab.
	LEASE_TAKEN_AWAY: 'lease-taken-away',
};

// What the person is told about the mode they have just been put into. The two ways that happen in
// front of them are absent from the map and stay silent.
const BUSY_ENTRY_MESSAGES = {
	[BUSY_ENTRY_REASONS.WRITE_REFUSED]: 'BIZPROCDESIGNER_EDITOR_TEMPLATE_BUSY_TOAST',
	[BUSY_ENTRY_REASONS.LEASE_TAKEN_AWAY]: 'BIZPROCDESIGNER_EDITOR_TEMPLATE_LEASE_RELEASED_TOAST',
};

const TEMPLATE_LOCKED_TOAST_TAG = 'bizprocdesigner-template-locked';

// The person holding the editing lease of the template, as the server names them. Only the id
// travels: the name is looked up by the client, which keeps the visibility rules of the portal.
export type TemplateLockOwner = {
	userId: number,
	acquiredAt: ?number,
	expiresAt: ?number,
};

// A refusal without a readable owner is still a refusal: the write did not happen, so the state
// remembers the lease with an unnamed holder instead of dropping it. The same shape arrives with the
// load answer, so both sources are normalized here.
export function toTemplateLockOwner(source: mixed): TemplateLockOwner
{
	return {
		userId: Type.isNumber(source?.userId) ? source.userId : 0,
		acquiredAt: Type.isNumber(source?.acquiredAt) ? source.acquiredAt : null,
		expiresAt: Type.isNumber(source?.expiresAt) ? source.expiresAt : null,
	};
}

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

// The mode of a publication that also stops the processes started before it. Which of them are
// stopped and how is decided by the server; the editor only names the mode it publishes in.
const FULL_PUBLISH_MODE = 'full';

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
		return { ...NEUTRAL_PILOT_STATE };
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
		// Revision of the draft as the server last confirmed it. It travels back with the next draft
		// write so the server can refuse a write made over a draft somebody else has already changed.
		// Zero means "unknown" and is never sent. Unrelated to graphRevision below: that one counts
		// graph swaps on the client and never leaves it.
		draftRevision: 0,
		// The graph of the agent arrived while the writing was closed and was left unapplied, so the
		// canvas is older than the draft the revision above describes. The next write reads the schema
		// once instead of passing the check of the server with a graph that erases the work of the agent.
		hasSkippedAgentGraph: false,
		documentType: [],
		documentTypeSigned: '',
		companyName: '',
		template: {},
		blocks: [],
		connections: [],
		saveStatus: SAVE_STATUSES.IDLE,
		lastSavedAt: null,
		// Every write the change journal records, so the open history feed knows it went stale.
		lastRecordedChangeAt: null,
		// Only a publication for everyone: it alone adds a version, and the version list follows it
		// instead of every autosave.
		lastPublishedAt: null,
		// Identifies the newest autosave chain: only it may write the terminal status.
		autosaveRunId: 0,
		// Tail of the draft save chain, see publicDraft(). markRaw: a promise is a handle, not data.
		draftSaveQueue: markRaw(Promise.resolve()),
		draftSavesInFlight: 0,
		blockCurrentTimestamps: {},
		blockSavedTimestamps: {},
		blockCurrentPublishErrors: {},
		// Nodes of the last inserted fragment whose settings still point outside it. Its own map and
		// not the one of the publish errors: the two are filled by different events and cleared at
		// different moments, and one map would make either of them wipe the other.
		fragmentReviewNodeIds: [],
		// The fragment being inserted right now, by its id, and `null` while nothing is: one field
		// answers both whether an insertion is in flight and which row of the library waits for it.
		insertingFragmentId: null,
		connectionCurrentTimestamps: {},
		connectionSavedTimestamps: {},
		templatePublishStatus: TEMPLATE_PUBLISH_STATUSES.MAIN,
		canPublish: false,
		copilotOptions: null,
		pilot: readPilotState(null),
		isPilotFeatureAvailable: false,
		// One warning per disappearance of the pilot: every next refusal of the same event describes
		// a pilot the editor already knows nothing about.
		isPilotGoneReported: false,
		isTemplateNotFound: false,
		isEditorReadonly: false,
		// Only the two terminal verdicts live here; the reversible one is added by the
		// editorLockReason getter, so writing it down could never lock the editor for good.
		terminalLockReason: null,
		// This session holds the editing lease of the template.
		hasLease: false,
		// The window of the lease this session holds, as the server dated it: the term of the lease is
		// expiresAt - acquiredAt, so the client keeps no term of its own to drift away from the server.
		lease: null,
		// When that window reached this tab, by the clock of this tab. The renewal is decided by the time
		// passed since then and never by comparing a server date with a browser one: a clock running
		// minutes behind would otherwise leave a working person without a renewal until the lease ran out
		// under them.
		leaseReceivedAt: null,
		// Who is holding the template right now, or null while nobody else does.
		busyLock: null,
		isBusyLockConfirmedFree: false,
		// This session held the lease and gave it away. Independent of busyLock: after a release of
		// its own nobody else holds the template, yet this session may no longer write to it.
		hasReleasedLease: false,
		// The schema has been on the screen at least once. Every load after the first one happens under
		// the eyes of the person, and the reading mode that comes with it interrupts their work.
		hasLoadedDiagram: false,
		// The reading mode arrived while the person was working — a lease taken away, a refused write —
		// and not together with the schema being opened. Only then is there a focus to take over.
		hasEnteredBusyDuringWork: false,
		isVersionViewMode: false,
		isVersionViewTransitionInProgress: false,
		isRestoreInProgress: false,
		// The template is being taken over right now: released, taken and reloaded as one move. Public,
		// because every entry into that move — the centre of the overlay and the item of the menu —
		// reads it instead of keeping a waiting flag of its own.
		isTemplateTakeoverInProgress: false,
		isPublishing: false,
		// Whether the server managed to schedule the stop of the processes of the previous scheme on the
		// last publication in the format that stops them. True by default and whenever the answer says
		// nothing: there was nothing to stop then.
		isTerminationScheduled: true,
		canUndoRestore: false,
		graphRevision: 0,
	}),
	getters: {
		// Reading a published version is not writing, so the reversible "busy" is deliberately not
		// part of this: a session that may not write is exactly the one that keeps reading. The four
		// states below are the ones that put something other than the live draft on the canvas, or a
		// server-side write already in flight.
		canViewVersions: (state): boolean => {
			return !state.isEditorReadonly
				&& !state.isVersionViewMode
				&& !state.isVersionViewTransitionInProgress
				&& !state.isRestoreInProgress
			;
		},
		// The template is held by somebody else, or this session has given its own lease away. Both
		// close the writing while the state stays reversible: a reload of the schema brings the
		// editor back to work.
		isBusy: (state): boolean => (
			state.busyLock !== null
			|| state.hasReleasedLease
			|| state.isBusyLockConfirmedFree
		),
		// Every write path shares one lock: a version snapshot on the canvas and a restore in
		// flight must never reach the draft - the first would overwrite it with a foreign graph,
		// the second would overwrite the backup copy the server has just made - and neither may a
		// session that no longer holds the template.
		isWriteLocked(): boolean
		{
			return !this.canViewVersions || this.isBusy;
		},
		// The restore of a version writes the template, so a session that may not write must not reach it.
		// isWriteLocked itself does not fit: the version view is where a restore is started from, and it is
		// part of that lock. The same getter gates the button of the bar and the item of the history
		// dialog, so nothing the store is going to refuse is offered to be pressed.
		canRestoreVersion(state): boolean
		{
			return !state.isEditorReadonly
				&& !this.isBusy
				&& !state.isRestoreInProgress
				&& !state.isVersionViewTransitionInProgress
			;
		},
		// Derived, never written: a terminal verdict outranks the reversible one, so a template
		// deleted while somebody else was editing it still tells the person what really happened.
		editorLockReason(state): ?string
		{
			if (state.terminalLockReason !== null)
			{
				return state.terminalLockReason;
			}

			return this.isBusy ? EDITOR_LOCK_REASONS.TEMPLATE_BUSY : null;
		},
		// The offer of the takeover, read by both entries into it: the centre of the busy overlay and the
		// item of the menu of the header. An administrator of the portal over a living lease of somebody
		// else, and never over a terminal verdict the move could only run into. A gate of the display and
		// not of the rights: whose lease may be taken away is answered by the server.
		canOfferTemplateTakeover(state): boolean
		{
			return state.busyLock !== null && state.terminalLockReason === null && isPortalAdmin();
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
		// A template that was never saved has started nothing, so the mode has nothing to stop: the server
		// schedules no job for such a publication and asks for the confirmation of the stop all the same.
		// Offering the mode there would take the consent of the author to an irreversible operation that
		// provably will not happen.
		canPublishStoppingRunningProcesses(state): boolean
		{
			return state.templateId > 0;
		},
		// The nodes to review as the scheme holds them now: one deleted by the user right after the
		// insertion drops out here instead of being cleaned out of the map at every place a node can
		// be removed from. The ids of the scheme are gathered once per recalculation, because a scan
		// per node of the fragment reads every block of the scheme through the reactive proxy again,
		// and the getter is recalculated on every node added or removed while the warning is open.
		fragmentReviewBlockIds(): Array<BlockId>
		{
			const blockIdsOnScheme = new Set(this.blocks.map((block) => block.id));

			return this.fragmentReviewNodeIds.filter((nodeId) => blockIdsOnScheme.has(nodeId));
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
		): Array<{ block: Block, connections: { [PortId]: PortId[] } }>
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
			let diagramData = null;
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
			// copilotOptions is not re-read here on purpose: the AI settings come with the screen
			// props at bootstrap and are not part of the diagram payload, so there is nothing to
			// pick up from this response.
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
			// The load answer is the main source of the revision: a tab that has just loaded the
			// diagram — on opening or after a reload that follows a refused write — would otherwise
			// keep writing without one.
			this.draftRevision = diagramData?.draftRevision ?? 0;
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

			this.applyTemplateLock(diagramData?.lock ?? null);
			this.hasLoadedDiagram = true;
			// The graph on the screen has just been replaced, so the fragment the last warning points
			// at is not on it any more.
			this.clearFragmentInsertOutcome();
			// Every read of the graph from the server lands here — the first load, a reload, the pilot
			// that went away, the pilot that was stopped — so what was built on the previous graph is
			// dropped in one place instead of at each of the callers.
			EventEmitter.emit(DIAGRAM_EVENTS.GRAPH_REPLACED);
		},
		// The owner of the lease travels with the schema, so opening a template somebody else is editing
		// goes straight into reading - without it the person would learn of the lease only from a change
		// of their own that got lost. An expired lease never reaches the client, so no deadline is judged
		// here by the clock of the browser — and the renewal judges none either: it counts the time passed
		// since the answer arrived. The same branch runs on every reload of the schema, and it is the only
		// way out of the reading mode.
		applyTemplateLock(lock: mixed): void
		{
			// The lock arrives together with the schema, so by now the canvas carries the graph of the
			// server: whatever the event of the agent brought earlier has been read again with it.
			this.hasSkippedAgentGraph = false;

			if (lock !== null && lock.isMine !== true)
			{
				// Nothing is reported here: opening a schema somebody else holds takes no change away,
				// and the bar that appears with it already says what may be done with the template.
				this.enterBusy(toTemplateLockOwner(lock), BUSY_ENTRY_REASONS.SCHEMA_LOAD);

				return;
			}

			if (lock !== null)
			{
				// A lease of this session that outlived a reload of the page is picked up here: left
				// unclaimed it would be renewed by nobody, released by nobody and invisible to the person
				// holding it.
				this.applyOwnLease(lock);
			}
			else if (this.hasLease)
			{
				// Nobody holds the template, so the lease this session remembers is gone: it ran out, or an
				// administrator released it. Kept, it would let the writes go without taking a lease first
				// and would offer the release of a lease that no longer exists.
				this.hasLease = false;
				this.forgetLease();
			}

			if (this.isBusy)
			{
				this.leaveBusy();
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
					this.connections[index].id = createConnectionId(this.connections[index]);
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
			this.$patch({
				blocks: publication.blocks,
				connections: publication.connections,
				blockCurrentTimestamps: publication.blockCurrentTimestamps,
				connectionCurrentTimestamps: publication.connectionCurrentTimestamps,
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
			this.terminalLockReason = reason;
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
		// The two refusals the template itself is behind: it is gone, or this session may no longer touch
		// it. No repetition of the request outlives them, unlike a broken connection, and which of the two
		// locks the editor is decided here alone — by the refused write and by the tick that asks who holds
		// the template alike. Returns whether the code was one of them.
		handleTerminalLockCode(code: ?string): boolean
		{
			switch (code)
			{
				case TEMPLATE_NOT_FOUND_ERROR_CODE:
					this.handleTemplateDeleted();

					return true;

				// A non-admin gets this code for a deleted template too — the server hides which one —
				// so both cases end up in the same lock.
				case ACCESS_DENIED_ERROR_CODE:
					this.handleWriteAccessLost();

					return true;

				default:
					return false;
			}
		},
		// The one place where a refused write is read, shared by every write path: the autosave, the
		// publication, the rename and the three version-history actions. Returns whether the server
		// gave a verdict: a false leaves the failure to the caller, so an unknown code and a broken
		// connection still go to the retries the way they did before.
		async handleWriteRejection(error: Error): Promise<boolean>
		{
			const code = getErrorCode(error);
			if (this.handleTerminalLockCode(code))
			{
				return true;
			}

			switch (code)
			{
				case TEMPLATE_LOCKED_ERROR_CODE:
					this.enterBusy(toTemplateLockOwner(getErrorCustomData(error)), BUSY_ENTRY_REASONS.WRITE_REFUSED);

					return true;

				// One behaviour and one message for both codes: which of them happened matters to the
				// server and to the agent, not to the person in the editor.
				case DRAFT_REVISION_CONFLICT_ERROR_CODE:
				case DRAFT_NOT_FOUND_ERROR_CODE:
					await this.handleOutdatedDraft();

					return true;

				default:
					return false;
			}
		},
		// The single way into the reading mode, shared by the refused write, the load answer and the
		// lease events. Unlike lockEditor() this is not terminal, so nothing is retired: a reload of
		// the schema takes the editor back to work. The owner is absent when nobody holds the template
		// any more — this session released the lease itself, or an administrator released it for them:
		// there is nobody to name, and the writing is over all the same.
		// The notification belongs to the ways where the writing was taken from the person by somebody
		// else, and which of them it was decides the words: see BUSY_ENTRY_REASONS.
		enterBusy(owner: ?TemplateLockOwner, reason: string): void
		{
			const wasBusy = this.isBusy;
			// The write that carried the fragment was refused, so the fragment never reached the draft
			// and the warning about it has nothing left to point at.
			this.clearFragmentInsertOutcome();
			this.busyLock = owner ?? null;
			this.isBusyLockConfirmedFree = false;

			if (this.hasLease)
			{
				this.hasLease = false;
				this.hasReleasedLease = true;
				this.forgetLease();
			}

			if (!wasBusy && this.isBusy)
			{
				// The first load of the page brings the reading mode with the schema, and there is no
				// focus in the editor to take over yet. Every later entry interrupts the work.
				this.hasEnteredBusyDuringWork = this.hasLoadedDiagram;
			}

			const messageId = BUSY_ENTRY_MESSAGES[reason] ?? null;

			// Every message waits for the schema: before it the reading mode took no writing away. The
			// event of a lost lease that reaches a tab holding nothing leaves isBusy false and is left
			// silent by the same check.
			if (!wasBusy && this.isBusy && messageId !== null && this.hasLoadedDiagram)
			{
				const message = Loc.getMessage(messageId) ?? '';
				useToastStore().addWarning(
					message,
					reason === BUSY_ENTRY_REASONS.WRITE_REFUSED ? TEMPLATE_LOCKED_TOAST_TAG : null,
				);
				// The toast renders a plain div, so the refused write reaches the screen reader from here.
				LiveAnnouncer.announce(message, 'assertive');
			}
		},
		// The only writer of the pair "the template is confirmed free" and "this is who holds it". Outside
		// a takeover the two always agree, and a takeover parts them for its own length only: everything
		// that puts them back together goes through here, so the rule lives in one place instead of being
		// repeated on every branch.
		setBusyOwner(owner: ?TemplateLockOwner): void
		{
			this.isBusyLockConfirmedFree = owner === null;
			this.busyLock = owner;
		},
		// The owner the background refresh of the bar has just read. Only the wording of the bar is at
		// stake here, so nothing else of the reading mode is touched. The guards belong to that refresh
		// alone: a takeover leaving the transition writes the pair directly and inherits none of them.
		refreshBusyOwner(owner: ?TemplateLockOwner): void
		{
			if (!this.isBusy || this.hasLease)
			{
				return;
			}

			if (owner === null && this.isTemplateTakeoverInProgress)
			{
				// The freedom is confirmed at once — the takeover learns from it that there was nothing to
				// release — while the name stays on the screen until the schema of the person is ready.
				this.isBusyLockConfirmedFree = true;

				return;
			}

			this.setBusyOwner(owner);
		},
		// The lease this session holds, as the server dated it. Nothing here leaves the reading mode: a
		// session that takes the template over is still looking at the graph of somebody else, and only a
		// reload of the schema brings it back to work.
		applyOwnLease(lock: mixed): void
		{
			this.lease = toTemplateLockOwner(lock);
			// Dated by the clock of this tab and used only to measure the time passed since: the term of
			// the lease comes from the server, so a browser clock set to anything at all changes nothing.
			this.leaseReceivedAt = Date.now();
			this.hasLease = true;
			// The renewal after this one waits for the person to act again: a tab nobody touches gives the
			// template back when the lease runs out.
			hasSeenUserActivity = false;
			this.armLeaseRenewal();
		},
		// Drops what is left of a lease this session no longer holds. The timer goes with it: a renewal of
		// a foreign lease is a request that can only be refused.
		forgetLease(): void
		{
			this.lease = null;
			this.leaseReceivedAt = null;
			this.stopLeaseRenewal();
		},
		// Takes the lease of the template for this session or extends the one it already holds: which of
		// the two is needed is decided by the server, so both go through one action. Returns whether this
		// session holds the lease afterwards. A failure without a verdict is put on the screen only for a
		// press of the person: the renewal in the background would report a broken connection every
		// minute, and on the way of a write the status of the save says it already.
		async acquireTemplateLease(isUserInitiated: boolean = false): Promise<boolean>
		{
			if (this.templateId <= 0 || !isTemplateEditLockAvailable())
			{
				return false;
			}

			try
			{
				const { lock } = await editorAPI.acquireTemplateLock({ templateId: this.templateId });
				this.applyOwnLease(lock);

				return true;
			}
			catch (error)
			{
				// A coded refusal is a verdict: TEMPLATE_LOCKED names the owner and turns the editor to
				// reading. Anything else — an unavailable lease storage answers with an unknown code —
				// means the template is not known to be busy, and nothing is closed on a guess. Such a
				// failure changes nothing on the screen, so the press behind it is answered here.
				if (!await this.handleWriteRejection(error) && isUserInitiated)
				{
					handleResponseError(error);
				}

				return false;
			}
		},
		// Whether the write about to go out still has to take the lease. Asked before the taking itself so
		// that a write with nothing to take starts in the same tick it always did: this is the hottest
		// path of the editor and an await of a promise that is already resolved still costs it a tick.
		needsTemplateLease(): boolean
		{
			return !this.hasLease && this.templateId > 0 && isTemplateEditLockAvailable();
		},
		// The lease of the first write in the session: the load of the schema only reads its owner. Tells
		// whether the write may go on — it may not once the server has named the person holding the
		// template, and it may when the lease is simply unavailable.
		async ensureTemplateLease(): Promise<boolean>
		{
			if (!this.needsTemplateLease())
			{
				return true;
			}

			await this.acquireTemplateLease();

			return !this.isWriteLocked;
		},
		// Gives the lease up on the action of the person. An administrator releases the lease of somebody
		// else the same way: whose lease may be released is decided by the server.
		async releaseTemplateLease(): Promise<boolean>
		{
			if (this.templateId <= 0 || !isTemplateEditLockAvailable())
			{
				return false;
			}

			// A change still waiting out the debounce of the autosave goes out now: left to the timer it
			// would fire into a session that may no longer write, and the last edit of the person would
			// disappear without a word.
			pendingSaveFlush?.();

			// The queued and the running writes next — the saves, the publication and the rename alike:
			// released before them, the lease would be gone while the last change of the person is still
			// on its way to the server, and the server would take the lease anew on behalf of that write.
			await waitForTemplateWrites(this);

			// Reading starts before the answer arrives: a change made in the meantime would otherwise take
			// the lease back through the write path and leave the button deciding nothing. Nothing is
			// reported: the person pressed the item themselves, and the bar answers the press.
			if (this.hasLease)
			{
				this.enterBusy(null, BUSY_ENTRY_REASONS.OWN_RELEASE);
			}

			try
			{
				const { released } = await editorAPI.releaseTemplateLock({ templateId: this.templateId });
				if (released === true)
				{
					this.refreshBusyOwner(null);

					return true;
				}

				// A false answer does not say that the template is free: another person may still hold it.
				// Read the verdict instead of optimistically erasing the owner shown on the screen.
				const { lock } = await editorAPI.getTemplateLock({ templateId: this.templateId });
				this.refreshBusyOwner(lock === null ? null : toTemplateLockOwner(lock));

				// Inside a takeover the warning describes a step, not a result: the person asked for the
				// template, and what became of it they read on the screen — the schema that opened, or the
				// name that stayed.
				if (!this.isTemplateTakeoverInProgress)
				{
					const message = Loc.getMessage('BIZPROCDESIGNER_EDITOR_RELEASE_TEMPLATE_IDLE_TOAST') ?? '';
					useToastStore().addWarning(message);
				}

				return false;
			}
			catch (error)
			{
				// A refusal of the release is either a verdict, which speaks for itself, or a failure the
				// lease outlives on its own: it expires without anybody asking.
				if (!await this.handleWriteRejection(error))
				{
					handleResponseError(error);
				}

				return false;
			}
		},
		// ALG-01: the one way to take the template into this session, shared by the centre of the overlay
		// and the item of the menu. The move is one — release the lease of somebody else, take it, reload
		// the schema — so the person sees no screen in between, and the flag it raises is what every entry
		// reads instead of waiting on a flag of its own. The flag decides nothing about the rights: who may
		// take a living lease away is answered by the server.
		async takeOverTemplate(): Promise<boolean>
		{
			if (this.isTemplateTakeoverInProgress || this.templateId <= 0 || !isTemplateEditLockAvailable())
			{
				return false;
			}

			// A deleted template and a lost access outlive any takeover: the requests it makes could only
			// be refused.
			if (this.terminalLockReason !== null)
			{
				return false;
			}

			this.isTemplateTakeoverInProgress = true;
			try
			{
				if (this.busyLock !== null && !this.hasLease)
				{
					const isReleased = await this.releaseTemplateLease();
					// A released:false naming a living owner ends the takeover: the template belongs to
					// somebody the server has just named again. A released:false over a free template is no
					// refusal at all — there was simply nothing left to release — so the move goes on to the
					// taking instead of asking for a second press.
					if (!isReleased && !this.isBusyLockConfirmedFree)
					{
						return false;
					}
				}

				if (!await this.acquireTemplateLease(true))
				{
					return false;
				}

				// Taking the lease does not open the writing by itself: the canvas still carries the graph
				// of somebody else, and only the reload brings the editor back to work.
				await this.reloadDiagram();

				return true;
			}
			catch (error)
			{
				handleResponseError(error);
				this.handleDiagramReloadFailure();

				return false;
			}
			finally
			{
				this.isTemplateTakeoverInProgress = false;
				// The holding of the name ends with the takeover. The release went through and the taking
				// did not: the person this very move removed does not stay on the screen, and the template
				// is shown for what it is — free. A verdict that named a new holder never reaches here,
				// enterBusy() has dropped the confirmed freedom itself.
				if (this.isBusyLockConfirmedFree)
				{
					this.setBusyOwner(null);
				}
			}
		},
		// The lease is given up on the way out of the page by a request that survives the unload; the
		// delivery of such a request is not guaranteed by anybody. The stuck lease is bounded by its own
		// term, by the button and by the release an administrator can make — not by this.
		releaseTemplateLeaseOnUnload(): void
		{
			if (!this.hasLease || this.templateId <= 0 || !isTemplateEditLockAvailable())
			{
				return;
			}

			editorAPI.releaseTemplateLockOnUnload({ templateId: this.templateId });
		},
		// Keeps the lease alive while the person works without saving: every write extends it on the
		// server, and this tick covers the pauses between the writes. The tick itself costs nothing —
		// almost always it ends without a request.
		armLeaseRenewal(): void
		{
			if (leaseRenewTimerId !== null || !isTemplateEditLockAvailable())
			{
				return;
			}

			leaseListeners = {
				markActivity: (): void => {
					hasSeenUserActivity = true;
				},
				releaseOnUnload: (event: PageTransitionEvent): void => {
					// A page put into the back-forward cache is not gone: the person can come back to it
					// with the graph as they left it, and to that page the lease still belongs.
					if (event.persisted === true)
					{
						return;
					}

					this.releaseTemplateLeaseOnUnload();
				},
			};

			USER_ACTIVITY_EVENTS.forEach((eventName) => {
				Event.bind(document, eventName, leaseListeners.markActivity, { capture: true, passive: true });
			});
			Event.bind(window, 'pagehide', leaseListeners.releaseOnUnload);

			leaseRenewTimerId = setInterval(() => {
				void this.maybeRenewTemplateLease();
			}, LEASE_RENEW_TICK_MS);
		},
		// A timer nobody stops outlives the lease it renews and, in the editor, the whole session: it dies
		// only with the page.
		stopLeaseRenewal(): void
		{
			if (leaseRenewTimerId === null)
			{
				return;
			}

			clearInterval(leaseRenewTimerId);
			leaseRenewTimerId = null;

			USER_ACTIVITY_EVENTS.forEach((eventName) => {
				Event.unbind(document, eventName, leaseListeners.markActivity, { capture: true });
			});
			Event.unbind(window, 'pagehide', leaseListeners.releaseOnUnload);
			leaseListeners = null;
		},
		// ALG-04: the lease is extended on its second half and only by a tab the person is working in. A
		// background tab renews nothing, and neither does a tab left alone since the previous renewal.
		// Halfway is counted from the moment the answer arrived here, so the term of the lease is the only
		// thing taken from the server and the clock of the browser decides nothing.
		async maybeRenewTemplateLease(): Promise<void>
		{
			if (!this.hasLease || this.lease === null || document.hidden)
			{
				return;
			}

			if (!hasSeenUserActivity)
			{
				return;
			}

			const halfTermMs = this.getLeaseHalfTermMs();
			// A term that cannot be read is a broken answer of the server, not a lease with no time left in
			// it: renewing every tick costs one request a minute, while trusting such a term would switch
			// the renewal off for good and take the template away from a working person.
			if (halfTermMs !== null && Date.now() - this.leaseReceivedAt < halfTermMs)
			{
				return;
			}

			await this.acquireTemplateLease();
		},
		// Half of the term of the lease, in milliseconds, or null when the server dated the window in a way
		// that gives no term at all.
		getLeaseHalfTermMs(): ?number
		{
			const termSeconds = (this.lease?.expiresAt ?? 0) - (this.lease?.acquiredAt ?? 0);

			return termSeconds > 0 && this.leaseReceivedAt !== null ? (termSeconds * 1000) / 2 : null;
		},
		// Called only from the load answer, so the editor comes back to work over a schema that is
		// current: leaving the reading mode over the graph the refused write was made on would send
		// that same graph again.
		leaveBusy(): void
		{
			this.busyLock = null;
			this.isBusyLockConfirmedFree = false;
			this.hasReleasedLease = false;
			this.hasEnteredBusyDuringWork = false;
			useToastStore().clearByTag(TEMPLATE_LOCKED_TOAST_TAG);
			// The refused write left the status in error, and it describes a save this editor is no
			// longer waiting for: kept as is, the header reports a failure in a working session.
			this.saveStatus = SAVE_STATUSES.IDLE;
		},
		// The draft on the server has moved on without this tab, or is gone. Reloading the schema is
		// the most expensive read of the editor, so it stays an emergency path: a routine divergence
		// with the agent is settled by the pull event, which already brings both the graph and the
		// revision. Without the reload the tab has no revision the server would accept again.
		async handleOutdatedDraft(): Promise<void>
		{
			// Two write paths refused in one moment describe one and the same divergence: the second of
			// them joins the reload already under way instead of saying the same thing again and reading
			// the whole schema a second time over the graph the first one has just brought.
			if (outdatedDraftReload !== null)
			{
				await outdatedDraftReload;

				return;
			}

			const message = Loc.getMessage('BIZPROCDESIGNER_EDITOR_DRAFT_OUTDATED_TOAST') ?? '';
			useToastStore().addWarning(message);
			// The graph on the screen is about to be replaced by another one, and the toast that says so
			// renders a plain div: without this the change happens for the screen reader in silence.
			LiveAnnouncer.announce(message, 'assertive');

			// The failure is settled inside the shared promise: whoever joins it waits for the reload and
			// not for an exception belonging to the write path of somebody else.
			outdatedDraftReload = this.reloadDiagram().catch((error) => {
				handleResponseError(error);
				this.handleDiagramReloadFailure();
			});

			try
			{
				await outdatedDraftReload;
			}
			finally
			{
				outdatedDraftReload = null;
			}
		},
		// Tells whether the new template data reached the server. By default nothing is thrown out of
		// here: the rename is fired from a computed setter nobody awaits, so an exception would end as
		// an unhandled rejection and the person would learn of the refusal from nothing at all. A
		// caller that awaits the answer and can fix the refusal itself asks for it with
		// rethrowUnhandledRefusal and then reports it on its own.
		async updateTemplateData(
			data: DiagramTemplate,
			rethrowUnhandledRefusal: boolean = false,
		): Promise<boolean>
		{
			if (this.isWriteLocked)
			{
				return false;
			}

			// The rename stands in no queue of its own, and the server takes the lease for it as well:
			// from here on the release of the lease waits for it.
			const finishWrite = beginWriteOutsideDraftQueue();

			if (this.needsTemplateLease() && !await this.ensureTemplateLease())
			{
				finishWrite();

				return false;
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
				const isRefusal = await this.handleWriteRejection(e);
				if (!isRefusal)
				{
					// A refusal the editor does not answer for itself belongs to the caller that asked
					// for it: the window that sent the values may be able to fix such a refusal on the
					// spot, and then it reports the refusal itself instead of the balloon here.
					if (rethrowUnhandledRefusal)
					{
						throw e;
					}

					handleResponseError(e);
				}

				return false;
			}
			finally
			{
				finishWrite();
			}

			this.lastRecordedChangeAt = Date.now();

			return true;
		},
		// The new name reaches the screen only once the server has accepted it: applied in advance it
		// stays on the screen after a refusal, while the template is called something else.
		async applyTemplateMetadata(data: DiagramTemplate): Promise<boolean>
		{
			const isSaved = await this.updateTemplateData(data);
			if (isSaved)
			{
				Object.assign(this.template, data);
			}

			return isSaved;
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
				// The lease is taken right before the write and inside the queue, so the second save of the
				// session does not ask for it again and no save overtakes the request that takes it. A
				// forced write does not stop for it: the flush of a draft before a version snapshot goes
				// around the write lock, and a lease it never asked for cannot refuse it.
				if (!ignoreWriteLock && this.needsTemplateLease() && !await this.ensureTemplateLease())
				{
					return false;
				}

				// The graph of the agent was left unapplied while the writing was closed: the canvas is
				// older than the draft on the server while the revision is the newest one, so this write
				// would pass the check of the server and erase the work of the agent. Reading the schema
				// once is what the revision is there for.
				if (this.hasSkippedAgentGraph)
				{
					await this.reloadDiagram();
				}

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

				// A request without the field is an old client for the server, and that is exactly the
				// behaviour the editor needs while the feature is off. An unknown revision is left out
				// for the same reason: sent as a zero it would read as a mismatch.
				if (this.draftRevision > 0 && isTemplateEditLockAvailable())
				{
					requestData.draftRevision = this.draftRevision;
				}

				try
				{
					const { templateDraftId, draftRevision } = await editorAPI.publicDiagramDataDraft(requestData);
					if (Type.isNumber(templateDraftId))
					{
						this.draftId = templateDraftId;
					}

					this.setDraftRevision(draftRevision);
				}
				catch (e)
				{
					// A coded refusal is a verdict, not a broken connection: without this branch the
					// caller retries a request the server will never accept and reports a network
					// failure the user cannot fix.
					if (await this.handleWriteRejection(e))
					{
						return false;
					}

					throw e;
				}

				// Every draft save goes through here, including the points that write the draft
				// silently, so the hint time follows the draft on the server, not the header status.
				this.lastSavedAt = Date.now();
				this.lastRecordedChangeAt = this.lastSavedAt;

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
				catch (error)
				{
					if (getErrorCode(error) === TEMPLATE_DRAFT_CONFLICT_ERROR_CODE)
					{
						if (!isOutdatedRun())
						{
							this.saveStatus = SAVE_STATUSES.ERROR;
							handleResponseError(error);
						}

						return;
					}

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
		// The save points outside the autosave — a deleted block, a changed frame, saved node settings
		// — write the draft through here: there is no retry loop on them, so the outcome has to become
		// visible on the spot. A refusal has already spoken for itself in handleWriteRejection(); a
		// broken connection is named here, otherwise the dialog closes and nothing is said at all.
		async saveDraftWithStatus(): Promise<boolean>
		{
			// Reserved before the request: a save started after this one owns the status, so a late
			// answer here must not overwrite it.
			const runId = this.beginSaveRun();
			try
			{
				const isDraftSaved = await this.publicDraft();
				this.updateStatus(isDraftSaved, runId);

				return isDraftSaved;
			}
			catch
			{
				this.updateStatus(false, runId);
				UI.Notification.Center.notify({
					content: Loc.getMessage('BIZPROCDESIGNER_EDITOR_TOP_PANEL_AUTOSAVE_STATUS_NOT_SAVED_HINT') ?? '',
					autoHideDelay: 4000,
				});

				return false;
			}
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
				this.notifyProcessDataPublicationError(error.data.activityErrors);
			}

			return false;
		},
		// A refusal caused by the data of the process names a key, and the key lives in the window of
		// the process data, not on the canvas: the way there travels with the message naming it.
		notifyProcessDataPublicationError(activityErrors: Array<Object>): void
		{
			const error = findProcessDataPublicationError(activityErrors);
			if (error === null)
			{
				return;
			}

			UI.Notification.Center.notify({
				content: Text.encode(error.message),
				autoHideDelay: 8000,
				actions: [{
					title: Loc.getMessage('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_PUBLISH_ERROR_ACTION') ?? '',
					events: {
						click: (event, balloon) => {
							balloon.close();
							EventEmitter.emit(
								PROCESS_DATA_EVENTS.OPEN,
								error.select === null ? {} : { select: error.select },
							);
						},
					},
				}],
			});
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

			// The publication stands in no queue of the draft saves, and the server takes the lease for it
			// as well: from here on the release of the lease waits for it.
			const finishWrite = beginWriteOutsideDraftQueue();

			if (this.needsTemplateLease() && !await this.ensureTemplateLease())
			{
				finishWrite();

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

				this.lastRecordedChangeAt = Date.now();
				this.lastPublishedAt = this.lastRecordedChangeAt;

				return true;
			}
			catch (e)
			{
				// The right to publish is granted separately from the right to edit, so a refused
				// publication does not mean this user lost write access: ACCESS_DENIED is left to the
				// caller, which shows the message of the server instead of locking the editor.
				if (getErrorCode(e) !== ACCESS_DENIED_ERROR_CODE && await this.handleWriteRejection(e))
				{
					return false;
				}

				if (this.handlePublicationFailure(e))
				{
					return false;
				}

				throw e;
			}
			finally
			{
				this.isPublishing = false;
				finishWrite();
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

			const finishWrite = beginWriteOutsideDraftQueue();

			if (this.needsTemplateLease() && !await this.ensureTemplateLease())
			{
				finishWrite();

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
			finally
			{
				finishWrite();
			}
		},
		// The publication that stops the processes started before it. The scheme reaches everyone the
		// way an ordinary publication sends it - the state after a success is that very one - and the
		// mode tells the server to stop what has already been running. Nothing of the publication to an
		// audience travels here: this mode publishes the canvas and promotes no stored snapshot.
		//
		// The waiting flag belongs to the caller and is not touched here: the rounds of confirmations
		// hold a dialog open between them, and a flag of this method would drop for the time of it.
		async publicFullTemplate(
			{ confirmations = [], scheme = null }: {
				confirmations?: Array<string>,
				scheme?: ?DiagramData,
			},
		): Promise<boolean>
		{
			// The lock every write path of the editor stands behind, and not the readonly state alone: a
			// version snapshot on the canvas and a restore in flight must not be published either.
			if (this.isWriteLocked)
			{
				return false;
			}

			const finishWrite = beginWriteOutsideDraftQueue();

			if (this.needsTemplateLease() && !await this.ensureTemplateLease())
			{
				finishWrite();

				return false;
			}

			const requestData = {
				// Every round of confirmations publishes one and the same scheme, so a caller that walks
				// them passes the graph it collected once instead of paying for the whole one per round.
				...(scheme ?? this.buildPublicationData()),
				publishMode: FULL_PUBLISH_MODE,
				confirmations,
			};

			try
			{
				const { templateId, pilot, terminationScheduled } = await editorAPI.publicDiagramData(requestData);
				this.isTerminationScheduled = terminationScheduled !== false;
				// The captured snapshot belongs to the previously published version.
				useNodeDataInspectorStore().resetLastValues();
				// This publication rewrites the live scheme and the server stops the pilot over it, so
				// the answer brings the state the editor has to show from now on.
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

				this.lastRecordedChangeAt = Date.now();
				this.lastPublishedAt = this.lastRecordedChangeAt;

				return true;
			}
			catch (e)
			{
				if (getErrorCode(e) !== ACCESS_DENIED_ERROR_CODE && await this.handleWriteRejection(e))
				{
					return false;
				}

				if (this.handlePublicationFailure(e))
				{
					return false;
				}

				throw e;
			}
			finally
			{
				finishWrite();
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
		markFragmentNodesForReview(nodes: Array<{ nodeName: string }>): void
		{
			this.fragmentReviewNodeIds = nodes
				.map((node) => node?.nodeName)
				.filter((nodeName) => Type.isStringFilled(nodeName))
			;
		},
		/**
		 * An insertion from the library holds the field for as long as it runs, and every outcome
		 * releases it. A second insertion started meanwhile would cost another request, another write
		 * of up to 200 nodes, another autosave of the draft and another step of the history to undo.
		 */
		startFragmentInsert(fragmentId: number): void
		{
			this.insertingFragmentId = fragmentId;
		},
		finishFragmentInsert(): void
		{
			this.insertingFragmentId = null;
		},
		/**
		 * Everything one insertion from the library left on the screen. The warning and the map are
		 * dropped together on purpose: a warning pointing at nodes that are no longer on the scheme
		 * sends the user to a node that does not exist, and a map outlasting its warning would do the
		 * same through the button of the next one.
		 */
		clearFragmentInsertOutcome(): void
		{
			this.fragmentReviewNodeIds = [];
			useToastStore().clearAllOfType(BLOCK_TOAST_TYPES.FRAGMENT_INSERT_OUTCOME);
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
			this.lastRecordedChangeAt = this.lastSavedAt;
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
		// Accepts the revision the server confirms: in the answer to a write, in the answer to a
		// version restore and in the agent event. A zero is not news — the server sends it when it has
		// nothing to confirm (an agent event about a draft that is no longer the freshest one), and
		// overwriting a known revision with it would silently drop the protection from a lost write.
		// Never gated by the write lock: a reading tab that stops following the revision would come
		// back to writing with a stale one.
		setDraftRevision(draftRevision: ?number): void
		{
			if (!Type.isNumber(draftRevision) || draftRevision <= 0)
			{
				return;
			}

			this.draftRevision = draftRevision;
		},
		// The event of the agent brought a graph this session could not put on the canvas. Only the
		// revision above was taken in, so the next write has to read the schema before it goes out.
		markSkippedAgentGraph(): void
		{
			this.hasSkippedAgentGraph = true;
		},
		// The debounce of the autosave lives in the canvas widget, and the release of the lease has to
		// reach it: a change waiting out the delay stands in no queue of the saves yet. Unmounting the
		// canvas passes null — a timer of a widget that is gone flushes nothing.
		setPendingSaveFlush(flush: ?() => void): void
		{
			pendingSaveFlush = flush;
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
			if (!this.canViewVersions)
			{
				return false;
			}

			this.isVersionViewTransitionInProgress = true;
			try
			{
				// The draft is flushed so the canvas does not lose local changes behind the snapshot.
				// In the reading mode there are none to flush, and the draft belongs to somebody else:
				// the forced write would go around the very lock that put the editor here.
				if (!this.isBusy)
				{
					await this.publicDraft(true);
				}

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
			// The snapshot of a published version has none of the nodes the last insertion added, so the
			// warning about them would point at a scheme that is no longer on the screen. Leaving the
			// view goes through a reload, which drops the same state on its own.
			this.clearFragmentInsertOutcome();
			this.graphRevision++;
			EventEmitter.emit(DIAGRAM_EVENTS.GRAPH_REPLACED);
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
		// The three version-history actions below write the template, so a session that may not write
		// must not reach them.
		async restoreVersion(versionId: number): Promise<boolean>
		{
			if (!this.canRestoreVersion)
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
				await this.applyRestoreResult(data?.draftId, data?.draftRevision, true);

				return true;
			}
			catch (error)
			{
				await this.handleVersionActionError(error);

				return false;
			}
			finally
			{
				this.isRestoreInProgress = false;
			}
		},
		async undoRestore(): Promise<boolean>
		{
			if (this.isEditorReadonly || this.isBusy || this.isRestoreInProgress || !this.canUndoRestore)
			{
				return false;
			}

			this.isRestoreInProgress = true;
			try
			{
				const data = await editorAPI.undoTemplateRestore({ templateId: this.templateId });
				await this.applyRestoreResult(data?.draftId, data?.draftRevision, false);

				return true;
			}
			catch (error)
			{
				await this.handleVersionActionError(error);

				return false;
			}
			finally
			{
				this.isRestoreInProgress = false;
			}
		},
		async discardRestoreBackup(): Promise<boolean>
		{
			if (this.isEditorReadonly || this.isBusy || this.isRestoreInProgress || !this.canUndoRestore)
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
				await this.handleVersionActionError(error);

				return false;
			}
			finally
			{
				this.isRestoreInProgress = false;
			}
		},
		// The draft the editor writes to is switched before the graph reload and before any
		// autosave can fire: the previous draft is now the backup copy.
		async applyRestoreResult(draftId: ?number, draftRevision: ?number, canUndoRestore: boolean): Promise<void>
		{
			this.setDraftId(draftId ?? 0, true);
			this.setDraftRevision(draftRevision);
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
				this.handleDiagramReloadFailure();

				return;
			}

			this.canUndoRestore = canUndoRestore;
			this.isVersionViewMode = false;
			// The server writes both the restore and its undo into the journal, and neither of them goes
			// through a draft save of this editor: without this the open feed would stay as it was.
			this.lastRecordedChangeAt = Date.now();
			useVersionHistoryStore().clearSelection();
		},
		// The server has already moved on — a restore happened, or the draft was rewritten from
		// elsewhere — while the canvas still shows the graph that was replaced. The editor stays
		// locked past the caller's finally, so no autosave writes the stale graph back: only a page
		// reload gets the user out.
		handleDiagramReloadFailure(): void
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
		async handleVersionActionError(error: Error): Promise<void>
		{
			if (await this.handleWriteRejection(error))
			{
				return;
			}

			if (getErrorCode(error) === RESTORE_UNDO_UNAVAILABLE_ERROR_CODE)
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
			// The switcher of a trigger sits beside the block, outside the top menu the lock hides, so
			// the refusal lives here: the draft behind this action is refused anyway, and the flag flipped
			// locally would leave the published version looking like something it never was.
			if (this.isWriteLocked)
			{
				return;
			}

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
