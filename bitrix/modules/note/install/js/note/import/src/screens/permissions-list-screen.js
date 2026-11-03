import { Dom, Event, Loc, Tag, Text } from 'main.core';
import type { PermissionsListScreenState, ConvertedCollection } from '../type';
import { createErrorBlock, renderBulletLoader } from './parts/collection-card';

export type PermissionsListScreenHandlers = {
	onRetry: () => void,
	onOpenPermissions: (collection: ConvertedCollection) => void,
};

export function renderPermissionsListScreen(
	state: PermissionsListScreenState,
	handlers: PermissionsListScreenHandlers,
): HTMLElement
{
	const container = Tag.render`<div class="note-import-screen note-import-screen-permissions-list"></div>`;
	const title = Loc.getMessagePlural('NOTE_IMPORT_PERMISSIONS_LIST_TITLE', state.collections.length);
	container.append(
		Tag.render`<div class="note-import-subtitle">${Text.encode(title)}</div>`,
	);

	if (state.isLoading)
	{
		container.append(Tag.render`
			<div class="note-import-screen-loading">${renderBulletLoader(Loc.getMessage('NOTE_IMPORT_LOADING'))}</div>
		`);

		return container;
	}

	if (state.errorMessage)
	{
		container.append(createErrorBlock(state.errorMessage, handlers.onRetry));

		return container;
	}

	if (state.collections.length === 0)
	{
		const empty = Loc.getMessage('NOTE_IMPORT_PERMISSIONS_LIST_EMPTY');
		container.append(
			Tag.render`<div class="note-import-limitations-empty">${Text.encode(empty)}</div>`,
		);

		return container;
	}

	const list = Tag.render`<div class="note-import-permissions-list"></div>`;
	for (const collection of state.collections)
	{
		list.append(renderCollectionRow(collection, handlers.onOpenPermissions));
	}

	container.append(list);

	return container;
}

function renderCollectionRow(
	collection: ConvertedCollection,
	onOpenPermissions: (collection: ConvertedCollection) => void,
): HTMLElement
{
	// The name is cut off by the width of the row, so the full one is left readable on hover, and
	// the button, whose text repeats in every row, is told apart by the base it opens.
	const row = Tag.render`
		<div class="note-import-permissions-list-row">
			<div class="note-import-permissions-list-title" title="${Text.encode(collection.name)}">
				${Text.encode(collection.name)}
			</div>
			<button type="button" class="note-import-link-button">
				${Text.encode(Loc.getMessage('NOTE_IMPORT_PERMISSIONS_LIST_OPEN'))}
			</button>
		</div>
	`;

	const button = row.querySelector('button');
	if (button)
	{
		Dom.attr(button, 'aria-label', Loc.getMessage(
			'NOTE_IMPORT_PERMISSIONS_LIST_OPEN_ARIA',
			{ '#NAME#': collection.name },
		));
		Event.bind(button, 'click', () => onOpenPermissions(collection));
	}

	return row;
}

