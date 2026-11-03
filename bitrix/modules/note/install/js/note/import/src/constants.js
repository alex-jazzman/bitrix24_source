import { Loc } from 'main.core';
import type {
	CheckConnectionRequest,
	GetCollectionsRequest,
	GetDocumentTreeRequest,
	StartRequest,
	GetStatusRequest,
	CancelRequest,
	ImportCollection,
	ImportDocumentTreeNode,
	ConnectionError,
	ConnectionFormState,
	CollectionsScreenState,
	CheckOverlapResponse,
	ConvertedCollection,
	ExistingCollection,
	ImportProgress,
	OverwriteScreenState,
	ProgressScreenState,
	PermissionsListScreenState,
	ReimportChoiceScreenState,
	GetConvertedCollectionsRequest,
	ImportDialogOptions,
	ActiveSessionResponse,
} from './type';

export const SOURCE_TYPE_OUTLINE = 'outline';
export const SOURCE_TYPE_LANDING = 'landing';
export const SOURCE_TYPE_WIKI = 'wiki';
export const IMPORT_POLL_INTERVAL_MS = 5000;

export const SOURCE_TYPES = Object.freeze([
	Object.freeze({
		id: SOURCE_TYPE_OUTLINE,
		label: Loc.getMessage('NOTE_IMPORT_SOURCE_OUTLINE'),
		enabled: true,
	}),
	Object.freeze({
		id: SOURCE_TYPE_WIKI,
		label: Loc.getMessage('NOTE_IMPORT_SOURCE_WIKI'),
		enabled: true,
	}),
	Object.freeze({
		id: SOURCE_TYPE_LANDING,
		label: Loc.getMessage('NOTE_IMPORT_SOURCE_LANDING'),
		enabled: true,
	}),
]);

// A source that converts bases of this very portal is released behind an option of the portal, and
// the answer of the server about it travels here as the dialog option named next to it. A source
// absent from this map is offered to everyone.
const RELEASE_OPTION_BY_SOURCE = Object.freeze({
	[SOURCE_TYPE_WIKI]: 'wikiImportEnabled',
	[SOURCE_TYPE_LANDING]: 'landingImportEnabled',
});

// Which sources the picker offers. A source is left out unless the server said it is on: an absent
// permission and a permission the transport garbled both read as "not offered".
export function resolveAvailableSources(options: ImportDialogOptions = {}): Array<Object>
{
	return SOURCE_TYPES.filter((source) => {
		const releaseOption = RELEASE_OPTION_BY_SOURCE[source.id];

		return releaseOption === undefined || options[releaseOption] === true;
	});
}

// A source that converts bases of this very portal needs neither an address nor a token: it is read
// over the session of the user who is logged in.
export function isLocalSource(sourceType: string): boolean
{
	return sourceType === SOURCE_TYPE_LANDING || sourceType === SOURCE_TYPE_WIKI;
}

export const IMPORT_SCREEN = Object.freeze({
	LOADING: 'loading',
	CONNECTION: 'connection',
	COLLECTIONS: 'collections',
	OVERWRITE_CONFIRM: 'overwriteConfirm',
	REIMPORT_CHOICE: 'reimportChoice',
	PROGRESS: 'progress',
	PERMISSIONS_LIST: 'permissionsList',
});

export const REIMPORT_ACTION = Object.freeze({
	UPDATE: 'update',
	CREATE: 'create',
});

export const IMPORT_PROGRESS_STATUS = Object.freeze({
	IN_PROGRESS: 'in_progress',
	DONE: 'done',
	ERROR: 'error',
	CANCELLED: 'cancelled',
});

export function createDefaultImportCollection(): ImportCollection
{
	return {
		id: '',
		name: '',
	};
}

export function createDefaultImportTreeNode(): ImportDocumentTreeNode
{
	return {
		id: '',
		title: '',
		parentId: null,
		children: [],
	};
}

export function createDefaultConnectionFormState(): ConnectionFormState
{
	return {
		sourceType: SOURCE_TYPE_OUTLINE,
		url: '',
		token: '',
		errorMessage: '',
		isSubmitting: false,
		touched: {
			sourceType: false,
			url: false,
			token: false,
		},
		errors: {
			sourceType: '',
			url: '',
			token: '',
		},
	};
}

export function createDefaultCollectionsScreenState(): CollectionsScreenState
{
	return {
		isLoading: false,
		errorMessage: '',
		collections: [],
		selectedCollectionIds: new Set(),
		expandedCollectionIds: new Set(),
		treeByCollectionId: new Map(),
	};
}

export function createDefaultOverwriteState(): OverwriteScreenState
{
	return {
		collections: [],
		expandedCollectionIds: new Set(),
		treeByCollectionId: new Map(),
	};
}

export function createDefaultReimportChoiceState(): ReimportChoiceScreenState
{
	return {
		collections: [],
		// Creating a new base changes nothing that already exists, so it is what the screen
		// starts on: updating overwrites documents and has to be picked on purpose.
		action: REIMPORT_ACTION.CREATE,
		errorMessage: '',
		expandedCollectionIds: new Set(),
		treeByCollectionId: new Map(),
	};
}

// Q-1: the decision is one per run, so a single base without the moderator right takes
// updating away from the whole run.
export function canUpdateExistingCollections(collections: ExistingCollection[]): boolean
{
	return collections.length > 0 && collections.every((collection) => collection.canModerate === true);
}

export function isReimportUpdateRequested(state: ReimportChoiceScreenState): boolean
{
	return state.action === REIMPORT_ACTION.UPDATE && canUpdateExistingCollections(state.collections);
}

// The overwrite flag a start carries, decided by the screen the start came from. A retry passes
// the screen of the run it retries, not the progress screen it sits on: restarting an update as a
// fresh import would leave the half-updated base behind and put a duplicate of it alongside. A
// retry only starts this way while that screen is known at all - {@see resolveRetryRoute}.
export function resolveStartOverwrite(originScreen: string, reimportState: ReimportChoiceScreenState): boolean
{
	if (originScreen === IMPORT_SCREEN.OVERWRITE_CONFIRM)
	{
		return true;
	}

	if (originScreen === IMPORT_SCREEN.REIMPORT_CHOICE)
	{
		return isReimportUpdateRequested(reimportState);
	}

	return false;
}

export const RETRY_ROUTE = Object.freeze({
	BACK: 'back',
	CHECK_OVERLAP: 'checkOverlap',
	REPEAT: 'repeat',
});

// Where the repeat of a stopped run goes. A run this dialog started remembers the screen it came
// from, and that screen carries the decision the user made ({@see resolveStartOverwrite}), so such a
// run is repeated exactly as it was. A run restored on opening the dialog came from no screen at
// all: the server keeps the decision in the state of the run but does not report it back, and
// repeating such a run as a plain start would turn an update into a fresh import - a duplicate base
// beside the half-updated one. It goes through the check for bases converted before instead, and
// that check asks the user again, the way the list of bases does. A run with no base picked has
// nothing to repeat, so its button leads back rather than nowhere.
export function resolveRetryRoute(startOriginScreen: string | null, pickedCollectionCount: number): string
{
	if (pickedCollectionCount === 0)
	{
		return RETRY_ROUTE.BACK;
	}

	return startOriginScreen === null ? RETRY_ROUTE.CHECK_OVERLAP : RETRY_ROUTE.REPEAT;
}

// Which screen a checked overlap leads to, or null to start the import right away. Landing
// asks what to do with a base converted before (API-01 names it and tells whether updating is
// allowed); the other sources keep the plain overwrite confirmation they had.
// A match the user cannot see is no match, and neither list speaks about one: both `existingCollections`
// and `existingCollectionIds` come from the bases the server let this user see (API-01).
export function resolveOverlapScreen(sourceType: string, overlap: CheckOverlapResponse): string | null
{
	if (sourceType === SOURCE_TYPE_LANDING)
	{
		return overlap.existingCollections.length > 0 ? IMPORT_SCREEN.REIMPORT_CHOICE : null;
	}

	return overlap.existingCollectionIds.length > 0 ? IMPORT_SCREEN.OVERWRITE_CONFIRM : null;
}

// Whether the read of the active session gives the dialog a run to show. The row of a session outlives
// the run it stands for: cancelling deletes the state of the run and keeps the row until the user
// acknowledges the end, so the server calls active a session that has nothing left to report. Such an
// answer says neither what the run did nor whether it is still going, and is read as no session at
// all: the dialog opens on the connection screen, and the next start drops the row anyway.
export function shouldRestoreSession(session: ActiveSessionResponse | null): boolean
{
	return session?.active === true && Boolean(session.progress);
}

// Whether the run on the progress screen can be started again from what the dialog holds. A source of
// this very portal is read over the session of the user, so a run of it repeats from anything restored.
// Outline is reached with a token, and a session restored on opening the dialog carries none: the
// server neither returns the token nor should. An empty token is not what a start is refused over,
// so such a repeat would be accepted and then die at the first request to the source - it is not
// offered at all instead.
export function canRepeatImport(sourceType: string, sourceToken: string): boolean
{
	return isLocalSource(sourceType) || String(sourceToken || '').trim() !== '';
}

// Where the way back from a stopped run leads. The list of bases is asked of the source with the same
// credentials the run was started with, so a run that cannot be repeated has no list to go back to
// either: the way back is then the connection screen, where the credentials are entered anew.
export function resolveStoppedImportBackScreen(sourceType: string, sourceToken: string): string
{
	return canRepeatImport(sourceType, sourceToken) ? IMPORT_SCREEN.COLLECTIONS : IMPORT_SCREEN.CONNECTION;
}

// Whether the button asking for a run may be pressed. A run already asked for refuses every such
// button: the server answers the second start with "the transfer is already going", and that answer
// takes the user to the list of bases while the first run keeps going - rebuilding that list every
// poll tick, together with its scroll, its opened branches and the focus standing on it.
// The list of bases refuses on its own account too. A list still loading shows no base to start
// over, and the ids picked before it belong to the list that was there: after the way back from a
// stopped run they come from the session, not from anything the screen shows.
export function canStartImport(
	screen: string,
	isStarting: boolean,
	collectionsState: CollectionsScreenState,
): boolean
{
	if (isStarting)
	{
		return false;
	}

	if (screen !== IMPORT_SCREEN.COLLECTIONS)
	{
		return true;
	}

	return !collectionsState.isLoading
		&& collectionsState.collections.length > 0
		&& collectionsState.selectedCollectionIds.size > 0;
}

// The bases a freshly loaded list comes up ticked with. The picks the screen had are not the picks of
// that list: the way back from a stopped run brings them from the session, and the list is only asked
// for afterwards. They are kept as far as the list that came back knows them - a run started over a
// base the user cannot see is not what the way back is for. A list that knows none of them says
// nothing about what was picked and comes up the way the first one does: every base ticked, because
// converting all of them is the common case and unticking the odd one out is less work than ticking
// each base by hand.
export function resolveCollectionPicks(
	previousPicks: Set<string>,
	collections: ImportCollection[],
): Set<string>
{
	const listedIds = collections.map((collection) => collection.id);
	const keptPicks = listedIds.filter((id) => previousPicks.has(id));

	return new Set(keptPicks.length > 0 ? keptPicks : listedIds);
}

export function createDefaultProgressScreenState(): ProgressScreenState
{
	return {
		isImporting: false,
		isCancelling: false,
		errorMessage: '',
		progress: null,
	};
}

// Whether the dialog asks the server about the run again. It asks while the run is going, and the
// cancel ends the run here rather than at the server: the answer to the cancel writes the status the
// run ended on, so an ask sent while that answer is on its way would come back after it - carrying
// the status the run had while it was still going, over the one it ended on.
export function shouldPollImportStatus(
	progressState: ProgressScreenState,
	sessionId: number | null,
): boolean
{
	return Boolean(sessionId) && progressState.isImporting && !progressState.isCancelling;
}

export function createDefaultPermissionsListState(): PermissionsListScreenState
{
	return {
		isLoading: false,
		errorMessage: '',
		hasLoaded: false,
		collections: [],
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
export function canFinishImport(
	isStarting: boolean,
	permissionsListState: PermissionsListScreenState,
): boolean
{
	return !isStarting && !permissionsListState.isLoading;
}

export function toCollectionId(value: mixed): number | null
{
	const id = Number(value);

	return Number.isInteger(id) && id > 0 ? id : null;
}

// Landing converts several bases in one run, so such a run has no single "the" base to open.
// Listing what has been converted is worth a screen only while there is more than one base;
// a cancelled run needs no screen either - its own summary already names the bases it kept.
export function shouldListConvertedCollections(
	sourceType: string,
	screen: string,
	progress: ImportProgress | null,
	convertedCollections: ConvertedCollection[],
): boolean
{
	if (sourceType !== SOURCE_TYPE_LANDING || screen === IMPORT_SCREEN.PERMISSIONS_LIST)
	{
		return false;
	}

	if (progress?.status === IMPORT_PROGRESS_STATUS.CANCELLED)
	{
		return false;
	}

	return convertedCollections.length > 1;
}

// Whether the summary of a run offers a way of its own to the list of what was converted. That way
// is one button, not two: a run that converted several bases has no single base to open, so finishing
// leads to the list by itself ({@see shouldListConvertedCollections}) and a second button to the same
// screen would have nothing else to do. A run that converted nothing has no list to offer at all.
export function shouldOfferPermissionsSetup(
	sourceType: string,
	screen: string,
	progress: ImportProgress | null,
	convertedCollections: ConvertedCollection[],
): boolean
{
	// The offer belongs to the summary of a run, and the summary is the progress screen: the list
	// itself has no way to offer to where it already is.
	if (screen !== IMPORT_SCREEN.PROGRESS)
	{
		return false;
	}

	if (sourceType !== SOURCE_TYPE_LANDING || convertedCollections.length === 0)
	{
		return false;
	}

	return !shouldListConvertedCollections(sourceType, screen, progress, convertedCollections);
}

// The base a finished landing run opens: only a run that converted exactly one base has one to
// open, and `null` keeps the user where they are instead of opening an arbitrary base.
export function resolveConvertedCollectionIdToOpen(convertedCollections: ConvertedCollection[]): number | null
{
	return convertedCollections.length === 1 ? toCollectionId(convertedCollections[0]?.collectionId) : null;
}

export function resolveProgressScreenStatus(state: ProgressScreenState): string
{
	if (state.errorMessage)
	{
		return 'error';
	}

	const progress = state.progress;
	if (!progress)
	{
		return 'preparing';
	}

	if (progress.status === IMPORT_PROGRESS_STATUS.CANCELLED)
	{
		return 'cancelled';
	}

	if (progress.status === IMPORT_PROGRESS_STATUS.ERROR)
	{
		return 'error';
	}

	if (progress.status === IMPORT_PROGRESS_STATUS.DONE)
	{
		return (progress.error ?? 0) > 0 ? 'done_error' : 'done_ok';
	}

	if (progress.step === 'downloadAttachments' || progress.step === 'retryAttachments')
	{
		return 'attachments';
	}

	if (progress.step === 'createStructure' || progress.step === 'fillContent')
	{
		return 'documents';
	}

	return 'preparing';
}

export function buildCheckConnectionPayload(sourceType: string, url: string, token: string): CheckConnectionRequest
{
	return {
		sourceType,
		url,
		token,
	};
}

export function buildGetCollectionsPayload(
	sourceType: string,
	url: string,
	token: string,
): GetCollectionsRequest
{
	return { sourceType, url, token };
}

export function buildGetDocumentTreePayload(
	sourceType: string,
	url: string,
	token: string,
	collectionId: string,
): GetDocumentTreeRequest
{
	return { sourceType, url, token, collectionId };
}

export function buildCheckOverlapPayload(sourceType: string, collectionIds: string[]): Object
{
	return { sourceType, collectionIds };
}

// The decision travels over a form-encoded transport, where every value becomes a string: a boolean
// `false` arrives as 'false', which is a non-empty string and reads as truth on the server. `1`/`0`
// says the same thing in the one form both sides read alike, and is what the rest of the module
// sends its flags as. {@see resolveStartOverwrite} for how the decision itself is made.
export function buildStartPayload(
	sourceType: string,
	url: string,
	token: string,
	collectionIds: string[],
	overwrite: boolean = false,
): StartRequest
{
	return { sourceType, url, token, collectionIds, overwrite: overwrite ? 1 : 0 };
}

export function buildGetStatusPayload(sessionId: number): GetStatusRequest
{
	return { sessionId };
}

export function buildCancelPayload(sessionId: number): CancelRequest
{
	return { sessionId };
}

export function buildAcknowledgeFinishPayload(sessionId: number): { sessionId: number }
{
	return { sessionId };
}

export function buildGetConvertedCollectionsPayload(sessionId: number): GetConvertedCollectionsRequest
{
	return { sessionId };
}

// Landing/Wiki import creates "knowledge bases"; Outline stays on "collection".
export function usesKnowledgeBaseTerm(sourceType: string): boolean
{
	return sourceType === SOURCE_TYPE_LANDING || sourceType === SOURCE_TYPE_WIKI;
}

// Where a failed source check belongs on the connection screen. A source with an address and a
// token gets the message on the field its error code names (API-04 keeps those codes unchanged).
// Landing has neither field, so none of its errors - module unavailable, no accessible bases -
// can belong to one: `field: null` means the message describes the source itself.
export function resolveConnectionError(sourceType: string, error: mixed): ConnectionError
{
	const message = String(error?.message ?? '');

	if (sourceType === SOURCE_TYPE_LANDING)
	{
		return {
			field: null,
			message: message === ''
				? Loc.getMessage(importTermMessageCode('NOTE_IMPORT_COLLECTIONS_LOAD_ERROR', sourceType))
				: message,
		};
	}

	return {
		field: error?.code === 'IMPORT_INVALID_TOKEN' ? 'token' : 'url',
		message: message === '' ? Loc.getMessage('NOTE_IMPORT_URL_INVALID') : message,
	};
}

// Returns the phrase code: the `_KB` variant for landing/wiki, otherwise the base code.
// If the `_KB` phrase doesn't exist for the current locale (translated only in ru),
// falls back to the base code so en/de/kz don't render blank text.
export function importTermMessageCode(baseCode: string, sourceType: string): string
{
	if (!usesKnowledgeBaseTerm(sourceType))
	{
		return baseCode;
	}

	const kbCode = `${baseCode}_KB`;

	return Loc.hasMessage(kbCode) || hasPluralForms(kbCode) ? kbCode : baseCode;
}

// A phrase written per number lives in the locale as `_PLURAL_*` only, so its plain code is
// absent - asking `hasMessage` about the plain code alone would call such a phrase missing.
function hasPluralForms(code: string): boolean
{
	return Loc.hasMessage(`${code}_PLURAL_1`);
}

// The phrase of the current term, in the form the count calls for. The `_KB` variants of landing
// and wiki are written per number while the base phrases they fall back to are not, so the code is
// resolved first and only then asked for its own form.
export function importTermMessage(baseCode: string, sourceType: string, count: number): string
{
	const code = importTermMessageCode(baseCode, sourceType);

	return hasPluralForms(code) ? Loc.getMessagePlural(code, count) : Loc.getMessage(code);
}

