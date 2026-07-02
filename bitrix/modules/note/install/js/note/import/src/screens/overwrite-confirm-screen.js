import { Loc, Tag } from 'main.core';
import type { OverwriteScreenState } from '../type';
import { renderCollectionCard } from './parts/collection-card';

export type OverwriteConfirmScreenHandlers = {
	onToggleCollectionExpanded: (collectionId: string) => void,
	onRetryTreeLoad: (collectionId: string) => void,
};

export function renderOverwriteConfirmScreen(
	state: OverwriteScreenState,
	handlers: OverwriteConfirmScreenHandlers,
): HTMLElement
{
	const container = Tag.render`<div class="note-import-screen note-import-screen-overwrite-confirm"></div>`;

	container.append(
		Tag.render`<div class="note-import-overwrite-message">${Loc.getMessage('NOTE_IMPORT_OVERWRITE_WARNING')}</div>`,
	);

	const list = Tag.render`<div class="note-import-collection-list"></div>`;
	for (const collection of state.collections)
	{
		list.append(renderCollectionCard(collection, state, handlers, { hasCheckbox: false }));
	}
	container.append(list);

	return container;
}
