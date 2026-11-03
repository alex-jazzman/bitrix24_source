import { Loc, Tag, Text } from 'main.core';
import type { CollectionsScreenState } from '../type';
import { createErrorBlock, renderBulletLoader, renderCollectionCard } from './parts/collection-card';
import { importTermMessageCode } from '../constants';

export function renderCollectionsScreen(
	state: CollectionsScreenState,
	handlers: {
		onToggleCollectionSelection: (collectionId: string) => void,
		onToggleCollectionExpanded: (collectionId: string) => void,
		onRetryCollectionsLoad: () => void,
		onRetryTreeLoad: (collectionId: string) => void,
		sourceType?: string,
	},
): HTMLElement
{
	const container = Tag.render`<div class="note-import-screen note-import-screen-collections"></div>`;
	const hint = Loc.getMessage(importTermMessageCode('NOTE_IMPORT_COLLECTIONS_HINT', handlers.sourceType ?? ''));
	container.append(Tag.render`
		<div class="note-import-subtitle">${Text.encode(hint)}</div>
	`);

	if (state.isLoading)
	{
		container.append(Tag.render`
			<div class="note-import-screen-loading">${renderBulletLoader(Loc.getMessage('NOTE_IMPORT_LOADING'))}</div>
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
		const empty = Loc.getMessage(importTermMessageCode('NOTE_IMPORT_EMPTY_COLLECTIONS', handlers.sourceType ?? ''));
		container.append(Tag.render`<div class="note-import-muted">${Text.encode(empty)}</div>`);

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
