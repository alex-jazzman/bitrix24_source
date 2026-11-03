import { Type, Loc, Tag, Text, Uri, Event, Page, ajax as Ajax } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { PullClient } from 'pull.client';
import { LiveAnnouncer } from 'ui.a11y';
import {
	BeforeStartEditEvent,
	HeaderElement,
	ServerChosenEditor,
	documentHeaderService,
	mapCompositionDtoToModel,
	openAccess,
	startEdit,
} from 'disk.document-header';
import type { CompositionModel, StartEditOutcome } from 'disk.document-header';
import type {
	EditorOptions,
	VibeOfficeEditor,
	CreateEditor,
	ContentUpdatedMessage,
	ConflictMessage,
	EditorUser,
	CurrentUserAvatar,
	NativeEditorInstance,
} from './types';

const SECONDS_TO_MARK_AS_STILL_WORKING = 60;

/** The component serving the actions of this shell. */
const COMPONENT_NAME = 'bitrix:disk.file.editor-vibeoffice';

// The engine endpoint of ajax actions and the action ending an edit session, shared with the
// OnlyOffice shell (@see BX.Disk.endEditSession in c_disk.js). Only the beacon of the unload path
// addresses the action directly: `ajax.runAction` returns a promise nobody is left to await, and
// the browser cancels its request together with the page.
const AJAX_ENDPOINT = '/bitrix/services/main/ajax.php';
const END_SESSION_ACTION = 'disk.api.onlyoffice.endSession';
const SAVE_REFUSAL_REASON_ACTION = 'disk.api.vibeoffice.getSavedRefusalReason';
const EXTERNAL_SAVE_REFUSAL_REASON_ACTION = 'disk.api.vibeoffice.getSavedRefusalReasonForExternalLink';

const ACCESS_CONTROL_TYPES = Object.freeze([
	'with-change-rights',
	'with-sharing',
	'without-edit',
	'blocked-by-feature',
]);

// The shape of a path of this very portal: one leading slash, no host of its own and no backslash
// (@see isSamePortalPath).
const PORTAL_PATH_SHAPE = /^\/(?!\/)[^\\]*$/;

// The helper facade events the wrapper reacts to (HelperEvents, types.ts:178-186). Recovery
// itself is fully owned by the helper, as is the loading UI; the wrapper subscribes only to what
// it turns into Disk-side UI, so `stateChange` and `documentReady` are not among them.
const HELPER_EVENTS = ['failover', 'sessionClosed', 'error', 'waiting'];

// Session-close reasons the helper relays from the SSE channel (SseSessionClosed,
// types.ts:116-119).
const SESSION_CLOSED_SAVED = 'saved';
const SESSION_CLOSED_REVOKED = 'revoked';
const SESSION_CLOSED_EXPIRED = 'expired';

// A session-close reaction that has to navigate the page (expired → reload, revoked/saved on a
// standalone page → downgrade to view) is deferred by this long so the accompanying message is
// actually painted before the navigation happens — an immediate `document.location` change would
// swap the page before the toast is seen (parity with the OnlyOffice force-reload UX).
const SESSION_CLOSE_NAVIGATION_DELAY_MS = 3000;

// `document.saved` is delivered asynchronously after the editor reports `sessionClosed('saved')`.
// Poll the host-side content version before opening the view, with a bounded fallback for a save
// that does not produce a new version or a temporarily unavailable AJAX endpoint.
const SAVED_CONFIRMATION_INITIAL_POLL_INTERVAL_MS = 1000;
const SAVED_CONFIRMATION_MAX_POLL_INTERVAL_MS = 5000;
const SAVED_CONFIRMATION_POLL_BACKOFF_FACTOR = 1.5;
const SAVED_CONFIRMATION_POLL_JITTER_RATIO = 0.2;
const SAVED_CONFIRMATION_TIMEOUT_MS = 30000;

// The helper emits error(...) and failover({recovered:false}) synchronously for one recovery
// failure; a failover within this window of the last surfaced error is that same event and its
// toast is suppressed (see handleFailover).
const FAILOVER_ERROR_DEDUP_WINDOW_MS = 1000;

// VibeOfficeError.code → user-facing reaction (helper types.ts:199-207). Every code maps to a
// localized message so the editor never fails silently. `terminal: true` means the editor is no
// longer usable → a blocking messagebox; `terminal: false` is a transient degradation → a toast.
// `sse-degraded` is the only non-terminal code here: the live channel is degraded but editing can
// continue, so the actual terminal point stays on `sessionClosed`/a terminal `error`.
// Exported for the test that keeps every code covered by a phrase of the extension; the entry
// point does not re-export it, so the public surface stays `BX.Disk.Editor.Vibeoffice`.
export const ERROR_REACTIONS = {
	'api-js-load-failed': { messageId: 'DISK_EDITOR_VIBEOFFICE_ERR_API_JS_LOAD_FAILED', terminal: true },
	'editor-create-failed': { messageId: 'DISK_EDITOR_VIBEOFFICE_ERR_EDITOR_CREATE_FAILED', terminal: true },
	'invalid-open-config': { messageId: 'DISK_EDITOR_VIBEOFFICE_ERR_INVALID_OPEN_CONFIG', terminal: true },
	'refresh-fetch-failed': { messageId: 'DISK_EDITOR_VIBEOFFICE_ERR_REFRESH_FETCH_FAILED', terminal: false },
	'session-dead': { messageId: 'DISK_EDITOR_VIBEOFFICE_ERR_SESSION_DEAD', terminal: true },
	'sse-degraded': { messageId: 'DISK_EDITOR_VIBEOFFICE_ERR_SSE_DEGRADED', terminal: false },
	'recovery-failed': { messageId: 'DISK_EDITOR_VIBEOFFICE_ERR_RECOVERY_FAILED', terminal: true },
	'ds-error': { messageId: 'DISK_EDITOR_VIBEOFFICE_ERR_DS_ERROR', terminal: true },
	'save-refused': { messageId: 'DISK_EDITOR_VIBEOFFICE_ERR_SAVE_REFUSED', terminal: true },
};

// Fallback for an unknown / missing code: still surfaced (never silent), and treated as terminal.
export const ERROR_FALLBACK = { messageId: 'DISK_EDITOR_VIBEOFFICE_ERR_GENERIC', terminal: true };

/**
 * Disk wrapper around `@vibeoffice/helper`.
 *
 * Additive sibling of {@see OnlyOffice}, but the engine boundary is different: the native
 * `DocsAPI.DocEditor` is NEVER created here — the helper's `createEditor` owns api.js
 * loading, the SSE session channel and seamless failover/recreate. This class only:
 *   - feeds the platform-signed `openConfig` to `createEditor` as-is,
 *   - subscribes to the facade events and maps them onto Disk UI/channels,
 *   - reuses the engine-orthogonal OnlyOffice behaviours (SidePanel close, endEditSession,
 *     markAsStillWorking, onSaved/onClosed emits),
 *   - tears the editor (SSE + native) down via `editor.destroy()` on unmount.
 *
 * `#documentServerEvents` is the pass-through seam for api.js handlers not reserved by the
 * helper (e.g. `onRequestHistory*` for history, driven via `historyEnabled`).
 */
export class Vibeoffice
{
	// `@vibeoffice/helper` API, injected by index.js after the vendored UMD runs. Static so a
	// single capture serves every instance; tests can override it.
	static #helper: ?{ createEditor: CreateEditor } = null;

	static setHelper(helper: ?{ createEditor: CreateEditor }): void
	{
		Vibeoffice.#helper = helper;
	}

	static getHelper(): ?{ createEditor: CreateEditor }
	{
		return Vibeoffice.#helper;
	}

	openConfig: Object = null;
	documentSession: Object = null;
	object: Object = null;
	attachedObject: Object = null;
	context: Object = null;
	targetNode: HTMLElement = null;
	editorNode: HTMLElement = null;
	elementId: string = null;
	linkToView: string = null;
	linkToDownload: string = null;
	linkToEdit: string = null;
	historyEnabled: boolean = false;
	externalLinkMode: boolean = false;
	texts: Object = {};
	pullConfig: any = null;
	publicChannel: ?string = null;

	editor: ?VibeOfficeEditor = null;
	documentWasChanged: boolean = false;
	#unsubscribers: Array<() => void> = [];
	#conflictNotified: boolean = false;
	#trackWorkTimer: ?IntervalID = null;
	#documentServerEvents: Object = {};
	// Only a real server answer resets this; cache hits issue no request and leave it untouched.
	#badUserInfoAttempts: number = 0;
	// Author display names resolved through getUserInfo, keyed by userId (the response depends on
	// the user alone - infoToken only authorizes the call). The promise is cached, not the value,
	// so events arriving while a request is in flight join it instead of firing their own.
	#userNameCache: Map<number, Promise<?string>> = new Map();
	#currentUserAvatarPromise: ?Promise<?CurrentUserAvatar> = null;
	#avatarRecipients: WeakSet<NativeEditorInstance> = new WeakSet();
	// Timestamps of the native "editor settled" events, used to gate document-change tracking
	// (see #handleDocumentStateChange). Parity with the OnlyOffice sibling.
	#caughtDocumentReady: ?number = null;
	#caughtInfoEvent: ?number = null;
	// When #handleError last surfaced a reaction to the user. The helper emits error(...) THEN
	// failover({recovered:false}) for the same recovery failure (helper.umd.cjs), so handleFailover
	// uses this to suppress its duplicate toast.
	#lastErrorNotifiedAt: ?number = null;
	#notifiedUnsavedReopens: Set<string> = new Set();
	// Pending deferred session-close navigation (expired / standalone downgrade-to-view),
	// cleared on destroy so it never navigates a torn-down editor.
	#pendingNavigationTimer: ?TimeoutID = null;
	#lifecycleGeneration: number = 0;
	#firstLoadController: AbortController = new AbortController();
	#openingDeadline: number = Infinity;
	#restartTarget: ?string = null;
	#manualRestartBox: ?Object = null;
	#manualRestartPending: boolean = false;
	#manualRestartClosePromise: ?Promise<void> = null;
	#waitingBox: ?Object = null;
	#waitingFallback: ?HTMLDialogElement = null;
	#waitingCode: ?string = null;
	#waitingUnsavedChanges: boolean = false;
	#saveRefusedShown: boolean = false;
	#saveRefusedBox: ?Object = null;
	#destroyed: boolean = false;
	// The rename asked for last: the engine can ask again while the previous request is in flight
	// (a repeated Enter), and the answers resolve in any order, so only the last one is applied.
	#renameGeneration: number = 0;
	// A transition to editing being made right now. The button of the engine draws no waiting of its
	// own and the shell cannot disable it from outside the frame, so a repeated press is ignored: the
	// press already under way answers the engine itself, with a refusal or with leaving the page.
	#reopening: boolean = false;
	// Idempotency guard for handleClose(): SidePanel.Slider:onClose,
	// pagehide and postMessage 'closeIframe' can all fire it, but the teardown /
	// endEditSession must run once. Never reset (a new wrapper is a new instance).
	#closed: boolean = false;

	constructor(editorOptions: EditorOptions)
	{
		const options = Type.isPlainObject(editorOptions) ? editorOptions : {};
		this.#openingDeadline = openingDeadline(options.openingBudget);
		this.#restartTarget = isSamePortalPath(options.restartTarget) ? options.restartTarget : null;
		const headerComposition: ?CompositionModel = mapCompositionDtoToModel(options.headerComposition);

		this.openConfig = options.openConfig;
		this.documentSession = options.documentSession;
		this.object = options.object || {};
		this.attachedObject = options.attachedObject || { id: null };
		this.targetNode = options.targetNode;
		this.editorNode = options.editorNode;
		this.linkToView = options.linkToView;
		this.linkToDownload = options.linkToDownload;
		this.linkToEdit = options.linkToEdit;
		this.historyEnabled = options.historyEnabled === true;
		this.externalLinkMode = options.externalLinkMode === true;
		this.texts = options.texts || {};
		this.pullConfig = options.pullConfig || null;
		this.publicChannel = Type.isStringFilled(options.publicChannel) ? options.publicChannel : null;

		this.context = {
			currentUser: options.currentUser,
			documentSession: this.documentSession,
			object: this.object,
			attachedObject: this.attachedObject,
		};

		// The api.js contract works with an element id. The template passes the node; resolve
		// it to its id (helper passes `element` straight into `new DocsAPI.DocEditor(id, ...)`).
		this.elementId = this.#resolveElementId(options.element, this.editorNode);

		// api.js handlers flow through here to the native DocsAPI editor: the helper (vendor
		// helper.umd.cjs) passes them straight through, except onAppReady/onDocumentReady/onError/
		// onRequestRefreshFile, which it wraps and calls ours after its own handling.
		// We wire the same document-change signal the OnlyOffice sibling uses:
		// onDocumentStateChange marks the document as changed once the editor has settled, so
		// endEditSession/emitEventOnClosed report a truthful `documentWasChanged` (it drives the
		// c_disk.js "document is being saved" balloon and its `vibeoffice` pull "saved" toast).
		// P4 history wiring (onRequestHistory*, gated by `historyEnabled`) lands here later.
		this.#documentServerEvents = {
			onDocumentReady: this.#handleNativeDocumentReady.bind(this),
			onInfo: this.#handleNativeInfo.bind(this),
			onDocumentStateChange: this.#handleDocumentStateChange.bind(this),
		};
		if (
			headerComposition !== null
			&& headerComposition.elements.includes(HeaderElement.Access)
			&& Number.isInteger(headerComposition.object.id)
			&& headerComposition.object.id > 0
			&& ACCESS_CONTROL_TYPES.includes(headerComposition.access.controlType)
		)
		{
			this.#documentServerEvents.onRequestSharingSettings = () => openAccess(headerComposition);
		}

		if (headerComposition !== null && headerComposition.elements.includes(HeaderElement.Rename))
		{
			this.#documentServerEvents.onRequestRename = (event) => {
				void this.#handleRequestRename(event, headerComposition);
			};
		}

		// The declaration itself is what offers the transition: the engine draws the button of editing
		// in a viewing by the sole fact the handler is there, so the address the server gave for this
		// opening is the whole condition - no right of its own is decided here.
		if (Type.isStringFilled(this.linkToEdit))
		{
			this.#documentServerEvents.onRequestEditRights = () => {
				void this.#handleRequestEditRights(headerComposition);
			};
		}

		this.loadDiskExtensionInTopWindow();
		if (this.isEditMode())
		{
			this.#closeParentViewer();
		}
		this.bindEvents();
		this.#initPull();
		if (options.initialNotice === true)
		{
			this.#notify(this.#text('openingNotice', ''));
		}

		void this.#createEditor();
	}

	async #createEditor(): Promise<void>
	{
		const lifecycleToken = this.#lifecycleGeneration;
		const context = this.#openingDeadline === Infinity
			? undefined
			: firstLoadContext(this.#openingDeadline, performance.now());
		if (context === null)
		{
			this.#handleError({ code: 'editor-create-failed' });

			return;
		}

		const createEditor: ?CreateEditor = Vibeoffice.#helper?.createEditor;
		if (!Type.isFunction(createEditor))
		{
			// The vendored helper UMD must have run (index.js side-effect import). If it did not,
			// the editor can never be created — surface the terminal reaction rather than only
			// logging, so the class keeps its "never fails silently" contract.
			if (this.#isCurrent(lifecycleToken))
			{
				this.#handleError({ code: 'editor-create-failed' });
			}

			return;
		}

		try
		{
			const editor = await createEditor({
				element: this.elementId,
				openConfig: this.openConfig,
				documentServerEvents: this.#documentServerEvents,
				onFirstLoadProgress: (progress) => {
					if (this.#isCurrent(lifecycleToken))
					{
						this.#handleWaiting({
							code: progress?.waitCode,
							stage: progress?.stage,
							attempt: progress?.attempt,
						});
					}
				},
				signal: this.#firstLoadController.signal,
				...(context === undefined ? {} : { firstLoadContext: context }),
			});

			if (!this.#isCurrent(lifecycleToken))
			{
				editor.destroy();

				return;
			}

			this.editor = editor;
			// Initial onDocumentReady may precede the resolution of createEditor.
			void this.#applyCurrentUserAvatar();
		}
		catch (error)
		{
			if (!this.#isCurrent(lifecycleToken))
			{
				return;
			}

			// Initial creation failed; surface the reaction without masking diagnostics.
			console.error('[vibeoffice] createEditor failed', error);
			this.#handleError(error);

			return;
		}

		this.#subscribeFacadeEvents(lifecycleToken);

		if (this.isEditMode())
		{
			this.registerTimerToTrackWork();
		}
	}

	#subscribeFacadeEvents(lifecycleToken: number): void
	{
		const editor = this.editor;
		if (!editor || !this.#isCurrent(lifecycleToken))
		{
			return;
		}

		const handlers = {
			failover: (event) => {
				if (this.#isCurrentEditor(editor, lifecycleToken))
				{
					this.handleFailover(event);
				}
			},
			sessionClosed: (reason) => {
				if (this.#isCurrentEditor(editor, lifecycleToken))
				{
					this.handleSessionClosed(reason);
				}
			},
			error: (error) => {
				if (this.#isCurrentEditor(editor, lifecycleToken))
				{
					this.#handleError(error);
				}
			},
			waiting: (event) => {
				if (this.#isCurrentEditor(editor, lifecycleToken))
				{
					this.#handleWaiting(event);
				}
			},
		};

		HELPER_EVENTS.forEach((event) => {
			const off = editor.on(event, handlers[event]);
			if (Type.isFunction(off))
			{
				this.#unsubscribers.push(off);
			}
		});
	}

	#handleUnsavedReopen(event: ?Object): void
	{
		const transitionId = Type.isStringFilled(event?.editorKey)
			? `${this.documentSession?.id}:${event.editorKey}`
			: null
		;
		if (transitionId !== null && this.#notifiedUnsavedReopens.has(transitionId))
		{
			return;
		}

		if (transitionId !== null)
		{
			this.#notifiedUnsavedReopens.add(transitionId);
			if (this.#notifiedUnsavedReopens.size > 64)
			{
				this.#notifiedUnsavedReopens.delete(this.#notifiedUnsavedReopens.values().next().value);
			}
		}
		this.#notify(Loc.getMessage('DISK_EDITOR_VIBEOFFICE_REOPENED_UNSAVED_LOST'));
	}

	#handleWaiting(event: ?Object): void
	{
		if (event?.code !== 'saving' && event?.code !== 'loading_no_signal')
		{
			return;
		}

		const unsavedChanges = event.code === 'saving' && event.unsavedChanges === true;
		const messageId = event.code === 'saving'
			? 'DISK_EDITOR_VIBEOFFICE_WAITING_SAVING'
			: 'DISK_EDITOR_VIBEOFFICE_WAITING_LOADING_NO_SIGNAL'
		;
		const message = [
			Loc.getMessage(messageId),
			unsavedChanges ? Loc.getMessage('DISK_EDITOR_VIBEOFFICE_WAITING_UNSAVED_CHANGES') : null,
		].filter(Boolean).join(' ');
		if (this.#waitingCode === event.code)
		{
			if (this.#waitingUnsavedChanges !== unsavedChanges)
			{
				this.#waitingUnsavedChanges = unsavedChanges;
				this.#waitingBox?.setMessage(message);
				if (this.#waitingFallback)
				{
					this.#waitingFallback.querySelector('p').textContent = message;
				}
			}

			return;
		}

		this.#closeWaiting();
		this.#waitingCode = event.code;
		this.#waitingUnsavedChanges = unsavedChanges;
		const MessageBox = BX.UI?.Dialogs?.MessageBox;
		if (!Type.isFunction(MessageBox?.create))
		{
			const dialog = document.createElement('dialog');
			const description = document.createElement('p');
			const cancel = document.createElement('button');
			description.textContent = message;
			cancel.type = 'button';
			cancel.textContent = Loc.getMessage('DISK_EDITOR_VIBEOFFICE_WAITING_CANCEL') || '';
			dialog.append(description, cancel);
			document.body.append(dialog);
			Event.bind(cancel, 'click', () => this.handleClose());
			Event.bind(dialog, 'cancel', (cancelEvent) => {
				cancelEvent.preventDefault();
				this.handleClose();
			});
			dialog.showModal();
			this.#waitingFallback = dialog;

			return;
		}

		this.#waitingBox = MessageBox.create({
			message,
			buttons: BX.UI.Dialogs.MessageBoxButtons.OK,
			okCaption: Loc.getMessage('DISK_EDITOR_VIBEOFFICE_WAITING_CANCEL'),
			onOk: () => {
				this.#closeWaiting();
				this.handleClose();
			},
			popupOptions: {
				events: {
					onPopupClose: () => {
						if (this.#waitingBox !== null)
						{
							this.handleClose();
						}
					},
				},
			},
		});
		this.#waitingBox.show();
	}

	#closeWaiting(): void
	{
		this.#waitingCode = null;
		this.#waitingUnsavedChanges = false;
		const waitingBox = this.#waitingBox;
		this.#waitingBox = null;
		waitingBox?.close();
		this.#waitingFallback?.remove();
		this.#waitingFallback = null;
	}

	// region [P2.T2] facade event reactions ----------------------------------------------

	handleFailover(event: { recovered: boolean, outcome?: string, editorKey?: string }): void
	{
		if (!this.#isActive())
		{
			return;
		}

		// The helper already attempted (and possibly completed) recovery on its own. The
		// wrapper only reflects the outcome in the UI — it never touches the platform session.
		if (event && event.recovered === true)
		{
			this.#closeWaiting();
			if (event.outcome === 'reopened_unsaved_lost')
			{
				this.#handleUnsavedReopen(event);

				return;
			}

			this.#notify(this.#text('failoverRecovered', 'DISK_EDITOR_VIBEOFFICE_FAILOVER_RECOVERED'), 'success');

			return;
		}
		this.#closeWaiting();

		// A failed recovery is emitted by the helper as error(...) immediately followed by
		// failover({recovered:false}) for the SAME event (helper.umd.cjs cycle()), so #handleError
		// has already surfaced it (terminal messagebox or transient toast). Skip this toast when an
		// error was just shown so the user sees one message, not two. With no preceding error we
		// still notify — never fail silently.
		if (this.#lastErrorNotifiedAt !== null
			&& Date.now() - this.#lastErrorNotifiedAt < FAILOVER_ERROR_DEDUP_WINDOW_MS)
		{
			return;
		}

		this.#notify(this.#text('failoverFailed', 'DISK_EDITOR_VIBEOFFICE_FAILOVER_FAILED'));
	}

	handleSessionClosed(reason: string): void
	{
		if (!this.#isActive())
		{
			return;
		}
		this.#closeWaiting();

		switch (reason)
		{
			case SESSION_CLOSED_SAVED:
				// vibeoffice persists versions via webhook (backend), so the onSaved-equivalent
				// is driven by sessionClosed('saved'), NOT a pull command.
				this.emitEventOnSaved();
				this.#waitForSavedThenClose();
				break;

			case SESSION_CLOSED_REVOKED:
				// SDD-frontend: revoked → message + downgrade to view / close.
				this.#notify(this.#text('sessionRevoked', 'DISK_EDITOR_VIBEOFFICE_SESSION_REVOKED'));
				this.#closeSliderOrDowngradeToView();
				break;

			case SESSION_CLOSED_EXPIRED:
				// 401/403 from refresh is folded into 'expired' by the helper; no HTTP-code
				// handling needed on the front. Downgrade like 'revoked' does instead of reloading:
				// the current address may open editing again and take a fresh session slot, while
				// `linkToView` is pinned to viewing. Delayed so the message is seen first.
				this.#notify(this.#text('sessionExpired', 'DISK_EDITOR_VIBEOFFICE_SESSION_EXPIRED'));
				this.#scheduleNavigation(() => this.#downgradeToView());
				break;

			default:
				break;
		}
	}

	/**
	 * Single point for error reactions. Maps a `VibeOfficeError.code` (helper types.ts:199-207)
	 * onto a localized, user-facing reaction — never a silent failure. Terminal codes raise a
	 * blocking `ui.dialogs.messagebox`; transient codes (only `sse-degraded`) raise a toast and
	 * let editing continue. An unknown/missing code falls back to a generic terminal message.
	 *
	 * Only the standard UI surfaces (`ui.notification` / `ui.dialogs.messagebox`) are used; no
	 * custom popup class is introduced.
	 */
	#handleError(error: ?Object): void
	{
		if (!this.#isActive())
		{
			return;
		}
		this.#closeWaiting();

		const reaction = this.#resolveErrorReaction(error);
		const message = Loc.getMessage(reaction.messageId) || '';

		// Mark that an error was just surfaced so a failover({recovered:false}) fired in the same
		// helper cycle does not double-notify the user (see handleFailover).
		this.#lastErrorNotifiedAt = Date.now();
		if (error?.code === 'save-refused')
		{
			if (!this.#saveRefusedShown)
			{
				this.#saveRefusedShown = true;
				this.#showSaveRefused(message);
			}

			return;
		}

		if (reaction.terminal || hasManualHandoff(error))
		{
			if (!this.#showManualRestart(message, error))
			{
				this.#showErrorMessageBox(message);
			}
		}
		else
		{
			this.#notify(message);
		}
	}

	#showSaveRefused(message: string): void
	{
		const MessageBox = BX.UI?.Dialogs?.MessageBox;
		if (!Type.isFunction(MessageBox?.create))
		{
			this.#showErrorMessageBox(message);

			return;
		}

		const lifecycleToken = this.#lifecycleGeneration;
		const box = MessageBox.create({
			message,
			buttons: BX.UI.Dialogs.MessageBoxButtons.OK,
			popupOptions: {
				events: {
					onPopupClose: () => {
						if (this.#saveRefusedBox === box)
						{
							this.#saveRefusedBox = null;
						}
					},
				},
			},
		});
		this.#saveRefusedBox = box;
		box.show();
		void this.#loadSaveRefusalReason(box, message, lifecycleToken);
	}

	async #loadSaveRefusalReason(box: Object, message: string, lifecycleToken: number): Promise<void>
	{
		try
		{
			const action = this.externalLinkMode
				? EXTERNAL_SAVE_REFUSAL_REASON_ACTION
				: SAVE_REFUSAL_REASON_ACTION
			;
			const response = await Ajax.runAction(action, {
				data: {
					documentSessionId: this.documentSession.id,
					documentSessionHash: this.documentSession.hash,
				},
			});
			const reason = response?.data?.reason;
			if (
				!this.#isCurrent(lifecycleToken)
				|| this.#saveRefusedBox !== box
				|| !Type.isStringFilled(reason)
				|| !/^[a-z0-9_]+$/.test(reason)
			)
			{
				return;
			}

			const reasonMessage = Loc.getMessage('DISK_EDITOR_VIBEOFFICE_SAVE_REFUSED_REASON', {
				'#CODE#': Text.encode(reason),
			});
			if (Type.isStringFilled(reasonMessage) && Type.isFunction(box.setMessage))
			{
				box.setMessage(`${message}<br>${reasonMessage}`);
			}
		}
		catch (error)
		{
			// The refusal remains visible when the diagnostic lookup is unavailable.
		}
	}

	// Resolve a `VibeOfficeError` onto its reaction descriptor (code → message + terminal flag).
	// The unit tests assert this mapping via the public `error` event (terminal → messagebox,
	// `sse-degraded`/`refresh-fetch-failed` → toast, unknown/missing code → generic terminal).
	#resolveErrorReaction(error: ?Object): { messageId: string, terminal: boolean }
	{
		const code = error && Type.isStringFilled(error.code) ? error.code : null;

		return (code && ERROR_REACTIONS[code]) ? ERROR_REACTIONS[code] : ERROR_FALLBACK;
	}

	#showManualRestart(message: string, error: ?Object): boolean
	{
		const MessageBox = BX.UI?.Dialogs?.MessageBox;
		if (
			!hasManualHandoff(error)
			|| this.#caughtDocumentReady !== null
			|| this.#restartTarget === null
			|| this.#firstLoadController.signal.aborted
			|| !Type.isFunction(MessageBox?.create)
		)
		{
			return false;
		}

		if (this.#manualRestartBox !== null)
		{
			return true;
		}

		const lifecycleToken = this.#lifecycleGeneration;
		const target = this.#restartTarget;
		this.#manualRestartPending = true;
		this.#manualRestartBox = MessageBox.create({
			message,
			buttons: BX.UI.Dialogs.MessageBoxButtons.OK_CANCEL,
			okCaption: Loc.getMessage('DISK_EDITOR_VIBEOFFICE_OPEN_AGAIN'),
			onOk: (_messageBox, button) => {
				if (!this.#manualRestartPending || !this.#isCurrent(lifecycleToken) || this.#caughtDocumentReady !== null)
				{
					return false;
				}

				this.#manualRestartPending = false;
				this.#manualRestartClosePromise = Promise.resolve(top.BX.Disk.endEditSession({
					id: this.documentSession.id,
					hash: this.documentSession.hash,
					documentWasChanged: this.documentWasChanged,
				})).then(() => {
					if (!this.#isCurrent(lifecycleToken))
					{
						return;
					}

					this.#closed = true;
					this.emitEventOnClosed();
					this.destroy();
					Page.redirect(target);
				}, () => {
					if (!this.#isCurrent(lifecycleToken))
					{
						return;
					}

					this.#manualRestartPending = true;
					this.#manualRestartClosePromise = null;
					button.setDisabled(false);
				});

				return false;
			},
			popupOptions: {
				events: {
					onPopupClose: () => {
						this.#manualRestartPending = false;
					},
				},
			},
		});
		this.#manualRestartBox.show();

		return true;
	}

	#closeManualRestart(): void
	{
		this.#manualRestartPending = false;
		this.#manualRestartBox?.close();
		this.#manualRestartBox = null;
	}

	#showErrorMessageBox(message: ?string): void
	{
		if (!Type.isStringFilled(message))
		{
			return;
		}

		// The page shell (template.php) loads `ui.dialogs.messagebox`; access it via the global,
		// mirroring the `BX.UI.Notification` usage in `#notify`. No custom popup is created.
		const MessageBox = BX.UI?.Dialogs?.MessageBox;
		if (MessageBox && Type.isFunction(MessageBox.alert))
		{
			MessageBox.alert(message);

			return;
		}

		// Last-resort fallback so the failure is never swallowed if the extension is missing.
		this.#notify(message);
	}

	// endregion

	// region [FF-V1] document-change tracking (parity with OnlyOffice handleDocumentStateChange) --

	// Native api.js `onDocumentReady` / `onInfo`: `onInfo` passes through the helper untouched,
	// `onDocumentReady` is wrapped by it and called here after its own handling. They timestamp
	// the moment the editor settled so the load-time / co-editing state changes below are not
	// mistaken for a genuine user edit.
	#handleNativeDocumentReady(): void
	{
		if (!this.#isActive())
		{
			return;
		}

		this.#caughtDocumentReady = Date.now();
		this.#closeWaiting();
		this.#closeManualRestart();
		this.#showDocumentName();
		void this.#applyCurrentUserAvatar();
	}

	#getCurrentEditorUser(): ?EditorUser
	{
		const user = this.openConfig?.config?.editorConfig?.user;
		if (
			!Type.isStringFilled(user?.id)
			|| !/^[1-9]\d*$/.test(user.id)
			|| user.id !== String(this.context.currentUser?.id)
			|| !Type.isString(user.name)
		)
		{
			return null;
		}

		return { id: user.id, name: user.name };
	}

	async #loadCurrentUserAvatar(): Promise<?CurrentUserAvatar>
	{
		try
		{
			const response = await Ajax.runComponentAction(COMPONENT_NAME, 'getCurrentUserAvatar', {
				mode: 'ajax',
				json: {},
			});

			return response.data;
		}
		catch
		{
			return null;
		}
	}

	async #applyCurrentUserAvatar(): Promise<void>
	{
		const lifecycleToken = this.#lifecycleGeneration;
		const editor = this.editor;
		const nativeEditor = editor?.instance;
		const user = this.#getCurrentEditorUser();
		if (
			!this.#isCurrent(lifecycleToken)
			|| !nativeEditor
			|| !user
			|| !Type.isFunction(nativeEditor.setUsers)
			|| this.#avatarRecipients.has(nativeEditor)
		)
		{
			return;
		}

		this.#currentUserAvatarPromise ??= this.#loadCurrentUserAvatar();
		const avatar = await this.#currentUserAvatarPromise;
		const currentUser = this.#getCurrentEditorUser();
		if (
			!this.#isCurrentEditor(editor, lifecycleToken)
			|| editor.instance !== nativeEditor
			|| this.#avatarRecipients.has(nativeEditor)
			|| currentUser?.id !== user.id
			|| currentUser?.name !== user.name
			|| avatar?.id !== user.id
			|| !Type.isStringFilled(avatar.image)
			|| !/^data:image\/(?:png|jpeg|gif|webp);base64,/.test(avatar.image)
		)
		{
			return;
		}

		this.#avatarRecipients.add(nativeEditor);
		try
		{
			nativeEditor.setUsers({ c: 'info', users: [{ ...user, image: avatar.image }] });
		}
		catch
		{
			// An optional avatar must not interrupt the document session.
		}
	}

	// The two places the page shows the name of the document, named from one owner so a rename
	// reaches both. The engine builds the iframe itself and leaves it without an accessible name,
	// and the page around it carries no header any more; it REPLACES the placeholder node with that
	// frame, so the search starts at the container around it - the only node of ours that survives
	// the drawing. The title of the page is written by the server once, while the shell is rendered
	// (`SetTitle` with the same stored name), and nothing else refreshes the tab afterwards.
	// Called when the document is ready (again after a failover recreate, which builds a new frame)
	// and after a rename, which is the other moment the name of the document changes.
	#showDocumentName(): void
	{
		if (!Type.isStringFilled(this.object.name))
		{
			return;
		}

		const frame: ?HTMLIFrameElement = this.targetNode?.querySelector('iframe');
		if (frame)
		{
			frame.title = this.object.name;
		}

		document.title = this.object.name;
	}

	#handleNativeInfo(): void
	{
		if (!this.#isActive())
		{
			return;
		}

		this.#caughtInfoEvent = Date.now();
	}

	// Native api.js `onDocumentStateChange`. Same guard as the OnlyOffice sibling: ignore changes
	// fired before the editor settled or within 500ms of it (load-time echoes, incoming co-editing
	// deltas), then treat any change as a real edit. Once set, `documentWasChanged` makes
	// handleClose → endEditSession create the "document is being saved" balloon in c_disk.js, which
	// the `vibeoffice` pull command later turns into the "saved" toast; emitEventOnClosed also
	// reports the truthful flag to the hosts.
	#handleDocumentStateChange(): void
	{
		if (!this.#isActive())
		{
			return;
		}

		if (this.#caughtDocumentReady === null || this.#caughtInfoEvent === null)
		{
			return;
		}

		if (Date.now() - Math.max(this.#caughtDocumentReady, this.#caughtInfoEvent) < 500)
		{
			return;
		}

		this.documentWasChanged = true;
	}

	// endregion

	/**
	 * The rename the editor asks for. The name is sent without the extension - it is appended by the
	 * server, so the entered one is stripped of it here; the server also makes an occupied name unique,
	 * so the name the object carries afterwards is not always the entered one and the person is told
	 * when it differs.
	 *
	 * The server also carries the stored name to the platform, which is what makes the header of the
	 * engine keep it. `editorSynchronized: false` says it did not get there - the engine will fall
	 * back to the name it was opened with on its next redraw - but the object is renamed either way,
	 * so that is not a refusal and nothing is said about it.
	 */
	async #handleRequestRename(event: { data: string }, composition: CompositionModel): Promise<void>
	{
		if (!this.#isActive())
		{
			return;
		}

		this.#renameGeneration += 1;
		const renameToken = this.#renameGeneration;
		const enteredName = Type.isStringFilled(event?.data) ? event.data.trim() : '';
		const newName = toEditableName(enteredName, composition.object.extension);
		const result = await documentHeaderService.rename(this.documentSession.hash, newName);
		if (!this.#isLastRename(renameToken))
		{
			return;
		}

		if (!result.success)
		{
			// The codes of the action are localized by the server; the two codes of the service itself
			// (UNEXPECTED, INVALID_RESPONSE) carry no message and are told with our own.
			const refusal = Type.isStringFilled(result.error.message)
				? result.error.message
				: this.#text('renameFailed', 'DISK_EDITOR_VIBEOFFICE_RENAME_FAILED')
			;

			this.#notify(refusal);

			return;
		}

		// Our own view of the name feeds everything the page names after the document - the frame and
		// the tab (`this.context.object` is the same object, so it follows along).
		if (Type.isStringFilled(result.data.name))
		{
			this.object.name = result.data.name;
			this.#showDocumentName();
		}

		const actualName = toEditableName(result.data.name, composition.object.extension);
		if (actualName === newName)
		{
			return;
		}

		this.#notify(
			Loc.getMessage('DISK_EDITOR_VIBEOFFICE_RENAMED_TO', { '#NAME#': Text.encode(actualName) }),
			'success',
		);
	}

	/**
	 * Reopens the document by the edit address, where the server checks the rights again.
	 */
	async #handleRequestEditRights(composition: ?CompositionModel): Promise<void>
	{
		if (!this.#isActive() || this.#reopening)
		{
			return;
		}

		this.#reopening = true;
		try
		{
			const outcome = isSamePortalPath(this.linkToEdit)
				? await this.#reopenInEditing(composition)
				: 'unavailable'
			;

			this.#answerTransition(outcome);
		}
		finally
		{
			this.#reopening = false;
		}
	}

	/**
	 * The button of the engine waits until it hears an answer, so every outcome but the leaving of the
	 * page is answered. A refusal of the gate of the limit shows the scenario of the restriction itself,
	 * and repeating the rights over it would name a reason the person does not have.
	 */
	#answerTransition(outcome: StartEditOutcome): void
	{
		if (outcome === 'opened')
		{
			return;
		}

		const refusal = outcome === 'refused'
			? this.#text('editTransitionUnavailable', 'DISK_EDITOR_VIBEOFFICE_EDIT_TRANSITION_UNAVAILABLE')
			: this.#text('editRightsDenied', 'DISK_EDITOR_VIBEOFFICE_EDIT_RIGHTS_DENIED')
		;

		this.#denyEditingRights(refusal);
	}

	/**
	 * Reports how the transition ended. The leaving of the page is announced by the header, and the answer
	 * of the transition tells the scenario of the restriction of the limit - which speaks to the person on
	 * its own - apart from a transition which was never made at all.
	 */
	async #reopenInEditing(composition: ?CompositionModel): Promise<StartEditOutcome>
	{
		let leaving = false;
		const onLeaving = () => {
			leaving = true;
		};

		// The wait can outlive the shell, so the teardown owns the release of the subscription as well;
		// whichever of the two comes first, the other one finds nothing left to release.
		let released = false;
		const release = () => {
			if (released)
			{
				return;
			}

			released = true;
			this.#unsubscribers = this.#unsubscribers.filter((off) => off !== release);
			EventEmitter.unsubscribe(BeforeStartEditEvent, onLeaving);
		};

		EventEmitter.subscribe(BeforeStartEditEvent, onLeaving);
		this.#unsubscribers.push(release);

		let outcome: StartEditOutcome = 'unavailable';
		try
		{
			outcome = await startEdit({
				editorCode: ServerChosenEditor,
				editUrl: this.linkToEdit,
				composition,
				// The button of the transition lives inside the engine, so the scenario of the restriction
				// has no control of ours to bind itself to.
				trigger: null,
				// The press is waited out by the gate, and the shell can be taken down in the meantime -
				// a document the person has just closed is not reopened in editing behind their back.
				isStillWanted: () => this.#isActive(),
			});
		}
		catch (error)
		{
			// A transition broken on its way is a transition not made; the refusal is the answer to it,
			// but the breakage itself never disappears silently.
			console.error('[vibeoffice] startEdit failed', error);

			return 'unavailable';
		}
		finally
		{
			release();
		}

		return leaving ? 'opened' : outcome;
	}

	// The answer of a refusal belongs to the native editor: the facade of the helper carries its own
	// methods only, and the rest of the api.js surface is reached through the index signature of its type.
	#denyEditingRights(message: string): void
	{
		const instance = this.editor?.instance;
		const deny = instance?.denyEditingRights;
		if (Type.isFunction(deny))
		{
			deny.call(instance, message);
		}
	}

	// region engine-orthogonal behaviours reused from the OnlyOffice wrapper ---------------

	registerTimerToTrackWork(): void
	{
		if (!this.#isActive() || this.#trackWorkTimer !== null)
		{
			return;
		}

		this.#trackWorkTimer = setInterval(
			this.#trackWork.bind(this),
			SECONDS_TO_MARK_AS_STILL_WORKING * 1000,
		);
	}

	#trackWork(): void
	{
		if (!this.#isActive())
		{
			return;
		}

		// Mirrors the OnlyOffice wrapper's keep-alive: ping the component so the document
		// session is not garbage-collected while the user keeps editing. Requires the
		// `markAsStillWorkingSession` action on the vibeoffice component (backend).
		Ajax.runComponentAction(COMPONENT_NAME, 'markAsStillWorkingSession', {
			mode: 'ajax',
			json: {
				documentSessionId: this.documentSession.id,
				documentSessionHash: this.documentSession.hash,
			},
		}).catch(() => {});
	}

	bindEvents(): void
	{
		const onSliderClose = this.handleSliderClose.bind(this);
		EventEmitter.subscribe('SidePanel.Slider:onClose', onSliderClose);
		this.#unsubscribers.push(() => EventEmitter.unsubscribe('SidePanel.Slider:onClose', onSliderClose));

		// beforeunload cannot distinguish navigation from a page entering the back/forward cache.
		const onPageHide = (event: PageTransitionEvent) => {
			// A page put into the back/forward cache is not closed: it can be shown again with the
			// editor alive, so its session stays open.
			if (event?.persisted === true)
			{
				return;
			}

			this.handleClose(true);
		};
		Event.bind(window, 'pagehide', onPageHide);
		this.#unsubscribers.push(() => Event.unbind(window, 'pagehide', onPageHide));

		// Native window events reach the page only through Event.bind: EventEmitter keeps a registry
		// of its own and never calls addEventListener.
		const onMessage = (event: MessageEvent) => {
			// 'closeIframe' is posted by the portal page embedding this editor in an iframe
			// (disk.onlyoffice-im-integration/create-document.js sends it with targetOrigin '*'). Both
			// pages are served by this portal, so a trusted message carries our own origin; anything
			// from another origin, or of another shape, is not ours and must not close the editor.
			if (event.origin !== window.location.origin || event.data !== 'closeIframe')
			{
				return;
			}

			this.handleClose(false);
		};
		Event.bind(window, 'message', onMessage);
		this.#unsubscribers.push(() => Event.unbind(window, 'message', onMessage));
	}

	loadDiskExtensionInTopWindow(): void
	{
		if (window.top !== window && !BX.getClass('window.top.BX.Disk.endEditSession'))
		{
			top.BX.loadExt('disk');
		}
	}

	// The 'Disk.OnlyOffice:*' event names below are the engine-agnostic contract of the hosts
	// (disk/document/editprocess.js, disk.folder.list, disk.documents, c_disk.js): they finalize
	// create/edit flows by listening to these exact names, whichever editor engine rendered the page.
	emitEventOnSaved(): void
	{
		const payload = {
			documentSession: this.documentSession,
			object: this.object,
		};

		const sliderByWindow = BX.SidePanel?.Instance?.getSliderByWindow(window);
		if (sliderByWindow)
		{
			BX.SidePanel.Instance.postMessageAll(window, 'Disk.OnlyOffice:onSaved', payload);
		}

		EventEmitter.emit('Disk.OnlyOffice:onSaved', payload);
	}

	emitEventOnClosed(): void
	{
		let process = 'edit';
		const sliderByWindow = BX.SidePanel?.Instance?.getSliderByWindow(window);
		if (sliderByWindow)
		{
			process = sliderByWindow.getData().get('process') || 'edit';

			BX.SidePanel.Instance.postMessageAll(window, 'Disk.OnlyOffice:onClosed', {
				documentSession: this.documentSession,
				object: this.object,
				process,
				documentWasChanged: this.documentWasChanged,
			});
		}

		EventEmitter.emit('Disk.OnlyOffice:onClosed', {
			documentSession: this.documentSession,
			object: this.object,
			process,
			documentWasChanged: this.documentWasChanged,
		});
	}

	handleSliderClose(event): void
	{
		if (!this.#isActive())
		{
			return;
		}

		const currentSlider = BX.SidePanel?.Instance?.getSliderByWindow(window);
		if (!currentSlider)
		{
			return;
		}

		const uid = currentSlider.getData().get('uid');
		const [sliderEvent] = event.getData();
		if (sliderEvent.getSlider().getData().get('uid') !== uid)
		{
			return;
		}

		this.handleClose();
	}

	// `viaBeacon` tells the two ways out apart. Closing the slider and the 'closeIframe' message of
	// the embedding page leave the page alive: the answer of the server is what draws the "document
	// is being saved" balloon, so they keep the ordinary call. Leaving the page has nobody left to
	// read an answer, so it hands the same action to the browser as a beacon.
	handleClose(viaBeacon: boolean = false): void
	{
		if (this.#closed || !this.#isActive())
		{
			return;
		}
		const manualClosePending = this.#manualRestartClosePromise !== null;
		if (manualClosePending && !viaBeacon)
		{
			this.#closed = true;
			this.destroy();
			this.emitEventOnClosed();

			return;
		}
		this.#closed = true;

		// Tear down SSE + native editor (helper destroy(); index.ts:183).
		this.destroy();

		this.emitEventOnClosed();

		if (viaBeacon && (this.#sendEndSessionBeacon() || manualClosePending))
		{
			return;
		}

		top.BX.Disk.endEditSession({
			id: this.documentSession.id,
			hash: this.documentSession.hash,
			documentWasChanged: this.documentWasChanged,
		});
	}

	// Returns whether the browser took the beacon over; the delivery itself is never guaranteed, and
	// a browser without sendBeacon returns false so the caller falls back to the ordinary call.
	// A repeated end of an already finished session is not an error on the server side.
	#sendEndSessionBeacon(): boolean
	{
		if (!Type.isFunction(navigator?.sendBeacon))
		{
			return false;
		}

		return navigator.sendBeacon(
			Uri.addParam(AJAX_ENDPOINT, {
				action: END_SESSION_ACTION,
				sessid: Loc.getMessage('bitrix_sessid') ?? '',
			}),
			this.#buildEndSessionPayload(),
		);
	}

	// `documentWasChanged` is left out on purpose: the action does not ask for it, and the balloon
	// it drives needs a page that is still there to show it.
	#buildEndSessionPayload(): Blob
	{
		return new Blob([JSON.stringify({
			sessionId: this.documentSession.id,
			documentSessionHash: this.documentSession.hash,
		})], { type: 'application/json' });
	}

	// endregion

	// The object channel carries viewer updates and conflict facts for exact editor sessions.
	#initPull(): void
	{
		if (!this.#isActive())
		{
			return;
		}

		if (!this.pullConfig || !this.publicChannel)
		{
			return;
		}

		// Always start a fresh public-channel client with this object's pull config, exactly like
		// the OnlyOffice editor shell. A login session almost always already has a `BX.PULL`
		// (im/notifications) that is NOT listening on this object's public channel (object_{id}),
		// so reusing it would never deliver the `contentUpdated` command. The editor page owns the
		// channel, so replacing `BX.PULL` with a client started from `this.pullConfig` is safe.
		BX.PULL = new PullClient({ skipStorageInit: true });
		BX.PULL.start(this.pullConfig);
		if (!this.isViewMode())
		{
			this.#unsubscribers.push(BX.PULL.subscribe({
				type: PullClient.SubscriptionType.Server,
				moduleId: 'disk',
				command: 'vibeoffice',
				callback: this.#handleConflict.bind(this),
			}));

			return;
		}

		// params-form subscription on the object client we just started. A handler-literal
		// (getModuleId/getSubscriptionType/getMap) is a plain object, so `subscribe()` skips the
		// `attachCommandHandler` branch (emitter.js:95) and falls into the flat params branch with
		// every field undefined — the callback would never fire. The params-form registers the
		// callback under `disk`/`contentUpdated` directly; on emit it receives `data.params`
		// (the `{object, updatedBy}` payload) as its first argument (emitter.js:246-251), which is
		// exactly what `#handleContentUpdated(data)` expects.
		const unsubscribe = BX.PULL.subscribe({
			type: PullClient.SubscriptionType.Server,
			moduleId: 'disk',
			command: 'contentUpdated',
			callback: this.#handleContentUpdated.bind(this),
		});
		this.#unsubscribers.push(unsubscribe);
	}

	#handleConflict(data: ConflictMessage): void
	{
		const sessionId = Number(this.documentSession?.id);
		if (
			!this.#isActive() || this.#conflictNotified || data?.event !== 'conflict'
			|| Number(data.object?.id) !== Number(this.object?.id)
			|| !Number.isInteger(sessionId) || sessionId <= 0
			|| !Array.isArray(data.documentSessionIds) || !data.documentSessionIds.includes(sessionId)
		)
		{
			return;
		}

		this.#conflictNotified = true;
		this.#notify(
			Loc.getMessage('DISK_EDITOR_VIBEOFFICE_CONFLICT'),
			null,
			'disk-vibeoffice-conflict-notification',
		);
	}

	// Live host notification that the object got a new version. Three guards, in order:
	//  (1) ignore other objects (the channel is per-object, but be defensive);
	//  (2) ignore our own change (the editor closes the stale parent viewer before editing);
	//  (3) only act in VIEW mode — edit mode handles its own concurrency. Then show a toast
	//      naming the author with a clickable "Refresh".
	#handleContentUpdated(data: ContentUpdatedMessage): void
	{
		if (!this.#isActive() || !data || !data.object)
		{
			return;
		}

		if (Number(data.object.id) !== Number(this.object?.id))
		{
			return;
		}

		const updatedBy = data.object.updatedBy;
		if (!updatedBy)
		{
			return;
		}

		if (!this.isViewMode())
		{
			return;
		}

		if (this.#isCurrentUser(updatedBy))
		{
			return;
		}

		const lifecycleToken = this.#lifecycleGeneration;
		const infoToken = data.updatedBy?.infoToken;
		this.#resolveUserName(updatedBy, infoToken).then(
			(userName) => {
				if (this.#isCurrent(lifecycleToken))
				{
					this.#notifyNonActualVersion(data.object.name, userName);
				}
			},
			() => {
				if (this.#isCurrent(lifecycleToken))
				{
					this.#notifyNonActualVersion(data.object.name, null);
				}
			},
		);
	}

	#isCurrentUser(userId: number): boolean
	{
		return Number(this.context.currentUser?.id) === Number(userId);
	}

	// Resolve the author's display name for parity with OnlyOffice (token-gated component
	// action). Rejects instead of throwing (the caller renders a name-less toast), so name
	// resolution never blocks the notification. The cache is read before the guards: they gate
	// issuing a NEW request, not a name already resolved under a token valid at that time.
	#resolveUserName(userId: ?number, infoToken: ?string): Promise<?string>
	{
		const cacheKey = this.#resolveNameCacheKey(userId);
		const cached = this.#userNameCache.get(cacheKey);
		if (cached)
		{
			return cached;
		}

		if (!Type.isStringFilled(infoToken) || this.#badUserInfoAttempts >= 3)
		{
			return Promise.reject();
		}

		const request = new Promise((resolve, reject) => {
			// A failed attempt counts toward the breaker (a stably failing backend stops being
			// re-asked) and drops its cache entry, so a transient failure does not lock the name
			// out for the rest of the viewing session.
			const fail = () => {
				this.#badUserInfoAttempts += 1;
				this.#userNameCache.delete(cacheKey);
				reject();
			};

			Ajax.runComponentAction(COMPONENT_NAME, 'getUserInfo', {
				mode: 'ajax',
				json: {
					documentSessionId: this.documentSession.id,
					documentSessionHash: this.documentSession.hash,
					userId,
					infoToken,
				},
			}).then(
				(response) => {
					if (!this.#isActive())
					{
						reject();

						return;
					}

					if (response.status === 'success' && response.data?.user?.name)
					{
						this.#badUserInfoAttempts = 0;
						resolve(response.data.user.name);

						return;
					}

					// A success response with no usable name is still a failed attempt: count it
					// toward the breaker threshold so a backend stably returning success-without-name
					// stops re-requesting getUserInfo on every contentUpdated.
					fail();
				},
				() => {
					if (!this.#isActive())
					{
						reject();

						return;
					}

					fail();
				},
			);
		});

		// Cached before the request settles: that is what deduplicates concurrent lookups.
		if (cacheKey !== null)
		{
			this.#userNameCache.set(cacheKey, request);
		}

		return request;
	}

	// Cache slot for an author id, or null when the id is not a positive int: `updatedBy` comes
	// from a pull message, and Number() would collapse every non-numeric value onto one NaN slot
	// shared by unrelated authors. A slot-less id is still requested from the backend.
	#resolveNameCacheKey(userId: ?number): ?number
	{
		const cacheKey = Number(userId);

		return (Number.isInteger(cacheKey) && cacheKey > 0) ? cacheKey : null;
	}

	// Toast with a clickable "Refresh" anchor (matches the OnlyOffice `[data-refresh-btn]`
	// pattern). With an author name → the `#USER_NAME#` variant; without → the no-name variant
	// so the user is still notified when name resolution fails.
	#notifyNonActualVersion(objectName: ?string, userName: ?string): void
	{
		if (!this.#isActive())
		{
			return;
		}

		const messageId = Type.isStringFilled(userName)
			? 'DISK_EDITOR_VIBEOFFICE_VIEW_NON_ACTUAL_VERSION'
			: 'DISK_EDITOR_VIBEOFFICE_VIEW_NON_ACTUAL_VERSION_NO_NAME';

		const replacements = { '#NAME#': Text.encode(objectName || '') };
		if (Type.isStringFilled(userName))
		{
			replacements['#USER_NAME#'] = Text.encode(userName);
		}

		const message = Loc.getMessage(messageId, replacements);
		if (!Type.isStringFilled(message))
		{
			return;
		}

		const content = Tag.render`<span data-testid="disk-vibeoffice-outdated-notification">${message}</span>`;
		const refreshButton = content.querySelector('[data-refresh-btn]');
		if (refreshButton)
		{
			refreshButton.setAttribute('data-testid', 'disk-vibeoffice-outdated-refresh-btn');
			Tag.style(refreshButton)`
				cursor: pointer;
			`;
			refreshButton.addEventListener('click', this.#reloadView.bind(this));
		}

		BX.UI?.Notification?.Center?.notify({ content });
	}

	// endregion

	// Prefer the text the template handed in `texts`; fall back to the extension's own
	// localization. No user-facing string is ever hardcoded here.
	#text(textKey: string, messageId: string): string
	{
		if (Type.isStringFilled(this.texts[textKey]))
		{
			return this.texts[textKey];
		}

		return Loc.getMessage(messageId) || '';
	}

	#notify(message: ?string, type: ?string = null, testId: ?string = null): void
	{
		if (!this.#isActive() || !Type.isStringFilled(message))
		{
			return;
		}

		const content = testId === null
			? message
			: Tag.render`<span data-testid="${testId}">${Text.encode(message)}</span>`
		;
		BX.UI?.Notification?.Center?.notify({ content, autoHideDelay: type === 'success' ? 3000 : 5000 });

		// The balloon carries no live region, so a screen reader gets nothing from it. The toast
		// renders the message as HTML; the live region speaks plain text.
		LiveAnnouncer.announce(Text.decode(message), type === 'success' ? 'polite' : 'assertive');
	}

	// Reaction to a closed session. Inside a slider we just close it (the host list / caller is
	// behind it). On a standalone page (external link / "open in new window") there is no slider to
	// close, so `#closeSlider`'s old `BX.SidePanel.Instance.close()` was a no-op that left a dead
	// editor on screen — downgrade to the document view instead. This satisfies the SDD requirement
	// (revoked → downgrade to view/close) and keeps `saved` from stranding the user on a finished
	// session.
	//
	// `deferNavigation` gates only the standalone navigation timing: revoked shows a message first,
	// so the navigation is delayed until it paints; saved shows no message, so it navigates at once
	// rather than leaving the user on the finished editor for the (message-only) delay.
	#closeSliderOrDowngradeToView(deferNavigation: boolean = true): void
	{
		const currentSlider = BX.SidePanel?.Instance?.getSliderByWindow(window);
		if (currentSlider)
		{
			currentSlider.close();

			return;
		}

		if (!deferNavigation)
		{
			this.#downgradeToView();

			return;
		}

		// Deferred so a just-shown message (e.g. "access revoked") paints before we navigate.
		this.#scheduleNavigation(() => this.#downgradeToView());
	}

	#waitForSavedThenClose(): void
	{
		const startedAt = Date.now();
		let pollInterval = SAVED_CONFIRMATION_INITIAL_POLL_INTERVAL_MS;
		const scheduleNextCheck = (check: () => void): void => {
			const elapsed = Date.now() - startedAt;
			if (elapsed >= SAVED_CONFIRMATION_TIMEOUT_MS)
			{
				this.#closeSliderOrDowngradeToView(false);

				return;
			}

			const jitterMultiplier = 1 + ((Math.random() * 2 - 1) * SAVED_CONFIRMATION_POLL_JITTER_RATIO);
			const delay = Math.min(
				Math.max(
					SAVED_CONFIRMATION_INITIAL_POLL_INTERVAL_MS,
					Math.round(pollInterval * jitterMultiplier),
				),
				SAVED_CONFIRMATION_MAX_POLL_INTERVAL_MS,
				SAVED_CONFIRMATION_TIMEOUT_MS - elapsed,
			);

			pollInterval = Math.min(
				pollInterval * SAVED_CONFIRMATION_POLL_BACKOFF_FACTOR,
				SAVED_CONFIRMATION_MAX_POLL_INTERVAL_MS,
			);
			setTimeout(check, delay);
		};

		const check = (): void => {
			if (!this.#isActive())
			{
				return;
			}

			Ajax.runAction('disk.api.vibeoffice.waitForSaved', {
				json: {
					documentSessionHash: this.documentSession?.hash,
				},
			})
				.then((response) => {
					const ready = response?.status === 'success' && response?.data?.ready === true;
					if (ready || Date.now() - startedAt >= SAVED_CONFIRMATION_TIMEOUT_MS)
					{
						this.#closeSliderOrDowngradeToView(false);

						return;
					}

					scheduleNextCheck(check);
				})
				.catch(() => {
					if (Date.now() - startedAt >= SAVED_CONFIRMATION_TIMEOUT_MS)
					{
						this.#closeSliderOrDowngradeToView(false);

						return;
					}

					scheduleNextCheck(check);
				});
		};

		check();
	}

	#closeParentViewer(): void
	{
		const viewer = window.top?.BX?.UI?.Viewer?.Instance;
		if (viewer?.isOpen?.() && viewer?.getCurrentItem?.())
		{
			viewer.close();
		}
	}

	// Leave the (now closed) editor for the plain document view. Prefer the server-built view URL;
	// fall back to a reload when it is absent so the stale editor is never left in place.
	#downgradeToView(): void
	{
		if (Type.isStringFilled(this.linkToView))
		{
			document.location = this.linkToView;

			return;
		}

		document.location.reload();
	}

	// Run a page-navigating session-close reaction after a short delay so its message is seen
	// first. Single-shot: a second close reason cannot stack another navigation. Cleared on destroy
	// so a torn-down editor never navigates.
	#scheduleNavigation(navigate: () => void): void
	{
		if (!this.#isActive() || this.#pendingNavigationTimer !== null)
		{
			return;
		}

		this.#pendingNavigationTimer = setTimeout(() => {
			this.#pendingNavigationTimer = null;
			if (this.#isActive())
			{
				navigate();
			}
		}, SESSION_CLOSE_NAVIGATION_DELAY_MS);
	}

	#reloadView(): void
	{
		if (!this.#isActive())
		{
			return;
		}

		if (this.isViewMode() && Type.isStringFilled(this.linkToView))
		{
			document.location = this.linkToView;

			return;
		}

		document.location.reload();
	}

	#resolveElementId(element: HTMLElement | string, fallbackNode: ?HTMLElement): ?string
	{
		if (Type.isStringFilled(element))
		{
			return element;
		}

		if (Type.isDomNode(element) && element.id)
		{
			return element.id;
		}

		if (fallbackNode && fallbackNode.id)
		{
			return fallbackNode.id;
		}

		return null;
	}

	isEditMode(): boolean
	{
		return this.openConfig?.config?.editorConfig?.mode === 'edit';
	}

	isViewMode(): boolean
	{
		return !this.isEditMode();
	}

	getEditor(): ?VibeOfficeEditor
	{
		return this.editor;
	}

	#isActive(): boolean
	{
		return !this.#destroyed;
	}

	#isCurrent(lifecycleToken: number): boolean
	{
		return this.#isActive() && lifecycleToken === this.#lifecycleGeneration;
	}

	#isCurrentEditor(editor: VibeOfficeEditor, lifecycleToken: number): boolean
	{
		return this.#isCurrent(lifecycleToken) && this.editor === editor;
	}

	#isLastRename(renameToken: number): boolean
	{
		return this.#isActive() && renameToken === this.#renameGeneration;
	}

	destroy(): void
	{
		if (!this.#isActive())
		{
			return;
		}

		this.#destroyed = true;
		this.#lifecycleGeneration += 1;
		this.#firstLoadController.abort();
		this.#closeManualRestart();
		this.#closeWaiting();
		this.#saveRefusedBox?.close();
		this.#saveRefusedBox = null;

		if (this.#trackWorkTimer !== null)
		{
			clearInterval(this.#trackWorkTimer);
			this.#trackWorkTimer = null;
		}

		if (this.#pendingNavigationTimer !== null)
		{
			clearTimeout(this.#pendingNavigationTimer);
			this.#pendingNavigationTimer = null;
		}

		this.#unsubscribers.forEach((off) => {
			try
			{
				off();
			}
			catch (e)
			{
				// best-effort teardown
			}
		});
		this.#unsubscribers = [];

		this.#userNameCache.clear();
		this.#currentUserAvatarPromise = null;
		this.#avatarRecipients = new WeakSet();

		if (this.editor)
		{
			this.editor.destroy();
			this.editor = null;
		}
	}
}

/**
 * Guards the transition against an open redirect. A control character is refused too, because a browser
 * drops it and follows what is left as `//host`.
 */
function isSamePortalPath(link: ?string): boolean
{
	return Type.isStringFilled(link)
		&& PORTAL_PATH_SHAPE.test(link)
		&& !carriesControlCharacter(link)
	;
}

function carriesControlCharacter(value: string): boolean
{
	return [...value].some((character: string) => {
		const code = character.codePointAt(0);

		return code < 0x20 || code === 0x7F;
	});
}

/**
 * The name as the person edits it. The extension belongs to the object and is appended by the server,
 * so the name it answers with is compared with the entered one without the extension.
 */
function toEditableName(storedName: string, extension: string): string
{
	const suffix = `.${extension}`;

	return extension !== '' && storedName.endsWith(suffix) ? storedName.slice(0, -suffix.length) : storedName;
}

function hasManualHandoff(error: ?Object): boolean
{
	if (!Type.isObject(error))
	{
		return false;
	}

	const handoff = error.handoff;

	return handoff?.version === 1
		&& handoff.action === 'manual'
		&& handoff.automaticOpenAllowed === false
		&& handoff.readyReached === false
		&& handoff.terminal === true
		&& handoff.cleanupComplete === true;
}

function openingDeadline(budget: ?Object): number
{
	if (budget === null || budget === undefined)
	{
		return Infinity;
	}

	if (!Type.isPlainObject(budget))
	{
		return 0;
	}

	const { version, totalMs, remainingMs } = budget;
	if (
		version !== 1
		|| !Number.isSafeInteger(totalMs)
		|| !Number.isSafeInteger(remainingMs)
		|| totalMs <= 0
		|| remainingMs < 0
	)
	{
		return 0;
	}

	// performance.now() includes the navigation elapsed before the HTML reached this shell.
	return Math.min(totalMs, remainingMs);
}

function firstLoadContext(deadline: number, navigationElapsed: number)
{
	const remainingMs = Math.floor(deadline - navigationElapsed);
	if (remainingMs <= 0)
	{
		return null;
	}

	return { version: 1, remainingMs, helperRemainingMs: Math.min(150_000, remainingMs) };
}
