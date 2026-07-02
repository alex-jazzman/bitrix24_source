export class SidebarSelectionActions
{
	#state;
	#ensureChildrenLoaded: (collectionId: number, parentId: number | null) => Promise<void>;

	constructor({ state, ensureChildrenLoaded }: {
		state: Object,
		ensureChildrenLoaded: (collectionId: number, parentId: number | null) => Promise<void>,
	})
	{
		this.#state = state;
		this.#ensureChildrenLoaded = ensureChildrenLoaded;
	}

	async selectCollection(collectionId: number, options: { preserveDocumentSelection?: boolean } = {}): Promise<void>
	{
		const preserveDocumentSelection = Boolean(options?.preserveDocumentSelection);
		this.#state.selectedCollectionId.value = Number(collectionId);
		this.#state.selectedSharedView.value = false;
		this.#state.selectedArchiveView.value = false;
		this.#state.selectedRecycleBinView.value = false;
		if (!preserveDocumentSelection)
		{
			this.#state.selectedDocId.value = null;
		}
		await this.#ensureChildrenLoaded(this.#state.selectedCollectionId.value, null);
	}

	selectDocument(docId: mixed): void
	{
		if (docId === null || docId === undefined || docId === '')
		{
			this.#state.selectedDocId.value = null;

			return;
		}

		this.#state.selectedDocId.value = Number(docId);
		this.#state.selectedSharedView.value = false;
		this.#state.selectedArchiveView.value = false;
		this.#state.selectedRecycleBinView.value = false;
	}

	clearSelection(): void
	{
		this.#state.selectedCollectionId.value = null;
		this.#state.selectedDocId.value = null;
	}

	clearDocumentSelection(): void
	{
		this.#state.selectedDocId.value = null;
	}

	setSharedView(active: boolean): void
	{
		const next = Boolean(active);
		this.#state.selectedSharedView.value = next;
		if (next)
		{
			this.#state.selectedCollectionId.value = null;
			this.#state.selectedDocId.value = null;
			this.#state.selectedArchiveView.value = false;
			this.#state.selectedRecycleBinView.value = false;
		}
	}

	setArchiveView(active: boolean): void
	{
		const next = Boolean(active);
		this.#state.selectedArchiveView.value = next;
		if (next)
		{
			this.#state.selectedCollectionId.value = null;
			this.#state.selectedDocId.value = null;
			this.#state.selectedSharedView.value = false;
			this.#state.selectedRecycleBinView.value = false;
		}
	}

	setRecycleBinView(active: boolean): void
	{
		const next = Boolean(active);
		this.#state.selectedRecycleBinView.value = next;
		if (next)
		{
			this.#state.selectedCollectionId.value = null;
			this.#state.selectedDocId.value = null;
			this.#state.selectedSharedView.value = false;
			this.#state.selectedArchiveView.value = false;
		}
	}
}
