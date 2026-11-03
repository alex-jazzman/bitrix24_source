import {
	ZoomBar,
	HistoryBar,
	useHistory,
	useAnimationQueue,
	useBlockDiagram,
	useCanvas,
	ANIMATED_TYPES,
} from 'ui.block-diagram';
import 'ui.design-tokens';
import 'ui.icon-set.outline';
import { EventEmitter, type BaseEvent } from 'main.core.events';
import { PULL } from 'pull.client';
import { BitrixVue, computed, markRaw, nextTick, onScopeDispose, ref, toValue, watch, getCurrentScope } from 'ui.vue3';
import { mapState, mapWritableState } from 'ui.vue3.pinia';

import { FeatureCode } from 'bizprocdesigner.feature';

import { AI_AGENT_TOAST_TYPES, AI_AGENT_MESSAGE_KEYS } from './entities/ai-assistant';
import { initAiUpdatePull } from './entities/ai-assistant/api/pull';
import { makeAnimationQueue } from './entities/ai-assistant/util/animation';
import { resolveAgentDraftApply } from './entities/ai-assistant/util/resolve-draft-apply';
import { createSettingsTour } from './entities/ai-assistant/util/settings-tour';
import * as TabHighlight from './entities/ai-assistant/util/tab-highlight';
import {
	AppSkeleton,
	useAppStore,
	CATALOG_WIDTH_COLLAPSED,
	CATALOG_WIDTH_EXPANDED,
	DATA_INSPECTOR_PANEL_WIDTH,
	DEBUG_BAR_TOOLBAR_OFFSET,
	PANEL_EDGE_GAP,
	SETTINGS_PANEL_WIDTH,
	TOOLBAR_ROW_HEIGHT,
} from './entities/app';
import {
	diagramStore,
	BLOCK_SLOT_NAMES,
	BLOCK_TOAST_TYPES,
	BUSY_ENTRY_REASONS,
	CONNECTION_SLOT_NAMES,
	ConnectionAux,
	FRAME_BG_COLORS,
	ICON_BG_COLORS,
	toTemplateLockOwner,
	usePublishMenuStore,
	type BlockId,
} from './entities/blocks';
import { useCatalogStore, DRAG_ITEM_SLOT_NAMES } from './entities/catalog';
import {
	createConnectionIndex,
	resolveConnectionMidpoint,
	resolveMarkerPosition,
	useNotesStore,
	type NoteAnchor,
	type NoteConnectionIndex,
	type NotePoint,
	type NoteSchemaRect,
	type NotesSchema,
} from './entities/notes';
import { initTemplateNotesPull } from './entities/notes/api/pull';
import { ToastWarning, ToastAgentNotice, ToastColorScheme } from './entities/toast';
import { highlightAgentChanges, initAgentHighlight } from './features/ai-assistant';
import { useDataViewDefinitionStore } from './features/data-view-editor';
import { initDataViewEditorConnector } from './features/data-view-editor/connector';
import { DataViewEditorWindow } from './features/data-view-editor/ui/editor-window';
import { initProcessDataConnector } from './features/process-data/connector';
import { FragmentLibraryWindow, SaveFragmentDialog } from './features/fragment-library';
import { ChangePilotAudience, PilotBadge, StopPilot } from './features/pilot';
import { DiagramLayoutButton } from './features/diagram-layout';
import { NoteComposer, NoteThread, NotesModeButton, type NoteDraft } from './features/notes';
import { focusNote } from './features/notes/lib/focus-note';
import { useFeature, useLoc } from './shared/composables';
import { FRAGMENT_LIBRARY_EVENTS, SHARED_TOAST_TYPES } from './shared/constants';
import { useToastStore } from './shared/stores';
import { ConnectAgentButton } from './shared/ui/connect-agent-button/connect-agent-button';
import { ConnectAgentOnboarding, PilotPublicationOnboarding } from './entities/onboarding';
import { DebugButton } from './shared/ui/debug-button';
import { SearchBar } from './shared/ui/search-bar/search-bar';
import { updateIdUrl, handleResponseError } from './shared/utils';
import { AppLayout, AppHeader } from './widgets/app';
import {
	BlockDiagram,
	BlockSimple,
	BlockTrigger,
	BlockComplex,
	BlockTool,
	BlockFrame,
	BlockOperator,
	BlockService,
	DiagramMenu,
	AutosaveStatus,
	TemplateName,
	PublishDropdownButton,
	ToastErrorBlockNavigationButton,
	ToastFragmentReviewButton,
} from './widgets/blocks';
import { BlockMediator } from './widgets/blocks/lib';
import { RestoreUndoBar } from './widgets/blocks/ui/restore-undo-bar/restore-undo-bar';
import { TemplateBusyBar } from './widgets/blocks/ui/template-busy-bar/template-busy-bar';
import { VersionViewBar } from './widgets/blocks/ui/version-view-bar/version-view-bar';
import { Catalog } from './widgets/catalog';
import { DebugBar } from './widgets/debug-bar';
import { CommonNodeSettings } from './widgets/common-node-settings';
import { NodeDataInspector, ToggleInspectorControl } from './widgets/node-data-inspector';
import { NodeSettings as ComplexNodeSettings } from './widgets/node-settings';
import { NodeSettingsHeader } from './widgets/node-settings-header';
import { NotesLayer } from './widgets/notes';
import { TemplateNotFoundState } from './widgets/template-not-found-state/template-not-found-state';
import { ToastWidget } from './widgets/toast';

import './design-tokens.css';

// Tells the former owner of a lease that it stopped being the editor of the template. Only an explicit
// release gets here: an expired lease is taken over silently and the tab learns of it from the refusal
// of its first write.
const TEMPLATE_LOCK_LOST_PULL_COMMAND = 'bizprocdesigner_template_lock_lost';

function initTemplateLockLostPull(): void
{
	PULL.subscribe({
		moduleId: 'bizprocdesigner',
		command: TEMPLATE_LOCK_LOST_PULL_COMMAND,
		callback: ({ templateId, owner }: { templateId: number, owner: ?Object }): void => {
			const store = diagramStore();

			// The event addresses the user and not the tab, so it reaches every tab they have open:
			// without the check a lease lost on one template would close the editor of another.
			if (templateId !== store.templateId)
			{
				return;
			}

			// Nobody holds the template once its owner has released it: an absent owner is the ordinary
			// shape of the event and not a refusal to show. Whether somebody has taken the template over
			// in the meantime changes nothing for this tab: its lease was released for it either way.
			store.enterBusy(owner ? toTemplateLockOwner(owner) : null, BUSY_ENTRY_REASONS.LEASE_TAKEN_AWAY);
			if (owner === null && store.isBusy)
			{
				store.refreshBusyOwner(null);
			}
		},
	});
}

function isExternalAiAgentAllowed(): boolean
{
	const { isFeatureAvailable, isFeatureLocked } = useFeature();

	return isFeatureAvailable(FeatureCode.externalAiAgent) && !isFeatureLocked(FeatureCode.externalAiAgent);
}

// The code of the feature is the one the server declares: a spelling of its own on the client would
// only ever keep the notes off.
function areTemplateNotesAvailable(): boolean
{
	const { isFeatureAvailable } = useFeature();

	return isFeatureAvailable('templateNotes');
}

/**
 * The capture of the note mode: while the mode is on, the canvas answers a click with a draft
 * instead of the schema below. The section holding it comes before the catalog and the toolbars,
 * which paint over it, so those stay workable with the mode on.
 */
const NOTES_CAPTURE_STYLE = Object.freeze({
	position: 'absolute',
	inset: '0',
	pointerEvents: 'auto',
	cursor: 'crosshair',
});

/**
 * The element `ui.block-diagram` listens for the gestures of its canvas on. The capture above covers
 * it whole, so a gesture that belongs to the canvas is handed to that element itself: the moving and
 * the scaling of the schema stay the doing of the canvas and are not written a second time here.
 */
const CANVAS_TRANSFORM_SELECTOR = '.ui-block-diagram-canvas-transform';

/**
 * Whether a gesture over the capture belongs to the canvas below rather than to the notes. The left
 * button is what puts a note, so it stays with the mode; every other button and the wheel move and
 * scale the schema and have to reach the canvas with the mode on all the same. A move is only of
 * interest while a button is held - that is the whole of a drag, and a bare hover has nothing to
 * hand over.
 */
export function isNotesCanvasGesture(event: MouseEvent): boolean
{
	if (event.type === 'wheel')
	{
		return true;
	}

	if (event.type === 'mousedown')
	{
		return event.button !== 0;
	}

	return event.type === 'mousemove' && event.buttons !== 0;
}

/**
 * The same gesture as an event of its own: an event being dispatched cannot be dispatched again, so
 * the canvas is given a copy of it.
 */
function copyCanvasGesture(event: MouseEvent): MouseEvent
{
	if (event.type !== 'wheel')
	{
		return new MouseEvent(event.type, event);
	}

	const copy = new WheelEvent(event.type, event);

	// The canvas tells a trackpad from a wheel by this legacy field, and not every engine carries it
	// through the init of a copy: rebuilt from deltaY, every mouse would be read as a trackpad.
	Object.defineProperty(copy, 'wheelDeltaY', { value: event.wheelDeltaY });

	return copy;
}

// How near the midpoint of a link a click counts as a click on the link, in canvas units.
const NOTE_CONNECTION_HIT_RADIUS = 24;

const NOTE_ZERO_OFFSET = Object.freeze({ x: 0, y: 0 });

// ERR-009. The discussion the link led to is over: the template is open, and that is all there is to say.
const NOTE_UNAVAILABLE_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_UNAVAILABLE';

function containsPoint(rect: NoteSchemaRect, point: NotePoint): boolean
{
	return point.x >= rect.x
		&& point.x <= rect.x + rect.width
		&& point.y >= rect.y
		&& point.y <= rect.y + rect.height
	;
}

/**
 * The node the click landed on. The smallest of the rects covering the point wins: a node drawn
 * over a frame is what the click is meant for, and the frame under it is not.
 */
function findNodeIdAt(schema: NotesSchema, point: NotePoint): string | null
{
	let nodeId = null;
	let smallestArea = Number.POSITIVE_INFINITY;

	for (const [blockId, rect] of Object.entries(schema.nodeRects))
	{
		const area = rect.width * rect.height;

		if (containsPoint(rect, point) && area < smallestArea)
		{
			smallestArea = area;
			nodeId = blockId;
		}
	}

	return nodeId;
}

/**
 * The point of the canvas an anchor pins a note to, taken from ALG-02 itself: a note sitting right
 * on its anchor resolves to exactly that point, so the utility that draws a marker is also what
 * says where the offset of a new note is counted from.
 */
function anchorPointOf(anchor: NoteAnchor, schema: NotesSchema, fallback: NotePoint): NotePoint
{
	return resolveMarkerPosition({ anchor, offset: NOTE_ZERO_OFFSET, position: fallback }, schema);
}

/**
 * The link the click landed on. A note is pinned to a link by its midpoint (ALG-02), so a click is
 * read the same way: near the point where a marker of that link would sit. The midpoint of a link is
 * taken straight from its own ends - a link whose ends the canvas has not measured has no midpoint
 * and is no hit.
 */
function findConnectionAnchorAt(schema: NotesSchema, point: NotePoint): NoteAnchor | null
{
	for (const connection of schema.connections)
	{
		const midpoint = resolveConnectionMidpoint(schema, connection);

		if (midpoint === null)
		{
			continue;
		}

		if (Math.hypot(midpoint.x - point.x, midpoint.y - point.y) <= NOTE_CONNECTION_HIT_RADIUS)
		{
			return {
				type: 'connection',
				sourceBlockId: connection.sourceBlockId,
				sourcePortId: connection.sourcePortId,
				targetBlockId: connection.targetBlockId,
				targetPortId: connection.targetPortId,
			};
		}
	}

	return null;
}

/**
 * ALG-02 read backwards: the note takes the anchor of whatever the click landed on, and `offset` is
 * its shift from that anchor - the shift is what makes the marker travel with a node that moves.
 * `position` is the absolute point of the canvas and is only read once the anchor is gone, so the
 * two are written apart and neither stands in for the other.
 */
function noteDraftAt(templateId: number, schema: NotesSchema, point: NotePoint): NoteDraft
{
	const nodeId = findNodeIdAt(schema, point);
	const anchor = nodeId === null
		? (findConnectionAnchorAt(schema, point) ?? { type: 'free' })
		: { type: 'node', nodeId }
	;
	const anchorPoint = anchorPointOf(anchor, schema, point);

	return {
		templateId,
		anchor,
		offset: {
			x: Math.round(point.x - anchorPoint.x),
			y: Math.round(point.y - anchorPoint.y),
		},
		position: point,
	};
}

// @vue/component
export const Chart = {
	components: {
		AppLayout,
		AppHeader,
		AppSkeleton,
		ConnectAgentButton,
		PilotBadge,
		ChangePilotAudience,
		StopPilot,
		BlockDiagram,
		BlockSimple,
		BlockTrigger,
		BlockComplex,
		BlockTool,
		BlockFrame,
		BlockOperator,
		BlockService,
		DiagramMenu,
		AutosaveStatus,
		TemplateName,
		PublishDropdownButton,
		ZoomBar,
		DebugButton,
		DiagramLayoutButton,
		DebugBar,
		ComplexNodeSettings,
		HistoryBar,
		SearchBar,
		Catalog,
		CommonNodeSettings,
		ConnectionAux,
		ToastWidget,
		ToastWarning,
		ToastAgentNotice,
		ToastErrorBlockNavigationButton,
		ToastFragmentReviewButton,
		NodeDataInspector,
		ToggleInspectorControl,
		NodeSettingsHeader,
		NotesLayer,
		NotesModeButton,
		NoteComposer,
		NoteThread,
		FragmentLibraryWindow,
		SaveFragmentDialog,
		DataViewEditorWindow,
		// Loaded on demand: the window and its form are the heavy half of the process data
		// feature, and the editor opens them by a menu item that most sessions never touch.
		ProcessDataWindow: BitrixVue.defineAsyncComponent(
			'bizprocdesigner.editor.process-data',
			'ProcessDataWindow',
		),
		TemplateNotFoundState,
		VersionViewBar,
		RestoreUndoBar,
		TemplateBusyBar,
	},
	provide(): {onBlockClick: (event: Event) => void}
	{
		return {
			onBlockClick: this.handleBlockClick,
			onToggleBlockActivation: this.handleToggleBlockActivation,
		};
	},
	props: {
		initTemplateId: {
			type: Number,
			default: 0,
		},
		initDocumentType: {
			type: Array, // todo: add type
			default: null,
		},
		initStartTrigger: {
			type: String,
			default: null,
		},
		initCanPublish: {
			type: Boolean,
			default: false,
		},
		// CFG-01. The server is the only authority on AI availability: null means the
		// assistant is not offered on this screen, and a missing param reads the same way.
		initCopilotOptions: {
			type: Object,
			default: null,
		},
		// TPL-02. The note a notification led here for. The page hands it over as a parameter of the
		// mounting: the address bar is read by the server, which has already dropped a value that is
		// no note at all.
		initNoteId: {
			type: Number,
			default: 0,
		},
	},
	// eslint-disable-next-line max-lines-per-function
	setup(props): {...}
	{
		const catalogStore = useCatalogStore();
		const notesStore = useNotesStore();
		diagramStore().initEventListeners();
		diagramStore().canPublish = props.initCanPublish;
		// markRaw: the options are read once at editor init and handed to ui.text-editor as they
		// are, so a reactive proxy would be the only thing this module adds to a foreign contract
		diagramStore().copilotOptions = props.initCopilotOptions === null
			? null
			: markRaw(props.initCopilotOptions);
		diagramStore().isPilotFeatureAvailable = useFeature().isFeatureAvailable(FeatureCode.pilotPublication);
		initDataViewEditorConnector();
		initProcessDataConnector();
		const { makeSnapshot, setHandlers, commonSnapshotHandler, commonRevertHandler } = useHistory();
		const isDiagramDisabled = ref(true);
		const snapshotHandler = (newState) => {
			return {
				...commonSnapshotHandler(newState),
				templateConstants: markRaw(
					JSON.parse(JSON.stringify(diagramStore().template.CONSTANTS ?? {})),
				),
				blockCurrentTimestamps: markRaw(JSON.parse(JSON.stringify(diagramStore().blockCurrentTimestamps))),
				connectionCurrentTimestamps: markRaw(JSON.parse(JSON.stringify(diagramStore().connectionCurrentTimestamps))),
			};
		};

		const revertHandler = (snapshot) => {
			commonRevertHandler(snapshot);
			diagramStore().setTemplateConstants(snapshot.templateConstants ?? {});
			diagramStore().setBlockCurrentTimestamps(snapshot.blockCurrentTimestamps);
			diagramStore().setConnectionCurrentTimestamps(snapshot.connectionCurrentTimestamps);
		};
		setHandlers({ snapshotHandler, revertHandler });

		const animationQueue = useAnimationQueue();
		// The queue of the animation outlives the editor: its step is deferred by a timer, and once
		// the scope is gone the step walks over a state nobody holds any more. Stopped through the
		// public stop() of the same instance, unconditionally - it is idempotent and does no harm to
		// a queue that was never started. Registered before every other disposal of this scope:
		// EffectScope.stop() runs them in order of registration and wraps none of them in a
		// try/catch, so a throw in an earlier one would leave the queue running.
		onScopeDispose(() => animationQueue.stop());

		const {
			isStopAnimation,
			transform,
			blocksRectMap,
			portsRectMap,
			connections: diagramConnections,
			canvasWidth,
			canvasHeight,
			blockDiagramTop,
			blockDiagramLeft,
			blockDiagramRef,
		} = useBlockDiagram();
		const { setCamera } = useCanvas();

		// The mode of the notes and the draft put by a click in it. A draft is the whole note until
		// its first message is sent (AC-007): nothing of it reaches the server before that.
		const isNotesMode = ref(false);
		const noteDraft = ref(null);
		// The selection on its way into the library: filled by a menu item, emptied by the window (API-02).
		const fragmentToSave = ref(null);
		const isFragmentLibraryShown = ref(false);
		// The place a fragment is added at: only the item of the canvas menu knows it, and by the time a
		// fragment is chosen the pointer has long left it. Without a place the insertion picks one itself.
		const fragmentInsertPoint = ref(null);
		// Subscribed synchronously in setup(), so the unsubscribe belongs to this scope: a reopened editor
		// piles no handlers on the bus.
		const showFragmentLibrary = (event: BaseEvent): void => {
			fragmentInsertPoint.value = event.getData()?.point ?? null;
			isFragmentLibraryShown.value = true;
		};
		EventEmitter.subscribe(FRAGMENT_LIBRARY_EVENTS.OPEN, showFragmentLibrary);
		onScopeDispose(() => EventEmitter.unsubscribe(FRAGMENT_LIBRARY_EVENTS.OPEN, showFragmentLibrary));
		// The single door into the dialog of saving: both menus reach it through this event, the one of a
		// single node and the one of a group selection (useSaveToLibrary).
		const showSaveFragmentDialog = (event: BaseEvent): void => {
			const { blocks, connections } = event.getData() ?? {};
			fragmentToSave.value = { blocks: blocks ?? [], connections: connections ?? [] };
		};
		EventEmitter.subscribe(FRAGMENT_LIBRARY_EVENTS.SAVE, showSaveFragmentDialog);
		onScopeDispose(() => EventEmitter.unsubscribe(FRAGMENT_LIBRARY_EVENTS.SAVE, showSaveFragmentDialog));
		// The index of the connections is owed to the set of them: a click reads it as it stands.
		const notesConnectionIndex = computed((): NoteConnectionIndex => (
			createConnectionIndex(diagramConnections.value)
		));
		// The element of the canvas a gesture swallowed by the capture is handed to. It is looked up
		// at the moment of the gesture: the canvas is built by the section above this one.
		const resolveNotesCanvasElement = (): HTMLElement | null => (
			toValue(blockDiagramRef)?.querySelector(CANVAS_TRANSFORM_SELECTOR) ?? null
		);
		// The drawn area of the canvas: the window of the form has to stand whole inside it.
		const notesViewport = computed((): { width: number, height: number } => ({
			width: toValue(canvasWidth),
			height: toValue(canvasHeight),
		}));
		// The drawn schema as the anchor utility reads it, taken at the moment of the click.
		const readNotesSchema = (): NotesSchema => ({
			nodeRects: blocksRectMap.value,
			portRects: portsRectMap.value,
			connections: diagramConnections.value,
			connectionIndex: notesConnectionIndex.value,
		});
		const toastStore = useToastStore();
		const { getMessage } = useLoc();

		// One-shot watcher for completion of the current graph-apply animation.
		// Keep a reference to its stop() so the next apply can cancel an
		// unfinished watcher and prevent it from leaking.
		const setupScope = getCurrentScope();
		let stopAnimationCompletionWatch = null;

		// Leads the right panel over the nodes the agent adds. Its own mediator instance: the
		// series must not run into the guard of a show started by a click of the user.
		const settingsTour = createSettingsTour(new BlockMediator());

		TabHighlight.init();

		// Without the feature neither the visible-set bridge nor the visibilitychange listener is
		// created, so nothing ever fills the highlight store the cards read. The call must remain
		// synchronous in setup() so that onScopeDispose() inside it belongs to this scope.
		if (isExternalAiAgentAllowed())
		{
			initAgentHighlight();
		}

		// EVENT-01. The live channel of the discussions of this template. Subscribed synchronously in
		// setup(), so the unsubscribe is bound to this scope: a handler left behind would keep asking
		// the store of an editor that is gone. The template is read at the moment of the signal -
		// here the schema has not been loaded yet, and the store has no identifier to give.
		if (areTemplateNotesAvailable())
		{
			const unsubscribeFromNotes = initTemplateNotesPull((): number => diagramStore().templateId);
			onScopeDispose(unsubscribeFromNotes);
		}

		/**
		 * The markers of the notes are an addition over the schema, so they are read after it is on the
		 * screen and their refusal leaves the editor as it was. A template that has not been saved yet
		 * has no notes to read: the store keeps that out by the identifier it is given.
		 *
		 * @return boolean whether the list of the notes was read
		 */
		async function loadTemplateNotes(): Promise<boolean>
		{
			if (!areTemplateNotesAvailable())
			{
				return false;
			}

			try
			{
				await notesStore.loadNotes(diagramStore().templateId);

				return true;
			}
			catch (error)
			{
				handleResponseError(error);

				return false;
			}
		}

		/**
		 * TPL-02. The note a notification led here for. It is brought over once the schema is drawn and
		 * the markers are read: before that neither the geometry the note is pinned by nor the note
		 * itself is known. A note that is no longer there leaves the template open as usual (ERR-009).
		 *
		 * A list that was not read says nothing about the note: the refusal of the reading has already
		 * been named, and "the discussion is over" on top of it would be an explanation of its own and
		 * an untrue one.
		 */
		async function focusRequestedNote(areNotesLoaded: boolean): Promise<void>
		{
			const noteId = Number(props.initNoteId);

			if (!areNotesLoaded || !Number.isInteger(noteId) || noteId <= 0)
			{
				return;
			}

			// the notes have just arrived, and their markers are drawn by the canvas of the next frame
			await nextTick();

			await focusNote(noteId, notesStore.notes, readNotesSchema(), {
				viewport: {
					zoom: Number(toValue(transform)?.zoom),
					width: toValue(canvasWidth),
					height: toValue(canvasHeight),
					left: toValue(blockDiagramLeft),
					top: toValue(blockDiagramTop),
				},
				setCamera,
				openThread: (id: number): Promise<void> => notesStore.openThread(id),
				notifyUnavailable: (): void => toastStore.addWarning(getMessage(NOTE_UNAVAILABLE_MESSAGE_ID)),
			});
		}

		async function initApp()
		{
			try
			{
				await Promise.all([
					diagramStore().refreshDiagramData(
						{
							templateId: props.initTemplateId,
							documentType: props.initDocumentType,
							startTrigger: props.initStartTrigger,
						},
					),
					catalogStore.init(),
				]);

				initAiUpdatePull(({ blocks, connections, draftId, draftRevision, templateId }) => {
					// No available/unlocked external AI-agent feature — the update is
					// ignored entirely: no graph apply, no animation, no notification.
					// Without the feature the agent cannot even connect (the connect button
					// is closed), so legitimate updates are unaffected, and on the client it is an extra safety margin.
					if (!isExternalAiAgentAllowed())
					{
						return;
					}
					const currentDiagramStore = diagramStore();

					// The event addresses the user, not the tab, so it reaches every tab of every
					// template: resolveAgentDraftApply() drops the ones about a foreign template or
					// a foreign draft.
					const { shouldApply, draftIdToAdopt } = resolveAgentDraftApply({
						storeDraftId: currentDiagramStore.draftId,
						storeTemplateId: currentDiagramStore.templateId,
						incomingDraftId: draftId,
						incomingTemplateId: templateId,
					});

					if (!shouldApply)
					{
						return;
					}

					// What the server states about the draft is taken in before the write lock is
					// looked at: a tab that stops reading the draft id and the revision while it may
					// not write would come back to writing with stale ones. Only applying the graph
					// and animating it are held back by the lock.
					//
					// That return is what the reversible lock promises. A terminal one — the template
					// deleted, the rights revoked — promises no return, so its editor takes in nothing
					// at all: the header of a session told "the template is gone" must not go on
					// reporting saves of it.
					if (currentDiagramStore.terminalLockReason !== null)
					{
						return;
					}

					if (draftIdToAdopt !== null)
					{
						currentDiagramStore.setDraftId(draftIdToAdopt, true);
					}

					currentDiagramStore.setDraftRevision(draftRevision);

					// The agent has already saved the draft on the server. The time is written
					// before the animation queue on purpose: a graph whose blocks and connections
					// did not change leaves the queue empty and returns below, and that save would
					// otherwise stay invisible in the header until the next local one.
					currentDiagramStore.markExternalDraftSave();

					if (currentDiagramStore.isWriteLocked)
					{
						// The revision above is now newer than the graph on the canvas, so the next write
						// of this session would pass the check of the server with a graph that erases what
						// the agent has just done. The store reads the schema once before that write.
						currentDiagramStore.markSkippedAgentGraph();

						return;
					}

					// The applying itself reports which blocks changed by properties: it mutates
					// the stored blocks in place, so afterwards no diff of its own is possible.
					const changedBlockIds = currentDiagramStore.updateExistedBlockProperties(blocks);

					const animatedItems = makeAnimationQueue(
						currentDiagramStore.blocks,
						currentDiagramStore.connections,
						blocks,
						connections,
					);

					highlightAgentChanges({ changedBlockIds, animatedItems, newBlocks: blocks });

					// Graph is unchanged — nothing to animate: show no toasts and
					// set no highlight (there will be no isStopAnimation false→true transition).
					if (animatedItems.length === 0)
					{
						return;
					}

					// Cancel the previous apply's unfinished watcher before showing the
					// new processing toast so it doesn't leak onto a different animation.
					stopAnimationCompletionWatch?.();
					stopAnimationCompletionWatch = null;

					// Start with the blue "processing" toast.
					toastStore.clearAllOfType(AI_AGENT_TOAST_TYPES.NOTICE);
					toastStore.addCustom(
						getMessage(AI_AGENT_MESSAGE_KEYS.PROCESS_PROCESSING),
						AI_AGENT_TOAST_TYPES.NOTICE,
						{ colorScheme: ToastColorScheme.Processing },
					);

					// start() synchronously sets isStopAnimation to false, so a watcher
					// registered after the start reacts exactly to the false→true transition
					// when this animation completes (we don't use immediate).
					animationQueue.start({ items: animatedItems });

					TabHighlight.onAgentAnimationStart();

					// Right after the start, before the first node appears: the tour subscribes to
					// the engine hook and must not miss it. Added nodes come in the order the queue
					// draws them; the queue length goes along with them because the series has to
					// outlive the whole queue: removals and connections included, and on a rebuilt
					// graph those outnumber the additions.
					settingsTour.start(
						animatedItems
							.filter((animatedItem) => animatedItem.type === ANIMATED_TYPES.BLOCK)
							.map((animatedItem) => animatedItem.item),
						animatedItems.length,
					);

					const registerCompletionWatch = () => watch(isStopAnimation, (isStopped: boolean): void => {
						if (!isStopped)
						{
							return;
						}

						// One-shot: stop ourselves, then replace the toast with the green
						// "completed" one.
						stopAnimationCompletionWatch?.();
						stopAnimationCompletionWatch = null;

						toastStore.clearAllOfType(AI_AGENT_TOAST_TYPES.NOTICE);
						toastStore.addCustom(
							getMessage(AI_AGENT_MESSAGE_KEYS.PROCESS_COMPLETED),
							AI_AGENT_TOAST_TYPES.NOTICE,
							{ colorScheme: ToastColorScheme.Completed },
						);

						// No more nodes will come: the only reliable end of the series.
						settingsTour.onAnimationFinished();
					});

					// Register the watcher in the setup() scope so it is guaranteed to be
					// disposed when the editor unmounts, even if the animation never finished.
					// Without a scope we don't register: a bare watch would leak outside the
					// effect scope. In setup() the scope always exists, so the real path
					// is unchanged.
					stopAnimationCompletionWatch = setupScope
						? setupScope.run(registerCompletionWatch)
						: null;
				});

				initTemplateLockLostPull();
			}
			catch (error)
			{
				handleResponseError(error);
			}
			finally
			{
				isDiagramDisabled.value = false;
			}

			makeSnapshot();

			void loadTemplateNotes().then(focusRequestedNote);
		}

		initApp();

		return {
			isDiagramDisabled,
			makeSnapshot,
			isNotesMode,
			noteDraft,
			fragmentToSave,
			isFragmentLibraryShown,
			fragmentInsertPoint,
			notesCamera: transform,
			notesCaptureStyle: NOTES_CAPTURE_STYLE,
			notesViewport,
			readNotesSchema,
			resolveNotesCanvasElement,
			loadTemplateNotes,
			FeatureCode,
			blockDiagramSlotNames: BLOCK_SLOT_NAMES,
			connectionSlotNames: CONNECTION_SLOT_NAMES,
			dragItemSlotNames: DRAG_ITEM_SLOT_NAMES,
			toast: {
				blockToastTypes: BLOCK_TOAST_TYPES,
				sharedTypes: SHARED_TOAST_TYPES,
				aiAgentTypes: AI_AGENT_TOAST_TYPES,
			},
			blockColors: ICON_BG_COLORS,
			frameColors: FRAME_BG_COLORS,
		};
	},
	computed:
	{
		...mapWritableState(
			diagramStore,
			[
				'documentTypeSigned',
				'templateId',
			],
		),
		...mapState(
			diagramStore,
			[
				'isTemplateNotFound',
				'isVersionViewMode',
				'isVersionViewTransitionInProgress',
				'isRestoreInProgress',
				'isWriteLocked',
				'isBusy',
				'busyLock',
				'isBusyLockConfirmedFree',
				'canUndoRestore',
				'canPublish',
				'canPublishToPilotAudience',
			],
		),
		// State of the panels that float over the canvas: the fit of the overview has to know which
		// edges of it they cover.
		...mapState(useAppStore, [
			'isShownRightPanel',
			'isDataInspectorPanelShown',
			'isShownDebugBar',
		]),
		...mapState(useCatalogStore, [
			'isExpandedCatalog',
		]),
		...mapState(useDataViewDefinitionStore, {
			isTableSettingsPanelShown: 'isOpen',
		}),
		isBlockDiagramDisabled(): boolean
		{
			// A published version on the canvas is a read, not a write: the settings of its nodes must
			// open, so the canvas stays live and every write path is closed by isWriteLocked on its own.
			// A restore in flight is the exception - it replaces the graph under the hands.
			const isReadingVersion = this.isVersionViewMode && !this.isRestoreInProgress;

			return this.isDiagramDisabled || (this.isWriteLocked && !isReadingVersion);
		},
		isBusyOverlayVisible(): boolean
		{
			return (
				(this.busyLock !== null || this.isBusyLockConfirmedFree === true)
				&& !this.isVersionViewMode
				&& !this.isTemplateNotFound
			);
		},
		isCatalogVisible(): boolean
		{
			return !this.isVersionViewMode
				&& !this.isVersionViewTransitionInProgress
				&& !this.isRestoreInProgress
				&& !this.isBusyOverlayVisible;
		},
		isCatalogDragDisabled(): boolean
		{
			return this.isWriteLocked;
		},
		/**
		 * Edges of the canvas the panels of the editor cover at this moment. The fit of the overview
		 * reads them when it runs, so a panel that opens or closes is accounted for without anything
		 * being remounted, and only the overview moves: the scheme itself is not written to.
		 *
		 * The only reader is the zoom bar, and the busy overlay takes it down together with the rest of
		 * the workspace panels, so the value is asked for only while that overlay is gone: no edge here
		 * has to answer for it.
		 */
		diagramViewportInsets(): { top: number, right: number, bottom: number, left: number }
		{
			const catalogWidth = this.isExpandedCatalog ? CATALOG_WIDTH_EXPANDED : CATALOG_WIDTH_COLLAPSED;

			// The data inspector and the table editor stand to the left of the settings panel and open
			// only together with it, so the covered edge is the two of them one after the other.
			const isInspectorShown = this.isShownRightPanel
				&& (this.isDataInspectorPanelShown || this.isTableSettingsPanelShown);

			// The toolbars are a row of buttons pinned to the top and to the bottom of the canvas; the
			// zoom bar the command is called from is one of them.
			const toolbarBand = PANEL_EDGE_GAP + TOOLBAR_ROW_HEIGHT;

			// The debug bar takes the whole bottom of the canvas and the layout lifts the bottom toolbar
			// above it, so the covered strip is the row in its raised place.
			const bottomBand = this.isShownDebugBar
				? DEBUG_BAR_TOOLBAR_OFFSET + TOOLBAR_ROW_HEIGHT
				: toolbarBand;

			return {
				top: toolbarBand,
				right: (this.isShownRightPanel ? PANEL_EDGE_GAP + SETTINGS_PANEL_WIDTH : 0)
					+ (isInspectorShown ? DATA_INSPECTOR_PANEL_WIDTH : 0),
				bottom: bottomBand,
				left: this.isCatalogVisible ? PANEL_EDGE_GAP + catalogWidth : 0,
			};
		},
		isDebugBarAvailable(): boolean
		{
			const { isFeatureAvailable } = useFeature();

			return isFeatureAvailable('debugBar');
		},
		isNotesFeatureAvailable(): boolean
		{
			return areTemplateNotesAvailable();
		},
		/**
		 * The point of the screen the draft stands at, counted by the camera the canvas draws itself
		 * with. It is read anew on every change of that camera and not snapped at the click: the form
		 * travels with the place of the schema it belongs to, the way a marker and an open thread do.
		 */
		noteDraftAnchor(): NotePoint
		{
			const camera = this.notesCamera;
			const zoom = Number(camera?.zoom);

			if (this.noteDraft === null || !Number.isFinite(zoom) || zoom <= 0)
			{
				return { x: 0, y: 0 };
			}

			return {
				x: Math.round((this.noteDraft.position.x - camera.x) * zoom),
				y: Math.round((this.noteDraft.position.y - camera.y) * zoom),
			};
		},
		isExternalAiAgentAvailable(): boolean
		{
			const { isFeatureAvailable } = useFeature();

			return isFeatureAvailable(FeatureCode.externalAiAgent);
		},
		isExternalAiAgentLocked(): boolean
		{
			const { isFeatureLocked } = useFeature();

			return isFeatureLocked(FeatureCode.externalAiAgent);
		},
		// The first step of the tour points at the item of the publish menu, so the tour waits for the
		// very thing that item waits for. Without the right of publication there is nothing to tell -
		// neither the item nor the operations over the pilot are available - and a template that is gone
		// has no toolbar to point at.
		isPilotOnboardingAvailable(): boolean
		{
			return this.canPublishToPilotAudience && this.canPublish && !this.isTemplateNotFound;
		},
	},
	watch: {
		templateId(value: number, previousValue: number)
		{
			if (value > 0)
			{
				updateIdUrl(value);
			}

			// The template has just been saved for the first time and only now has notes to read. The
			// single reading of them at the start of the editor fell on a template with no identifier
			// of its own, and without this one the limits and the recognition of a lost right (ERR-005)
			// would stay out until the page is reloaded. An editor opened with an identifier is left
			// alone: there the list has been read already, and this would read it a second time.
			const hadTemplateId = previousValue > 0;
			const openedWithTemplateId = this.initTemplateId > 0;
			if (value > 0 && !hadTemplateId && !openedWithTemplateId)
			{
				void this.loadTemplateNotes();
			}
		},
		// The tour points at the loaded toolbar: until the data of the diagram arrive the state of the
		// pilot is unknown, and the step about the pilot cannot be chosen.
		isDiagramDisabled(isDisabled: boolean): void
		{
			if (isDisabled || !this.isPilotOnboardingAvailable)
			{
				return;
			}

			const publishMenu = usePublishMenuStore();
			this.$nextTick(() => {
				PilotPublicationOnboarding.show(publishMenu);
			});
		},
		// Leaving the mode leaves nothing behind. The button gives the mode up by Escape and when the
		// mode itself becomes unavailable, and a draft outliving it would have no canvas to belong to.
		isNotesMode(isOn: boolean): void
		{
			if (!isOn)
			{
				this.noteDraft = null;
			}
		},
	},
	mounted(): void
	{
		if (this.isExternalAiAgentAvailable && !this.isExternalAiAgentLocked)
		{
			ConnectAgentOnboarding.show();
		}
	},
	methods: {
		handleToggleBlockActivation(blockId: BlockId): void
		{
			diagramStore().toggleBlockActivation(blockId);
		},
		/**
		 * A click in the mode puts a draft where it landed: the anchor comes from what is drawn under
		 * that point, and the form of the first message is what turns the draft into a note (AC-007).
		 * The point is read in the coordinates of the canvas, so the marker of the note that follows
		 * lands exactly where the draft was put.
		 */
		handleNotesCanvasClick(event: MouseEvent): void
		{
			// A draft being written keeps the canvas to itself: a second click here would drop the
			// text written so far without a word about it. It is sent or given up first.
			if (this.noteDraft !== null)
			{
				return;
			}

			const camera = this.notesCamera;
			const zoom = Number(camera?.zoom);

			// the canvas has not measured itself yet, so there is no point of it to put a draft at
			if (!Number.isFinite(zoom) || zoom <= 0)
			{
				return;
			}

			const point = {
				x: Math.round((event.offsetX / zoom) + camera.x),
				y: Math.round((event.offsetY / zoom) + camera.y),
			};

			// The draft alone: where it is drawn is counted from the camera every time, and a point of
			// the screen kept here would be the one point of the whole layer that stayed behind.
			this.noteDraft = noteDraftAt(this.templateId, this.readNotesSchema(), point);
		},
		/**
		 * The gesture the capture swallowed, handed over to the canvas below. The capture covers the
		 * whole drawn area, and `ui.block-diagram` listens on its own element, so without this the
		 * schema could neither be dragged nor scaled while the mode is on. A copy of the event is
		 * dispatched on that element, and the canvas answers it the way it answers its own.
		 */
		handleNotesCanvasGesture(event: MouseEvent): void
		{
			if (!isNotesCanvasGesture(event))
			{
				return;
			}

			const canvas = this.resolveNotesCanvasElement();

			if (canvas === null)
			{
				return;
			}

			const copy = copyCanvasGesture(event);
			canvas.dispatchEvent(copy);

			// The canvas stops what it has to stop - the page scrolling under a wheel, the autoscroll
			// of a middle button - on the event it was given, and that is the copy. The same is
			// stopped here, on the gesture that really happened.
			if (copy.defaultPrevented)
			{
				event.preventDefault();
			}
		},
		// The note is written and the mode stays on (AC-007): the next place of the schema is one
		// click away, and the marker of the note just written comes from the store with the layer.
		handleNoteCreated(): void
		{
			this.noteDraft = null;
		},
		handleNoteDraftCancel(): void
		{
			this.noteDraft = null;
		},
		handleSaveFragmentClose(): void
		{
			this.fragmentToSave = null;
		},
		handleFragmentLibraryClose(): void
		{
			this.isFragmentLibraryShown = false;
			this.fragmentInsertPoint = null;
		},
		// A refusal does not close the window: the fragment may become insertable a moment later, and
		// the list is worth keeping open either way. The overlay of a busy template leaves the canvas
		// unmounted, and then there is nothing to add to at all.
		//
		// The place is spent by the insertion it pointed at: it stands for one click of the menu, and
		// the next insertion from the same open window lands to the right of the scheme instead of on
		// top of the first one. A refusal is not an insertion and leaves the place alone.
		async handleFragmentInsert(fragmentId: number): Promise<void>
		{
			const outcome = await this.$refs.blockDiagram?.insertFragment(fragmentId, this.fragmentInsertPoint);
			if (outcome?.isRefused === false)
			{
				this.fragmentInsertPoint = null;
			}
		},
	},
	template: `
		<AppLayout :hideWorkspacePanels="isBusyOverlayVisible">
			<template #skeleton>
				<AppSkeleton
					v-if="isDiagramDisabled"
				/>
				<TemplateNotFoundState
					v-else-if="isTemplateNotFound"
				/>
			</template>

			<template #header>
				<AppHeader>
					<template #templateName>
						<TemplateName/>
					</template>

					<template #autosaveStatus>
						<AutosaveStatus/>
					</template>

					<template #diagramMenu>
						<DiagramMenu/>
					</template>

					<template #publishButton>
					<PublishDropdownButton :readonly="isTemplateNotFound || isWriteLocked"/>
					</template>
				</AppHeader>
			</template>

			<template #diagram>
				<TemplateBusyBar v-if="isBusyOverlayVisible"/>
				<BlockDiagram
					v-else
					ref="blockDiagram"
					:disabled="isBlockDiagramDisabled"
					:enableGrouping="true"
				>
					<template #[blockDiagramSlotNames.SIMPLE]="{ block }">
						<BlockSimple :block="block"/>
					</template>

					<template #[blockDiagramSlotNames.TRIGGER]="{ block }">
						<BlockTrigger :block="block"/>
					</template>

					<template #[blockDiagramSlotNames.COMPLEX]="{ block }">
						<BlockComplex :block="block"/>
					</template>

					<template #[blockDiagramSlotNames.TOOL]="{ block }">
						<BlockTool :block="block"/>
					</template>

					<template #[blockDiagramSlotNames.FRAME]="{ block }">
						<BlockFrame :block="block"/>
					</template>

					<template #[blockDiagramSlotNames.OPERATORS]="{ block }">
						<BlockOperator :block="block"/>
					</template>

					<template #[blockDiagramSlotNames.SERVICES]="{ block }">
						<BlockService :block="block"/>
					</template>

					<template #[connectionSlotNames.AUX]="{ connection }">
						<ConnectionAux :connection="connection" />
					</template>
				</BlockDiagram>
				<SaveFragmentDialog
					v-if="fragmentToSave !== null"
					:blocks="fragmentToSave.blocks"
					:connections="fragmentToSave.connections"
					@close="handleSaveFragmentClose"
				/>
				<FragmentLibraryWindow
					v-if="isFragmentLibraryShown"
					@close="handleFragmentLibraryClose"
					@insert="handleFragmentInsert"
				/>
			</template>

			<template #notes-layer>
				<!-- The capture stands before the markers on purpose: a note already written is above
					it and still opens by a click, while everywhere else the click starts a new one.
					Only the click belongs to the mode: the wheel and a drag by any other button are
					handed on to the canvas, which stays movable and scalable with the mode on. -->
				<div
					v-if="isNotesFeatureAvailable && isNotesMode"
					:style="notesCaptureStyle"
					:data-testid="$testId('bizprocdesigner-notes-capture')"
					@click="handleNotesCanvasClick"
					@mousedown="handleNotesCanvasGesture"
					@mousemove="handleNotesCanvasGesture"
					@wheel="handleNotesCanvasGesture"
				></div>
				<NotesLayer v-if="isNotesFeatureAvailable"/>
				<NoteComposer
					v-if="isNotesFeatureAvailable && noteDraft !== null"
					:draft="noteDraft"
					:x="noteDraftAnchor.x"
					:y="noteDraftAnchor.y"
					:viewportWidth="notesViewport.width"
					:viewportHeight="notesViewport.height"
					@created="handleNoteCreated"
					@cancel="handleNoteDraftCancel"
				/>
				<!-- The thread of the open note stands above the markers and is pinned to its own the
					same way they are: which note is open is held by the store alone (AC-012). Under the
					write lock of the editor the discussion is read and nothing is written into it. -->
				<NoteThread
					v-if="isNotesFeatureAvailable"
					:templateId="templateId"
					:readonly="isWriteLocked"
				/>
			</template>

			<template #catalog>
				<Catalog
					v-if="isCatalogVisible"
					:dragDisabled="isCatalogDragDisabled"
				>
					<template #[dragItemSlotNames.simple]="{ item }">
						<BlockSimple :block="item"/>
					</template>

					<template #[dragItemSlotNames.trigger]="{ item }">
						<BlockTrigger :block="item"/>
					</template>

					<template #[dragItemSlotNames.complex]="{ item }">
						<BlockComplex :block="item"/>
					</template>

					<template #[dragItemSlotNames.tool]="{ item }">
						<BlockTool :block="item"/>
					</template>

					<template #[dragItemSlotNames.frame]="{ item }">
						<BlockFrame :block="item" drag-preview/>
					</template>

					<template #[dragItemSlotNames.operators]="{ item }">
						<BlockOperator :block="item"/>
					</template>

					<template #[dragItemSlotNames.services]="{ item }">
						<BlockService :block="item"/>
					</template>
				</Catalog>
			</template>

			<template #top-right-toolbar>
				<template v-if="!isBusyOverlayVisible">
					<PilotBadge>
						<template #actions>
							<ChangePilotAudience/>
							<StopPilot/>
						</template>
					</PilotBadge>
					<ConnectAgentButton
						v-if="isExternalAiAgentAvailable"
						:templateId="templateId"
						:locked="isExternalAiAgentLocked"
					/>
					<HistoryBar/>
					<SearchBar/>
				</template>
			</template>

			<template #bottom-right-toolbar>
				<template v-if="!isBusyOverlayVisible">
					<DebugButton v-if="isDebugBarAvailable"/>
					<div
						class="editor-chart-app-layout__diagram-controls"
						:data-test-id="$testId('diagramControls')"
					>
						<DiagramLayoutButton/>
						<NotesModeButton
							v-if="isNotesFeatureAvailable"
							v-model="isNotesMode"
							:readonly="isWriteLocked"
							:templateId="templateId"
						/>
						<div class="editor-chart-app-layout__diagram-controls-separator"/>
						<ZoomBar
							:stepZoom="0.2"
							:blockColors="blockColors"
							:frameColors="frameColors"
							:viewportInsets="diagramViewportInsets"
							flat
						/>
					</div>
				</template>
			</template>

			<template #debug-bar-toolbar>
				<DebugBar v-if="isDebugBarAvailable && !isBusyOverlayVisible" />
			</template>

			<template #top-middle-anchor>
				<VersionViewBar v-if="isVersionViewMode"/>
				<RestoreUndoBar v-else-if="canUndoRestore && !isBusyOverlayVisible"/>
				<ToastWidget>

					<template #[toast.sharedTypes.WARNING]="{ message }">
						<ToastWarning
							:message="message"
							:closeable="true"
						/>
					</template>

					<template #[toast.blockToastTypes.ACTIVITY_PUBLIC_ERROR]="{ message }">
						<ToastWarning
							:message="message"
							:closeable="true"
						>
							<template #contentEnd>
								<ToastErrorBlockNavigationButton/>
							</template>
						</ToastWarning>
					</template>

					<template #[toast.blockToastTypes.FRAGMENT_INSERT_OUTCOME]="{ message }">
						<ToastWarning
							:message="message"
							:closeable="true"
							data-testid="bizprocdesigner-fragment-insert-outcome"
						>
							<template #contentEnd>
								<ToastFragmentReviewButton/>
							</template>
						</ToastWarning>
					</template>

					<template #[toast.aiAgentTypes.NOTICE]="{ message, colorScheme }">
						<ToastAgentNotice
							:message="message"
							:color-scheme="colorScheme"
							:closeable="true"
						/>
					</template>

				</ToastWidget>
			</template>

			<template #settings>
				<CommonNodeSettings>
					<template #header="{ block, moreMenuItems, onDeletedBlock }">
						<NodeSettingsHeader
							:block="block"
							:moreMenuItems="moreMenuItems"
							@deletedBlock="onDeletedBlock"
						/>
					</template>
					<template #data-inspector-toggle>
						<ToggleInspectorControl />
					</template>
				</CommonNodeSettings>

				<ComplexNodeSettings>
					<template #header="{ block, moreMenuItems, onDeletedBlock }">
						<NodeSettingsHeader
							:block="block"
							:moreMenuItems="moreMenuItems"
							@deletedBlock="onDeletedBlock"
						/>
					</template>
					<template #data-inspector-toggle>
						<ToggleInspectorControl />
					</template>
				</ComplexNodeSettings>
			</template>

			<template #settings-data-inspector>
				<NodeDataInspector />
			</template>

			<template #settings-table-settings>
				<DataViewEditorWindow/>
			</template>

			<template #settings-process-data>
				<ProcessDataWindow/>
			</template>
		</AppLayout>
	`,
};
