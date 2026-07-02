import type { SidebarDocument } from '../../../type';

export class SidebarExpansionActions
{
	#state;
	#getChildren: (collectionId: number, parentId: number | null) => SidebarDocument[];
	#ensureChildrenLoaded: (collectionId: number, parentId: number | null) => Promise<void>;

	constructor({ state, getChildren, ensureChildrenLoaded }: {
		state: Object,
		getChildren: (collectionId: number, parentId: number | null) => SidebarDocument[],
		ensureChildrenLoaded: (collectionId: number, parentId: number | null) => Promise<void>,
	})
	{
		this.#state = state;
		this.#getChildren = getChildren;
		this.#ensureChildrenLoaded = ensureChildrenLoaded;
	}

	#clearExpandedBranch(collectionId: number, parentDocId: number): void
	{
		const children = this.#getChildren(collectionId, parentDocId);
		for (const child of children)
		{
			const childId = Number(child.id);
			delete this.#state.expandedDocs[childId];
			this.#clearExpandedBranch(collectionId, childId);
		}
	}

	async toggleDocExpanded(doc: SidebarDocument): Promise<void>
	{
		const docId = Number(doc.id);
		const isNextExpanded = !this.#state.expandedDocs[docId];
		this.#state.expandedDocs[docId] = isNextExpanded;
		if (isNextExpanded)
		{
			await this.#ensureChildrenLoaded(Number(doc.collectionId), docId);
		}
		else
		{
			this.#clearExpandedBranch(Number(doc.collectionId), docId);
		}
	}

	clearCollectionExpandedDocs(collectionId: number): void
	{
		const rootDocs = this.#getChildren(collectionId, null);
		for (const doc of rootDocs)
		{
			const docId = Number(doc.id);
			delete this.#state.expandedDocs[docId];
			this.#clearExpandedBranch(collectionId, docId);
		}
	}
}
