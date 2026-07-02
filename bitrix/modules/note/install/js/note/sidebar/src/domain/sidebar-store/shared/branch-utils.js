import type { SidebarDocument } from '../../../type';

export class SidebarBranchUtils
{
	#state;
	#keyOf: (collectionId: number, parentId: number | null) => string;

	constructor(state: Object, keyOf: (collectionId: number, parentId: number | null) => string)
	{
		this.#state = state;
		this.#keyOf = keyOf;
	}

	setBranchDocs(
		collectionId: number,
		parentId: number | null,
		list: SidebarDocument[],
		{ keepHasNext = true }: { keepHasNext?: boolean } = {},
	): void
	{
		const key = this.#keyOf(collectionId, parentId);
		const normalizedList = Array.isArray(list) ? list : [];
		this.#state.docsByParent[key] = normalizedList;
		this.#state.docsOffsetByParent[key] = normalizedList.length;
		this.#state.docsHydratedByParent[key] = true;
		this.#state.docsStaleByParent[key] = false;
		if (!keepHasNext)
		{
			this.#state.docsHasNextPageByParent[key] = false;
		}
	}

	removeBranch(collectionId: number, parentId: number | null = null): void
	{
		const key = this.#keyOf(collectionId, parentId);
		delete this.#state.docsByParent[key];
		delete this.#state.docsLoadingByParent[key];
		delete this.#state.docsHasNextPageByParent[key];
		delete this.#state.docsOffsetByParent[key];
		delete this.#state.docsCursorByParent[key];
		delete this.#state.docsHydratedByParent[key];
		delete this.#state.docsStaleByParent[key];
		delete this.#state.docsRequestByParent[key];
	}
}
