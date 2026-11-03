import { Dom, Event, Loc, Tag, Text, Type } from 'main.core';
import { Checkbox, CheckboxSize } from 'ui.system.checkbox';
import { Icon, Outline } from 'ui.icon-set.api.core';
import 'ui.icon-set.outline';
import 'note.ui.loader';
import type {
	CollectionTreeState,
	CollectionsScreenState,
	ImportCollection,
	ImportDocumentTreeNode,
} from '../../type';
import { importTermMessageCode } from '../../constants';

type CollectionCardHandlers = {
	onToggleCollectionSelection?: (collectionId: string) => void,
	onToggleCollectionExpanded: (collectionId: string) => void,
	onRetryTreeLoad: (collectionId: string) => void,
	sourceType?: string,
};

type CollectionCardOptions = {
	hasCheckbox?: boolean,
};

const CARD_SELECTOR = '.note-import-collection';
const CARD_DISCLOSURE_SELECTOR = ':scope > .note-import-collection-row > .note-import-disclosure';
const CARD_SUBTREE_SELECTOR = ':scope > .note-import-collection-subtree';

export function renderCollectionCard(
	collection: ImportCollection,
	state: CollectionsScreenState,
	handlers: CollectionCardHandlers,
	options: CollectionCardOptions = {},
): HTMLElement
{
	const hasCheckbox = options.hasCheckbox !== false;
	const isSelected = state.selectedCollectionIds?.has(collection.id) ?? false;
	const isExpanded = state.expandedCollectionIds.has(collection.id);
	const wrapper = Tag.render`<div class="note-import-collection"></div>`;
	wrapper.dataset.collectionId = collection.id;
	const row = Tag.render`<div class="note-import-collection-row"></div>`;
	const disclosure = renderDisclosure(isExpanded, collection.name);
	const title = Tag.render`<div class="note-import-collection-title">${Text.encode(collection.name)}</div>`;

	if (hasCheckbox)
	{
		const checkbox = new Checkbox({
			size: CheckboxSize.Md,
			checked: isSelected,
			// The base name is a node of its own next to the box and is not tied to the field,
			// so without this the checkbox has no accessible name at all.
			attributes: { 'aria-label': collection.name },
			onChange: () => handlers.onToggleCollectionSelection?.(collection.id),
		});
		row.append(checkbox.render());
	}

	Event.bind(disclosure, 'click', () => handlers.onToggleCollectionExpanded(collection.id));

	row.append(disclosure, title);

	// The subtree is part of the card whether it is open or not: expanding then only shows the
	// node that is already there, without a re-render that would destroy the button in focus.
	const subtree = Tag.render`<div class="note-import-collection-subtree"></div>`;
	if (isExpanded)
	{
		subtree.append(renderTree(
			state.treeByCollectionId.get(collection.id),
			collection.id,
			handlers.onRetryTreeLoad,
			collection.name,
			handlers.sourceType ?? '',
		));
	}
	else
	{
		Dom.style(subtree, 'display', 'none');
	}

	wrapper.append(row, subtree);

	return wrapper;
}

export function findCollectionCard(root: HTMLElement | null, collectionId: string): HTMLElement | null
{
	const cards = root?.querySelectorAll(CARD_SELECTOR) ?? [];
	for (const card of cards)
	{
		if (card.dataset.collectionId === collectionId)
		{
			return card;
		}
	}

	return null;
}

export function setCollectionCardExpanded(card: HTMLElement, isExpanded: boolean): void
{
	const disclosure = card.querySelector(CARD_DISCLOSURE_SELECTOR);
	if (disclosure)
	{
		Dom.attr(disclosure, 'aria-expanded', isExpanded ? 'true' : 'false');
		disclosure.replaceChildren(renderChevronIcon(isExpanded));
	}

	const subtree = card.querySelector(CARD_SUBTREE_SELECTOR);
	if (subtree)
	{
		Dom.style(subtree, 'display', isExpanded ? '' : 'none');
	}
}

export function setCollectionCardTree(card: HTMLElement, tree: HTMLElement): void
{
	card.querySelector(CARD_SUBTREE_SELECTOR)?.replaceChildren(tree);
}

function renderChevronIcon(isExpanded: boolean): HTMLElement
{
	return new Icon({
		icon: isExpanded ? Outline.CHEVRON_DOWN_L : Outline.CHEVRON_RIGHT_L,
		size: 20,
	}).render();
}

function renderDisclosure(isExpanded: boolean, name: string = ''): HTMLElement
{
	const button = Tag.render`<button type="button" class="note-import-disclosure"></button>`;
	// The chevron is the only child, so the button has no text to be named by, and the direction
	// of that chevron is the only sign of the state - both have to be spelled out.
	Dom.attr(button, 'aria-expanded', isExpanded ? 'true' : 'false');
	if (Type.isStringFilled(name))
	{
		Dom.attr(button, 'aria-label', Loc.getMessage('NOTE_IMPORT_DISCLOSURE_ARIA', { '#NAME#': name }));
	}

	button.append(renderChevronIcon(isExpanded));

	return button;
}

function renderTreePlaceholder(): HTMLElement
{
	return Tag.render`<span class="note-import-disclosure-placeholder"></span>`;
}

// The tree shows what the source holds, and the two sources that convert bases of this very portal
// name those objects differently from Outline: the term follows the source the card belongs to.
export function renderTree(
	treeState: CollectionTreeState | void,
	collectionId: string,
	onRetryTreeLoad: (collectionId: string) => void,
	collectionName: string = '',
	sourceType: string = '',
): HTMLElement
{
	if (!treeState || treeState.isLoading)
	{
		const container = Tag.render`<div class="note-import-tree note-import-tree-loading"></div>`;
		const loading = Loc.getMessage(importTermMessageCode('NOTE_IMPORT_TREE_LOADING', sourceType));
		container.append(renderBulletLoader(loading));

		return container;
	}

	if (treeState.errorMessage)
	{
		const container = Tag.render`<div class="note-import-tree"></div>`;
		container.append(createErrorBlock(
			treeState.errorMessage,
			() => onRetryTreeLoad(collectionId),
			collectionName,
		));

		return container;
	}

	if (treeState.documents.length === 0)
	{
		const empty = Loc.getMessage(importTermMessageCode('NOTE_IMPORT_PREVIEW_EMPTY', sourceType));

		return Tag.render`
			<ul class="note-import-tree">
				<li class="note-import-tree-item">
					<div class="note-import-tree-row">
						${renderTreePlaceholder()}
						<div class="note-import-tree-title note-import-muted">${Text.encode(empty)}</div>
					</div>
				</li>
			</ul>
		`;
	}

	const list = Tag.render`<ul class="note-import-tree"></ul>`;
	for (const document of treeState.documents)
	{
		list.append(renderTreeBranch(document));
	}

	return list;
}

function renderTreeBranch(node: ImportDocumentTreeNode): HTMLElement
{
	const item = Tag.render`<li class="note-import-tree-item"></li>`;
	const hasChildren = node.children.length > 0;
	const row = Tag.render`<div class="note-import-tree-row"></div>`;
	const rawTitle = typeof node.title === 'string' ? node.title.trim() : '';
	const untitled = Loc.getMessage('NOTE_IMPORT_DOCUMENT_UNTITLED');
	const title = rawTitle === ''
		? Tag.render`<div class="note-import-tree-title note-import-muted">${Text.encode(untitled)}</div>`
		: Tag.render`<div class="note-import-tree-title">${Text.encode(rawTitle)}</div>`;

	if (hasChildren)
	{
		const disclosure = renderDisclosure(false, rawTitle === '' ? untitled : rawTitle);
		const childrenList = Tag.render`<ul class="note-import-tree-children"></ul>`;
		Dom.style(childrenList, 'display', 'none');

		for (const child of node.children)
		{
			childrenList.append(renderTreeBranch(child));
		}

		let isExpanded = false;
		Event.bind(disclosure, 'click', () => {
			isExpanded = !isExpanded;
			Dom.style(childrenList, 'display', isExpanded ? '' : 'none');
			Dom.attr(disclosure, 'aria-expanded', isExpanded ? 'true' : 'false');
			disclosure.replaceChildren(renderChevronIcon(isExpanded));
		});

		row.append(disclosure, title);
		item.append(row, childrenList);
	}
	else
	{
		row.append(renderTreePlaceholder(), title);
		item.append(row);
	}

	return item;
}

export function renderBulletLoader(label: string = ''): HTMLElement
{
	const loader = Tag.render`
		<div class="ui-loader__bullet">
			<div class="ui-loader__bullet_item"></div>
			<div class="ui-loader__bullet_item"></div>
			<div class="ui-loader__bullet_item"></div>
			<div class="ui-loader__bullet_item"></div>
			<div class="ui-loader__bullet_item"></div>
		</div>
	`;

	// A live region with nothing but dots in it announces nothing, so the role is given only
	// together with the state spelled out for a screen reader.
	if (Type.isStringFilled(label))
	{
		Dom.attr(loader, 'role', 'status');
		Dom.attr(loader, 'aria-live', 'polite');
		loader.append(Tag.render`<visually-hidden>${Text.encode(label)}</visually-hidden>`);
	}

	return loader;
}

export function createErrorBlock(message: string, onRetry: Function, name: string = ''): HTMLElement
{
	const container = Tag.render`<div class="note-import-error-block"></div>`;
	const retryButton = Tag.render`
		<button type="button" class="note-import-link-button" data-testid="note-import-retry">${Text.encode(Loc.getMessage('NOTE_IMPORT_RETRY'))}</button>
	`;
	// Trees of several bases can fail at once, and then the screen holds several retry buttons
	// with the same text: the name says which one repeats what.
	if (Type.isStringFilled(name))
	{
		Dom.attr(retryButton, 'aria-label', Loc.getMessage('NOTE_IMPORT_RETRY_ARIA', { '#NAME#': name }));
	}

	Event.bind(retryButton, 'click', () => onRetry());
	container.append(
		// The block replaces a loader that had been saying what it was waiting for, and it takes that
		// live region away with it: without a role of its own the refusal would arrive in silence.
		Tag.render`<div class="note-import-error" role="alert">${Text.encode(message)}</div>`,
		retryButton,
	);

	return container;
}
