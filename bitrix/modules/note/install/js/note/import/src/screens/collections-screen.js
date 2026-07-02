import { Loc, Tag } from 'main.core';
import type { CollectionsScreenState } from '../type';
import { createErrorBlock, renderBulletLoader, renderCollectionCard } from './parts/collection-card';

export function renderCollectionsScreen(
	state: CollectionsScreenState,
	handlers: {
		onToggleCollectionSelection: (collectionId: string) => void,
		onToggleCollectionExpanded: (collectionId: string) => void,
		onRetryCollectionsLoad: () => void,
		onRetryTreeLoad: (collectionId: string) => void,
	},
): HTMLElement
{
	const container = Tag.render`<div class="note-import-screen note-import-screen-collections"></div>`;
	container.append(Tag.render`
		<div class="note-import-subtitle">${Loc.getMessage('NOTE_IMPORT_COLLECTIONS_HINT')}</div>
	`);

	if (state.isLoading)
	{
		container.append(Tag.render`
			<div class="note-import-screen-loading">${renderBulletLoader()}</div>
		`);

		return container;
	}

	if (state.errorMessage)
	{
		container.append(createErrorBlock(state.errorMessage, handlers.onRetryCollectionsLoad));

		return container;
	}

	if (state.collections.length === 0)
	{
		container.append(Tag.render`<div class="note-import-muted">${Loc.getMessage('NOTE_IMPORT_EMPTY_COLLECTIONS')}</div>`);

		return container;
	}

	const list = Tag.render`<div class="note-import-collection-list"></div>`;
	for (const collection of state.collections)
	{
		list.append(renderCollectionCard(collection, state, handlers, { hasCheckbox: true }));
	}

	container.append(list);

	return container;
}
