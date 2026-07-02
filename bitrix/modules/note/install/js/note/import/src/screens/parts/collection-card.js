import { Dom, Event, Loc, Tag, Text } from 'main.core';
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

type CollectionCardHandlers = {
	onToggleCollectionSelection?: (collectionId: string) => void,
	onToggleCollectionExpanded: (collectionId: string) => void,
	onRetryTreeLoad: (collectionId: string) => void,
};

type CollectionCardOptions = {
	hasCheckbox?: boolean,
};

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
	const row = Tag.render`<div class="note-import-collection-row"></div>`;
	const disclosure = renderDisclosure(isExpanded);
	const title = Tag.render`<div class="note-import-collection-title">${Text.encode(collection.name)}</div>`;

	if (hasCheckbox)
	{
		const checkbox = new Checkbox({
			size: CheckboxSize.Md,
			checked: isSelected,
			onChange: () => handlers.onToggleCollectionSelection?.(collection.id),
		});
		row.append(checkbox.render());
	}

	Event.bind(disclosure, 'click', () => handlers.onToggleCollectionExpanded(collection.id));

	row.append(disclosure, title);
	wrapper.append(row);

	if (isExpanded)
	{
		wrapper.append(renderTree(
			state.treeByCollectionId.get(collection.id),
			collection.id,
			handlers.onRetryTreeLoad,
		));
	}

	return wrapper;
}

function renderChevronIcon(isExpanded: boolean): HTMLElement
{
	return new Icon({
		icon: isExpanded ? Outline.CHEVRON_DOWN_L : Outline.CHEVRON_RIGHT_L,
		size: 20,
	}).render();
}

function renderDisclosure(isExpanded: boolean): HTMLElement
{
	const button = Tag.render`<button type="button" class="note-import-disclosure"></button>`;
	button.append(renderChevronIcon(isExpanded));

	return button;
}

function renderTreePlaceholder(): HTMLElement
{
	return Tag.render`<span class="note-import-disclosure-placeholder"></span>`;
}

export function renderTree(
	treeState: CollectionTreeState | void,
	collectionId: string,
	onRetryTreeLoad: (collectionId: string) => void,
): HTMLElement
{
	if (!treeState || treeState.isLoading)
	{
		return Tag.render`
			<div class="note-import-tree note-import-tree-loading">
				${renderBulletLoader()}
			</div>
		`;
	}

	if (treeState.errorMessage)
	{
		const container = Tag.render`<div class="note-import-tree"></div>`;
		container.append(createErrorBlock(treeState.errorMessage, () => onRetryTreeLoad(collectionId)));

		return container;
	}

	if (treeState.documents.length === 0)
	{
		return Tag.render`
			<ul class="note-import-tree">
				<li class="note-import-tree-item">
					<div class="note-import-tree-row">
						${renderTreePlaceholder()}
						<div class="note-import-tree-title note-import-muted">${Loc.getMessage('NOTE_IMPORT_PREVIEW_EMPTY')}</div>
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
	const title = rawTitle === ''
		? Tag.render`<div class="note-import-tree-title note-import-muted">${Loc.getMessage('NOTE_IMPORT_DOCUMENT_UNTITLED')}</div>`
		: Tag.render`<div class="note-import-tree-title">${Text.encode(rawTitle)}</div>`;

	if (hasChildren)
	{
		const disclosure = renderDisclosure(false);
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

export function renderBulletLoader(): HTMLElement
{
	return Tag.render`
		<div class="ui-loader__bullet" role="status" aria-live="polite">
			<div class="ui-loader__bullet_item"></div>
			<div class="ui-loader__bullet_item"></div>
			<div class="ui-loader__bullet_item"></div>
			<div class="ui-loader__bullet_item"></div>
			<div class="ui-loader__bullet_item"></div>
		</div>
	`;
}

export function createErrorBlock(message: string, onRetry: Function): HTMLElement
{
	const container = Tag.render`<div class="note-import-error-block"></div>`;
	const retryButton = Tag.render`
		<button type="button" class="note-import-link-button">${Loc.getMessage('NOTE_IMPORT_RETRY')}</button>
	`;

	Event.bind(retryButton, 'click', () => onRetry());
	container.append(
		Tag.render`<div class="note-import-error">${Text.encode(message)}</div>`,
		retryButton,
	);

	return container;
}
