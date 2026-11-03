/* eslint-disable */
this.BX = this.BX || {};
this.BX.Note = this.BX.Note || {};
(function (exports, ui_progressbar, main_core, ui_buttons, ui_system_dialog, ui_a11y, ui_notification, note_permissions, note_ui_themeContext, ui_system_checkbox, ui_iconSet_api_core, ui_iconSet_outline, note_ui_loader, ui_vue3, ui_system_input_vue, ui_system_menu, ui_system_alert_vue, ui_system_alert, ui_system_radiobutton) {
	'use strict';

	const SOURCE_TYPE_OUTLINE = 'outline';
	const SOURCE_TYPE_LANDING = 'landing';
	const SOURCE_TYPE_WIKI = 'wiki';
	const IMPORT_POLL_INTERVAL_MS = 5000;
	const SOURCE_TYPES = Object.freeze([Object.freeze({
		id: SOURCE_TYPE_OUTLINE,
		label: main_core.Loc.getMessage('NOTE_IMPORT_SOURCE_OUTLINE'),
		enabled: true
	}), Object.freeze({
		id: SOURCE_TYPE_WIKI,
		label: main_core.Loc.getMessage('NOTE_IMPORT_SOURCE_WIKI'),
		enabled: true
	}), Object.freeze({
		id: SOURCE_TYPE_LANDING,
		label: main_core.Loc.getMessage('NOTE_IMPORT_SOURCE_LANDING'),
		enabled: true
	})]);

	// A source that converts bases of this very portal is released behind an option of the portal, and
	// the answer of the server about it travels here as the dialog option named next to it. A source
	// absent from this map is offered to everyone.
	const RELEASE_OPTION_BY_SOURCE = Object.freeze({
		[SOURCE_TYPE_WIKI]: 'wikiImportEnabled',
		[SOURCE_TYPE_LANDING]: 'landingImportEnabled'
	});

	// Which sources the picker offers. A source is left out unless the server said it is on: an absent
	// permission and a permission the transport garbled both read as "not offered".
	function resolveAvailableSources(options = {}) {
		return SOURCE_TYPES.filter(source => {
			const releaseOption = RELEASE_OPTION_BY_SOURCE[source.id];
			return releaseOption === undefined || options[releaseOption] === true;
		});
	}

	// A source that converts bases of this very portal needs neither an address nor a token: it is read
	// over the session of the user who is logged in.
	function isLocalSource(sourceType) {
		return sourceType === SOURCE_TYPE_LANDING || sourceType === SOURCE_TYPE_WIKI;
	}
	const IMPORT_SCREEN = Object.freeze({
		LOADING: 'loading',
		CONNECTION: 'connection',
		COLLECTIONS: 'collections',
		OVERWRITE_CONFIRM: 'overwriteConfirm',
		REIMPORT_CHOICE: 'reimportChoice',
		PROGRESS: 'progress',
		PERMISSIONS_LIST: 'permissionsList'
	});
	const REIMPORT_ACTION = Object.freeze({
		UPDATE: 'update',
		CREATE: 'create'
	});
	const IMPORT_PROGRESS_STATUS = Object.freeze({
		IN_PROGRESS: 'in_progress',
		DONE: 'done',
		ERROR: 'error',
		CANCELLED: 'cancelled'
	});
	function createDefaultImportCollection() {
		return {
			id: '',
			name: ''
		};
	}
	function createDefaultImportTreeNode() {
		return {
			id: '',
			title: '',
			parentId: null,
			children: []
		};
	}
	function createDefaultConnectionFormState() {
		return {
			sourceType: SOURCE_TYPE_OUTLINE,
			url: '',
			token: '',
			errorMessage: '',
			isSubmitting: false,
			touched: {
				sourceType: false,
				url: false,
				token: false
			},
			errors: {
				sourceType: '',
				url: '',
				token: ''
			}
		};
	}
	function createDefaultCollectionsScreenState() {
		return {
			isLoading: false,
			errorMessage: '',
			collections: [],
			selectedCollectionIds: new Set(),
			expandedCollectionIds: new Set(),
			treeByCollectionId: new Map()
		};
	}
	function createDefaultOverwriteState() {
		return {
			collections: [],
			expandedCollectionIds: new Set(),
			treeByCollectionId: new Map()
		};
	}
	function createDefaultReimportChoiceState() {
		return {
			collections: [],
			// Creating a new base changes nothing that already exists, so it is what the screen
			// starts on: updating overwrites documents and has to be picked on purpose.
			action: REIMPORT_ACTION.CREATE,
			errorMessage: '',
			expandedCollectionIds: new Set(),
			treeByCollectionId: new Map()
		};
	}

	// Q-1: the decision is one per run, so a single base without the moderator right takes
	// updating away from the whole run.
	function canUpdateExistingCollections(collections) {
		return collections.length > 0 && collections.every(collection => collection.canModerate === true);
	}
	function isReimportUpdateRequested(state) {
		return state.action === REIMPORT_ACTION.UPDATE && canUpdateExistingCollections(state.collections);
	}

	// The overwrite flag a start carries, decided by the screen the start came from. A retry passes
	// the screen of the run it retries, not the progress screen it sits on: restarting an update as a
	// fresh import would leave the half-updated base behind and put a duplicate of it alongside. A
	// retry only starts this way while that screen is known at all - {@see resolveRetryRoute}.
	function resolveStartOverwrite(originScreen, reimportState) {
		if (originScreen === IMPORT_SCREEN.OVERWRITE_CONFIRM) {
			return true;
		}
		if (originScreen === IMPORT_SCREEN.REIMPORT_CHOICE) {
			return isReimportUpdateRequested(reimportState);
		}
		return false;
	}
	const RETRY_ROUTE = Object.freeze({
		BACK: 'back',
		CHECK_OVERLAP: 'checkOverlap',
		REPEAT: 'repeat'
	});

	// Where the repeat of a stopped run goes. A run this dialog started remembers the screen it came
	// from, and that screen carries the decision the user made ({@see resolveStartOverwrite}), so such a
	// run is repeated exactly as it was. A run restored on opening the dialog came from no screen at
	// all: the server keeps the decision in the state of the run but does not report it back, and
	// repeating such a run as a plain start would turn an update into a fresh import - a duplicate base
	// beside the half-updated one. It goes through the check for bases converted before instead, and
	// that check asks the user again, the way the list of bases does. A run with no base picked has
	// nothing to repeat, so its button leads back rather than nowhere.
	function resolveRetryRoute(startOriginScreen, pickedCollectionCount) {
		if (pickedCollectionCount === 0) {
			return RETRY_ROUTE.BACK;
		}
		return startOriginScreen === null ? RETRY_ROUTE.CHECK_OVERLAP : RETRY_ROUTE.REPEAT;
	}

	// Which screen a checked overlap leads to, or null to start the import right away. Landing
	// asks what to do with a base converted before (API-01 names it and tells whether updating is
	// allowed); the other sources keep the plain overwrite confirmation they had.
	// A match the user cannot see is no match, and neither list speaks about one: both `existingCollections`
	// and `existingCollectionIds` come from the bases the server let this user see (API-01).
	function resolveOverlapScreen(sourceType, overlap) {
		if (sourceType === SOURCE_TYPE_LANDING) {
			return overlap.existingCollections.length > 0 ? IMPORT_SCREEN.REIMPORT_CHOICE : null;
		}
		return overlap.existingCollectionIds.length > 0 ? IMPORT_SCREEN.OVERWRITE_CONFIRM : null;
	}

	// Whether the read of the active session gives the dialog a run to show. The row of a session outlives
	// the run it stands for: cancelling deletes the state of the run and keeps the row until the user
	// acknowledges the end, so the server calls active a session that has nothing left to report. Such an
	// answer says neither what the run did nor whether it is still going, and is read as no session at
	// all: the dialog opens on the connection screen, and the next start drops the row anyway.
	function shouldRestoreSession(session) {
		return session?.active === true && Boolean(session.progress);
	}

	// Whether the run on the progress screen can be started again from what the dialog holds. A source of
	// this very portal is read over the session of the user, so a run of it repeats from anything restored.
	// Outline is reached with a token, and a session restored on opening the dialog carries none: the
	// server neither returns the token nor should. An empty token is not what a start is refused over,
	// so such a repeat would be accepted and then die at the first request to the source - it is not
	// offered at all instead.
	function canRepeatImport(sourceType, sourceToken) {
		return isLocalSource(sourceType) || String(sourceToken || '').trim() !== '';
	}

	// Where the way back from a stopped run leads. The list of bases is asked of the source with the same
	// credentials the run was started with, so a run that cannot be repeated has no list to go back to
	// either: the way back is then the connection screen, where the credentials are entered anew.
	function resolveStoppedImportBackScreen(sourceType, sourceToken) {
		return canRepeatImport(sourceType, sourceToken) ? IMPORT_SCREEN.COLLECTIONS : IMPORT_SCREEN.CONNECTION;
	}

	// Whether the button asking for a run may be pressed. A run already asked for refuses every such
	// button: the server answers the second start with "the transfer is already going", and that answer
	// takes the user to the list of bases while the first run keeps going - rebuilding that list every
	// poll tick, together with its scroll, its opened branches and the focus standing on it.
	// The list of bases refuses on its own account too. A list still loading shows no base to start
	// over, and the ids picked before it belong to the list that was there: after the way back from a
	// stopped run they come from the session, not from anything the screen shows.
	function canStartImport(screen, isStarting, collectionsState) {
		if (isStarting) {
			return false;
		}
		if (screen !== IMPORT_SCREEN.COLLECTIONS) {
			return true;
		}
		return !collectionsState.isLoading && collectionsState.collections.length > 0 && collectionsState.selectedCollectionIds.size > 0;
	}

	// The bases a freshly loaded list comes up ticked with. The picks the screen had are not the picks of
	// that list: the way back from a stopped run brings them from the session, and the list is only asked
	// for afterwards. They are kept as far as the list that came back knows them - a run started over a
	// base the user cannot see is not what the way back is for. A list that knows none of them says
	// nothing about what was picked and comes up the way the first one does: every base ticked, because
	// converting all of them is the common case and unticking the odd one out is less work than ticking
	// each base by hand.
	function resolveCollectionPicks(previousPicks, collections) {
		const listedIds = collections.map(collection => collection.id);
		const keptPicks = listedIds.filter(id => previousPicks.has(id));
		return new Set(keptPicks.length > 0 ? keptPicks : listedIds);
	}
	function createDefaultProgressScreenState() {
		return {
			isImporting: false,
			isCancelling: false,
			errorMessage: '',
			progress: null
		};
	}

	// Whether the dialog asks the server about the run again. It asks while the run is going, and the
	// cancel ends the run here rather than at the server: the answer to the cancel writes the status the
	// run ended on, so an ask sent while that answer is on its way would come back after it - carrying
	// the status the run had while it was still going, over the one it ended on.
	function shouldPollImportStatus(progressState, sessionId) {
		return Boolean(sessionId) && progressState.isImporting && !progressState.isCancelling;
	}
	function createDefaultPermissionsListState() {
		return {
			isLoading: false,
			errorMessage: '',
			hasLoaded: false,
			collections: []
		};
	}

	// Whether the button that finishes may be pressed. What finishing does is read from the list of
	// bases the run converted: several of them lead to the list itself, a single one is opened
	// ({@see shouldListConvertedCollections}, {@see resolveConvertedCollectionIdToOpen}). That list is
	// asked for once the run has ended, while the summary of the run - the button included - is drawn as
	// soon as it ends, so a press landing before the list arrives would close the dialog past both.
	// A repeat asked for on the summary of a stopped run holds the button for the reason the rest of
	// that screen is held: the answer to the repeat would put the user onto the progress of a run they
	// have already walked away from.
	function canFinishImport(isStarting, permissionsListState) {
		return !isStarting && !permissionsListState.isLoading;
	}
	function toCollectionId(value) {
		const id = Number(value);
		return Number.isInteger(id) && id > 0 ? id : null;
	}

	// Landing converts several bases in one run, so such a run has no single "the" base to open.
	// Listing what has been converted is worth a screen only while there is more than one base;
	// a cancelled run needs no screen either - its own summary already names the bases it kept.
	function shouldListConvertedCollections(sourceType, screen, progress, convertedCollections) {
		if (sourceType !== SOURCE_TYPE_LANDING || screen === IMPORT_SCREEN.PERMISSIONS_LIST) {
			return false;
		}
		if (progress?.status === IMPORT_PROGRESS_STATUS.CANCELLED) {
			return false;
		}
		return convertedCollections.length > 1;
	}

	// Whether the summary of a run offers a way of its own to the list of what was converted. That way
	// is one button, not two: a run that converted several bases has no single base to open, so finishing
	// leads to the list by itself ({@see shouldListConvertedCollections}) and a second button to the same
	// screen would have nothing else to do. A run that converted nothing has no list to offer at all.
	function shouldOfferPermissionsSetup(sourceType, screen, progress, convertedCollections) {
		// The offer belongs to the summary of a run, and the summary is the progress screen: the list
		// itself has no way to offer to where it already is.
		if (screen !== IMPORT_SCREEN.PROGRESS) {
			return false;
		}
		if (sourceType !== SOURCE_TYPE_LANDING || convertedCollections.length === 0) {
			return false;
		}
		return !shouldListConvertedCollections(sourceType, screen, progress, convertedCollections);
	}

	// The base a finished landing run opens: only a run that converted exactly one base has one to
	// open, and `null` keeps the user where they are instead of opening an arbitrary base.
	function resolveConvertedCollectionIdToOpen(convertedCollections) {
		return convertedCollections.length === 1 ? toCollectionId(convertedCollections[0]?.collectionId) : null;
	}
	function resolveProgressScreenStatus(state) {
		if (state.errorMessage) {
			return 'error';
		}
		const progress = state.progress;
		if (!progress) {
			return 'preparing';
		}
		if (progress.status === IMPORT_PROGRESS_STATUS.CANCELLED) {
			return 'cancelled';
		}
		if (progress.status === IMPORT_PROGRESS_STATUS.ERROR) {
			return 'error';
		}
		if (progress.status === IMPORT_PROGRESS_STATUS.DONE) {
			return (progress.error ?? 0) > 0 ? 'done_error' : 'done_ok';
		}
		if (progress.step === 'downloadAttachments' || progress.step === 'retryAttachments') {
			return 'attachments';
		}
		if (progress.step === 'createStructure' || progress.step === 'fillContent') {
			return 'documents';
		}
		return 'preparing';
	}
	function buildCheckConnectionPayload(sourceType, url, token) {
		return {
			sourceType,
			url,
			token
		};
	}
	function buildGetCollectionsPayload(sourceType, url, token) {
		return {
			sourceType,
			url,
			token
		};
	}
	function buildGetDocumentTreePayload(sourceType, url, token, collectionId) {
		return {
			sourceType,
			url,
			token,
			collectionId
		};
	}
	function buildCheckOverlapPayload(sourceType, collectionIds) {
		return {
			sourceType,
			collectionIds
		};
	}

	// The decision travels over a form-encoded transport, where every value becomes a string: a boolean
	// `false` arrives as 'false', which is a non-empty string and reads as truth on the server. `1`/`0`
	// says the same thing in the one form both sides read alike, and is what the rest of the module
	// sends its flags as. {@see resolveStartOverwrite} for how the decision itself is made.
	function buildStartPayload(sourceType, url, token, collectionIds, overwrite = false) {
		return {
			sourceType,
			url,
			token,
			collectionIds,
			overwrite: overwrite ? 1 : 0
		};
	}
	function buildGetStatusPayload(sessionId) {
		return {
			sessionId
		};
	}
	function buildCancelPayload(sessionId) {
		return {
			sessionId
		};
	}
	function buildAcknowledgeFinishPayload(sessionId) {
		return {
			sessionId
		};
	}
	function buildGetConvertedCollectionsPayload(sessionId) {
		return {
			sessionId
		};
	}

	// Landing/Wiki import creates "knowledge bases"; Outline stays on "collection".
	function usesKnowledgeBaseTerm(sourceType) {
		return sourceType === SOURCE_TYPE_LANDING || sourceType === SOURCE_TYPE_WIKI;
	}

	// Where a failed source check belongs on the connection screen. A source with an address and a
	// token gets the message on the field its error code names (API-04 keeps those codes unchanged).
	// Landing has neither field, so none of its errors - module unavailable, no accessible bases -
	// can belong to one: `field: null` means the message describes the source itself.
	function resolveConnectionError(sourceType, error) {
		const message = String(error?.message ?? '');
		if (sourceType === SOURCE_TYPE_LANDING) {
			return {
				field: null,
				message: message === '' ? main_core.Loc.getMessage(importTermMessageCode('NOTE_IMPORT_COLLECTIONS_LOAD_ERROR', sourceType)) : message
			};
		}
		return {
			field: error?.code === 'IMPORT_INVALID_TOKEN' ? 'token' : 'url',
			message: message === '' ? main_core.Loc.getMessage('NOTE_IMPORT_URL_INVALID') : message
		};
	}

	// Returns the phrase code: the `_KB` variant for landing/wiki, otherwise the base code.
	// If the `_KB` phrase doesn't exist for the current locale (translated only in ru),
	// falls back to the base code so en/de/kz don't render blank text.
	function importTermMessageCode(baseCode, sourceType) {
		if (!usesKnowledgeBaseTerm(sourceType)) {
			return baseCode;
		}
		const kbCode = `${baseCode}_KB`;
		return main_core.Loc.hasMessage(kbCode) || hasPluralForms(kbCode) ? kbCode : baseCode;
	}

	// A phrase written per number lives in the locale as `_PLURAL_*` only, so its plain code is
	// absent - asking `hasMessage` about the plain code alone would call such a phrase missing.
	function hasPluralForms(code) {
		return main_core.Loc.hasMessage(`${code}_PLURAL_1`);
	}

	// The phrase of the current term, in the form the count calls for. The `_KB` variants of landing
	// and wiki are written per number while the base phrases they fall back to are not, so the code is
	// resolved first and only then asked for its own form.
	function importTermMessage(baseCode, sourceType, count) {
		const code = importTermMessageCode(baseCode, sourceType);
		return hasPluralForms(code) ? main_core.Loc.getMessagePlural(code, count) : main_core.Loc.getMessage(code);
	}

	const ALLOWED_PROGRESS_STATUS = new Set(Object.values(IMPORT_PROGRESS_STATUS));
	function normalizeCheckConnectionResponse(rawResponse) {
		if (!main_core.Type.isPlainObject(rawResponse)) {
			throw new TypeError('Invalid checkConnection response');
		}
		return {
			instanceName: String(rawResponse.instanceName ?? '')
		};
	}
	function normalizeGetCollectionsResponse(rawResponse) {
		if (!main_core.Type.isPlainObject(rawResponse) || !Array.isArray(rawResponse.collections)) {
			throw new TypeError('Invalid getCollections response');
		}
		return {
			collections: rawResponse.collections.map(collection => normalizeImportCollection(collection))
		};
	}
	function normalizeGetDocumentTreeResponse(rawResponse) {
		if (!main_core.Type.isPlainObject(rawResponse) || !Array.isArray(rawResponse.documents)) {
			throw new TypeError('Invalid getDocumentTree response');
		}
		return {
			documents: rawResponse.documents.map(document => normalizeImportDocumentTreeNode(document))
		};
	}
	function normalizeCheckOverlapResponse(rawResponse) {
		if (!main_core.Type.isPlainObject(rawResponse)) {
			throw new TypeError('Invalid checkOverlap response');
		}
		return {
			existingCollectionIds: Array.isArray(rawResponse.existingCollectionIds) ? rawResponse.existingCollectionIds.map(id => String(id)) : [],
			existingCollections: Array.isArray(rawResponse.existingCollections) ? rawResponse.existingCollections.filter(item => main_core.Type.isPlainObject(item)).map(item => normalizeExistingCollection(item)).filter(item => item.collectionId > 0) : []
		};
	}
	function normalizeExistingCollection(rawCollection) {
		return {
			externalId: String(rawCollection.externalId ?? ''),
			collectionId: toPositiveInt(rawCollection.collectionId) ?? 0,
			name: String(rawCollection.name ?? ''),
			// Absent means "no right": the screen may only offer an update the server confirmed.
			canModerate: rawCollection.canModerate === true
		};
	}
	function normalizeStartResponse(rawResponse) {
		if (!main_core.Type.isPlainObject(rawResponse)) {
			throw new TypeError('Invalid start response');
		}
		const sessionId = toPositiveInt(rawResponse.sessionId);
		if (sessionId === null) {
			throw new TypeError('Invalid start sessionId');
		}
		return {
			sessionId,
			progress: normalizeImportProgress(rawResponse.progress)
		};
	}
	function normalizeGetStatusResponse(rawResponse) {
		if (!main_core.Type.isPlainObject(rawResponse)) {
			throw new TypeError('Invalid getStatus response');
		}
		return {
			progress: normalizeImportProgress(rawResponse.progress)
		};
	}
	function normalizeGetConvertedCollectionsResponse(rawResponse) {
		if (!main_core.Type.isPlainObject(rawResponse) || !Array.isArray(rawResponse.collections)) {
			throw new TypeError('Invalid getConvertedCollections response');
		}
		return {
			collections: rawResponse.collections.filter(item => main_core.Type.isPlainObject(item)).map(item => ({
				collectionId: toPositiveInt(item.collectionId) ?? 0,
				name: String(item.name ?? '')
			})).filter(item => item.collectionId > 0)
		};
	}
	function normalizeImportCollection(rawCollection) {
		const defaultCollection = createDefaultImportCollection();
		if (!main_core.Type.isPlainObject(rawCollection)) {
			return defaultCollection;
		}
		return {
			id: String(rawCollection.id ?? defaultCollection.id),
			name: String(rawCollection.name ?? defaultCollection.name)
		};
	}
	function normalizeImportDocumentTreeNode(rawNode) {
		const defaultNode = createDefaultImportTreeNode();
		if (!main_core.Type.isPlainObject(rawNode)) {
			return defaultNode;
		}
		return {
			id: String(rawNode.id ?? defaultNode.id),
			title: String(rawNode.title ?? defaultNode.title),
			parentId: toNullableString(rawNode.parentId),
			children: Array.isArray(rawNode.children) ? rawNode.children.map(child => normalizeImportDocumentTreeNode(child)) : defaultNode.children
		};
	}
	function normalizeImportProgress(rawProgress) {
		if (!main_core.Type.isPlainObject(rawProgress)) {
			throw new TypeError('Invalid import progress');
		}
		const rawStatus = String(rawProgress.status ?? IMPORT_PROGRESS_STATUS.IN_PROGRESS);
		const status = ALLOWED_PROGRESS_STATUS.has(rawStatus) ? rawStatus : IMPORT_PROGRESS_STATUS.IN_PROGRESS;
		return {
			status,
			step: String(rawProgress.step ?? ''),
			total: toNonNegativeInt(rawProgress.total) ?? 0,
			done: toNonNegativeInt(rawProgress.done) ?? 0,
			error: toNonNegativeInt(rawProgress.error) ?? 0,
			totalAttachments: toNonNegativeInt(rawProgress.totalAttachments) ?? 0,
			doneAttachments: toNonNegativeInt(rawProgress.doneAttachments) ?? 0,
			collectionName: String(rawProgress.collectionName ?? ''),
			collectionIndex: toNonNegativeInt(rawProgress.collectionIndex) ?? 0,
			collectionCount: toNonNegativeInt(rawProgress.collectionCount) ?? 0,
			errorMessage: String(rawProgress.errorMessage ?? ''),
			errorDetails: normalizeErrorDetails(rawProgress.errorDetails)
		};
	}
	function normalizeErrorDetails(raw) {
		if (!Array.isArray(raw)) {
			return [];
		}
		return raw.filter(item => main_core.Type.isPlainObject(item)).map(item => ({
			title: String(item.title ?? ''),
			reason: String(item.reason ?? '')
		}));
	}
	function toPositiveInt(value) {
		const parsed = Number(value);
		if (!Number.isInteger(parsed) || parsed <= 0) {
			return null;
		}
		return parsed;
	}
	function toNonNegativeInt(value) {
		const parsed = Number(value);
		if (!Number.isInteger(parsed) || parsed < 0) {
			return null;
		}
		return parsed;
	}
	function toNullableString(value) {
		if (value === null || value === undefined || value === '') {
			return null;
		}
		return String(value);
	}

	class ImportApi {
		#controller;
		constructor(controller = 'note.infrastructure.ImportController') {
			this.#controller = controller;
		}
		async getActiveSession() {
			return this.#call('getActiveSession', {});
		}
		async checkOverlap(payload) {
			const response = await this.#call('checkOverlap', payload);
			return normalizeCheckOverlapResponse(response);
		}
		async checkConnection(payload) {
			const response = await this.#call('checkConnection', payload);
			return normalizeCheckConnectionResponse(response);
		}
		async getCollections(payload) {
			const response = await this.#call('getCollections', payload);
			return normalizeGetCollectionsResponse(response);
		}
		async getDocumentTree(payload) {
			const response = await this.#call('getDocumentTree', payload);
			return normalizeGetDocumentTreeResponse(response);
		}
		async start(payload) {
			const response = await this.#call('start', payload);
			return normalizeStartResponse(response);
		}
		async getStatus(payload) {
			const response = await this.#call('getStatus', payload);
			return normalizeGetStatusResponse(response);
		}
		async cancel(payload) {
			const response = await this.#call('cancel', payload);
			return response === true;
		}
		async acknowledgeFinish(payload) {
			const response = await this.#call('acknowledgeFinish', payload);
			return response === true;
		}
		async getConvertedCollections(payload) {
			const response = await this.#call('getConvertedCollections', payload);
			return normalizeGetConvertedCollectionsResponse(response);
		}
		#call(action, data) {
			return main_core.ajax.runAction(`${this.#controller}.${action}`, {
				data
			}).then(response => response?.data).catch(error => {
				const wrapped = new Error(this.#extractErrorMessage(error));
				const code = this.#extractErrorCode(error);
				if (code !== '') {
					wrapped.code = code;
				}
				throw wrapped;
			});
		}
		#extractErrorMessage(error) {
			if (main_core.Type.isPlainObject(error)) {
				const firstError = error?.errors?.[0]?.message;
				if (main_core.Type.isStringFilled(firstError)) {
					return firstError;
				}
				if (main_core.Type.isStringFilled(error.message)) {
					return error.message;
				}
			}
			return 'Request failed';
		}
		#extractErrorCode(error) {
			if (main_core.Type.isPlainObject(error)) {
				const code = error?.errors?.[0]?.code;
				if (main_core.Type.isStringFilled(code)) {
					return code;
				}
			}
			return '';
		}
	}

	const CARD_SELECTOR = '.note-import-collection';
	const CARD_DISCLOSURE_SELECTOR = ':scope > .note-import-collection-row > .note-import-disclosure';
	const CARD_SUBTREE_SELECTOR = ':scope > .note-import-collection-subtree';
	function renderCollectionCard(collection, state, handlers, options = {}) {
		const hasCheckbox = options.hasCheckbox !== false;
		const isSelected = state.selectedCollectionIds?.has(collection.id) ?? false;
		const isExpanded = state.expandedCollectionIds.has(collection.id);
		const wrapper = main_core.Tag.render`<div class="note-import-collection"></div>`;
		wrapper.dataset.collectionId = collection.id;
		const row = main_core.Tag.render`<div class="note-import-collection-row"></div>`;
		const disclosure = renderDisclosure(isExpanded, collection.name);
		const title = main_core.Tag.render`<div class="note-import-collection-title">${main_core.Text.encode(collection.name)}</div>`;
		if (hasCheckbox) {
			const checkbox = new ui_system_checkbox.Checkbox({
				size: ui_system_checkbox.CheckboxSize.Md,
				checked: isSelected,
				// The base name is a node of its own next to the box and is not tied to the field,
				// so without this the checkbox has no accessible name at all.
				attributes: {
					'aria-label': collection.name
				},
				onChange: () => handlers.onToggleCollectionSelection?.(collection.id)
			});
			row.append(checkbox.render());
		}
		main_core.Event.bind(disclosure, 'click', () => handlers.onToggleCollectionExpanded(collection.id));
		row.append(disclosure, title);

		// The subtree is part of the card whether it is open or not: expanding then only shows the
		// node that is already there, without a re-render that would destroy the button in focus.
		const subtree = main_core.Tag.render`<div class="note-import-collection-subtree"></div>`;
		if (isExpanded) {
			subtree.append(renderTree(state.treeByCollectionId.get(collection.id), collection.id, handlers.onRetryTreeLoad, collection.name, handlers.sourceType ?? ''));
		} else {
			main_core.Dom.style(subtree, 'display', 'none');
		}
		wrapper.append(row, subtree);
		return wrapper;
	}
	function findCollectionCard(root, collectionId) {
		const cards = root?.querySelectorAll(CARD_SELECTOR) ?? [];
		for (const card of cards) {
			if (card.dataset.collectionId === collectionId) {
				return card;
			}
		}
		return null;
	}
	function setCollectionCardExpanded(card, isExpanded) {
		const disclosure = card.querySelector(CARD_DISCLOSURE_SELECTOR);
		if (disclosure) {
			main_core.Dom.attr(disclosure, 'aria-expanded', isExpanded ? 'true' : 'false');
			disclosure.replaceChildren(renderChevronIcon(isExpanded));
		}
		const subtree = card.querySelector(CARD_SUBTREE_SELECTOR);
		if (subtree) {
			main_core.Dom.style(subtree, 'display', isExpanded ? '' : 'none');
		}
	}
	function setCollectionCardTree(card, tree) {
		card.querySelector(CARD_SUBTREE_SELECTOR)?.replaceChildren(tree);
	}
	function renderChevronIcon(isExpanded) {
		return new ui_iconSet_api_core.Icon({
			icon: isExpanded ? ui_iconSet_api_core.Outline.CHEVRON_DOWN_L : ui_iconSet_api_core.Outline.CHEVRON_RIGHT_L,
			size: 20
		}).render();
	}
	function renderDisclosure(isExpanded, name = '') {
		const button = main_core.Tag.render`<button type="button" class="note-import-disclosure"></button>`;
		// The chevron is the only child, so the button has no text to be named by, and the direction
		// of that chevron is the only sign of the state - both have to be spelled out.
		main_core.Dom.attr(button, 'aria-expanded', isExpanded ? 'true' : 'false');
		if (main_core.Type.isStringFilled(name)) {
			main_core.Dom.attr(button, 'aria-label', main_core.Loc.getMessage('NOTE_IMPORT_DISCLOSURE_ARIA', {
				'#NAME#': name
			}));
		}
		button.append(renderChevronIcon(isExpanded));
		return button;
	}
	function renderTreePlaceholder() {
		return main_core.Tag.render`<span class="note-import-disclosure-placeholder"></span>`;
	}

	// The tree shows what the source holds, and the two sources that convert bases of this very portal
	// name those objects differently from Outline: the term follows the source the card belongs to.
	function renderTree(treeState, collectionId, onRetryTreeLoad, collectionName = '', sourceType = '') {
		if (!treeState || treeState.isLoading) {
			const container = main_core.Tag.render`<div class="note-import-tree note-import-tree-loading"></div>`;
			const loading = main_core.Loc.getMessage(importTermMessageCode('NOTE_IMPORT_TREE_LOADING', sourceType));
			container.append(renderBulletLoader(loading));
			return container;
		}
		if (treeState.errorMessage) {
			const container = main_core.Tag.render`<div class="note-import-tree"></div>`;
			container.append(createErrorBlock(treeState.errorMessage, () => onRetryTreeLoad(collectionId), collectionName));
			return container;
		}
		if (treeState.documents.length === 0) {
			const empty = main_core.Loc.getMessage(importTermMessageCode('NOTE_IMPORT_PREVIEW_EMPTY', sourceType));
			return main_core.Tag.render`
			<ul class="note-import-tree">
				<li class="note-import-tree-item">
					<div class="note-import-tree-row">
						${renderTreePlaceholder()}
						<div class="note-import-tree-title note-import-muted">${main_core.Text.encode(empty)}</div>
					</div>
				</li>
			</ul>
		`;
		}
		const list = main_core.Tag.render`<ul class="note-import-tree"></ul>`;
		for (const document of treeState.documents) {
			list.append(renderTreeBranch(document));
		}
		return list;
	}
	function renderTreeBranch(node) {
		const item = main_core.Tag.render`<li class="note-import-tree-item"></li>`;
		const hasChildren = node.children.length > 0;
		const row = main_core.Tag.render`<div class="note-import-tree-row"></div>`;
		const rawTitle = typeof node.title === 'string' ? node.title.trim() : '';
		const untitled = main_core.Loc.getMessage('NOTE_IMPORT_DOCUMENT_UNTITLED');
		const title = rawTitle === '' ? main_core.Tag.render`<div class="note-import-tree-title note-import-muted">${main_core.Text.encode(untitled)}</div>` : main_core.Tag.render`<div class="note-import-tree-title">${main_core.Text.encode(rawTitle)}</div>`;
		if (hasChildren) {
			const disclosure = renderDisclosure(false, rawTitle === '' ? untitled : rawTitle);
			const childrenList = main_core.Tag.render`<ul class="note-import-tree-children"></ul>`;
			main_core.Dom.style(childrenList, 'display', 'none');
			for (const child of node.children) {
				childrenList.append(renderTreeBranch(child));
			}
			let isExpanded = false;
			main_core.Event.bind(disclosure, 'click', () => {
				isExpanded = !isExpanded;
				main_core.Dom.style(childrenList, 'display', isExpanded ? '' : 'none');
				main_core.Dom.attr(disclosure, 'aria-expanded', isExpanded ? 'true' : 'false');
				disclosure.replaceChildren(renderChevronIcon(isExpanded));
			});
			row.append(disclosure, title);
			item.append(row, childrenList);
		} else {
			row.append(renderTreePlaceholder(), title);
			item.append(row);
		}
		return item;
	}
	function renderBulletLoader(label = '') {
		const loader = main_core.Tag.render`
		<div class="ui-loader__bullet">
			<div class="ui-loader__bullet_item"></div>
			<div class="ui-loader__bullet_item"></div>
			<div class="ui-loader__bullet_item"></div>
			<div class="ui-loader__bullet_item"></div>
			<div class="ui-loader__bullet_item"></div>
		</div>
	`;

		// A live region with nothing but dots in it announces nothing, so the role is given only
		// together with the state spelled out for a screen reader.
		if (main_core.Type.isStringFilled(label)) {
			main_core.Dom.attr(loader, 'role', 'status');
			main_core.Dom.attr(loader, 'aria-live', 'polite');
			loader.append(main_core.Tag.render`<visually-hidden>${main_core.Text.encode(label)}</visually-hidden>`);
		}
		return loader;
	}
	function createErrorBlock(message, onRetry, name = '') {
		const container = main_core.Tag.render`<div class="note-import-error-block"></div>`;
		const retryButton = main_core.Tag.render`
		<button type="button" class="note-import-link-button" data-testid="note-import-retry">${main_core.Text.encode(main_core.Loc.getMessage('NOTE_IMPORT_RETRY'))}</button>
	`;
		// Trees of several bases can fail at once, and then the screen holds several retry buttons
		// with the same text: the name says which one repeats what.
		if (main_core.Type.isStringFilled(name)) {
			main_core.Dom.attr(retryButton, 'aria-label', main_core.Loc.getMessage('NOTE_IMPORT_RETRY_ARIA', {
				'#NAME#': name
			}));
		}
		main_core.Event.bind(retryButton, 'click', () => onRetry());
		container.append(
		// The block replaces a loader that had been saying what it was waiting for, and it takes that
		// live region away with it: without a role of its own the refusal would arrive in silence.
		main_core.Tag.render`<div class="note-import-error" role="alert">${main_core.Text.encode(message)}</div>`, retryButton);
		return container;
	}

	function renderCollectionsScreen(state, handlers) {
		const container = main_core.Tag.render`<div class="note-import-screen note-import-screen-collections"></div>`;
		const hint = main_core.Loc.getMessage(importTermMessageCode('NOTE_IMPORT_COLLECTIONS_HINT', handlers.sourceType ?? ''));
		container.append(main_core.Tag.render`
		<div class="note-import-subtitle">${main_core.Text.encode(hint)}</div>
	`);
		if (state.isLoading) {
			container.append(main_core.Tag.render`
			<div class="note-import-screen-loading">${renderBulletLoader(main_core.Loc.getMessage('NOTE_IMPORT_LOADING'))}</div>
		`);
			return container;
		}
		if (state.errorMessage) {
			container.append(createErrorBlock(state.errorMessage, handlers.onRetryCollectionsLoad));
			return container;
		}
		if (state.collections.length === 0) {
			const empty = main_core.Loc.getMessage(importTermMessageCode('NOTE_IMPORT_EMPTY_COLLECTIONS', handlers.sourceType ?? ''));
			container.append(main_core.Tag.render`<div class="note-import-muted">${main_core.Text.encode(empty)}</div>`);
			return container;
		}
		const list = main_core.Tag.render`<div class="note-import-collection-list"></div>`;
		for (const collection of state.collections) {
			list.append(renderCollectionCard(collection, state, handlers, {
				hasCheckbox: true
			}));
		}
		container.append(list);
		return container;
	}

	function createConnectionScreen(handlers, sources) {
		const element = document.createElement('div');
		element.className = 'note-import-screen note-import-screen-connection';
		const vueRoot = document.createElement('div');
		element.append(vueRoot);
		let sourceMenu = null;
		const ConnectionForm = {
			name: 'NoteImportConnectionForm',
			components: {
				BInput: ui_system_input_vue.BInput,
				Alert: ui_system_alert_vue.Alert
			},
			data() {
				return {
					sourceType: '',
					sourceLabel: '',
					url: '',
					token: '',
					sourceError: '',
					urlError: '',
					tokenError: '',
					formError: '',
					isWiki: false,
					isLanding: false,
					noticeDesign: ui_system_alert.AlertDesign.tintedWarning,
					formErrorDesign: ui_system_alert.AlertDesign.tintedAlert,
					labels: {
						source: main_core.Loc.getMessage('NOTE_IMPORT_SOURCE_LABEL'),
						sourcePlaceholder: main_core.Loc.getMessage('NOTE_IMPORT_SOURCE_PLACEHOLDER'),
						url: main_core.Loc.getMessage('NOTE_IMPORT_URL_LABEL'),
						urlPlaceholder: main_core.Loc.getMessage('NOTE_IMPORT_CONNECTION_PLACEHOLDER'),
						token: main_core.Loc.getMessage('NOTE_IMPORT_TOKEN_LABEL'),
						tokenPlaceholder: main_core.Loc.getMessage('NOTE_IMPORT_TOKEN_PLACEHOLDER'),
						wikiNotice: main_core.Loc.getMessage('NOTE_IMPORT_WIKI_LOSS_NOTICE')
					},
					inputSize: ui_system_input_vue.InputSize.Lg,
					inputDesign: ui_system_input_vue.InputDesign.Grey,
					SOURCE_TYPE_LANDING
				};
			},
			methods: {
				handleUrlUpdate(value) {
					this.url = value;
					handlers.onUrlInput(value);
				},
				handleUrlBlur() {
					handlers.onUrlBlur();
				},
				handleTokenUpdate(value) {
					this.token = value;
					handlers.onTokenInput(value);
				},
				handleTokenBlur() {
					handlers.onTokenBlur();
				},
				// The source is picked from a menu hung on the field, and the field is a div whose only
				// focusable child drops focus by design (`clickable` blurs it on focus). Left as it is,
				// the picker answers the mouse alone - and the landing source, which has no other way
				// in, goes with it. Making the field itself the control also legalises the aria the
				// menu stamps on it: aria-haspopup and aria-expanded need a role to sit on.
				makeSourceFieldOperable() {
					const field = this.$refs.sourceInput?.$el;
					if (!field) {
						return;
					}
					field.setAttribute('role', 'button');
					field.setAttribute('tabindex', '0');
					const input = field.querySelector('input');
					if (input) {
						// The box would otherwise be what a tab lands on, only to be blurred onto <body>,
						// and a textbox inside a button is not a control anyone can reach anyway. The
						// field holds the focus and carries the value in its own name instead.
						input.setAttribute('tabindex', '-1');
						input.setAttribute('aria-hidden', 'true');
					}
					this.syncSourceFieldName();
					main_core.Event.bind(field, 'keydown', event => {
						if (event.key !== 'Enter' && event.key !== ' ') {
							return;
						}
						event.preventDefault();
						this.handleSourceClick();
					});
				},
				// The name of the field is the question and the answer to it, because the box that shows
				// the answer is out of the tree.
				syncSourceFieldName() {
					const field = this.$refs.sourceInput?.$el;
					if (!field) {
						return;
					}
					field.setAttribute('aria-label', [this.labels.source, this.sourceLabel].filter(part => part !== '').join(': '));
				},
				handleSourceClick() {
					const enabled = sources.filter(source => source.enabled);
					if (enabled.length === 0) {
						return;
					}
					const bindElement = this.$refs.sourceInput?.$el ?? this.$el;
					const width = bindElement?.offsetWidth ?? 0;
					sourceMenu?.destroy();
					sourceMenu = new ui_system_menu.Menu({
						minWidth: width,
						width,
						designSystemContext: note_ui_themeContext.NoteThemeContext.getDesignSystemContext(),
						className: 'note-import-source-menu',
						items: enabled.map(source => ({
							id: source.id,
							title: source.label,
							isSelected: source.id === this.sourceType,
							onClick: () => {
								handlers.onSourceChange(source.id);
								sourceMenu?.close();
							}
						}))
					});
					sourceMenu.show(bindElement);
				}
			},
			watch: {
				sourceLabel() {
					this.syncSourceFieldName();
				}
			},
			mounted() {
				const bindEnter = refName => {
					const inputEl = this.$refs[refName]?.$el?.querySelector('input');
					if (inputEl) {
						main_core.Event.bind(inputEl, 'keydown', event => {
							if (event.key === 'Enter') {
								handlers.onSubmit();
							}
						});
					}
				};
				bindEnter('urlInput');
				bindEnter('tokenInput');
				this.makeSourceFieldOperable();
			},
			template: `
			<div class="note-import-connection-form">
				<!-- The source answers a submit the user already made, so the message appears long
					 after the screen was built and has to speak for itself when it does. -->
				<Alert v-if="formError" role="alert" :design="formErrorDesign" data-testid="note-import-source-error">
					{{ formError }}
				</Alert>
				<BInput
					ref="sourceInput"
					:modelValue="sourceLabel"
					:label="labels.source"
					:ariaLabel="labels.source"
					:placeholder="labels.sourcePlaceholder"
					:error="sourceError"
					:size="inputSize"
					:design="inputDesign"
					required
					stretched
					clickable
					dropdown
					readonly
					@click="handleSourceClick"
				/>
				<Alert v-if="isWiki" :design="noticeDesign">
					{{ labels.wikiNotice }}
				</Alert>
				<BInput
					v-if="!isWiki && !isLanding"
					ref="urlInput"
					:modelValue="url"
					@update:modelValue="handleUrlUpdate"
					:label="labels.url"
					:ariaLabel="labels.url"
					:placeholder="labels.urlPlaceholder"
					:error="urlError"
					:size="inputSize"
					:design="inputDesign"
					required
					stretched
					type="text"
					@blur="handleUrlBlur"
				/>
				<BInput
					v-if="!isWiki && !isLanding"
					ref="tokenInput"
					:modelValue="token"
					@update:modelValue="handleTokenUpdate"
					:label="labels.token"
					:ariaLabel="labels.token"
					:placeholder="labels.tokenPlaceholder"
					:error="tokenError"
					:size="inputSize"
					:design="inputDesign"
					required
					stretched
					type="password"
					@blur="handleTokenBlur"
				/>
			</div>
		`
		};
		const app = ui_vue3.BitrixVue.createApp(ConnectionForm);
		const vm = app.mount(vueRoot);
		function applyState(state) {
			const sourceType = state.sourceType ?? '';
			const source = sources.find(item => item.id === sourceType);
			vm.sourceType = sourceType;
			vm.sourceLabel = source ? source.label : '';
			vm.isWiki = sourceType === SOURCE_TYPE_WIKI;
			vm.isLanding = sourceType === SOURCE_TYPE_LANDING;
			const nextUrl = String(state.url ?? '');
			if (vm.url !== nextUrl) {
				vm.url = nextUrl;
			}
			const nextToken = String(state.token ?? '');
			if (vm.token !== nextToken) {
				vm.token = nextToken;
			}
			syncErrors(state);
		}
		function syncErrors(state) {
			const errors = state.errors ?? {
				sourceType: '',
				url: '',
				token: ''
			};
			const touched = state.touched ?? {
				sourceType: false,
				url: false,
				token: false
			};
			vm.sourceError = touched.sourceType ? errors.sourceType ?? '' : '';
			vm.urlError = touched.url ? errors.url ?? '' : '';
			vm.tokenError = touched.token ? errors.token ?? '' : '';
			// A source-level error is not tied to a field, so no `touched` gate applies: it is a
			// server answer to a submit the user already made.
			vm.formError = String(state.errorMessage ?? '');
		}
		function focusField(field) {
			const refName = field === 'url' ? 'urlInput' : field === 'token' ? 'tokenInput' : null;
			if (refName) {
				vm.$refs[refName]?.focus?.();
				return;
			}
			if (field === 'sourceType') {
				vm.handleSourceClick();
			}
		}
		function destroy() {
			sourceMenu?.destroy();
			sourceMenu = null;
			app.unmount();
		}
		return {
			element,
			applyState,
			syncErrors,
			focusField,
			destroy
		};
	}

	function renderOverwriteConfirmScreen(state, handlers) {
		const container = main_core.Tag.render`<div class="note-import-screen note-import-screen-overwrite-confirm"></div>`;
		const warning = importTermMessage('NOTE_IMPORT_OVERWRITE_WARNING', handlers.sourceType ?? '', state.collections.length);
		container.append(main_core.Tag.render`<div class="note-import-overwrite-message">${main_core.Text.encode(warning)}</div>`);
		const list = main_core.Tag.render`<div class="note-import-collection-list"></div>`;
		for (const collection of state.collections) {
			list.append(renderCollectionCard(collection, state, handlers, {
				hasCheckbox: false
			}));
		}
		container.append(list);
		return container;
	}

	function renderPermissionsListScreen(state, handlers) {
		const container = main_core.Tag.render`<div class="note-import-screen note-import-screen-permissions-list"></div>`;
		const title = main_core.Loc.getMessagePlural('NOTE_IMPORT_PERMISSIONS_LIST_TITLE', state.collections.length);
		container.append(main_core.Tag.render`<div class="note-import-subtitle">${main_core.Text.encode(title)}</div>`);
		if (state.isLoading) {
			container.append(main_core.Tag.render`
			<div class="note-import-screen-loading">${renderBulletLoader(main_core.Loc.getMessage('NOTE_IMPORT_LOADING'))}</div>
		`);
			return container;
		}
		if (state.errorMessage) {
			container.append(createErrorBlock(state.errorMessage, handlers.onRetry));
			return container;
		}
		if (state.collections.length === 0) {
			const empty = main_core.Loc.getMessage('NOTE_IMPORT_PERMISSIONS_LIST_EMPTY');
			container.append(main_core.Tag.render`<div class="note-import-limitations-empty">${main_core.Text.encode(empty)}</div>`);
			return container;
		}
		const list = main_core.Tag.render`<div class="note-import-permissions-list"></div>`;
		for (const collection of state.collections) {
			list.append(renderCollectionRow(collection, handlers.onOpenPermissions));
		}
		container.append(list);
		return container;
	}
	function renderCollectionRow(collection, onOpenPermissions) {
		// The name is cut off by the width of the row, so the full one is left readable on hover, and
		// the button, whose text repeats in every row, is told apart by the base it opens.
		const row = main_core.Tag.render`
		<div class="note-import-permissions-list-row">
			<div class="note-import-permissions-list-title" title="${main_core.Text.encode(collection.name)}">
				${main_core.Text.encode(collection.name)}
			</div>
			<button type="button" class="note-import-link-button">
				${main_core.Text.encode(main_core.Loc.getMessage('NOTE_IMPORT_PERMISSIONS_LIST_OPEN'))}
			</button>
		</div>
	`;
		const button = row.querySelector('button');
		if (button) {
			main_core.Dom.attr(button, 'aria-label', main_core.Loc.getMessage('NOTE_IMPORT_PERMISSIONS_LIST_OPEN_ARIA', {
				'#NAME#': collection.name
			}));
			main_core.Event.bind(button, 'click', () => onOpenPermissions(collection));
		}
		return row;
	}

	const STATUS_TO_MASCOT = {
		preparing: 'working',
		documents: 'working',
		attachments: 'working',
		done_ok: 'done',
		done_error: 'error',
		cancelled: 'error',
		error: 'error'
	};
	// The screen outlives the poll that feeds it: a tick brings new numbers for the run, not a new
	// screen, so the handle moves the nodes it has already built. Building them again would restart
	// the bar and drop whatever the user has in focus - every five seconds, for the whole import.
	function createProgressScreen() {
		const title = main_core.Tag.render`<div class="note-import-progress__title"></div>`;
		const barWrapper = main_core.Tag.render`<div class="note-import-progress__bar"></div>`;
		const mascot = main_core.Tag.render`<div class="note-import-progress__mascot"></div>`;
		let summary = main_core.Tag.render`<div class="note-import-progress__summary"></div>`;
		const element = main_core.Tag.render`
		<div class="note-import-screen note-import-screen-progress">
			${title}
			${barWrapper}
			<div class="note-import-progress__body">${summary}${mascot}</div>
		</div>
	`;
		let bar = null;
		let counter = null;
		let isIndeterminate = false;
		const removeBar = () => {
			bar?.destroy();
			bar = null;
			main_core.Dom.remove(counter);
			counter = null;
		};
		const applyCounter = (value, maxValue, indeterminate) => {
			if (indeterminate) {
				main_core.Dom.remove(counter);
				counter = null;
				return;
			}
			if (counter === null) {
				counter = main_core.Tag.render`<div class="note-import-progress__counter"></div>`;
				barWrapper.append(counter);
			}
			counter.textContent = `${Math.round(value)} / ${Math.round(maxValue)}`;
		};
		const applyBar = (state, status) => {
			if (status === 'error') {
				// no bar for system-level error
				removeBar();
				return;
			}
			const {
				value,
				maxValue,
				indeterminate
			} = resolveBarValues(state.progress, status);
			// The looping animation is wired into the bar node when the bar is built, so only a phase
			// that switches that loop on or off gets a new bar. Within one phase the bar it already
			// has moves to the new value.
			if (bar === null || indeterminate !== isIndeterminate) {
				removeBar();
				bar = new ui_progressbar.ProgressBar({
					value,
					maxValue,
					size: ui_progressbar.ProgressBar.Size.LARGE,
					color: ui_progressbar.ProgressBar.Color.PRIMARY,
					statusType: ui_progressbar.ProgressBar.Status.NONE,
					infiniteLoading: indeterminate
				});
				isIndeterminate = indeterminate;
				bar.renderTo(barWrapper);
			} else {
				bar.setMaxValue(maxValue);
				bar.update(value);
			}
			applyCounter(value, maxValue, indeterminate);
		};
		const applySummary = (state, status, sourceType, convertedCollections) => {
			const next = renderSummary(state, status, sourceType, convertedCollections);
			if (next.innerHTML === summary.innerHTML) {
				return;
			}
			summary.replaceWith(next);
			summary = next;
		};
		return {
			element,
			applyState: (state, sourceType = '', convertedCollections = []) => {
				const status = resolveProgressScreenStatus(state);
				title.textContent = resolveTitleText(status, sourceType);
				setVariant(title, 'note-import-progress__title', resolveTitleVariant(status));
				applyBar(state, status);
				applySummary(state, status, sourceType, convertedCollections);
				setVariant(mascot, 'note-import-progress__mascot', STATUS_TO_MASCOT[status] ?? 'working');
			}
		};
	}

	// What the run says to a screen reader: the phase or the outcome it is in, and, once it has
	// finished or stopped, the numbers and the reason shown with it. The dialog announces this through
	// the live region of ui.a11y, which lives outside everything the poll rebuilds.
	function resolveProgressAnnouncement(state, sourceType = '', convertedCollections = []) {
		const status = resolveProgressScreenStatus(state);
		const summary = renderSummary(state, status, sourceType, convertedCollections);
		// Line by line, not as one run of text: the lines of the summary are separate nodes with nothing
		// between them, and read together they run into each other ("Импортировано: 28Не удалось
		// импортировать: 0"). A part that already ends a sentence keeps its own ending.
		const lines = [...summary.children].map(line => line.textContent ?? '');
		return [resolveTitleText(status, sourceType), ...lines].map(part => part.replaceAll(/\s+/g, ' ').trim()).filter(part => part !== '').reduce((text, part) => text === '' ? part : `${text}${/[.!?…]$/.test(text) ? ' ' : '. '}${part}`, '');
	}
	function resolveTitleVariant(status) {
		switch (status) {
			case 'done_ok':
				return 'success';
			case 'done_error':
			case 'cancelled':
			case 'error':
				return 'alert';
			default:
				return 'muted';
		}
	}
	function setVariant(node, blockClass, variant) {
		for (const name of [...node.classList]) {
			if (name.startsWith(`${blockClass}--`)) {
				main_core.Dom.removeClass(node, name);
			}
		}
		main_core.Dom.addClass(node, `${blockClass}--${variant}`);
	}
	function resolveTitleText(status, sourceType = '') {
		return main_core.Loc.getMessage(importTermMessageCode(resolveTitleKey(status), sourceType));
	}
	function resolveTitleKey(status) {
		switch (status) {
			case 'documents':
				return 'NOTE_IMPORT_PROGRESS_TITLE_DOCUMENTS';
			case 'attachments':
				return 'NOTE_IMPORT_PROGRESS_TITLE_ATTACHMENTS';
			case 'done_ok':
				return 'NOTE_IMPORT_PROGRESS_TITLE_DONE_OK';
			case 'done_error':
				return 'NOTE_IMPORT_PROGRESS_TITLE_DONE_ERROR';
			case 'cancelled':
				return 'NOTE_IMPORT_PROGRESS_TITLE_CANCELLED';
			case 'error':
				return 'NOTE_IMPORT_PROGRESS_TITLE_ERROR';
			case 'preparing':
			default:
				return 'NOTE_IMPORT_PROGRESS_TITLE_PREPARING';
		}
	}
	function resolveBarValues(progress, status) {
		if (status === 'preparing' || !progress) {
			return {
				value: 0,
				maxValue: 100,
				indeterminate: true
			};
		}
		if (status === 'attachments') {
			const total = Math.max(0, progress.totalAttachments ?? 0);
			const done = Math.max(0, progress.doneAttachments ?? 0);
			if (total <= 0) {
				return {
					value: 0,
					maxValue: 100,
					indeterminate: true
				};
			}
			return {
				value: Math.min(done, total),
				maxValue: total,
				indeterminate: false
			};
		}
		if (status === 'documents') {
			const total = Math.max(0, progress.total ?? 0);
			const done = Math.max(0, progress.done ?? 0);
			if (total <= 0) {
				return {
					value: 0,
					maxValue: 100,
					indeterminate: true
				};
			}
			return {
				value: Math.min(done, total),
				maxValue: total,
				indeterminate: false
			};
		}

		// done_ok / done_error / cancelled — backend reports global counts on finish,
		// but `progress.total` stays at the last collection's totalItems (not a global sum).
		// Reconstruct a sensible denominator from done + error.
		const done = Math.max(0, progress.done ?? 0);
		const error = Math.max(0, progress.error ?? 0);
		const total = done + error;
		if (total <= 0) {
			return {
				value: 1,
				maxValue: 1,
				indeterminate: false
			};
		}
		return {
			value: Math.min(done, total),
			maxValue: total,
			indeterminate: false
		};
	}
	function renderSummary(state, status, sourceType = '', convertedCollections = []) {
		const container = main_core.Tag.render`<div class="note-import-progress__summary"></div>`;
		const progress = state.progress;
		if (status === 'error') {
			// A failed status request and a stop reported by the server are different things and must
			// not stand in for each other: the request failure keeps its own text, while the reason
			// the server gives (API-03) comes with the counters of the run that stopped. An empty
			// reason draws no block - the screen then reads exactly as it did before.
			const stopReason = state.errorMessage === '' ? String(progress?.errorMessage ?? '') : '';
			if (stopReason === '') {
				container.append(renderAlertLine(state.errorMessage || main_core.Loc.getMessage('NOTE_IMPORT_STATUS_ERROR')));
				return container;
			}
			container.append(renderAlertLine(stopReason, 'note-import-error-reason'));
			appendImportCounters(container, progress, true);
			return container;
		}
		if (status === 'cancelled') {
			if (convertedCollections.length === 0) {
				return container;
			}
			const keptNotice = main_core.Loc.getMessagePlural('NOTE_IMPORT_CANCELLED_KEPT_NOTICE', convertedCollections.length);
			container.append(main_core.Tag.render`
			<div class="note-import-progress__summary-line" data-testid="note-import-cancelled-kept">
				${main_core.Text.encode(keptNotice)}
			</div>
		`);
			for (const collection of convertedCollections) {
				container.append(main_core.Tag.render`
				<div
					class="note-import-progress__summary-line note-import-progress__summary-line--muted"
					data-testid="note-import-cancelled-kept-item"
				>
					${main_core.Text.encode(collection.name)}
				</div>
			`);
			}
			return container;
		}
		if (status === 'done_ok' || status === 'done_error') {
			appendImportCounters(container, progress, status === 'done_error');
			return container;
		}

		// active phases (preparing, documents, attachments) — show current collection caption
		const caption = resolveCollectionCaption(progress, sourceType);
		if (caption !== '') {
			container.append(main_core.Tag.render`
			<div class="note-import-progress__summary-line note-import-progress__summary-line--muted">
				${main_core.Text.encode(caption)}
			</div>
		`);
		}
		return container;
	}
	function renderAlertLine(text, testId = '') {
		// A run that stopped is drawn only once the poll has already reported it, so the line appears
		// long after the screen was built - it has to speak for itself when it does.
		const line = main_core.Tag.render`
		<div class="note-import-progress__summary-line note-import-progress__summary-line--alert" role="alert">
			${main_core.Text.encode(text)}
		</div>
	`;
		if (testId !== '') {
			line.dataset.testid = testId;
		}
		return line;
	}
	function appendImportCounters(container, progress, isAlert) {
		const importedClass = isAlert ? 'note-import-progress__summary-line--alert' : '';
		const importedText = main_core.Loc.getMessage('NOTE_IMPORT_IMPORTED_COUNT').replace('#COUNT#', String(progress?.done ?? 0));
		container.append(main_core.Tag.render`
		<div class="note-import-progress__summary-line ${importedClass}">${main_core.Text.encode(importedText)}</div>
	`);
		const errorCount = progress?.error ?? 0;
		const errorClass = isAlert ? 'note-import-progress__summary-line--alert' : 'note-import-progress__summary-line--muted';
		const errorText = main_core.Loc.getMessage('NOTE_IMPORT_ERROR_COUNT').replace('#COUNT#', String(errorCount));
		container.append(main_core.Tag.render`
		<div class="note-import-progress__summary-line ${errorClass}">${main_core.Text.encode(errorText)}</div>
	`);
		const details = progress?.errorDetails ?? [];
		if (details.length > 0) {
			container.append(renderErrorDetails(details, errorCount));
		}
	}
	function resolveCollectionCaption(progress, sourceType = '') {
		if (!progress || !progress.collectionName) {
			return '';
		}
		const name = progress.collectionName;
		const count = progress.collectionCount ?? 0;
		if (count > 1) {
			return main_core.Loc.getMessage(importTermMessageCode('NOTE_IMPORT_COLLECTION_PROGRESS_LABEL', sourceType)).replace('#NAME#', name).replace('#INDEX#', String((progress.collectionIndex ?? 0) + 1)).replace('#COUNT#', String(count));
		}
		return name;
	}
	function renderErrorDetails(details, totalErrors) {
		const container = main_core.Tag.render`<div class="note-import-progress__errors"></div>`;
		for (const detail of details) {
			const title = main_core.Text.encode(detail.title);
			const reason = main_core.Text.encode(detail.reason);
			container.append(main_core.Tag.render`
			<div class="note-import-progress__errors-item">
				<span class="note-import-progress__errors-title">${title}</span>
				<span class="note-import-progress__errors-reason">${reason}</span>
			</div>
		`);
		}
		if (totalErrors > details.length) {
			const more = main_core.Loc.getMessage('NOTE_IMPORT_ERROR_DETAILS_MORE').replace('#COUNT#', String(totalErrors - details.length));
			container.append(main_core.Tag.render`
			<div class="note-import-progress__errors-more">${main_core.Text.encode(more)}</div>
		`);
		}
		return container;
	}

	const ACTION_GROUP = 'note-import-reimport-action';
	const ACTION_OPTIONS = [{
		action: REIMPORT_ACTION.UPDATE,
		testId: 'note-import-reimport-update',
		titleCode: 'NOTE_IMPORT_REIMPORT_ACTION_UPDATE',
		captionCode: 'NOTE_IMPORT_REIMPORT_ACTION_UPDATE_HINT'
	}, {
		action: REIMPORT_ACTION.CREATE,
		testId: 'note-import-reimport-create',
		titleCode: 'NOTE_IMPORT_REIMPORT_ACTION_CREATE',
		captionCode: 'NOTE_IMPORT_REIMPORT_ACTION_CREATE_HINT'
	}];
	function renderReimportChoiceScreen(state, handlers) {
		const container = main_core.Tag.render`<div class="note-import-screen note-import-screen-reimport-choice"></div>`;
		const canUpdate = canUpdateExistingCollections(state.collections);
		const count = state.collections.length;
		container.append(renderAlert(main_core.Loc.getMessagePlural('NOTE_IMPORT_REIMPORT_NOTICE', count), ui_system_alert.AlertDesign.tintedWarning, 'note-import-reimport-notice'));
		const list = main_core.Tag.render`<div class="note-import-collection-list"></div>`;
		for (const collection of state.collections) {
			list.append(renderCollectionCard({
				id: collection.externalId,
				name: collection.name
			}, state, handlers, {
				hasCheckbox: false
			}));
		}
		container.append(list);

		// The options answer one question, and a screen reader has no other way to learn which one.
		const options = main_core.Tag.render`<div class="note-import-reimport-option-list" role="radiogroup"></div>`;
		main_core.Dom.attr(options, 'aria-label', main_core.Loc.getMessage('NOTE_IMPORT_REIMPORT_GROUP_ARIA'));
		const radios = new Map();
		for (const option of ACTION_OPTIONS) {
			if (option.action === REIMPORT_ACTION.UPDATE && !canUpdate) {
				continue;
			}
			options.append(renderOption(option, state.action, count, radios, handlers.onActionChange));
		}
		container.append(options);
		if (!canUpdate) {
			container.append(renderAlert(main_core.Loc.getMessagePlural('NOTE_IMPORT_REIMPORT_NO_MODERATE', count), ui_system_alert.AlertDesign.tintedWarning, 'note-import-reimport-forbidden'));
		}
		if (state.errorMessage !== '') {
			container.append(renderAlert(state.errorMessage, ui_system_alert.AlertDesign.tintedAlert, 'note-import-reimport-error'));
		}
		return container;
	}
	function renderOption(option, currentAction, count, radios, onActionChange) {
		const inputId = `${ACTION_GROUP}-${option.action}`;
		const hintId = `${inputId}-hint`;
		const radio = new ui_system_radiobutton.RadioButton({
			group: ACTION_GROUP,
			size: ui_system_radiobutton.RadioButtonSize.Md,
			checked: option.action === currentAction,
			attributes: {
				id: inputId,
				// The hint describes the option, it is not part of its name: inside the label it would
				// be read as one long name of the radio instead of the consequence it explains.
				'aria-describedby': hintId,
				'data-testid': option.testId
			},
			onChange: () => {
				// A native group of radios sends `change` to the newly picked input only, and each
				// radio draws its own mark, so the one left behind is unmarked by hand: the screen is
				// deliberately not redrawn on a pick, and `setChecked` leaves focus where it stands.
				radios.forEach((item, action) => item.setChecked(action === option.action));
				onActionChange(option.action);
			}
		});
		radios.set(option.action, radio);
		const row = main_core.Tag.render`
		<div class="note-import-reimport-option">
			<div class="note-import-reimport-option__text">
				<label class="note-import-reimport-option__title" for="${inputId}">
					${main_core.Text.encode(main_core.Loc.getMessagePlural(option.titleCode, count))}
				</label>
				<div class="note-import-subtitle" id="${hintId}">
					${main_core.Text.encode(main_core.Loc.getMessagePlural(option.captionCode, count))}
				</div>
			</div>
		</div>
	`;
		row.prepend(radio.render());
		return row;
	}
	function renderAlert(text, design, testId) {
		const alert = new ui_system_alert.Alert({
			design,
			content: text
		}).render();
		alert.dataset.testid = testId;
		return alert;
	}

	class ImportDialog {
		#dialog;
		#api;
		#screen;
		#sourceType;
		#sourceUrl;
		#sourceToken;
		#sessionId;
		#instanceName;
		#connectionForm;
		#connectionScreen;
		#connectionConnectButton;
		#startButton;
		#startScreenButtons;
		#doneButtons;
		#cancelButton;
		#collectionsState;
		#overwriteState;
		#reimportState;
		#startOriginScreen;
		#isStarting;
		#progressState;
		#progressScreen;
		#permissionsListState;
		#destroyed;
		#requestId;
		#onComplete;
		#availableSources;
		#screenNode;
		#buttonsSignature;
		#appliedTitle;
		#announcedProgress;
		constructor(options = {}) {
			this.#dialog = null;
			this.#api = new ImportApi();
			this.#screen = IMPORT_SCREEN.LOADING;
			this.#sourceType = SOURCE_TYPE_OUTLINE;
			this.#sourceUrl = '';
			this.#sourceToken = '';
			this.#sessionId = null;
			this.#instanceName = '';
			this.#connectionForm = createDefaultConnectionFormState();
			this.#connectionScreen = null;
			this.#connectionConnectButton = null;
			this.#startButton = null;
			this.#startScreenButtons = [];
			this.#doneButtons = [];
			this.#cancelButton = null;
			this.#sourceType = this.#connectionForm.sourceType ?? SOURCE_TYPE_OUTLINE;
			this.#collectionsState = createDefaultCollectionsScreenState();
			this.#overwriteState = createDefaultOverwriteState();
			this.#reimportState = createDefaultReimportChoiceState();
			// No run has been started here yet, and a run resumed from a previous visit was started
			// elsewhere: the screen it came from - and with it the decision that screen carried - is
			// unknown until this dialog starts a run of its own. {@see resolveRetryRoute}
			this.#startOriginScreen = null;
			this.#isStarting = false;
			this.#progressState = createDefaultProgressScreenState();
			this.#progressScreen = null;
			this.#permissionsListState = createDefaultPermissionsListState();
			this.#destroyed = false;
			this.#requestId = 0;
			this.#onComplete = main_core.Type.isFunction(options.onComplete) ? options.onComplete : null;
			this.#screenNode = null;
			this.#buttonsSignature = '';
			this.#appliedTitle = '';
			this.#announcedProgress = '';
			this.#availableSources = resolveAvailableSources(options);
		}
		show() {
			if (this.#dialog) {
				this.#dialog.show();
				this.#resumeIfNeeded();
				return;
			}
			this.#destroyed = false;
			const content = this.#resolveContent();
			this.#appliedTitle = this.#resolveTitle();
			this.#dialog = new ui_system_dialog.Dialog({
				title: this.#appliedTitle,
				content,
				centerButtons: this.#createButtons(),
				width: 700,
				hasOverlay: true,
				closeByEsc: true,
				closeByClickOutside: true,
				events: {
					onHide: () => {
						this.#destroyed = true;
						this.#dialog = null;
						this.#screenNode = null;
						this.#progressScreen = null;
						this.#buttonsSignature = '';
						this.#appliedTitle = '';
						this.#destroyConnectionScreen();
					}
				}
			});
			note_ui_themeContext.NoteThemeContext.themeDialog(this.#dialog, content, {
				extraClass: 'note-import-dialog'
			});
			this.#dialog.show();
			this.#checkActiveSession();
		}
		async #onConnect() {
			this.#touchAllConnectionFields();
			this.#validateAllConnectionFields();
			if (!this.#canSubmitConnection()) {
				this.#render();
				this.#focusFirstInvalidConnectionField();
				return;
			}
			const sourceType = this.#currentSourceType();
			if (sourceType === SOURCE_TYPE_LANDING) {
				await this.#connectLanding();
				return;
			}
			this.#connectionForm.isSubmitting = true;
			this.#connectionForm.errorMessage = '';
			this.#render();
			try {
				const url = String(this.#connectionForm.url || '').trim();
				const token = String(this.#connectionForm.token || '').trim();
				const response = await this.#api.checkConnection(buildCheckConnectionPayload(sourceType, url, token));
				if (this.#destroyed) {
					return;
				}
				this.#sourceType = sourceType;
				this.#sourceUrl = url;
				this.#sourceToken = token;
				this.#instanceName = response.instanceName || url;
				this.#screen = IMPORT_SCREEN.COLLECTIONS;
				this.#collectionsState = createDefaultCollectionsScreenState();
				this.#destroyConnectionScreen();
				await this.#loadCollections();
			} catch (error) {
				this.#applyConnectionError(sourceType, error);
			} finally {
				this.#connectionForm.isSubmitting = false;
				this.#render();
			}
		}
		async #connectLanding() {
			this.#connectionForm.isSubmitting = true;
			this.#connectionForm.errorMessage = '';
			this.#render();
			try {
				// Landing has no remote instance to name, but it does have a source check: it is the
				// only place that tells "the landing module is off" from "you have no bases to convert".
				await this.#api.checkConnection(buildCheckConnectionPayload(SOURCE_TYPE_LANDING, '', ''));
				if (this.#destroyed) {
					return;
				}
				this.#sourceType = SOURCE_TYPE_LANDING;
				this.#sourceUrl = '';
				this.#sourceToken = '';
				this.#instanceName = main_core.Loc.getMessage('NOTE_IMPORT_SOURCE_LANDING');
				this.#collectionsState = createDefaultCollectionsScreenState();
				this.#screen = IMPORT_SCREEN.COLLECTIONS;
				this.#destroyConnectionScreen();
				await this.#loadCollections();
			} catch (error) {
				this.#applyConnectionError(SOURCE_TYPE_LANDING, error);
			} finally {
				this.#connectionForm.isSubmitting = false;
				this.#render();
			}
		}
		#applyConnectionError(sourceType, error) {
			const {
				field,
				message
			} = resolveConnectionError(sourceType, error);
			if (field === null) {
				this.#connectionForm.errorMessage = message;
				return;
			}
			this.#connectionForm.errors[field] = message;
			this.#connectionForm.touched[field] = true;
		}
		#validateConnectionField(field) {
			const errors = this.#connectionForm.errors;
			if (field === 'sourceType') {
				const value = String(this.#connectionForm.sourceType || '').trim();
				errors.sourceType = value === '' ? main_core.Loc.getMessage('NOTE_IMPORT_SOURCE_REQUIRED') : '';
				return;
			}
			if (field === 'url') {
				// Wiki reads local bases — no URL/token needed.
				if (this.#isWikiSource()) {
					errors.url = '';
					return;
				}
				const value = String(this.#connectionForm.url || '').trim();
				if (value === '') {
					errors.url = main_core.Loc.getMessage('NOTE_IMPORT_URL_REQUIRED');
					return;
				}
				if (!/^https?:\/\//i.test(value)) {
					errors.url = main_core.Loc.getMessage('NOTE_IMPORT_URL_INVALID');
					return;
				}
				errors.url = '';
				return;
			}
			if (field === 'token') {
				if (this.#isWikiSource()) {
					errors.token = '';
					return;
				}
				const value = String(this.#connectionForm.token || '').trim();
				errors.token = value === '' ? main_core.Loc.getMessage('NOTE_IMPORT_TOKEN_REQUIRED') : '';
			}
		}

		// The source the dialog is dealing with. The form holds it while the user is still picking, and
		// what the form holds is what a source check, a resumed session and every screen after them carry
		// into #sourceType - so the form is asked first and #sourceType answers for the screens that have
		// no form of their own.
		#currentSourceType() {
			return String(this.#connectionForm.sourceType || this.#sourceType || '').trim();
		}
		#isWikiSource() {
			return this.#currentSourceType() === SOURCE_TYPE_WIKI;
		}
		#validateAllConnectionFields() {
			this.#validateConnectionField('sourceType');
			if (this.#currentSourceType() === SOURCE_TYPE_LANDING) {
				// URL/Token are irrelevant for landing - clear any stale errors so that
				// canSubmit() doesn't trip on them.
				this.#connectionForm.errors.url = '';
				this.#connectionForm.errors.token = '';
				return;
			}
			this.#validateConnectionField('url');
			this.#validateConnectionField('token');
		}
		#touchAllConnectionFields() {
			this.#connectionForm.touched.sourceType = true;
			if (this.#currentSourceType() === SOURCE_TYPE_LANDING) {
				return;
			}
			this.#connectionForm.touched.url = true;
			this.#connectionForm.touched.token = true;
		}
		#hasConnectionErrors() {
			const {
				errors
			} = this.#connectionForm;
			return Boolean(errors.sourceType || errors.url || errors.token);
		}
		#onConnectionFieldInput(field, value) {
			if (field === 'sourceType') {
				this.#connectionForm.sourceType = value;
				this.#connectionForm.touched.sourceType = true;
				// A source-level error belongs to the source that produced it.
				this.#connectionForm.errorMessage = '';
				this.#validateConnectionField('sourceType');
				// Source change comes from menu, not from input — full sync is safe.
				this.#connectionScreen?.applyState(this.#connectionForm);
				// The title names the source the dialog is dealing with, and that is now another one, so
				// a title left as it was would stand over a form asking about a different source. Setting
				// it rebuilds the window, hence only on a title that really differs: sources sharing the
				// plain title change nothing here.
				this.#applyTitle();
				this.#renderButtons();
				return;
			}
			if (field === 'url') {
				this.#connectionForm.url = value;
				// Drop server error stuck to URL field as soon as user edits the URL itself.
				// Re-validation below will repopulate it if the new value is still invalid.
				this.#connectionForm.errors.url = '';
			} else if (field === 'token') {
				this.#connectionForm.token = value;
				// Same idea for the token field — drop a server-side 401/403 hint on the next keystroke.
				this.#connectionForm.errors.token = '';
			}
			if (this.#connectionForm.touched[field]) {
				this.#validateConnectionField(field);
			}

			// Don't re-apply value back to Vue while user is typing — only sync errors.
			// Also avoid full setCenterButtons re-render: it rebuilds popup content
			// and detaches the focused input. Update button disabled state in place.
			this.#connectionScreen?.syncErrors(this.#connectionForm);
			this.#refreshConnectButtonState();
		}
		#onConnectionFieldBlur(field) {
			this.#connectionForm.touched[field] = true;
			this.#validateConnectionField(field);
			this.#connectionScreen?.syncErrors(this.#connectionForm);
			this.#refreshConnectButtonState();
		}
		#destroyConnectionScreen() {
			this.#connectionScreen?.destroy();
			this.#connectionScreen = null;
			this.#connectionConnectButton = null;
		}
		#refreshConnectButtonState() {
			this.#connectionConnectButton?.setDisabled(!this.#canSubmitConnection());
		}

		// What the screen asking for a run carries in place. Waiting for the answer belongs to the whole
		// screen and not to the button that asked: while the start is on its way, "Назад" and "Готово"
		// next to it would take the user off the screen, and the answer would then put them onto the
		// progress of a run they have already walked away from. "Готово" waits for that same reason and
		// for one more of its own, so it is held by {@see canFinishImport} instead.
		#syncStartScreenButtons() {
			this.#startButton?.setDisabled(!this.#canStartImport());
			for (const button of this.#startScreenButtons) {
				button.setDisabled(this.#isStarting);
			}
		}

		// What the button finishing the dialog carries in place: the list of converted bases decides what
		// finishing does, and that list is read while the summary holding the button is already on screen.
		#syncDoneButtons() {
			for (const button of this.#doneButtons) {
				button.setDisabled(!this.#canFinishImport());
			}
		}
		#refreshCancelButtonState() {
			this.#cancelButton?.setDisabled(this.#progressState.isCancelling);
		}
		#canStartImport() {
			return canStartImport(this.#screen, this.#isStarting, this.#collectionsState);
		}
		#canFinishImport() {
			return canFinishImport(this.#isStarting, this.#permissionsListState);
		}
		#focusFirstInvalidConnectionField() {
			const order = ['sourceType', 'url', 'token'];
			const errors = this.#connectionForm.errors;
			const firstInvalid = order.find(field => errors[field]);
			if (!firstInvalid) {
				return;
			}
			this.#connectionScreen?.focusField(firstInvalid);
		}
		async #loadCollections() {
			const previousPicks = this.#collectionsState.selectedCollectionIds;
			this.#collectionsState.isLoading = true;
			this.#collectionsState.errorMessage = '';
			// Nothing stays ticked over a spinner: the list is being asked for anew and may not come back
			// at all, and a run started over bases the user cannot see is not what a button above a loading
			// list does. What the list does bring back decides which of the picks come with it -
			// {@see resolveCollectionPicks}; a list that does not come back gives them back untouched.
			this.#collectionsState.selectedCollectionIds = new Set();
			this.#render();
			try {
				const response = await this.#api.getCollections(buildGetCollectionsPayload(this.#sourceType, this.#sourceUrl, this.#sourceToken));
				this.#collectionsState.collections = response.collections;
				this.#collectionsState.selectedCollectionIds = resolveCollectionPicks(previousPicks, response.collections);
			} catch (error) {
				this.#collectionsState.errorMessage = String(error?.message || main_core.Loc.getMessage(importTermMessageCode('NOTE_IMPORT_COLLECTIONS_LOAD_ERROR', this.#sourceType)));
				// The picks the screen had are given back with the failure: a list that never arrived says
				// nothing about them, and dropping them would leave the next try to tick every base of the
				// portal - while the picks of the way back from a stopped run are the only thing that says
				// what the user was converting.
				this.#collectionsState.selectedCollectionIds = previousPicks;
			} finally {
				this.#collectionsState.isLoading = false;
				this.#render();
			}
		}

		// The list of bases, entered from a screen standing on top of it. A run restored from a previous
		// visit reaches those screens without the list ever having been asked for, and an empty list
		// there would read as "the source has no base to convert".
		#showCollectionsScreen() {
			this.#screen = IMPORT_SCREEN.COLLECTIONS;
			this.#render();
			if (this.#collectionsState.collections.length === 0 && !this.#collectionsState.isLoading) {
				this.#loadCollections();
			}
		}

		// The base list, the overwrite confirmation and the reimport choice all list bases over their
		// own state, so they share one expansion and one tree cache.
		// Expanding touches that card alone: a full #render() rebuilds the dialog content and destroys
		// the disclosure button the keypress came from, which drops focus on <body> - two bases in a row
		// could not be expanded from the keyboard.
		async #toggleTreeExpanded(state, collectionId) {
			if (state.expandedCollectionIds.has(collectionId)) {
				state.expandedCollectionIds.delete(collectionId);
				this.#applyCardExpanded(state, collectionId, false);
				return;
			}
			state.expandedCollectionIds.add(collectionId);
			this.#applyCardExpanded(state, collectionId, true);
			const treeState = state.treeByCollectionId.get(collectionId);
			if (treeState?.isLoaded || treeState?.isLoading) {
				return;
			}
			await this.#loadTreeInto(state, collectionId);
		}
		async #loadTreeInto(state, collectionId) {
			state.treeByCollectionId.set(collectionId, {
				isLoading: true,
				isLoaded: false,
				errorMessage: '',
				documents: []
			});
			this.#applyCardTree(state, collectionId);
			try {
				const response = await this.#api.getDocumentTree(buildGetDocumentTreePayload(this.#sourceType, this.#sourceUrl, this.#sourceToken, collectionId));
				state.treeByCollectionId.set(collectionId, {
					isLoading: false,
					isLoaded: true,
					errorMessage: '',
					documents: response.documents
				});
			} catch (error) {
				state.treeByCollectionId.set(collectionId, {
					isLoading: false,
					isLoaded: false,
					errorMessage: String(error?.message || main_core.Loc.getMessage(importTermMessageCode('NOTE_IMPORT_TREE_LOAD_ERROR', this.#sourceType))),
					documents: []
				});
			}
			this.#applyCardTree(state, collectionId);
		}
		#applyCardExpanded(state, collectionId, isExpanded) {
			const card = findCollectionCard(this.#screenNode, collectionId);
			if (!card) {
				return;
			}
			setCollectionCardExpanded(card, isExpanded);
			if (isExpanded) {
				this.#applyCardTree(state, collectionId, card);
			}
		}
		#applyCardTree(state, collectionId, knownCard = null) {
			const card = knownCard ?? findCollectionCard(this.#screenNode, collectionId);
			if (!card) {
				return;
			}
			setCollectionCardTree(card, renderTree(state.treeByCollectionId.get(collectionId), collectionId, id => {
				this.#loadTreeInto(state, id);
			}, this.#resolveCollectionName(state, collectionId), this.#sourceType));
		}
		#resolveCollectionName(state, collectionId) {
			const collection = state.collections.find(item => (item.id ?? item.externalId) === collectionId);
			return collection?.name ?? '';
		}
		async #onStartImport() {
			await this.#guardStart(() => this.#checkOverlapAndStart());
		}

		// Every button asking for a run goes through here, so a press is taken once and the button says so
		// until the answer arrives. A second press reaches the server as a second start, comes back refused
		// with "the transfer is already going", and that refusal is answered by leaving for the list of
		// bases - under which the first run keeps going and rebuilds that list every poll tick. The flag is
		// held here and synced onto the buttons of the screen in place, the way the flags of the source
		// check and of the cancel are, so that waiting for an answer never rebuilds the set of buttons.
		async #guardStart(start) {
			if (this.#isStarting) {
				return;
			}
			this.#isStarting = true;
			this.#syncButtonStates();
			try {
				await start();
			} finally {
				this.#isStarting = false;
				this.#syncButtonStates();
			}
		}
		async #checkOverlapAndStart() {
			const collectionIds = [...this.#collectionsState.selectedCollectionIds];
			if (collectionIds.length === 0) {
				return;
			}
			let overlap = null;
			try {
				overlap = await this.#api.checkOverlap(buildCheckOverlapPayload(this.#sourceType, collectionIds));
				if (this.#destroyed) {
					return;
				}
			} catch (error) {
				this.#collectionsState.errorMessage = String(error?.message || main_core.Loc.getMessage('NOTE_IMPORT_START_ERROR'));
				// The check answers a start that was asked for, so its refusal is shown where a refused
				// start is shown - on the list of bases. A repeat asks for it from the progress screen,
				// and a message written for a screen the user is not on would say nothing at all.
				this.#screen = IMPORT_SCREEN.COLLECTIONS;
				this.#render();
				return;
			}
			const nextScreen = resolveOverlapScreen(this.#sourceType, overlap);
			if (nextScreen === IMPORT_SCREEN.REIMPORT_CHOICE) {
				this.#reimportState = this.#buildReimportState(overlap.existingCollections);
				this.#screen = nextScreen;
				this.#render();
				return;
			}
			if (nextScreen === IMPORT_SCREEN.OVERWRITE_CONFIRM) {
				this.#overwriteState = this.#buildOverwriteState(overlap);
				this.#screen = nextScreen;
				this.#render();
				return;
			}
			await this.#runStart(IMPORT_SCREEN.COLLECTIONS);
		}
		#buildOverwriteState(overlap) {
			const state = createDefaultOverwriteState();
			state.collections = overlap.existingCollectionIds.map(id => {
				// The base is named by the list of the source while that list is at hand. A repeat of a
				// run restored from a previous visit reaches this screen without ever having asked for
				// that list, and then the name comes from the answer that found the base: an external id
				// tells the user nothing about what is about to be overwritten.
				const listed = this.#collectionsState.collections.find(collection => collection.id === id);
				const matched = overlap.existingCollections.find(collection => collection.externalId === id);
				return {
					id,
					name: listed?.name || matched?.name || id
				};
			});
			this.#warmTreeCache(state, overlap.existingCollectionIds);
			return state;
		}
		#buildReimportState(existingCollections) {
			const state = createDefaultReimportChoiceState();
			state.collections = existingCollections;
			this.#warmTreeCache(state, existingCollections.map(collection => collection.externalId));
			return state;
		}
		#warmTreeCache(state, collectionIds) {
			for (const id of collectionIds) {
				const cached = this.#collectionsState.treeByCollectionId.get(id);
				if (cached?.isLoaded) {
					state.treeByCollectionId.set(id, cached);
				}
			}
		}
		async #onConfirmOverwrite() {
			await this.#guardStart(() => this.#runStart(IMPORT_SCREEN.OVERWRITE_CONFIRM));
		}
		#onReimportActionChange(action) {
			if (this.#reimportState.action === action) {
				return;
			}
			this.#reimportState.action = action;
			this.#reimportState.errorMessage = '';

			// Re-rendering here would destroy the radio the arrow key just moved to and leave focus on
			// <body>, so the next arrow press would do nothing. The choice itself is held by the native
			// input; all the screen owes the change is dropping the refusal the previous try left.
			main_core.Dom.remove(this.#screenNode?.querySelector('[data-testid="note-import-reimport-error"]'));
		}
		async #onConfirmReimport() {
			this.#reimportState.errorMessage = '';
			await this.#guardStart(() => this.#runStart(IMPORT_SCREEN.REIMPORT_CHOICE));
		}
		async #runStart(originScreen) {
			this.#permissionsListState = createDefaultPermissionsListState();
			// From here on the run on the progress screen is one this dialog started, so the screen it
			// came from - and the decision that screen carried - is known to a repeat of it.
			this.#startOriginScreen = originScreen;
			const collectionIds = [...this.#collectionsState.selectedCollectionIds];
			try {
				const response = await this.#api.start(buildStartPayload(this.#sourceType, this.#sourceUrl, this.#sourceToken, collectionIds, resolveStartOverwrite(originScreen, this.#reimportState)));
				this.#sessionId = response.sessionId;
				this.#screen = IMPORT_SCREEN.PROGRESS;
				this.#progressState.progress = response.progress;
				this.#progressState.errorMessage = '';
				this.#progressState.isImporting = true;
				this.#progressState.isCancelling = false;
				this.#render();
				this.#scheduleNextTick();
			} catch (error) {
				const message = String(error?.message || main_core.Loc.getMessage('NOTE_IMPORT_START_ERROR'));

				// A refused update (IMPORT_COLLECTION_FORBIDDEN) is answered on the screen that asked
				// for it: from there the user can switch to creating a new base and try again.
				if (this.#screen === IMPORT_SCREEN.REIMPORT_CHOICE) {
					this.#reimportState.errorMessage = message;
					this.#render();
					return;
				}
				this.#collectionsState.errorMessage = message;
				this.#screen = IMPORT_SCREEN.COLLECTIONS;
				this.#render();
			}
		}
		async #runImportLoop() {
			const requestId = ++this.#requestId;
			if (this.#destroyed || !shouldPollImportStatus(this.#progressState, this.#sessionId)) {
				return;
			}
			try {
				const response = await this.#api.getStatus(buildGetStatusPayload(this.#sessionId));
				if (this.#destroyed || requestId !== this.#requestId) {
					return;
				}
				this.#progressState.progress = response.progress;
				if (response.progress.status !== IMPORT_PROGRESS_STATUS.IN_PROGRESS) {
					this.#progressState.isImporting = false;
					if (this.#sourceType === SOURCE_TYPE_LANDING) {
						await this.#loadConvertedCollections();
					}
					this.#render();
					return;
				}
				this.#progressState.errorMessage = '';
				this.#render();
				this.#scheduleNextTick();
			} catch (error) {
				if (this.#destroyed || requestId !== this.#requestId) {
					return;
				}
				this.#progressState.errorMessage = String(error?.message || main_core.Loc.getMessage('NOTE_IMPORT_STATUS_ERROR'));
				this.#progressState.isImporting = false;
				this.#render();
			}
		}

		// The run stopped on the server, as opposed to a status request that failed on the client.
		// Only the former makes a retry safe: a failed poll leaves the import running.
		#hasStoppedImport() {
			return this.#progressState.errorMessage === '' && this.#progressState.progress?.status === IMPORT_PROGRESS_STATUS.ERROR;
		}
		async #onBackFromStoppedImport() {
			this.#progressState.errorMessage = '';
			this.#screen = resolveStoppedImportBackScreen(this.#sourceType, this.#sourceToken);
			this.#render();

			// Going back answers the run that stopped, so the session ends here instead of being
			// left behind: a session left behind is resumed the next time the dialog opens, which
			// would drop the user back onto the screen they just left. The server refuses to end a
			// session that is still running, and this button only appears once the run has stopped.
			await this.#acknowledgeFinishedSession();

			// A resumed session restores the picked ids but not the list itself, so the list is asked for
			// here; of the restored ids it keeps the ones that list still knows.
			if (this.#screen === IMPORT_SCREEN.COLLECTIONS && this.#collectionsState.collections.length === 0) {
				await this.#loadCollections();
			}
		}
		async #onRetryImport() {
			await this.#guardStart(() => this.#retryStoppedImport());
		}
		async #retryStoppedImport() {
			const route = resolveRetryRoute(this.#startOriginScreen, this.#collectionsState.selectedCollectionIds.size);
			if (route === RETRY_ROUTE.BACK) {
				await this.#onBackFromStoppedImport();
				return;
			}
			this.#progressState.errorMessage = '';
			if (route === RETRY_ROUTE.CHECK_OVERLAP) {
				// A run restored from a previous visit brings no decision to repeat, so the repeat asks
				// the same question the list of bases asks: the check finds the bases converted before
				// and the user says again what is to be done with them. Whether updating one of them is
				// allowed at all stays with the server - the check only reports the answer.
				await this.#checkOverlapAndStart();
				return;
			}

			// Repeat the run that stopped, decision included: restarting an update as a fresh import
			// would leave the half-updated base behind and create a duplicate of it alongside.
			await this.#runStart(this.#startOriginScreen);
		}
		async #onCancel() {
			if (!this.#sessionId || this.#progressState.isCancelling) {
				return;
			}

			// The run ends here, and the poll of it ends with it. A status answer asked before the cancel
			// comes back telling the run is going, over the status the cancel writes below: the poll drops
			// its own outdated answers by this number, so ending the run moves it on the way a next ask
			// would. And no next ask is sent while the cancel is on its way - {@see shouldPollImportStatus}.
			this.#requestId++;
			this.#progressState.isCancelling = true;
			this.#render();
			try {
				await this.#api.cancel(buildCancelPayload(this.#sessionId));
			} catch (error) {
				// Only an answer that arrived says the run is over: a cancel that failed leaves it going
				// at the server, and a state calling it cancelled would say the opposite of what is
				// happening. The poll was stopped for the cancel alone, so it is put back on - the run
				// keeps being reported and the button asking to stop it can be pressed again.
				this.#progressState.errorMessage = String(error?.message || main_core.Loc.getMessage('NOTE_IMPORT_CANCEL_ERROR'));
				this.#progressState.isCancelling = false;
				this.#render();
				this.#scheduleNextTick();
				return;
			}
			this.#progressState.isImporting = false;
			this.#progressState.isCancelling = false;
			if (this.#progressState.progress) {
				this.#progressState.progress.status = IMPORT_PROGRESS_STATUS.CANCELLED;
			}
			this.#render();
			// Cancelling stops the run but keeps the bases created before it - read them
			// the same way a finished run does, so the summary can name what stayed.
			await this.#loadConvertedCollections();
		}
		async #onDone() {
			if (this.#shouldListImportedCollections()) {
				this.#screen = IMPORT_SCREEN.PERMISSIONS_LIST;
				this.#render();
				return;
			}

			// Read the collection to open before the ack - acknowledgeFinishedSession()
			// clears #sessionId, and getConvertedCollections needs it.
			const collectionId = await this.#resolveCollectionIdToOpen();
			await this.#acknowledgeFinishedSession();
			try {
				await this.#onComplete?.(collectionId ?? undefined);
			} catch (error) {
				BX.UI.Notification.Center.notify({
					content: String(error?.message || ''),
					position: 'top-right'
				});
			}
			this.#dialog?.hide();
		}
		#shouldListImportedCollections() {
			return shouldListConvertedCollections(this.#sourceType, this.#screen, this.#progressState.progress, this.#permissionsListState.collections);
		}
		#shouldOfferPermissionsSetup() {
			return shouldOfferPermissionsSetup(this.#sourceType, this.#screen, this.#progressState.progress, this.#permissionsListState.collections);
		}
		async #resolveCollectionIdToOpen() {
			if (this.#sourceType !== SOURCE_TYPE_LANDING) {
				return this.#resolveLastImportedCollectionId();
			}
			return resolveConvertedCollectionIdToOpen(this.#permissionsListState.collections);
		}
		async #resolveLastImportedCollectionId() {
			if (!this.#sessionId) {
				return null;
			}
			try {
				const response = await this.#api.getConvertedCollections(buildGetConvertedCollectionsPayload(this.#sessionId));
				const list = response?.collections ?? [];
				return toCollectionId(list[list.length - 1]?.collectionId);
			} catch {
				return null;
			}
		}
		async #loadConvertedCollections(force = false) {
			if (!this.#sessionId || this.#sourceType !== SOURCE_TYPE_LANDING) {
				return;
			}
			if (this.#permissionsListState.isLoading) {
				return;
			}
			if (this.#permissionsListState.hasLoaded && !force) {
				return;
			}
			this.#permissionsListState.isLoading = true;
			this.#permissionsListState.errorMessage = '';
			this.#render();
			try {
				const response = await this.#api.getConvertedCollections(buildGetConvertedCollectionsPayload(this.#sessionId));
				if (this.#destroyed) {
					return;
				}
				this.#permissionsListState.collections = response.collections;
			} catch (error) {
				this.#permissionsListState.errorMessage = String(error?.message || main_core.Loc.getMessage('NOTE_IMPORT_PERMISSIONS_LIST_LOAD_ERROR'));
				this.#permissionsListState.collections = [];
			} finally {
				this.#permissionsListState.isLoading = false;
				this.#permissionsListState.hasLoaded = true;
				this.#render();
			}
		}
		#render() {
			if (!this.#dialog || this.#destroyed) {
				return;
			}
			if (this.#updateProgressInPlace()) {
				this.#renderButtons();
				this.#announceProgress();
				return;
			}

			// setContent rebuilds the popup DOM, which resets scroll on the collection list.
			// Capture scrollTop of any scrollable inner container before re-render and reapply after.
			const scrollSnapshots = [];
			const popupContent = this.#dialog.getContainer?.() ?? document;
			for (const selector of ['.note-import-collection-list', '.note-import-screen']) {
				const node = popupContent.querySelector?.(selector);
				if (node && node.scrollTop > 0) {
					scrollSnapshots.push([selector, node.scrollTop]);
				}
			}
			this.#applyTitle();
			this.#dialog.setContent(this.#resolveContent());
			this.#renderButtons();
			if (scrollSnapshots.length > 0) {
				const root = this.#dialog.getContainer?.() ?? document;
				for (const [selector, top] of scrollSnapshots) {
					const node = root.querySelector?.(selector);
					if (node) {
						node.scrollTop = top;
					}
				}
			}
			if (this.#screen === IMPORT_SCREEN.PROGRESS) {
				this.#announceProgress();
			}
		}

		// A poll tick brings new numbers for the screen already on display, not a new screen, so the
		// progress screen updates its own nodes instead of being built again. Neither setContent nor
		// setTitle may be called for it: both rebuild the whole popup, which restarts the bar and
		// leaves focus on <body> - every five seconds, for as long as the import runs. The title of
		// the dialog doesn't change while the run goes on, so nothing is lost by not setting it.
		#updateProgressInPlace() {
			const element = this.#progressScreen?.element;
			if (this.#screen !== IMPORT_SCREEN.PROGRESS || !element) {
				return false;
			}

			// The screen is only updated where it stands - if it isn't what the dialog currently shows,
			// the caller has to go through a full render to put it there.
			if (this.#screenNode !== element || !element.isConnected) {
				return false;
			}
			this.#applyProgressState();
			return true;
		}
		#applyProgressState() {
			this.#progressScreen?.applyState(this.#progressState, this.#sourceType, this.#permissionsListState.collections);
		}

		// The import runs behind a poll, so nothing on the progress screen reaches a screen reader by
		// itself: the live region of ui.a11y lives in the body, outside everything the dialog rebuilds,
		// and a region rebuilt together with the content would announce nothing at all.
		#announceProgress() {
			const announcement = resolveProgressAnnouncement(this.#progressState, this.#sourceType, this.#permissionsListState.collections);
			if (announcement === '' || announcement === this.#announcedProgress) {
				return;
			}
			this.#announcedProgress = announcement;
			ui_a11y.LiveAnnouncer.announce(announcement);
		}
		#renderButtons() {
			if (!this.#dialog || this.#destroyed) {
				return;
			}

			// Rebuilding buttons replaces their nodes, and a running import renders every poll tick:
			// without this the focus on the cancel button would be lost every 5 seconds.
			if (this.#resolveButtonsSignature() === this.#buttonsSignature) {
				// The set of buttons is the same, but what the buttons carry in place is not: the list
				// of bases arrives after the screen asking for it was drawn, and the import button of
				// that screen would stay disabled over a list where every base is already ticked.
				this.#syncButtonStates();
				return;
			}
			this.#dialog.setCenterButtons(this.#createButtons());
		}

		// What the buttons hold themselves rather than through their set - only the current screen has
		// buttons to sync, the other references are null and the other lists empty.
		#syncButtonStates() {
			this.#refreshConnectButtonState();
			this.#syncStartScreenButtons();
			this.#syncDoneButtons();
			this.#refreshCancelButtonState();
		}
		#createButtons() {
			this.#buttonsSignature = this.#resolveButtonsSignature();
			return this.#resolveButtons();
		}

		// Everything #resolveButtons() reads to decide which buttons the screen has and what they say.
		// States they carry in place - disabled, above all - are synced through the button objects
		// themselves and don't belong here.
		#resolveButtonsSignature() {
			return [this.#screen, this.#connectionForm.sourceType, this.#sourceType, this.#progressState.isImporting, this.#hasStoppedImport(), this.#canRepeatImport(), this.#shouldOfferPermissionsSetup()].join('|');
		}
		#canRepeatImport() {
			return canRepeatImport(this.#sourceType, this.#sourceToken);
		}

		// The title of the dialog, given to it only when it differs from the one already standing there.
		// Setting a title rebuilds the whole window - header, content and footer alike - so setting the
		// same title again costs a rebuild and changes nothing.
		#applyTitle() {
			const title = this.#resolveTitle();
			if (title === this.#appliedTitle) {
				return;
			}
			this.#appliedTitle = title;
			this.#dialog?.setTitle(title);
		}
		#resolveTitle() {
			const sourceType = this.#currentSourceType();

			// Landing gets a title of its own instead of the "#SOURCE#" join: that join only reads as
			// Russian for a source name that doesn't decline, and the landing one does. The source is
			// asked before the screen is: the bases converted are the ones of this very portal, and
			// calling them external on the screen the run spends its whole time on would be wrong.
			if (sourceType === SOURCE_TYPE_LANDING) {
				return main_core.Loc.getMessage('NOTE_IMPORT_DIALOG_TITLE_LANDING');
			}
			if (this.#screen === IMPORT_SCREEN.PROGRESS) {
				return main_core.Loc.getMessage('NOTE_IMPORT_DIALOG_TITLE');
			}

			// The name of an instance belongs to the source it was read from: while the form asks about
			// another source, that source has not been connected to and has no instance to name.
			if (this.#instanceName && sourceType === this.#sourceType) {
				return main_core.Loc.getMessage('NOTE_IMPORT_DIALOG_TITLE_SOURCE').replace('#SOURCE#', main_core.Text.encode(this.#instanceName));
			}
			return main_core.Loc.getMessage('NOTE_IMPORT_DIALOG_TITLE');
		}
		#resolveContent() {
			// Kept so that a local update finds its own nodes without a re-render: re-rendering
			// destroys whatever the user has in focus.
			this.#screenNode = this.#buildScreen();
			return this.#screenNode;
		}
		#buildScreen() {
			if (this.#screen === IMPORT_SCREEN.LOADING) {
				return this.#renderLoadingScreen();
			}
			if (this.#screen === IMPORT_SCREEN.COLLECTIONS) {
				return renderCollectionsScreen(this.#collectionsState, {
					onToggleCollectionSelection: collectionId => {
						if (this.#collectionsState.selectedCollectionIds.has(collectionId)) {
							this.#collectionsState.selectedCollectionIds.delete(collectionId);
						} else {
							this.#collectionsState.selectedCollectionIds.add(collectionId);
						}

						// Avoid full #render(): setContent rebuilds popup DOM and resets per-card local state
						// (sub-folder expansion, scroll). Just sync the buttons' disabled flags in place.
						this.#syncStartScreenButtons();
					},
					onToggleCollectionExpanded: collectionId => {
						this.#toggleTreeExpanded(this.#collectionsState, collectionId);
					},
					onRetryCollectionsLoad: () => {
						this.#loadCollections();
					},
					onRetryTreeLoad: collectionId => {
						this.#loadTreeInto(this.#collectionsState, collectionId);
					},
					sourceType: this.#sourceType
				});
			}
			if (this.#screen === IMPORT_SCREEN.OVERWRITE_CONFIRM) {
				return renderOverwriteConfirmScreen(this.#overwriteState, {
					onToggleCollectionExpanded: collectionId => {
						this.#toggleTreeExpanded(this.#overwriteState, collectionId);
					},
					onRetryTreeLoad: collectionId => {
						this.#loadTreeInto(this.#overwriteState, collectionId);
					},
					sourceType: this.#sourceType
				});
			}
			if (this.#screen === IMPORT_SCREEN.REIMPORT_CHOICE) {
				return renderReimportChoiceScreen(this.#reimportState, {
					onActionChange: action => {
						this.#onReimportActionChange(action);
					},
					onToggleCollectionExpanded: collectionId => {
						this.#toggleTreeExpanded(this.#reimportState, collectionId);
					},
					onRetryTreeLoad: collectionId => {
						this.#loadTreeInto(this.#reimportState, collectionId);
					},
					sourceType: this.#sourceType
				});
			}
			if (this.#screen === IMPORT_SCREEN.PROGRESS) {
				this.#progressScreen ??= createProgressScreen();
				this.#applyProgressState();
				return this.#progressScreen.element;
			}
			if (this.#screen === IMPORT_SCREEN.PERMISSIONS_LIST) {
				return renderPermissionsListScreen(this.#permissionsListState, {
					onRetry: () => {
						this.#loadConvertedCollections(true);
					},
					onOpenPermissions: collection => {
						note_permissions.App.openCollectionPopup(collection.collectionId, {
							collectionName: collection.name
						});
					}
				});
			}
			if (!this.#connectionScreen) {
				this.#connectionScreen = createConnectionScreen({
					onSourceChange: value => {
						this.#onConnectionFieldInput('sourceType', value);
						this.#onConnectionFieldBlur('sourceType');
					},
					onUrlInput: value => {
						this.#onConnectionFieldInput('url', value);
					},
					onUrlBlur: () => {
						this.#onConnectionFieldBlur('url');
					},
					onTokenInput: value => {
						this.#onConnectionFieldInput('token', value);
					},
					onTokenBlur: () => {
						this.#onConnectionFieldBlur('token');
					},
					onSubmit: () => {
						this.#onConnect();
					}
				}, this.#availableSources);
			}
			this.#connectionScreen.applyState(this.#connectionForm);
			return this.#connectionScreen.element;
		}

		// The button that asks for a run: the base list, both confirmations and the repeat of a stopped
		// run all have one, and only one of those screens is on display at a time. That one is kept, so
		// that what the button carries in place - being refused - is synced onto it without a rebuild.
		#createStartButton(text, testId, onclick) {
			const button = new ui_buttons.Button({
				size: ui_buttons.ButtonSize.LARGE,
				style: ui_buttons.AirButtonStyle.FILLED,
				useAirDesign: true,
				text,
				dataset: {
					testid: testId
				},
				onclick
			});
			// See connect button comment: { disabled: true } option doesn't drive ButtonState,
			// so the first setDisabled(false) leaves --disabled class on the container.
			button.setDisabled(!this.#canStartImport());
			this.#startButton = button;
			return button;
		}

		// A button standing next to the one that asks for a run. It is kept for the same reason that one
		// is: waiting for the answer is shown on it in place, so the set is not rebuilt for the wait.
		// The screen a start leads to is built while the wait is still on, hence the state on creation.
		#trackStartScreenButton(button) {
			button.setDisabled(this.#isStarting);
			this.#startScreenButtons.push(button);
			return button;
		}

		// The button that finishes the dialog: the summary of a run has one, and so has the list of what
		// the run converted. It is kept for the reason the button asking for a run is kept - it waits for
		// an answer in place, and the wait is not worth rebuilding the set of buttons for.
		#trackDoneButton(button) {
			button.setDisabled(!this.#canFinishImport());
			this.#doneButtons.push(button);
			return button;
		}
		#resolveButtons() {
			// The buttons of the screen being left go away with their nodes, so what is synced in place
			// is only ever what the branches below build for the screen currently on display.
			this.#connectionConnectButton = null;
			this.#startButton = null;
			this.#startScreenButtons = [];
			this.#doneButtons = [];
			this.#cancelButton = null;
			if (this.#screen === IMPORT_SCREEN.LOADING) {
				return [];
			}
			if (this.#screen === IMPORT_SCREEN.CONNECTION) {
				// Landing and wiki are local sources with no remote connection step - the
				// action just reveals the local bases to pick, so the button reads "Выбрать"
				// rather than "Подключиться".
				const submitMessageId = isLocalSource(this.#currentSourceType()) ? 'NOTE_IMPORT_SELECT' : 'NOTE_IMPORT_CONNECT';
				const connectButton = new ui_buttons.Button({
					size: ui_buttons.ButtonSize.LARGE,
					style: ui_buttons.AirButtonStyle.FILLED,
					useAirDesign: true,
					text: main_core.Loc.getMessage(submitMessageId),
					dataset: {
						testid: 'note-import-connect'
					},
					onclick: () => {
						this.#onConnect();
					}
				});
				// Sync via setDisabled so internal state is wired to the disabled CSS class.
				// Passing { disabled: true } in options sets the class but leaves this.state = null,
				// which makes the first setDisabled(false) a visual no-op.
				connectButton.setDisabled(!this.#canSubmitConnection());
				this.#connectionConnectButton = connectButton;
				return [connectButton, new ui_buttons.Button({
					size: ui_buttons.ButtonSize.LARGE,
					style: ui_buttons.AirButtonStyle.PLAIN,
					useAirDesign: true,
					text: main_core.Loc.getMessage('NOTE_IMPORT_DIALOG_CANCEL_BUTTON'),
					dataset: {
						testid: 'note-import-close'
					},
					onclick: () => {
						this.#dialog?.hide();
					}
				})];
			}
			if (this.#screen === IMPORT_SCREEN.COLLECTIONS) {
				return [this.#createStartButton(main_core.Loc.getMessage('NOTE_IMPORT_START'), 'note-import-start', () => {
					this.#onStartImport();
				}), this.#trackStartScreenButton(new ui_buttons.Button({
					size: ui_buttons.ButtonSize.LARGE,
					style: ui_buttons.AirButtonStyle.PLAIN,
					useAirDesign: true,
					text: main_core.Loc.getMessage('NOTE_IMPORT_BACK'),
					dataset: {
						testid: 'note-import-back'
					},
					onclick: () => {
						this.#screen = IMPORT_SCREEN.CONNECTION;
						this.#render();
					}
				}))];
			}
			if (this.#screen === IMPORT_SCREEN.REIMPORT_CHOICE) {
				return [this.#createStartButton(main_core.Loc.getMessage('NOTE_IMPORT_OVERWRITE_CONFIRM'), 'note-import-reimport-confirm', () => {
					this.#onConfirmReimport();
				}), this.#trackStartScreenButton(new ui_buttons.Button({
					size: ui_buttons.ButtonSize.LARGE,
					style: ui_buttons.AirButtonStyle.PLAIN,
					useAirDesign: true,
					text: main_core.Loc.getMessage('NOTE_IMPORT_BACK'),
					dataset: {
						testid: 'note-import-back'
					},
					onclick: () => {
						this.#showCollectionsScreen();
					}
				}))];
			}
			if (this.#screen === IMPORT_SCREEN.OVERWRITE_CONFIRM) {
				return [this.#createStartButton(main_core.Loc.getMessage('NOTE_IMPORT_OVERWRITE_CONFIRM'), 'note-import-overwrite-confirm', () => {
					this.#onConfirmOverwrite();
				}), this.#trackStartScreenButton(new ui_buttons.Button({
					size: ui_buttons.ButtonSize.LARGE,
					style: ui_buttons.AirButtonStyle.PLAIN,
					useAirDesign: true,
					text: main_core.Loc.getMessage('NOTE_IMPORT_BACK'),
					dataset: {
						testid: 'note-import-back'
					},
					onclick: () => {
						this.#showCollectionsScreen();
					}
				}))];
			}
			if (this.#progressState.isImporting) {
				const cancelButton = new ui_buttons.Button({
					size: ui_buttons.ButtonSize.LARGE,
					style: ui_buttons.AirButtonStyle.PLAIN,
					useAirDesign: true,
					text: main_core.Loc.getMessage('NOTE_IMPORT_CANCEL'),
					dataset: {
						testid: 'note-import-cancel'
					},
					onclick: () => {
						this.#onCancel();
					}
				});
				cancelButton.setDisabled(this.#progressState.isCancelling);
				this.#cancelButton = cancelButton;
				return [cancelButton];
			}
			if (this.#screen === IMPORT_SCREEN.PERMISSIONS_LIST) {
				return [this.#trackDoneButton(new ui_buttons.Button({
					size: ui_buttons.ButtonSize.LARGE,
					style: ui_buttons.AirButtonStyle.FILLED,
					useAirDesign: true,
					text: main_core.Loc.getMessage('NOTE_IMPORT_DONE'),
					dataset: {
						testid: 'note-import-done'
					},
					onclick: () => {
						this.#onDone();
					}
				}))];
			}
			if (this.#screen === IMPORT_SCREEN.PROGRESS && this.#hasStoppedImport()) {
				const stoppedButtons = [];

				// A repeat is offered only while the run can actually be repeated: a session restored on
				// opening the dialog carries no token of the source, and starting the same run without it
				// would be refused at the source. The way back then leads to the connection screen, where
				// the token is entered anew.
				if (this.#canRepeatImport()) {
					stoppedButtons.push(this.#createStartButton(main_core.Loc.getMessage('NOTE_IMPORT_RETRY'),
					// Not `note-import-retry`: that one already marks "retry loading the tree"
					// inside a base card, and this button restarts the import itself.
					'note-import-error-retry', () => {
						this.#onRetryImport();
					}));
				}
				stoppedButtons.push(this.#trackStartScreenButton(new ui_buttons.Button({
					size: ui_buttons.ButtonSize.LARGE,
					style: ui_buttons.AirButtonStyle.PLAIN,
					useAirDesign: true,
					text: main_core.Loc.getMessage('NOTE_IMPORT_BACK'),
					dataset: {
						testid: 'note-import-back'
					},
					onclick: () => {
						this.#onBackFromStoppedImport();
					}
				})), this.#trackDoneButton(new ui_buttons.Button({
					size: ui_buttons.ButtonSize.LARGE,
					style: ui_buttons.AirButtonStyle.PLAIN,
					useAirDesign: true,
					text: main_core.Loc.getMessage('NOTE_IMPORT_DONE'),
					dataset: {
						testid: 'note-import-done'
					},
					onclick: () => {
						this.#onDone();
					}
				})));
				return stoppedButtons;
			}
			const doneButtons = [];
			if (this.#shouldOfferPermissionsSetup()) {
				doneButtons.push(new ui_buttons.Button({
					size: ui_buttons.ButtonSize.LARGE,
					style: ui_buttons.AirButtonStyle.PLAIN,
					useAirDesign: true,
					text: main_core.Loc.getMessage('NOTE_IMPORT_PERMISSIONS_CONFIGURE'),
					dataset: {
						testid: 'note-import-permissions-configure'
					},
					onclick: () => {
						this.#screen = IMPORT_SCREEN.PERMISSIONS_LIST;
						this.#render();
					}
				}));
			}
			doneButtons.push(this.#trackDoneButton(new ui_buttons.Button({
				size: ui_buttons.ButtonSize.LARGE,
				style: ui_buttons.AirButtonStyle.FILLED,
				useAirDesign: true,
				text: main_core.Loc.getMessage('NOTE_IMPORT_DONE'),
				dataset: {
					testid: 'note-import-done'
				},
				onclick: () => {
					this.#onDone();
				}
			})));
			return doneButtons;
		}
		async #checkActiveSession() {
			try {
				const result = await this.#api.getActiveSession();
				if (this.#destroyed) {
					return;
				}
				if (shouldRestoreSession(result)) {
					this.#sessionId = result.sessionId;
					this.#screen = IMPORT_SCREEN.PROGRESS;
					this.#progressState.progress = result.progress;
					this.#progressState.errorMessage = '';
					this.#sourceType = String(result.progress.sourceType || this.#sourceType || '').trim();
					// The form of the connection follows the restored source: from a run that cannot be
					// repeated the way out leads back to that screen, and there it has to ask about the
					// source the run was started for.
					this.#connectionForm.sourceType = this.#sourceType;
					this.#permissionsListState = createDefaultPermissionsListState();
					const isInProgress = result.progress.status === IMPORT_PROGRESS_STATUS.IN_PROGRESS;
					this.#progressState.isImporting = isInProgress;

					// Restore source URL + collection selection from finished session so that
					// Retry can prefill the connection form and pre-select the same collections.
					if (result.progress.sourceUrl) {
						this.#sourceUrl = result.progress.sourceUrl;
						this.#connectionForm.url = result.progress.sourceUrl;
					}
					if (Array.isArray(result.progress.collectionIds)) {
						this.#collectionsState.selectedCollectionIds = new Set(result.progress.collectionIds);
					}
					this.#render();
					if (!isInProgress && this.#sourceType === SOURCE_TYPE_LANDING) {
						await this.#loadConvertedCollections();
					}
					if (isInProgress) {
						this.#scheduleNextTick();
					}
					return;
				}
			} catch {
				// Request failed — fall through to connection screen.
			}
			if (!this.#destroyed && this.#screen === IMPORT_SCREEN.LOADING) {
				this.#screen = IMPORT_SCREEN.CONNECTION;
				this.#render();
			}
		}
		async #acknowledgeFinishedSession() {
			const sessionId = this.#sessionId;
			if (!sessionId) {
				return;
			}

			// The session is let go before the answer comes back, not after it: the answer arrives while
			// the user is already on another screen, and by then the dialog may hold the session of a run
			// they have just started. Clearing it then would leave that run without a poll - it goes on at
			// the server while the progress screen stands still. Nothing here reads the id afterwards, so
			// letting it go early costs nothing.
			this.#sessionId = null;
			try {
				await this.#api.acknowledgeFinish(buildAcknowledgeFinishPayload(sessionId));
			} catch (error) {
				// Acknowledgement is best-effort: we don't want to block the UI on it.
				// A session left behind is dropped by the next start, which clears the previous
				// finished session of the user before creating its own. The source check clears
				// nothing: it only refuses while a run is still going.
				console.warn('[note import] acknowledgeFinish failed', error);
			}
		}

		// The first screen of the dialog, shown while the active session is read. The spinner says
		// nothing on its own, so the state is spelled out for a screen reader next to it.
		#renderLoadingScreen() {
			return main_core.Tag.render`
			<div class="note-import-screen note-import-loading" role="status">
				<div class="note-import-loading-spinner"></div>
				<visually-hidden>${main_core.Text.encode(main_core.Loc.getMessage('NOTE_IMPORT_LOADING'))}</visually-hidden>
			</div>
		`;
		}
		#resumeIfNeeded() {
			if (this.#sessionId && this.#screen === IMPORT_SCREEN.PROGRESS && this.#progressState.progress?.status === IMPORT_PROGRESS_STATUS.IN_PROGRESS) {
				this.#progressState.isImporting = true;
				this.#render();
				this.#runImportLoop();
			}
		}
		#scheduleNextTick() {
			setTimeout(() => {
				this.#runImportLoop();
			}, IMPORT_POLL_INTERVAL_MS);
		}
		#canSubmitConnection() {
			if (this.#connectionForm.isSubmitting) {
				return false;
			}
			const sourceType = this.#currentSourceType();
			if (sourceType === '') {
				return false;
			}
			if (isLocalSource(sourceType)) {
				return true;
			}
			const url = String(this.#connectionForm.url || '').trim();
			const token = String(this.#connectionForm.token || '').trim();
			if (url === '' || token === '') {
				return false;
			}

			// Only client-side validation gates submit. errors.url may carry a
			// server-side message after a failed checkConnection — that shouldn't
			// keep the button disabled, the user should be able to retry.
			return /^https?:\/\//i.test(url);
		}
	}

	exports.ImportDialog = ImportDialog;

})(this.BX.Note.Import = this.BX.Note.Import || {}, BX.UI, BX, BX.UI, BX.UI.System, BX.UI.Accessibility, BX.UI.Notification, BX.Note.Permissions, BX.Note.Ui, BX.UI.System.Checkbox, BX.UI.IconSet, window, BX.Note.Ui, BX.Vue3, BX.UI.System.Input.Vue, BX.UI.System, BX.UI.System.Alert.Vue, BX.UI.System.Alert, BX.UI.System.RadioButton);
//# sourceMappingURL=import.bundle.js.map
