import { Loc, Text, Type } from 'main.core';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import { Dialog } from 'ui.system.dialog';
import 'ui.notification';
import { NoteThemeContext } from 'note.ui.theme-context';
import {
	SOURCE_TYPE_OUTLINE,
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
	createDefaultCollectionsScreenState,
	createDefaultConnectionFormState,
	createDefaultOverwriteState,
	createDefaultProgressScreenState,
} from './constants';
import { ImportApi } from './services/import-api';
import { renderCollectionsScreen } from './screens/collections-screen';
import { createConnectionScreen } from './screens/connection-screen';
import type { ConnectionScreenHandle } from './screens/connection-screen';
import { renderOverwriteConfirmScreen } from './screens/overwrite-confirm-screen';
import { renderProgressScreen } from './screens/progress-screen';
import type { ImportDialogOptions } from './type';

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
	#collectionsImportButton: Button | null;
	#collectionsState: Object;
	#overwriteState: Object;
	#progressState: Object;
	#destroyed: boolean;
	#requestId: number;
	#onComplete: ?Function;

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
		this.#collectionsImportButton = null;
		this.#sourceType = this.#connectionForm.sourceType ?? SOURCE_TYPE_OUTLINE;
		this.#collectionsState = createDefaultCollectionsScreenState();
		this.#overwriteState = createDefaultOverwriteState();
		this.#progressState = createDefaultProgressScreenState();
		this.#destroyed = false;
		this.#requestId = 0;
		this.#onComplete = Type.isFunction(options.onComplete) ? options.onComplete : null;
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
		this.#dialog = new Dialog({
			title: this.#resolveTitle(),
			content,
			centerButtons: this.#resolveButtons(),
			width: 700,
			hasOverlay: true,
			closeByEsc: true,
			closeByClickOutside: true,
			events: {
				onHide: () => {
					this.#destroyed = true;
					this.#dialog = null;
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

		this.#connectionForm.isSubmitting = true;
		this.#connectionForm.errorMessage = '';
		this.#render();

		try
		{
			const url = String(this.#connectionForm.url || '').trim();
			const token = String(this.#connectionForm.token || '').trim();
			const sourceType = String(this.#connectionForm.sourceType || this.#sourceType || '').trim();

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
			// Server error from checkConnection — route to the field hinted by the error code.
			const message = String(error?.message || Loc.getMessage('NOTE_IMPORT_URL_INVALID'));
			const targetField = error?.code === 'IMPORT_INVALID_TOKEN' ? 'token' : 'url';
			this.#connectionForm.errors[targetField] = message;
			this.#connectionForm.touched[targetField] = true;
		}
		finally
		{
			this.#connectionForm.isSubmitting = false;
			this.#render();
		}
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
			const value = String(this.#connectionForm.token || '').trim();
			errors.token = value === '' ? Loc.getMessage('NOTE_IMPORT_TOKEN_REQUIRED') : '';
		}
	}

	#validateAllConnectionFields(): void
	{
		this.#validateConnectionField('sourceType');
		this.#validateConnectionField('url');
		this.#validateConnectionField('token');
	}

	#touchAllConnectionFields(): void
	{
		this.#connectionForm.touched.sourceType = true;
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
			this.#validateConnectionField('sourceType');
			// Source change comes from menu, not from input — full sync is safe.
			this.#connectionScreen?.applyState(this.#connectionForm);
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

	#refreshImportButtonState(): void
	{
		this.#collectionsImportButton?.setDisabled(this.#collectionsState.selectedCollectionIds.size === 0);
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
		this.#collectionsState.isLoading = true;
		this.#collectionsState.errorMessage = '';
		this.#render();

		try
		{
			const response = await this.#api.getCollections(buildGetCollectionsPayload(
				this.#sourceType,
				this.#sourceUrl,
				this.#sourceToken,
			));
			this.#collectionsState.collections = response.collections;
		}
		catch (error)
		{
			this.#collectionsState.errorMessage = String(
				error?.message
				|| Loc.getMessage('NOTE_IMPORT_COLLECTIONS_LOAD_ERROR'),
			);
		}
		finally
		{
			this.#collectionsState.isLoading = false;
			this.#render();
		}
	}

	async #toggleCollectionExpanded(collectionId: string): Promise<void>
	{
		if (this.#collectionsState.expandedCollectionIds.has(collectionId))
		{
			this.#collectionsState.expandedCollectionIds.delete(collectionId);
			this.#render();

			return;
		}

		this.#collectionsState.expandedCollectionIds.add(collectionId);
		const treeState = this.#collectionsState.treeByCollectionId.get(collectionId);
		if (treeState?.isLoaded || treeState?.isLoading)
		{
			this.#render();

			return;
		}

		await this.#loadTree(collectionId);
	}

	async #loadTree(collectionId: string): Promise<void>
	{
		this.#collectionsState.treeByCollectionId.set(collectionId, {
			isLoading: true,
			isLoaded: false,
			errorMessage: '',
			documents: [],
		});
		this.#render();

		try
		{
			const response = await this.#api.getDocumentTree(buildGetDocumentTreePayload(
				this.#sourceType,
				this.#sourceUrl,
				this.#sourceToken,
				collectionId,
			));
			this.#collectionsState.treeByCollectionId.set(collectionId, {
				isLoading: false,
				isLoaded: true,
				errorMessage: '',
				documents: response.documents,
			});
		}
		catch (error)
		{
			this.#collectionsState.treeByCollectionId.set(collectionId, {
				isLoading: false,
				isLoaded: false,
				errorMessage: String(error?.message || Loc.getMessage('NOTE_IMPORT_TREE_LOAD_ERROR')),
				documents: [],
			});
		}

		this.#render();
	}

	async #toggleOverwriteCollectionExpanded(collectionId: string): Promise<void>
	{
		if (this.#overwriteState.expandedCollectionIds.has(collectionId))
		{
			this.#overwriteState.expandedCollectionIds.delete(collectionId);
			this.#render();

			return;
		}

		this.#overwriteState.expandedCollectionIds.add(collectionId);
		const treeState = this.#overwriteState.treeByCollectionId.get(collectionId);
		if (treeState?.isLoaded || treeState?.isLoading)
		{
			this.#render();

			return;
		}

		await this.#loadOverwriteTree(collectionId);
	}

	async #loadOverwriteTree(collectionId: string): Promise<void>
	{
		this.#overwriteState.treeByCollectionId.set(collectionId, {
			isLoading: true,
			isLoaded: false,
			errorMessage: '',
			documents: [],
		});
		this.#render();

		try
		{
			const response = await this.#api.getDocumentTree(buildGetDocumentTreePayload(
				this.#sourceType,
				this.#sourceUrl,
				this.#sourceToken,
				collectionId,
			));
			this.#overwriteState.treeByCollectionId.set(collectionId, {
				isLoading: false,
				isLoaded: true,
				errorMessage: '',
				documents: response.documents,
			});
		}
		catch (error)
		{
			this.#overwriteState.treeByCollectionId.set(collectionId, {
				isLoading: false,
				isLoaded: false,
				errorMessage: String(error?.message || Loc.getMessage('NOTE_IMPORT_TREE_LOAD_ERROR')),
				documents: [],
			});
		}

		this.#render();
	}

	async #onStartImport(): Promise<void>
	{
		const collectionIds = [...this.#collectionsState.selectedCollectionIds];
		if (collectionIds.length === 0)
		{
			return;
		}

		try
		{
			const overlapResult = await this.#api.checkOverlap(
				buildCheckOverlapPayload(this.#sourceType, collectionIds),
			);
			if (this.#destroyed)
			{
				return;
			}

			const existingIds = overlapResult?.existingCollectionIds ?? [];
			if (existingIds.length > 0)
			{
				const nextOverwriteState = createDefaultOverwriteState();
				nextOverwriteState.collections = existingIds.map((id) => {
					const collection = this.#collectionsState.collections.find((c) => c.id === id);

					return { id, name: collection ? collection.name : id };
				});

				// Warm tree cache with already-loaded trees from the collections screen.
				for (const id of existingIds)
				{
					const cached = this.#collectionsState.treeByCollectionId.get(id);
					if (cached?.isLoaded)
					{
						nextOverwriteState.treeByCollectionId.set(id, cached);
					}
				}

				this.#overwriteState = nextOverwriteState;
				this.#screen = IMPORT_SCREEN.OVERWRITE_CONFIRM;
				this.#render();

				return;
			}
		}
		catch (error)
		{
			this.#collectionsState.errorMessage = String(error?.message || Loc.getMessage('NOTE_IMPORT_START_ERROR'));
			this.#render();

			return;
		}

		await this.#runStart(false);
	}

	async #onConfirmOverwrite(): Promise<void>
	{
		await this.#runStart(true);
	}

	async #runStart(overwrite: boolean): Promise<void>
	{
		const collectionIds = [...this.#collectionsState.selectedCollectionIds];

		try
		{
			const response = await this.#api.start(buildStartPayload(
				this.#sourceType,
				this.#sourceUrl,
				this.#sourceToken,
				collectionIds,
				overwrite,
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
			this.#collectionsState.errorMessage = String(error?.message || Loc.getMessage('NOTE_IMPORT_START_ERROR'));
			this.#screen = IMPORT_SCREEN.COLLECTIONS;
			this.#render();
		}
	}

	async #runImportLoop(): Promise<void>
	{
		const requestId = ++this.#requestId;
		if (!this.#progressState.isImporting || this.#destroyed || !this.#sessionId)
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

	async #onCancel(): Promise<void>
	{
		if (!this.#sessionId || this.#progressState.isCancelling)
		{
			return;
		}

		this.#progressState.isCancelling = true;
		this.#render();

		try
		{
			await this.#api.cancel(buildCancelPayload(this.#sessionId));
		}
		catch (error)
		{
			this.#progressState.errorMessage = String(error?.message || Loc.getMessage('NOTE_IMPORT_CANCEL_ERROR'));
		}
		finally
		{
			this.#progressState.isImporting = false;
			this.#progressState.isCancelling = false;
			if (this.#progressState.progress)
			{
				this.#progressState.progress.status = IMPORT_PROGRESS_STATUS.CANCELLED;
			}

			this.#render();
		}
	}

	async #onDone(): Promise<void>
	{
		await this.#acknowledgeFinishedSession();

		try
		{
			await this.#onComplete?.();
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

	#render(): void
	{
		if (!this.#dialog || this.#destroyed)
		{
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

		this.#dialog.setTitle(this.#resolveTitle());
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
	}

	#renderButtons(): void
	{
		if (!this.#dialog || this.#destroyed)
		{
			return;
		}

		this.#dialog.setCenterButtons(this.#resolveButtons());
	}

	#resolveTitle(): string
	{
		if (this.#screen === IMPORT_SCREEN.PROGRESS)
		{
			return Loc.getMessage('NOTE_IMPORT_DIALOG_TITLE');
		}

		if (this.#instanceName)
		{
			return Loc.getMessage('NOTE_IMPORT_DIALOG_TITLE_SOURCE')
				.replace('#SOURCE#', Text.encode(this.#instanceName));
		}

		return Loc.getMessage('NOTE_IMPORT_DIALOG_TITLE');
	}

	#resolveContent(): HTMLElement
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
					// (sub-folder expansion, scroll). Just sync the import button's disabled flag in-place.
					this.#refreshImportButtonState();
				},
				onToggleCollectionExpanded: (collectionId) => {
					this.#toggleCollectionExpanded(collectionId);
				},
				onRetryCollectionsLoad: () => {
					this.#loadCollections();
				},
				onRetryTreeLoad: (collectionId) => {
					this.#loadTree(collectionId);
				},
			});
		}

		if (this.#screen === IMPORT_SCREEN.OVERWRITE_CONFIRM)
		{
			return renderOverwriteConfirmScreen(this.#overwriteState, {
				onToggleCollectionExpanded: (collectionId) => {
					this.#toggleOverwriteCollectionExpanded(collectionId);
				},
				onRetryTreeLoad: (collectionId) => {
					this.#loadOverwriteTree(collectionId);
				},
			});
		}

		if (this.#screen === IMPORT_SCREEN.PROGRESS)
		{
			return renderProgressScreen(this.#progressState);
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
			});
		}

		this.#connectionScreen.applyState(this.#connectionForm);

		return this.#connectionScreen.element;
	}

	#resolveButtons(): Button[]
	{
		if (this.#screen === IMPORT_SCREEN.LOADING)
		{
			return [];
		}

		if (this.#screen === IMPORT_SCREEN.CONNECTION)
		{
			const connectButton = new Button({
				size: ButtonSize.LARGE,
				style: AirButtonStyle.FILLED,
				useAirDesign: true,
				text: Loc.getMessage('NOTE_IMPORT_CONNECT'),
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
					onclick: () => {
						this.#dialog?.hide();
					},
				}),
			];
		}

		if (this.#screen === IMPORT_SCREEN.COLLECTIONS)
		{
			const importButton = new Button({
				size: ButtonSize.LARGE,
				style: AirButtonStyle.FILLED,
				useAirDesign: true,
				text: Loc.getMessage('NOTE_IMPORT_START'),
				onclick: () => {
					this.#onStartImport();
				},
			});
			// See connect button comment: { disabled: true } option doesn't drive ButtonState,
			// so the first setDisabled(false) leaves --disabled class on the container.
			importButton.setDisabled(this.#collectionsState.selectedCollectionIds.size === 0);
			this.#collectionsImportButton = importButton;

			return [
				importButton,
				new Button({
					size: ButtonSize.LARGE,
					style: AirButtonStyle.PLAIN,
					useAirDesign: true,
					text: Loc.getMessage('NOTE_IMPORT_BACK'),
					onclick: () => {
						this.#screen = IMPORT_SCREEN.CONNECTION;
						this.#render();
					},
				}),
			];
		}

		this.#collectionsImportButton = null;

		if (this.#screen === IMPORT_SCREEN.OVERWRITE_CONFIRM)
		{
			return [
				new Button({
					size: ButtonSize.LARGE,
					style: AirButtonStyle.FILLED,
					useAirDesign: true,
					text: Loc.getMessage('NOTE_IMPORT_OVERWRITE_CONFIRM'),
					onclick: () => {
						this.#onConfirmOverwrite();
					},
				}),
				new Button({
					size: ButtonSize.LARGE,
					style: AirButtonStyle.PLAIN,
					useAirDesign: true,
					text: Loc.getMessage('NOTE_IMPORT_BACK'),
					onclick: () => {
						this.#screen = IMPORT_SCREEN.COLLECTIONS;
						this.#render();
					},
				}),
			];
		}

		if (this.#progressState.isImporting)
		{
			const cancelButton = new Button({
				size: ButtonSize.LARGE,
				style: AirButtonStyle.PLAIN,
				useAirDesign: true,
				text: Loc.getMessage('NOTE_IMPORT_CANCEL'),
				onclick: () => {
					this.#onCancel();
				},
			});
			cancelButton.setDisabled(this.#progressState.isCancelling);

			return [cancelButton];
		}

		return [
			new Button({
				size: ButtonSize.LARGE,
				style: AirButtonStyle.FILLED,
				useAirDesign: true,
				text: Loc.getMessage('NOTE_IMPORT_DONE'),
				onclick: () => {
					this.#onDone();
				},
			}),
		];
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

			if (result?.active)
			{
				this.#sessionId = result.sessionId;
				this.#screen = IMPORT_SCREEN.PROGRESS;
				this.#progressState.progress = result.progress;
				this.#progressState.errorMessage = '';

				const isInProgress = result.progress?.status === IMPORT_PROGRESS_STATUS.IN_PROGRESS;
				this.#progressState.isImporting = isInProgress;

				// Restore source URL + collection selection from finished session so that
				// Retry can prefill the connection form and pre-select the same collections.
				if (result.progress?.sourceUrl)
				{
					this.#sourceUrl = result.progress.sourceUrl;
					this.#connectionForm.url = result.progress.sourceUrl;
				}
				if (Array.isArray(result.progress?.collectionIds))
				{
					this.#collectionsState.selectedCollectionIds = new Set(result.progress.collectionIds);
				}

				this.#render();
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
		if (!this.#sessionId)
		{
			return;
		}

		try
		{
			await this.#api.acknowledgeFinish(buildAcknowledgeFinishPayload(this.#sessionId));
		}
		catch (error)
		{
			// Acknowledgement is best-effort: we don't want to block the UI on it.
			// Stale records will be cleaned up by checkConnection on the next attempt.
			console.warn('[note import] acknowledgeFinish failed', error);
		}

		this.#sessionId = null;
	}

	#renderLoadingScreen(): HTMLElement
	{
		const container = document.createElement('div');
		container.className = 'note-import-screen note-import-loading';
		container.innerHTML = '<div class="note-import-loading-spinner"></div>';

		return container;
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

		const sourceType = String(this.#connectionForm.sourceType || this.#sourceType || '').trim();
		const url = String(this.#connectionForm.url || '').trim();
		const token = String(this.#connectionForm.token || '').trim();
		if (sourceType === '' || url === '' || token === '')
		{
			return false;
		}

		// Only client-side validation gates submit. errors.url may carry a
		// server-side message after a failed checkConnection — that shouldn't
		// keep the button disabled, the user should be able to retry.
		return /^https?:\/\//i.test(url);
	}
}
