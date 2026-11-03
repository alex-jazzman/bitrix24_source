import { Dom, Loc, Tag, Text, Type } from 'main.core';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import { Dialog } from 'ui.system.dialog';
import { LiveAnnouncer } from 'ui.a11y';
import 'ui.notification';
import { App as PermissionsApp } from 'note.permissions';
import { NoteThemeContext } from 'note.ui.theme-context';
import {
	SOURCE_TYPE_OUTLINE,
	SOURCE_TYPE_LANDING,
	SOURCE_TYPE_WIKI,
	IMPORT_POLL_INTERVAL_MS,
	IMPORT_PROGRESS_STATUS,
	IMPORT_SCREEN,
	buildAcknowledgeFinishPayload,
	buildCancelPayload,
	buildCheckConnectionPayload,
	buildCheckOverlapPayload,
	buildGetCollectionsPayload,
	buildGetDocumentTreePayload,
	buildGetStatusPayload,
	buildStartPayload,
	buildGetConvertedCollectionsPayload,
	canFinishImport,
	canRepeatImport,
	canStartImport,
	createDefaultCollectionsScreenState,
	createDefaultConnectionFormState,
	createDefaultOverwriteState,
	createDefaultPermissionsListState,
	createDefaultProgressScreenState,
	createDefaultReimportChoiceState,
	importTermMessageCode,
	isLocalSource,
	resolveAvailableSources,
	resolveCollectionPicks,
	resolveConnectionError,
	resolveConvertedCollectionIdToOpen,
	resolveOverlapScreen,
	resolveRetryRoute,
	resolveStartOverwrite,
	resolveStoppedImportBackScreen,
	RETRY_ROUTE,
	shouldListConvertedCollections,
	shouldOfferPermissionsSetup,
	shouldPollImportStatus,
	shouldRestoreSession,
	toCollectionId,
} from './constants';
import { ImportApi } from './services/import-api';
import { renderCollectionsScreen } from './screens/collections-screen';
import { findCollectionCard, renderTree, setCollectionCardExpanded, setCollectionCardTree } from './screens/parts/collection-card';
import { createConnectionScreen } from './screens/connection-screen';
import type { ConnectionScreenHandle } from './screens/connection-screen';
import { renderOverwriteConfirmScreen } from './screens/overwrite-confirm-screen';
import { renderPermissionsListScreen } from './screens/permissions-list-screen';
import { createProgressScreen, resolveProgressAnnouncement } from './screens/progress-screen';
import type { ProgressScreenHandle } from './screens/progress-screen';
import { renderReimportChoiceScreen } from './screens/reimport-choice-screen';
import type { CheckOverlapResponse, ExistingCollection, ImportDialogOptions } from './type';

export class ImportDialog
{
	#dialog: Dialog | null;
	#api: ImportApi;
	#screen: string;
	#sourceType: string;
	#sourceUrl: string;
	#sourceToken: string;
	#sessionId: number | null;
	#instanceName: string;
	#connectionForm: Object;
	#connectionScreen: ConnectionScreenHandle | null;
	#connectionConnectButton: Button | null;
	#startButton: Button | null;
	#startScreenButtons: Button[];
	#doneButtons: Button[];
	#cancelButton: Button | null;
	#collectionsState: Object;
	#overwriteState: Object;
	#reimportState: Object;
	#startOriginScreen: string | null;
	#isStarting: boolean;
	#progressState: Object;
	#progressScreen: ProgressScreenHandle | null;
	#permissionsListState: Object;
	#destroyed: boolean;
	#requestId: number;
	#onComplete: ?Function;
	#availableSources: Array<Object>;
	#screenNode: HTMLElement | null;
	#buttonsSignature: string;
	#appliedTitle: string;
	#announcedProgress: string;

	constructor(options: ImportDialogOptions = {})
	{
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
		this.#onComplete = Type.isFunction(options.onComplete) ? options.onComplete : null;
		this.#screenNode = null;
		this.#buttonsSignature = '';
		this.#appliedTitle = '';
		this.#announcedProgress = '';

		this.#availableSources = resolveAvailableSources(options);
	}

	show(): void
	{
		if (this.#dialog)
		{
			this.#dialog.show();
			this.#resumeIfNeeded();

			return;
		}

		this.#destroyed = false;

		const content = this.#resolveContent();
		this.#appliedTitle = this.#resolveTitle();
		this.#dialog = new Dialog({
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
				},
			},
		});

		NoteThemeContext.themeDialog(this.#dialog, content, { extraClass: 'note-import-dialog' });
		this.#dialog.show();
		this.#checkActiveSession();
	}

	async #onConnect(): Promise<void>
	{
		this.#touchAllConnectionFields();
		this.#validateAllConnectionFields();

		if (!this.#canSubmitConnection())
		{
			this.#render();
			this.#focusFirstInvalidConnectionField();

			return;
		}

		const sourceType = this.#currentSourceType();
		if (sourceType === SOURCE_TYPE_LANDING)
		{
			await this.#connectLanding();

			return;
		}

		this.#connectionForm.isSubmitting = true;
		this.#connectionForm.errorMessage = '';
		this.#render();

		try
		{
			const url = String(this.#connectionForm.url || '').trim();
			const token = String(this.#connectionForm.token || '').trim();

			const response = await this.#api.checkConnection(buildCheckConnectionPayload(
				sourceType,
				url,
				token,
			));
			if (this.#destroyed)
			{
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
		}
		catch (error)
		{
			this.#applyConnectionError(sourceType, error);
		}
		finally
		{
			this.#connectionForm.isSubmitting = false;
			this.#render();
		}
	}

	async #connectLanding(): Promise<void>
	{
		this.#connectionForm.isSubmitting = true;
		this.#connectionForm.errorMessage = '';
		this.#render();

		try
		{
			// Landing has no remote instance to name, but it does have a source check: it is the
			// only place that tells "the landing module is off" from "you have no bases to convert".
			await this.#api.checkConnection(buildCheckConnectionPayload(SOURCE_TYPE_LANDING, '', ''));
			if (this.#destroyed)
			{
				return;
			}

			this.#sourceType = SOURCE_TYPE_LANDING;
			this.#sourceUrl = '';
			this.#sourceToken = '';
			this.#instanceName = Loc.getMessage('NOTE_IMPORT_SOURCE_LANDING');

			this.#collectionsState = createDefaultCollectionsScreenState();
			this.#screen = IMPORT_SCREEN.COLLECTIONS;
			this.#destroyConnectionScreen();
			await this.#loadCollections();
		}
		catch (error)
		{
			this.#applyConnectionError(SOURCE_TYPE_LANDING, error);
		}
		finally
		{
			this.#connectionForm.isSubmitting = false;
			this.#render();
		}
	}

	#applyConnectionError(sourceType: string, error: mixed): void
	{
		const { field, message } = resolveConnectionError(sourceType, error);
		if (field === null)
		{
			this.#connectionForm.errorMessage = message;

			return;
		}

		this.#connectionForm.errors[field] = message;
		this.#connectionForm.touched[field] = true;
	}

	#validateConnectionField(field: string): void
	{
		const errors = this.#connectionForm.errors;
		if (field === 'sourceType')
		{
			const value = String(this.#connectionForm.sourceType || '').trim();
			errors.sourceType = value === '' ? Loc.getMessage('NOTE_IMPORT_SOURCE_REQUIRED') : '';

			return;
		}

		if (field === 'url')
		{
			// Wiki reads local bases — no URL/token needed.
			if (this.#isWikiSource())
			{
				errors.url = '';

				return;
			}

			const value = String(this.#connectionForm.url || '').trim();
			if (value === '')
			{
				errors.url = Loc.getMessage('NOTE_IMPORT_URL_REQUIRED');

				return;
			}

			if (!/^https?:\/\//i.test(value))
			{
				errors.url = Loc.getMessage('NOTE_IMPORT_URL_INVALID');

				return;
			}

			errors.url = '';

			return;
		}

		if (field === 'token')
		{
			if (this.#isWikiSource())
			{
				errors.token = '';

				return;
			}

			const value = String(this.#connectionForm.token || '').trim();
			errors.token = value === '' ? Loc.getMessage('NOTE_IMPORT_TOKEN_REQUIRED') : '';
		}
	}

	// The source the dialog is dealing with. The form holds it while the user is still picking, and
	// what the form holds is what a source check, a resumed session and every screen after them carry
	// into #sourceType - so the form is asked first and #sourceType answers for the screens that have
	// no form of their own.
	#currentSourceType(): string
	{
		return String(this.#connectionForm.sourceType || this.#sourceType || '').trim();
	}

	#isWikiSource(): boolean
	{
		return this.#currentSourceType() === SOURCE_TYPE_WIKI;
	}

	#validateAllConnectionFields(): void
	{
		this.#validateConnectionField('sourceType');
		if (this.#currentSourceType() === SOURCE_TYPE_LANDING)
		{
			// URL/Token are irrelevant for landing - clear any stale errors so that
			// canSubmit() doesn't trip on them.
			this.#connectionForm.errors.url = '';
			this.#connectionForm.errors.token = '';

			return;
		}

		this.#validateConnectionField('url');
		this.#validateConnectionField('token');
	}

	#touchAllConnectionFields(): void
	{
		this.#connectionForm.touched.sourceType = true;
		if (this.#currentSourceType() === SOURCE_TYPE_LANDING)
		{
			return;
		}

		this.#connectionForm.touched.url = true;
		this.#connectionForm.touched.token = true;
	}

	#hasConnectionErrors(): boolean
	{
		const { errors } = this.#connectionForm;

		return Boolean(errors.sourceType || errors.url || errors.token);
	}

	#onConnectionFieldInput(field: string, value: string): void
	{
		if (field === 'sourceType')
		{
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

		if (field === 'url')
		{
			this.#connectionForm.url = value;
			// Drop server error stuck to URL field as soon as user edits the URL itself.
			// Re-validation below will repopulate it if the new value is still invalid.
			this.#connectionForm.errors.url = '';
		}
		else if (field === 'token')
		{
			this.#connectionForm.token = value;
			// Same idea for the token field — drop a server-side 401/403 hint on the next keystroke.
			this.#connectionForm.errors.token = '';
		}

		if (this.#connectionForm.touched[field])
		{
			this.#validateConnectionField(field);
		}

		// Don't re-apply value back to Vue while user is typing — only sync errors.
		// Also avoid full setCenterButtons re-render: it rebuilds popup content
		// and detaches the focused input. Update button disabled state in place.
		this.#connectionScreen?.syncErrors(this.#connectionForm);
		this.#refreshConnectButtonState();
	}

	#onConnectionFieldBlur(field: string): void
	{
		this.#connectionForm.touched[field] = true;
		this.#validateConnectionField(field);
		this.#connectionScreen?.syncErrors(this.#connectionForm);
		this.#refreshConnectButtonState();
	}

	#destroyConnectionScreen(): void
	{
		this.#connectionScreen?.destroy();
		this.#connectionScreen = null;
		this.#connectionConnectButton = null;
	}

	#refreshConnectButtonState(): void
	{
		this.#connectionConnectButton?.setDisabled(!this.#canSubmitConnection());
	}

	// What the screen asking for a run carries in place. Waiting for the answer belongs to the whole
	// screen and not to the button that asked: while the start is on its way, "Назад" and "Готово"
	// next to it would take the user off the screen, and the answer would then put them onto the
	// progress of a run they have already walked away from. "Готово" waits for that same reason and
	// for one more of its own, so it is held by {@see canFinishImport} instead.
	#syncStartScreenButtons(): void
	{
		this.#startButton?.setDisabled(!this.#canStartImport());

		for (const button of this.#startScreenButtons)
		{
			button.setDisabled(this.#isStarting);
		}
	}

	// What the button finishing the dialog carries in place: the list of converted bases decides what
	// finishing does, and that list is read while the summary holding the button is already on screen.
	#syncDoneButtons(): void
	{
		for (const button of this.#doneButtons)
		{
			button.setDisabled(!this.#canFinishImport());
		}
	}

	#refreshCancelButtonState(): void
	{
		this.#cancelButton?.setDisabled(this.#progressState.isCancelling);
	}

	#canStartImport(): boolean
	{
		return canStartImport(this.#screen, this.#isStarting, this.#collectionsState);
	}

	#canFinishImport(): boolean
	{
		return canFinishImport(this.#isStarting, this.#permissionsListState);
	}

	#focusFirstInvalidConnectionField(): void
	{
		const order = ['sourceType', 'url', 'token'];
		const errors = this.#connectionForm.errors;
		const firstInvalid = order.find((field) => errors[field]);
		if (!firstInvalid)
		{
			return;
		}

		this.#connectionScreen?.focusField(firstInvalid);
	}

	async #loadCollections(): Promise<void>
	{
		const previousPicks = this.#collectionsState.selectedCollectionIds;
		this.#collectionsState.isLoading = true;
		this.#collectionsState.errorMessage = '';
		// Nothing stays ticked over a spinner: the list is being asked for anew and may not come back
		// at all, and a run started over bases the user cannot see is not what a button above a loading
		// list does. What the list does bring back decides which of the picks come with it -
		// {@see resolveCollectionPicks}; a list that does not come back gives them back untouched.
		this.#collectionsState.selectedCollectionIds = new Set();
		this.#render();

		try
		{
			const response = await this.#api.getCollections(buildGetCollectionsPayload(
				this.#sourceType,
				this.#sourceUrl,
				this.#sourceToken,
			));
			this.#collectionsState.collections = response.collections;
			this.#collectionsState.selectedCollectionIds = resolveCollectionPicks(
				previousPicks,
				response.collections,
			);
		}
		catch (error)
		{
			this.#collectionsState.errorMessage = String(
				error?.message
				|| Loc.getMessage(importTermMessageCode('NOTE_IMPORT_COLLECTIONS_LOAD_ERROR', this.#sourceType)),
			);
			// The picks the screen had are given back with the failure: a list that never arrived says
			// nothing about them, and dropping them would leave the next try to tick every base of the
			// portal - while the picks of the way back from a stopped run are the only thing that says
			// what the user was converting.
			this.#collectionsState.selectedCollectionIds = previousPicks;
		}
		finally
		{
			this.#collectionsState.isLoading = false;
			this.#render();
		}
	}

	// The list of bases, entered from a screen standing on top of it. A run restored from a previous
	// visit reaches those screens without the list ever having been asked for, and an empty list
	// there would read as "the source has no base to convert".
	#showCollectionsScreen(): void
	{
		this.#screen = IMPORT_SCREEN.COLLECTIONS;
		this.#render();

		if (this.#collectionsState.collections.length === 0 && !this.#collectionsState.isLoading)
		{
			this.#loadCollections();
		}
	}

	// The base list, the overwrite confirmation and the reimport choice all list bases over their
	// own state, so they share one expansion and one tree cache.
	// Expanding touches that card alone: a full #render() rebuilds the dialog content and destroys
	// the disclosure button the keypress came from, which drops focus on <body> - two bases in a row
	// could not be expanded from the keyboard.
	async #toggleTreeExpanded(state: Object, collectionId: string): Promise<void>
	{
		if (state.expandedCollectionIds.has(collectionId))
		{
			state.expandedCollectionIds.delete(collectionId);
			this.#applyCardExpanded(state, collectionId, false);

			return;
		}

		state.expandedCollectionIds.add(collectionId);
		this.#applyCardExpanded(state, collectionId, true);

		const treeState = state.treeByCollectionId.get(collectionId);
		if (treeState?.isLoaded || treeState?.isLoading)
		{
			return;
		}

		await this.#loadTreeInto(state, collectionId);
	}

	async #loadTreeInto(state: Object, collectionId: string): Promise<void>
	{
		state.treeByCollectionId.set(collectionId, {
			isLoading: true,
			isLoaded: false,
			errorMessage: '',
			documents: [],
		});
		this.#applyCardTree(state, collectionId);

		try
		{
			const response = await this.#api.getDocumentTree(buildGetDocumentTreePayload(
				this.#sourceType,
				this.#sourceUrl,
				this.#sourceToken,
				collectionId,
			));
			state.treeByCollectionId.set(collectionId, {
				isLoading: false,
				isLoaded: true,
				errorMessage: '',
				documents: response.documents,
			});
		}
		catch (error)
		{
			state.treeByCollectionId.set(collectionId, {
				isLoading: false,
				isLoaded: false,
				errorMessage: String(error?.message || Loc.getMessage(importTermMessageCode('NOTE_IMPORT_TREE_LOAD_ERROR', this.#sourceType))),
				documents: [],
			});
		}

		this.#applyCardTree(state, collectionId);
	}

	#applyCardExpanded(state: Object, collectionId: string, isExpanded: boolean): void
	{
		const card = findCollectionCard(this.#screenNode, collectionId);
		if (!card)
		{
			return;
		}

		setCollectionCardExpanded(card, isExpanded);
		if (isExpanded)
		{
			this.#applyCardTree(state, collectionId, card);
		}
	}

	#applyCardTree(state: Object, collectionId: string, knownCard: HTMLElement | null = null): void
	{
		const card = knownCard ?? findCollectionCard(this.#screenNode, collectionId);
		if (!card)
		{
			return;
		}

		setCollectionCardTree(card, renderTree(
			state.treeByCollectionId.get(collectionId),
			collectionId,
			(id) => {
				this.#loadTreeInto(state, id);
			},
			this.#resolveCollectionName(state, collectionId),
			this.#sourceType,
		));
	}

	#resolveCollectionName(state: Object, collectionId: string): string
	{
		const collection = state.collections.find(
			(item) => (item.id ?? item.externalId) === collectionId,
		);

		return collection?.name ?? '';
	}

	async #onStartImport(): Promise<void>
	{
		await this.#guardStart(() => this.#checkOverlapAndStart());
	}

	// Every button asking for a run goes through here, so a press is taken once and the button says so
	// until the answer arrives. A second press reaches the server as a second start, comes back refused
	// with "the transfer is already going", and that refusal is answered by leaving for the list of
	// bases - under which the first run keeps going and rebuilds that list every poll tick. The flag is
	// held here and synced onto the buttons of the screen in place, the way the flags of the source
	// check and of the cancel are, so that waiting for an answer never rebuilds the set of buttons.
	async #guardStart(start: () => Promise<void>): Promise<void>
	{
		if (this.#isStarting)
		{
			return;
		}

		this.#isStarting = true;
		this.#syncButtonStates();

		try
		{
			await start();
		}
		finally
		{
			this.#isStarting = false;
			this.#syncButtonStates();
		}
	}

	async #checkOverlapAndStart(): Promise<void>
	{
		const collectionIds = [...this.#collectionsState.selectedCollectionIds];
		if (collectionIds.length === 0)
		{
			return;
		}

		let overlap = null;
		try
		{
			overlap = await this.#api.checkOverlap(
				buildCheckOverlapPayload(this.#sourceType, collectionIds),
			);
			if (this.#destroyed)
			{
				return;
			}
		}
		catch (error)
		{
			this.#collectionsState.errorMessage = String(error?.message || Loc.getMessage('NOTE_IMPORT_START_ERROR'));
			// The check answers a start that was asked for, so its refusal is shown where a refused
			// start is shown - on the list of bases. A repeat asks for it from the progress screen,
			// and a message written for a screen the user is not on would say nothing at all.
			this.#screen = IMPORT_SCREEN.COLLECTIONS;
			this.#render();

			return;
		}

		const nextScreen = resolveOverlapScreen(this.#sourceType, overlap);
		if (nextScreen === IMPORT_SCREEN.REIMPORT_CHOICE)
		{
			this.#reimportState = this.#buildReimportState(overlap.existingCollections);
			this.#screen = nextScreen;
			this.#render();

			return;
		}

		if (nextScreen === IMPORT_SCREEN.OVERWRITE_CONFIRM)
		{
			this.#overwriteState = this.#buildOverwriteState(overlap);
			this.#screen = nextScreen;
			this.#render();

			return;
		}

		await this.#runStart(IMPORT_SCREEN.COLLECTIONS);
	}

	#buildOverwriteState(overlap: CheckOverlapResponse): Object
	{
		const state = createDefaultOverwriteState();
		state.collections = overlap.existingCollectionIds.map((id) => {
			// The base is named by the list of the source while that list is at hand. A repeat of a
			// run restored from a previous visit reaches this screen without ever having asked for
			// that list, and then the name comes from the answer that found the base: an external id
			// tells the user nothing about what is about to be overwritten.
			const listed = this.#collectionsState.collections.find((collection) => collection.id === id);
			const matched = overlap.existingCollections.find((collection) => collection.externalId === id);

			return { id, name: listed?.name || matched?.name || id };
		});
		this.#warmTreeCache(state, overlap.existingCollectionIds);

		return state;
	}

	#buildReimportState(existingCollections: ExistingCollection[]): Object
	{
		const state = createDefaultReimportChoiceState();
		state.collections = existingCollections;
		this.#warmTreeCache(state, existingCollections.map((collection) => collection.externalId));

		return state;
	}

	#warmTreeCache(state: Object, collectionIds: string[]): void
	{
		for (const id of collectionIds)
		{
			const cached = this.#collectionsState.treeByCollectionId.get(id);
			if (cached?.isLoaded)
			{
				state.treeByCollectionId.set(id, cached);
			}
		}
	}

	async #onConfirmOverwrite(): Promise<void>
	{
		await this.#guardStart(() => this.#runStart(IMPORT_SCREEN.OVERWRITE_CONFIRM));
	}

	#onReimportActionChange(action: string): void
	{
		if (this.#reimportState.action === action)
		{
			return;
		}

		this.#reimportState.action = action;
		this.#reimportState.errorMessage = '';

		// Re-rendering here would destroy the radio the arrow key just moved to and leave focus on
		// <body>, so the next arrow press would do nothing. The choice itself is held by the native
		// input; all the screen owes the change is dropping the refusal the previous try left.
		Dom.remove(this.#screenNode?.querySelector('[data-testid="note-import-reimport-error"]'));
	}

	async #onConfirmReimport(): Promise<void>
	{
		this.#reimportState.errorMessage = '';
		await this.#guardStart(() => this.#runStart(IMPORT_SCREEN.REIMPORT_CHOICE));
	}

	async #runStart(originScreen: string): Promise<void>
	{
		this.#permissionsListState = createDefaultPermissionsListState();
		// From here on the run on the progress screen is one this dialog started, so the screen it
		// came from - and the decision that screen carried - is known to a repeat of it.
		this.#startOriginScreen = originScreen;

		const collectionIds = [...this.#collectionsState.selectedCollectionIds];

		try
		{
			const response = await this.#api.start(buildStartPayload(
				this.#sourceType,
				this.#sourceUrl,
				this.#sourceToken,
				collectionIds,
				resolveStartOverwrite(originScreen, this.#reimportState),
			));
			this.#sessionId = response.sessionId;
			this.#screen = IMPORT_SCREEN.PROGRESS;
			this.#progressState.progress = response.progress;
			this.#progressState.errorMessage = '';
			this.#progressState.isImporting = true;
			this.#progressState.isCancelling = false;
			this.#render();
			this.#scheduleNextTick();
		}
		catch (error)
		{
			const message = String(error?.message || Loc.getMessage('NOTE_IMPORT_START_ERROR'));

			// A refused update (IMPORT_COLLECTION_FORBIDDEN) is answered on the screen that asked
			// for it: from there the user can switch to creating a new base and try again.
			if (this.#screen === IMPORT_SCREEN.REIMPORT_CHOICE)
			{
				this.#reimportState.errorMessage = message;
				this.#render();

				return;
			}

			this.#collectionsState.errorMessage = message;
			this.#screen = IMPORT_SCREEN.COLLECTIONS;
			this.#render();
		}
	}

	async #runImportLoop(): Promise<void>
	{
		const requestId = ++this.#requestId;
		if (this.#destroyed || !shouldPollImportStatus(this.#progressState, this.#sessionId))
		{
			return;
		}

		try
		{
			const response = await this.#api.getStatus(buildGetStatusPayload(this.#sessionId));
			if (this.#destroyed || requestId !== this.#requestId)
			{
				return;
			}

			this.#progressState.progress = response.progress;

			if (response.progress.status !== IMPORT_PROGRESS_STATUS.IN_PROGRESS)
			{
				this.#progressState.isImporting = false;
				if (this.#sourceType === SOURCE_TYPE_LANDING)
				{
					await this.#loadConvertedCollections();
				}
				this.#render();

				return;
			}

			this.#progressState.errorMessage = '';
			this.#render();
			this.#scheduleNextTick();
		}
		catch (error)
		{
			if (this.#destroyed || requestId !== this.#requestId)
			{
				return;
			}

			this.#progressState.errorMessage = String(
				error?.message
				|| Loc.getMessage('NOTE_IMPORT_STATUS_ERROR'),
			);
			this.#progressState.isImporting = false;
			this.#render();
		}
	}

	// The run stopped on the server, as opposed to a status request that failed on the client.
	// Only the former makes a retry safe: a failed poll leaves the import running.
	#hasStoppedImport(): boolean
	{
		return this.#progressState.errorMessage === ''
			&& this.#progressState.progress?.status === IMPORT_PROGRESS_STATUS.ERROR;
	}

	async #onBackFromStoppedImport(): Promise<void>
	{
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
		if (this.#screen === IMPORT_SCREEN.COLLECTIONS && this.#collectionsState.collections.length === 0)
		{
			await this.#loadCollections();
		}
	}

	async #onRetryImport(): Promise<void>
	{
		await this.#guardStart(() => this.#retryStoppedImport());
	}

	async #retryStoppedImport(): Promise<void>
	{
		const route = resolveRetryRoute(
			this.#startOriginScreen,
			this.#collectionsState.selectedCollectionIds.size,
		);

		if (route === RETRY_ROUTE.BACK)
		{
			await this.#onBackFromStoppedImport();

			return;
		}

		this.#progressState.errorMessage = '';

		if (route === RETRY_ROUTE.CHECK_OVERLAP)
		{
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

	async #onCancel(): Promise<void>
	{
		if (!this.#sessionId || this.#progressState.isCancelling)
		{
			return;
		}

		// The run ends here, and the poll of it ends with it. A status answer asked before the cancel
		// comes back telling the run is going, over the status the cancel writes below: the poll drops
		// its own outdated answers by this number, so ending the run moves it on the way a next ask
		// would. And no next ask is sent while the cancel is on its way - {@see shouldPollImportStatus}.
		this.#requestId++;
		this.#progressState.isCancelling = true;
		this.#render();

		try
		{
			await this.#api.cancel(buildCancelPayload(this.#sessionId));
		}
		catch (error)
		{
			// Only an answer that arrived says the run is over: a cancel that failed leaves it going
			// at the server, and a state calling it cancelled would say the opposite of what is
			// happening. The poll was stopped for the cancel alone, so it is put back on - the run
			// keeps being reported and the button asking to stop it can be pressed again.
			this.#progressState.errorMessage = String(error?.message || Loc.getMessage('NOTE_IMPORT_CANCEL_ERROR'));
			this.#progressState.isCancelling = false;
			this.#render();
			this.#scheduleNextTick();

			return;
		}

		this.#progressState.isImporting = false;
		this.#progressState.isCancelling = false;
		if (this.#progressState.progress)
		{
			this.#progressState.progress.status = IMPORT_PROGRESS_STATUS.CANCELLED;
		}

		this.#render();
		// Cancelling stops the run but keeps the bases created before it - read them
		// the same way a finished run does, so the summary can name what stayed.
		await this.#loadConvertedCollections();
	}

	async #onDone(): Promise<void>
	{
		if (this.#shouldListImportedCollections())
		{
			this.#screen = IMPORT_SCREEN.PERMISSIONS_LIST;
			this.#render();

			return;
		}

		// Read the collection to open before the ack - acknowledgeFinishedSession()
		// clears #sessionId, and getConvertedCollections needs it.
		const collectionId = await this.#resolveCollectionIdToOpen();

		await this.#acknowledgeFinishedSession();

		try
		{
			await this.#onComplete?.(collectionId ?? undefined);
		}
		catch (error)
		{
			BX.UI.Notification.Center.notify({
				content: String(error?.message || ''),
				position: 'top-right',
			});
		}

		this.#dialog?.hide();
	}

	#shouldListImportedCollections(): boolean
	{
		return shouldListConvertedCollections(
			this.#sourceType,
			this.#screen,
			this.#progressState.progress,
			this.#permissionsListState.collections,
		);
	}

	#shouldOfferPermissionsSetup(): boolean
	{
		return shouldOfferPermissionsSetup(
			this.#sourceType,
			this.#screen,
			this.#progressState.progress,
			this.#permissionsListState.collections,
		);
	}

	async #resolveCollectionIdToOpen(): Promise<number | null>
	{
		if (this.#sourceType !== SOURCE_TYPE_LANDING)
		{
			return this.#resolveLastImportedCollectionId();
		}

		return resolveConvertedCollectionIdToOpen(this.#permissionsListState.collections);
	}

	async #resolveLastImportedCollectionId(): Promise<number | null>
	{
		if (!this.#sessionId)
		{
			return null;
		}

		try
		{
			const response = await this.#api.getConvertedCollections(
				buildGetConvertedCollectionsPayload(this.#sessionId),
			);
			const list = response?.collections ?? [];

			return toCollectionId(list[list.length - 1]?.collectionId);
		}
		catch
		{
			return null;
		}
	}

	async #loadConvertedCollections(force: boolean = false): Promise<void>
	{
		if (!this.#sessionId || this.#sourceType !== SOURCE_TYPE_LANDING)
		{
			return;
		}

		if (this.#permissionsListState.isLoading)
		{
			return;
		}

		if (this.#permissionsListState.hasLoaded && !force)
		{
			return;
		}

		this.#permissionsListState.isLoading = true;
		this.#permissionsListState.errorMessage = '';
		this.#render();

		try
		{
			const response = await this.#api.getConvertedCollections(
				buildGetConvertedCollectionsPayload(this.#sessionId),
			);
			if (this.#destroyed)
			{
				return;
			}

			this.#permissionsListState.collections = response.collections;
		}
		catch (error)
		{
			this.#permissionsListState.errorMessage = String(
				error?.message || Loc.getMessage('NOTE_IMPORT_PERMISSIONS_LIST_LOAD_ERROR'),
			);
			this.#permissionsListState.collections = [];
		}
		finally
		{
			this.#permissionsListState.isLoading = false;
			this.#permissionsListState.hasLoaded = true;
			this.#render();
		}
	}

	#render(): void
	{
		if (!this.#dialog || this.#destroyed)
		{
			return;
		}

		if (this.#updateProgressInPlace())
		{
			this.#renderButtons();
			this.#announceProgress();

			return;
		}

		// setContent rebuilds the popup DOM, which resets scroll on the collection list.
		// Capture scrollTop of any scrollable inner container before re-render and reapply after.
		const scrollSnapshots: Array<[string, number]> = [];
		const popupContent = this.#dialog.getContainer?.() ?? document;
		for (const selector of ['.note-import-collection-list', '.note-import-screen'])
		{
			const node = popupContent.querySelector?.(selector);
			if (node && node.scrollTop > 0)
			{
				scrollSnapshots.push([selector, node.scrollTop]);
			}
		}

		this.#applyTitle();
		this.#dialog.setContent(this.#resolveContent());
		this.#renderButtons();

		if (scrollSnapshots.length > 0)
		{
			const root = this.#dialog.getContainer?.() ?? document;
			for (const [selector, top] of scrollSnapshots)
			{
				const node = root.querySelector?.(selector);
				if (node)
				{
					node.scrollTop = top;
				}
			}
		}

		if (this.#screen === IMPORT_SCREEN.PROGRESS)
		{
			this.#announceProgress();
		}
	}

	// A poll tick brings new numbers for the screen already on display, not a new screen, so the
	// progress screen updates its own nodes instead of being built again. Neither setContent nor
	// setTitle may be called for it: both rebuild the whole popup, which restarts the bar and
	// leaves focus on <body> - every five seconds, for as long as the import runs. The title of
	// the dialog doesn't change while the run goes on, so nothing is lost by not setting it.
	#updateProgressInPlace(): boolean
	{
		const element = this.#progressScreen?.element;
		if (this.#screen !== IMPORT_SCREEN.PROGRESS || !element)
		{
			return false;
		}

		// The screen is only updated where it stands - if it isn't what the dialog currently shows,
		// the caller has to go through a full render to put it there.
		if (this.#screenNode !== element || !element.isConnected)
		{
			return false;
		}

		this.#applyProgressState();

		return true;
	}

	#applyProgressState(): void
	{
		this.#progressScreen?.applyState(
			this.#progressState,
			this.#sourceType,
			this.#permissionsListState.collections,
		);
	}

	// The import runs behind a poll, so nothing on the progress screen reaches a screen reader by
	// itself: the live region of ui.a11y lives in the body, outside everything the dialog rebuilds,
	// and a region rebuilt together with the content would announce nothing at all.
	#announceProgress(): void
	{
		const announcement = resolveProgressAnnouncement(
			this.#progressState,
			this.#sourceType,
			this.#permissionsListState.collections,
		);
		if (announcement === '' || announcement === this.#announcedProgress)
		{
			return;
		}

		this.#announcedProgress = announcement;
		LiveAnnouncer.announce(announcement);
	}

	#renderButtons(): void
	{
		if (!this.#dialog || this.#destroyed)
		{
			return;
		}

		// Rebuilding buttons replaces their nodes, and a running import renders every poll tick:
		// without this the focus on the cancel button would be lost every 5 seconds.
		if (this.#resolveButtonsSignature() === this.#buttonsSignature)
		{
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
	#syncButtonStates(): void
	{
		this.#refreshConnectButtonState();
		this.#syncStartScreenButtons();
		this.#syncDoneButtons();
		this.#refreshCancelButtonState();
	}

	#createButtons(): Button[]
	{
		this.#buttonsSignature = this.#resolveButtonsSignature();

		return this.#resolveButtons();
	}

	// Everything #resolveButtons() reads to decide which buttons the screen has and what they say.
	// States they carry in place - disabled, above all - are synced through the button objects
	// themselves and don't belong here.
	#resolveButtonsSignature(): string
	{
		return [
			this.#screen,
			this.#connectionForm.sourceType,
			this.#sourceType,
			this.#progressState.isImporting,
			this.#hasStoppedImport(),
			this.#canRepeatImport(),
			this.#shouldOfferPermissionsSetup(),
		].join('|');
	}

	#canRepeatImport(): boolean
	{
		return canRepeatImport(this.#sourceType, this.#sourceToken);
	}

	// The title of the dialog, given to it only when it differs from the one already standing there.
	// Setting a title rebuilds the whole window - header, content and footer alike - so setting the
	// same title again costs a rebuild and changes nothing.
	#applyTitle(): void
	{
		const title = this.#resolveTitle();
		if (title === this.#appliedTitle)
		{
			return;
		}

		this.#appliedTitle = title;
		this.#dialog?.setTitle(title);
	}

	#resolveTitle(): string
	{
		const sourceType = this.#currentSourceType();

		// Landing gets a title of its own instead of the "#SOURCE#" join: that join only reads as
		// Russian for a source name that doesn't decline, and the landing one does. The source is
		// asked before the screen is: the bases converted are the ones of this very portal, and
		// calling them external on the screen the run spends its whole time on would be wrong.
		if (sourceType === SOURCE_TYPE_LANDING)
		{
			return Loc.getMessage('NOTE_IMPORT_DIALOG_TITLE_LANDING');
		}

		if (this.#screen === IMPORT_SCREEN.PROGRESS)
		{
			return Loc.getMessage('NOTE_IMPORT_DIALOG_TITLE');
		}

		// The name of an instance belongs to the source it was read from: while the form asks about
		// another source, that source has not been connected to and has no instance to name.
		if (this.#instanceName && sourceType === this.#sourceType)
		{
			return Loc.getMessage('NOTE_IMPORT_DIALOG_TITLE_SOURCE')
				.replace('#SOURCE#', Text.encode(this.#instanceName));
		}

		return Loc.getMessage('NOTE_IMPORT_DIALOG_TITLE');
	}

	#resolveContent(): HTMLElement
	{
		// Kept so that a local update finds its own nodes without a re-render: re-rendering
		// destroys whatever the user has in focus.
		this.#screenNode = this.#buildScreen();

		return this.#screenNode;
	}

	#buildScreen(): HTMLElement
	{
		if (this.#screen === IMPORT_SCREEN.LOADING)
		{
			return this.#renderLoadingScreen();
		}

		if (this.#screen === IMPORT_SCREEN.COLLECTIONS)
		{
			return renderCollectionsScreen(this.#collectionsState, {
				onToggleCollectionSelection: (collectionId) => {
					if (this.#collectionsState.selectedCollectionIds.has(collectionId))
					{
						this.#collectionsState.selectedCollectionIds.delete(collectionId);
					}
					else
					{
						this.#collectionsState.selectedCollectionIds.add(collectionId);
					}

					// Avoid full #render(): setContent rebuilds popup DOM and resets per-card local state
					// (sub-folder expansion, scroll). Just sync the buttons' disabled flags in place.
					this.#syncStartScreenButtons();
				},
				onToggleCollectionExpanded: (collectionId) => {
					this.#toggleTreeExpanded(this.#collectionsState, collectionId);
				},
				onRetryCollectionsLoad: () => {
					this.#loadCollections();
				},
				onRetryTreeLoad: (collectionId) => {
					this.#loadTreeInto(this.#collectionsState, collectionId);
				},
				sourceType: this.#sourceType,
			});
		}

		if (this.#screen === IMPORT_SCREEN.OVERWRITE_CONFIRM)
		{
			return renderOverwriteConfirmScreen(this.#overwriteState, {
				onToggleCollectionExpanded: (collectionId) => {
					this.#toggleTreeExpanded(this.#overwriteState, collectionId);
				},
				onRetryTreeLoad: (collectionId) => {
					this.#loadTreeInto(this.#overwriteState, collectionId);
				},
				sourceType: this.#sourceType,
			});
		}

		if (this.#screen === IMPORT_SCREEN.REIMPORT_CHOICE)
		{
			return renderReimportChoiceScreen(this.#reimportState, {
				onActionChange: (action) => {
					this.#onReimportActionChange(action);
				},
				onToggleCollectionExpanded: (collectionId) => {
					this.#toggleTreeExpanded(this.#reimportState, collectionId);
				},
				onRetryTreeLoad: (collectionId) => {
					this.#loadTreeInto(this.#reimportState, collectionId);
				},
				sourceType: this.#sourceType,
			});
		}

		if (this.#screen === IMPORT_SCREEN.PROGRESS)
		{
			this.#progressScreen ??= createProgressScreen();
			this.#applyProgressState();

			return this.#progressScreen.element;
		}

		if (this.#screen === IMPORT_SCREEN.PERMISSIONS_LIST)
		{
			return renderPermissionsListScreen(this.#permissionsListState, {
				onRetry: () => {
					this.#loadConvertedCollections(true);
				},
				onOpenPermissions: (collection) => {
					PermissionsApp.openCollectionPopup(collection.collectionId, {
						collectionName: collection.name,
					});
				},
			});
		}

		if (!this.#connectionScreen)
		{
			this.#connectionScreen = createConnectionScreen({
				onSourceChange: (value) => {
					this.#onConnectionFieldInput('sourceType', value);
					this.#onConnectionFieldBlur('sourceType');
				},
				onUrlInput: (value) => {
					this.#onConnectionFieldInput('url', value);
				},
				onUrlBlur: () => {
					this.#onConnectionFieldBlur('url');
				},
				onTokenInput: (value) => {
					this.#onConnectionFieldInput('token', value);
				},
				onTokenBlur: () => {
					this.#onConnectionFieldBlur('token');
				},
				onSubmit: () => {
					this.#onConnect();
				},
			}, this.#availableSources);
		}

		this.#connectionScreen.applyState(this.#connectionForm);

		return this.#connectionScreen.element;
	}

	// The button that asks for a run: the base list, both confirmations and the repeat of a stopped
	// run all have one, and only one of those screens is on display at a time. That one is kept, so
	// that what the button carries in place - being refused - is synced onto it without a rebuild.
	#createStartButton(text: string, testId: string, onclick: () => void): Button
	{
		const button = new Button({
			size: ButtonSize.LARGE,
			style: AirButtonStyle.FILLED,
			useAirDesign: true,
			text,
			dataset: { testid: testId },
			onclick,
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
	#trackStartScreenButton(button: Button): Button
	{
		button.setDisabled(this.#isStarting);
		this.#startScreenButtons.push(button);

		return button;
	}

	// The button that finishes the dialog: the summary of a run has one, and so has the list of what
	// the run converted. It is kept for the reason the button asking for a run is kept - it waits for
	// an answer in place, and the wait is not worth rebuilding the set of buttons for.
	#trackDoneButton(button: Button): Button
	{
		button.setDisabled(!this.#canFinishImport());
		this.#doneButtons.push(button);

		return button;
	}

	#resolveButtons(): Button[]
	{
		// The buttons of the screen being left go away with their nodes, so what is synced in place
		// is only ever what the branches below build for the screen currently on display.
		this.#connectionConnectButton = null;
		this.#startButton = null;
		this.#startScreenButtons = [];
		this.#doneButtons = [];
		this.#cancelButton = null;

		if (this.#screen === IMPORT_SCREEN.LOADING)
		{
			return [];
		}

		if (this.#screen === IMPORT_SCREEN.CONNECTION)
		{
			// Landing and wiki are local sources with no remote connection step - the
			// action just reveals the local bases to pick, so the button reads "Выбрать"
			// rather than "Подключиться".
			const submitMessageId = isLocalSource(this.#currentSourceType())
				? 'NOTE_IMPORT_SELECT'
				: 'NOTE_IMPORT_CONNECT';
			const connectButton = new Button({
				size: ButtonSize.LARGE,
				style: AirButtonStyle.FILLED,
				useAirDesign: true,
				text: Loc.getMessage(submitMessageId),
				dataset: { testid: 'note-import-connect' },
				onclick: () => {
					this.#onConnect();
				},
			});
			// Sync via setDisabled so internal state is wired to the disabled CSS class.
			// Passing { disabled: true } in options sets the class but leaves this.state = null,
			// which makes the first setDisabled(false) a visual no-op.
			connectButton.setDisabled(!this.#canSubmitConnection());
			this.#connectionConnectButton = connectButton;

			return [
				connectButton,
				new Button({
					size: ButtonSize.LARGE,
					style: AirButtonStyle.PLAIN,
					useAirDesign: true,
					text: Loc.getMessage('NOTE_IMPORT_DIALOG_CANCEL_BUTTON'),
					dataset: { testid: 'note-import-close' },
					onclick: () => {
						this.#dialog?.hide();
					},
				}),
			];
		}

		if (this.#screen === IMPORT_SCREEN.COLLECTIONS)
		{
			return [
				this.#createStartButton(
					Loc.getMessage('NOTE_IMPORT_START'),
					'note-import-start',
					() => {
						this.#onStartImport();
					},
				),
				this.#trackStartScreenButton(new Button({
					size: ButtonSize.LARGE,
					style: AirButtonStyle.PLAIN,
					useAirDesign: true,
					text: Loc.getMessage('NOTE_IMPORT_BACK'),
					dataset: { testid: 'note-import-back' },
					onclick: () => {
						this.#screen = IMPORT_SCREEN.CONNECTION;
						this.#render();
					},
				})),
			];
		}

		if (this.#screen === IMPORT_SCREEN.REIMPORT_CHOICE)
		{
			return [
				this.#createStartButton(
					Loc.getMessage('NOTE_IMPORT_OVERWRITE_CONFIRM'),
					'note-import-reimport-confirm',
					() => {
						this.#onConfirmReimport();
					},
				),
				this.#trackStartScreenButton(new Button({
					size: ButtonSize.LARGE,
					style: AirButtonStyle.PLAIN,
					useAirDesign: true,
					text: Loc.getMessage('NOTE_IMPORT_BACK'),
					dataset: { testid: 'note-import-back' },
					onclick: () => {
						this.#showCollectionsScreen();
					},
				})),
			];
		}

		if (this.#screen === IMPORT_SCREEN.OVERWRITE_CONFIRM)
		{
			return [
				this.#createStartButton(
					Loc.getMessage('NOTE_IMPORT_OVERWRITE_CONFIRM'),
					'note-import-overwrite-confirm',
					() => {
						this.#onConfirmOverwrite();
					},
				),
				this.#trackStartScreenButton(new Button({
					size: ButtonSize.LARGE,
					style: AirButtonStyle.PLAIN,
					useAirDesign: true,
					text: Loc.getMessage('NOTE_IMPORT_BACK'),
					dataset: { testid: 'note-import-back' },
					onclick: () => {
						this.#showCollectionsScreen();
					},
				})),
			];
		}

		if (this.#progressState.isImporting)
		{
			const cancelButton = new Button({
				size: ButtonSize.LARGE,
				style: AirButtonStyle.PLAIN,
				useAirDesign: true,
				text: Loc.getMessage('NOTE_IMPORT_CANCEL'),
				dataset: { testid: 'note-import-cancel' },
				onclick: () => {
					this.#onCancel();
				},
			});
			cancelButton.setDisabled(this.#progressState.isCancelling);
			this.#cancelButton = cancelButton;

			return [cancelButton];
		}

		if (this.#screen === IMPORT_SCREEN.PERMISSIONS_LIST)
		{
			return [
				this.#trackDoneButton(new Button({
					size: ButtonSize.LARGE,
					style: AirButtonStyle.FILLED,
					useAirDesign: true,
					text: Loc.getMessage('NOTE_IMPORT_DONE'),
					dataset: { testid: 'note-import-done' },
					onclick: () => {
						this.#onDone();
					},
				})),
			];
		}

		if (this.#screen === IMPORT_SCREEN.PROGRESS && this.#hasStoppedImport())
		{
			const stoppedButtons = [];

			// A repeat is offered only while the run can actually be repeated: a session restored on
			// opening the dialog carries no token of the source, and starting the same run without it
			// would be refused at the source. The way back then leads to the connection screen, where
			// the token is entered anew.
			if (this.#canRepeatImport())
			{
				stoppedButtons.push(this.#createStartButton(
					Loc.getMessage('NOTE_IMPORT_RETRY'),
					// Not `note-import-retry`: that one already marks "retry loading the tree"
					// inside a base card, and this button restarts the import itself.
					'note-import-error-retry',
					() => {
						this.#onRetryImport();
					},
				));
			}

			stoppedButtons.push(
				this.#trackStartScreenButton(new Button({
					size: ButtonSize.LARGE,
					style: AirButtonStyle.PLAIN,
					useAirDesign: true,
					text: Loc.getMessage('NOTE_IMPORT_BACK'),
					dataset: { testid: 'note-import-back' },
					onclick: () => {
						this.#onBackFromStoppedImport();
					},
				})),
				this.#trackDoneButton(new Button({
					size: ButtonSize.LARGE,
					style: AirButtonStyle.PLAIN,
					useAirDesign: true,
					text: Loc.getMessage('NOTE_IMPORT_DONE'),
					dataset: { testid: 'note-import-done' },
					onclick: () => {
						this.#onDone();
					},
				})),
			);

			return stoppedButtons;
		}

		const doneButtons = [];
		if (this.#shouldOfferPermissionsSetup())
		{
			doneButtons.push(new Button({
				size: ButtonSize.LARGE,
				style: AirButtonStyle.PLAIN,
				useAirDesign: true,
				text: Loc.getMessage('NOTE_IMPORT_PERMISSIONS_CONFIGURE'),
				dataset: { testid: 'note-import-permissions-configure' },
				onclick: () => {
					this.#screen = IMPORT_SCREEN.PERMISSIONS_LIST;
					this.#render();
				},
			}));
		}

		doneButtons.push(this.#trackDoneButton(new Button({
				size: ButtonSize.LARGE,
				style: AirButtonStyle.FILLED,
				useAirDesign: true,
				text: Loc.getMessage('NOTE_IMPORT_DONE'),
				dataset: { testid: 'note-import-done' },
				onclick: () => {
					this.#onDone();
				},
			})));

		return doneButtons;
	}

	async #checkActiveSession(): Promise<void>
	{
		try
		{
			const result = await this.#api.getActiveSession();
			if (this.#destroyed)
			{
				return;
			}

			if (shouldRestoreSession(result))
			{
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
				if (result.progress.sourceUrl)
				{
					this.#sourceUrl = result.progress.sourceUrl;
					this.#connectionForm.url = result.progress.sourceUrl;
				}
				if (Array.isArray(result.progress.collectionIds))
				{
					this.#collectionsState.selectedCollectionIds = new Set(result.progress.collectionIds);
				}

				this.#render();
				if (!isInProgress && this.#sourceType === SOURCE_TYPE_LANDING)
				{
					await this.#loadConvertedCollections();
				}
				if (isInProgress)
				{
					this.#scheduleNextTick();
				}

				return;
			}
		}
		catch
		{
			// Request failed — fall through to connection screen.
		}

		if (!this.#destroyed && this.#screen === IMPORT_SCREEN.LOADING)
		{
			this.#screen = IMPORT_SCREEN.CONNECTION;
			this.#render();
		}
	}

	async #acknowledgeFinishedSession(): Promise<void>
	{
		const sessionId = this.#sessionId;
		if (!sessionId)
		{
			return;
		}

		// The session is let go before the answer comes back, not after it: the answer arrives while
		// the user is already on another screen, and by then the dialog may hold the session of a run
		// they have just started. Clearing it then would leave that run without a poll - it goes on at
		// the server while the progress screen stands still. Nothing here reads the id afterwards, so
		// letting it go early costs nothing.
		this.#sessionId = null;

		try
		{
			await this.#api.acknowledgeFinish(buildAcknowledgeFinishPayload(sessionId));
		}
		catch (error)
		{
			// Acknowledgement is best-effort: we don't want to block the UI on it.
			// A session left behind is dropped by the next start, which clears the previous
			// finished session of the user before creating its own. The source check clears
			// nothing: it only refuses while a run is still going.
			console.warn('[note import] acknowledgeFinish failed', error);
		}
	}

	// The first screen of the dialog, shown while the active session is read. The spinner says
	// nothing on its own, so the state is spelled out for a screen reader next to it.
	#renderLoadingScreen(): HTMLElement
	{
		return Tag.render`
			<div class="note-import-screen note-import-loading" role="status">
				<div class="note-import-loading-spinner"></div>
				<visually-hidden>${Text.encode(Loc.getMessage('NOTE_IMPORT_LOADING'))}</visually-hidden>
			</div>
		`;
	}

	#resumeIfNeeded(): void
	{
		if (
			this.#sessionId
			&& this.#screen === IMPORT_SCREEN.PROGRESS
			&& this.#progressState.progress?.status === IMPORT_PROGRESS_STATUS.IN_PROGRESS
		)
		{
			this.#progressState.isImporting = true;
			this.#render();
			this.#runImportLoop();
		}
	}

	#scheduleNextTick(): void
	{
		setTimeout(() => {
			this.#runImportLoop();
		}, IMPORT_POLL_INTERVAL_MS);
	}

	#canSubmitConnection(): boolean
	{
		if (this.#connectionForm.isSubmitting)
		{
			return false;
		}

		const sourceType = this.#currentSourceType();
		if (sourceType === '')
		{
			return false;
		}

		if (isLocalSource(sourceType))
		{
			return true;
		}

		const url = String(this.#connectionForm.url || '').trim();
		const token = String(this.#connectionForm.token || '').trim();
		if (url === '' || token === '')
		{
			return false;
		}

		// Only client-side validation gates submit. errors.url may carry a
		// server-side message after a failed checkConnection — that shouldn't
		// keep the button disabled, the user should be able to retry.
		return /^https?:\/\//i.test(url);
	}
}
