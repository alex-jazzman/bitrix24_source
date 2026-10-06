import { EventEmitter, BaseEvent } from 'main.core.events';
import { App as PermissionsApp } from 'note.permissions';
import { NoteEvent } from '../../services/note-events';
import type { Collection } from '../../type';
import type { SidebarApi } from '../../services/sidebar-api';

export class CollectionUseCases
{
	#api: SidebarApi;
	#dialog: Object;
	#store: Object;
	#uiState: Object;
	#messages: Object;
	#onFail: (error: mixed) => void;
	#emitAction: (action: string, data: Object) => void;
	#isDragging: () => boolean;
	#router: Object | null;
	#homeRouteName: string;
	#documentRouteName: string;
	#workspaceRouteName: string;
	#getRouteDocumentContext: () => Object | null;
	#saveSidebarState: () => void;
	#prefetchTimer: ?TimeoutID = null;
	#handleExternalCollectionRenamed: Function | null = null;

	constructor({
		api,
		dialog,
		store,
		uiState,
		messages,
		onFail,
		emitAction,
		isDragging = () => false,
		router = null,
		routeNames = {},
		getRouteDocumentContext,
		saveSidebarState = () => {},
	}: Object)
	{
		this.#api = api;
		this.#dialog = dialog;
		this.#store = store;
		this.#uiState = uiState;
		this.#messages = messages;
		this.#onFail = onFail;
		this.#emitAction = emitAction;
		this.#isDragging = isDragging;
		this.#router = router;
		this.#homeRouteName = routeNames.home || 'home';
		this.#documentRouteName = routeNames.document || 'document';
		this.#workspaceRouteName = routeNames.workspace || 'workspace';
		this.#getRouteDocumentContext = getRouteDocumentContext || (() => null);
		this.#saveSidebarState = saveSidebarState;

		this.#handleExternalCollectionRenamed = (event) => {
			const { id, name } = event.getData();
			const collectionId = Number(id);
			if (!Number.isInteger(collectionId) || collectionId <= 0)
			{
				return;
			}

			this.#store.actions.updateCollectionLocal(collectionId, { name: String(name || '') });
		};
		EventEmitter.subscribe(NoteEvent.COLLECTION_RENAMED, this.#handleExternalCollectionRenamed);
	}

	// Undoes what the constructor subscribed. See DocumentUseCases::destroy for why a global subscription
	// left behind is not merely untidy.
	destroy(): void
	{
		if (this.#handleExternalCollectionRenamed !== null)
		{
			EventEmitter.unsubscribe(NoteEvent.COLLECTION_RENAMED, this.#handleExternalCollectionRenamed);
			this.#handleExternalCollectionRenamed = null;
		}
	}

	isCollectionExpanded(collectionId: number): boolean
	{
		return Boolean(this.#uiState.expandedCollections[Number(collectionId)]);
	}

	canCreateCollections(): boolean
	{
		return Boolean(this.#store.state.globalPermissions.canEditCollections);
	}

	canEditCollection(collection: Collection): boolean
	{
		return Boolean(collection?.canEditCollection);
	}

	canManageCollectionPermissions(collection: Collection): boolean
	{
		return Boolean(collection?.canManagePermissions);
	}

	async openCollection(collection: Collection): Promise<void>
	{
		await this.#store.actions.selectCollection(collection.id);

		this.#emitAction('onOpenCollection', { collectionId: Number(collection.id) });
	}

	prefetchCollectionChildren(collection: Collection | null): void
	{
		clearTimeout(this.#prefetchTimer);

		if (!collection || this.#isDragging())
		{
			return;
		}

		const collectionId = Number(collection.id);
		this.#prefetchTimer = setTimeout(() => {
			this.#store.actions.prefetchChildren(collectionId, null);
		}, 300);
	}

	async toggleCollectionExpanded(collection: Collection): Promise<void>
	{
		const id = Number(collection.id);
		const nextValue = !this.isCollectionExpanded(id);
		this.#uiState.expandedCollections[id] = nextValue;
		if (nextValue)
		{
			await this.#store.actions.ensureChildrenLoaded(id, null);
		}
		else
		{
			this.#store.actions.clearCollectionExpandedDocs(id);
		}
	}

	toggleCollectionsSection(): void
	{
		this.#uiState.collectionsSectionExpanded = !this.#uiState.collectionsSectionExpanded;
	}

	async loadMoreCollections(): Promise<void>
	{
		if (
			this.#store.state.collectionsLoading.value
			|| !this.#store.state.collectionsHasNextPage.value
		)
		{
			return;
		}

		await this.#store.actions.loadCollections(true);
	}

	async refreshCollections(): Promise<void>
	{
		await this.#store.actions.loadCollections(false);
	}

	createCollection(): void
	{
		if (!this.canCreateCollections())
		{
			return;
		}

		void PermissionsApp.openCollectionCreatePopup({
			onCreated: (collection) => this.#onCollectionCreated(collection),
		});
	}

	async #onCollectionCreated(collection: { id: number, name: string, position?: number }): Promise<void>
	{
		const id = Number(collection?.id);
		if (!Number.isInteger(id) || id <= 0)
		{
			return;
		}

		const name = String(collection?.name || '');
		const maxPosition = this.#store.state.collections.value.reduce(
			(max, item) => Math.max(max, Number(item?.position || 0)),
			0,
		);
		this.#store.actions.insertCollectionLocal({
			id,
			name,
			position: Number(collection?.position || (maxPosition + 1)),
			canEditCollection: true,
			canManagePermissions: true,
		});
		EventEmitter.emit(NoteEvent.COLLECTION_RENAMED, new BaseEvent({
			data: { id, name },
		}));

		// A base created into a closed block opens it, and that is a state to remember like any other:
		// left unsaved, the block would close itself again on the next load.
		this.#uiState.collectionsSectionExpanded = true;
		this.#saveSidebarState();
		this.#uiState.expandedCollections[id] = true;
		await this.openCollection({ id, name });
		if (this.#router && this.#workspaceRouteName)
		{
			await this.#router.push({ name: this.#workspaceRouteName, params: { id } });
		}
	}

	renameCollection(collection: Collection): void
	{
		if (!this.canEditCollection(collection))
		{
			return;
		}

		this.#uiState.renamingCollectionId = Number(collection.id);
	}

	async confirmRenameCollection(collectionId: number, newName: string): Promise<void>
	{
		this.#uiState.renamingCollectionId = null;
		if (!newName)
		{
			return;
		}

		const id = Number(collectionId);
		const current = this.#store.queries.findCollection(id);
		const previousName = current ? String(current.name ?? '') : null;

		if (previousName === newName)
		{
			return;
		}

		this.#store.actions.updateCollectionLocal(id, { name: newName });

		try
		{
			await this.#api.updateCollection(id, newName);
			EventEmitter.emit(NoteEvent.COLLECTION_RENAMED, new BaseEvent({
				data: { id, name: newName },
			}));
		}
		catch (error)
		{
			if (previousName !== null)
			{
				this.#store.actions.updateCollectionLocal(id, { name: previousName });
			}

			this.#onFail(error);
		}
	}

	cancelRenameCollection(): void
	{
		this.#uiState.renamingCollectionId = null;
	}

	#isRouteDocumentInCollection(collectionId: number): boolean
	{
		const normalizedCollectionId = Number(collectionId);
		if (!Number.isInteger(normalizedCollectionId) || normalizedCollectionId <= 0)
		{
			return false;
		}

		const route = this.#router?.currentRoute?.value;
		if (!route || route.name !== this.#documentRouteName)
		{
			return false;
		}

		const routeDoc = this.#getRouteDocumentContext()?.document ?? null;
		if (routeDoc && Number(routeDoc.collectionId) === normalizedCollectionId)
		{
			return true;
		}

		if (routeDoc)
		{
			return false;
		}

		const routeDocId = Number(route.params?.id);
		if (!Number.isInteger(routeDocId) || routeDocId <= 0)
		{
			return false;
		}

		return Boolean(this.#store.queries.findLoadedDocument(normalizedCollectionId, routeDocId));
	}

	async deleteCollection(collection: Collection): Promise<void>
	{
		if (!this.canManageCollectionPermissions(collection))
		{
			return;
		}

		const confirmed = await this.#dialog.confirm(
			this.#messages.confirmDeleteCollection,
			this.#messages.confirmDeleteCollectionTitle,
			this.#messages.delete,
		);
		if (!confirmed)
		{
			return;
		}

		try
		{
			const collectionId = Number(collection.id);
			await this.#api.deleteCollection(collectionId);
			const shouldLeaveDocumentPage = this.#isRouteDocumentInCollection(collectionId);
			this.#store.actions.removeCollectionLocal(collectionId);
			delete this.#uiState.expandedCollections[collectionId];
			if (collectionId === this.#store.state.selectedCollectionId.value)
			{
				this.#store.actions.clearSelection();
			}
			if (shouldLeaveDocumentPage)
			{
				await this.#router?.replace({ name: this.#homeRouteName });
			}
		}
		catch (error)
		{
			this.#onFail(error);
		}
	}

	async archiveCollection(collection: Collection): Promise<void>
	{
		if (!this.canManageCollectionPermissions(collection))
		{
			return;
		}

		const confirmed = await this.#dialog.confirm(
			this.#messages.confirmDeleteCollection,
			this.#messages.confirmDeleteCollectionTitle,
			this.#messages.delete,
		);
		if (!confirmed)
		{
			return;
		}

		try
		{
			const collectionId = Number(collection.id);
			await this.#api.archiveCollection(collectionId);
			const shouldLeaveDocumentPage = this.#isRouteDocumentInCollection(collectionId);
			this.#store.actions.removeCollectionLocal(collectionId);
			delete this.#uiState.expandedCollections[collectionId];
			if (collectionId === this.#store.state.selectedCollectionId.value)
			{
				this.#store.actions.clearSelection();
			}
			if (shouldLeaveDocumentPage)
			{
				await this.#router?.replace({ name: this.#homeRouteName });
			}
		}
		catch (error)
		{
			this.#onFail(error);
		}
	}
}
