import { Tag, Loc, Text } from 'main.core';
import { DragDropHandler } from './handlers/drag-drop-handler';
import { type ListItemProps } from './types/type';

export class ListItem
{
	#layout: HTMLElement;
	#props: ListItemProps;
	#titleNode: HTMLElement;
	#descriptionNode: HTMLElement;
	#linkNode: ?HTMLElement;
	#contentNode: ?HTMLElement;
	#dragOverlayNode: ?HTMLElement;

	constructor(props: ListItemProps)
	{
		this.#titleNode = Tag.render`
			<span class="sign-blank-selector__list_item-title"></span>
		`;
		this.#descriptionNode = Tag.render`
			<span class="sign-blank-selector__list_item-info"></span>
		`;
		this.#linkNode = null;
		this.setProps(props);
	}

	#createListItem(): HTMLElement
	{
		const { title, description, modifier, link, onLinkClick, isNew, isPlaceholderDocumentAvailable } = this.getProps();
		this.setTitle(title);
		this.setDescription(description);

		const children = [this.#titleNode, this.#descriptionNode];

		if (link && onLinkClick)
		{
			this.#linkNode = Tag.render`
				<a class="sign-blank-selector__list_item-link" onclick="${(e) => {
					e.stopPropagation();
					onLinkClick();
				}}">
					${Text.encode(link)}
				</a>
			`;
			children.push(this.#linkNode);
		}

		if (isNew)
		{
			const badgeText = Loc.getMessage('SIGN_BLANK_SELECTOR_NEW_BADGE');
			const badge = Tag.render`
				<span class="sign-blank-selector__list_item-badge" title="${Text.encode(badgeText)}">
					${Text.encode(badgeText)}
				</span>
			`;

			children.push(badge);
		}

		if (isPlaceholderDocumentAvailable)
		{
			this.#contentNode = Tag.render`
				<div class="sign-blank-selector__list_item-content">
					${children}
				</div>
			`;

			const { dragDescriptionTextHTML } = this.getProps();
			this.#dragOverlayNode = Tag.render`
				<div class="sign-blank-selector__list_item-drag-overlay">
					<div class="sign-blank-selector__list_item-drag-overlay-content">
						<span class="sign-blank-selector__list_item-drag-overlay-title">
							${Text.encode(title)}
						</span>
						<span>
							${dragDescriptionTextHTML}
						</span>
					</div>
				</div>
			`;

			const layout = Tag.render`
				<div class="sign-blank-selector__list_item --${Text.encode(modifier)} --b2e">
					${this.#contentNode}
					${this.#dragOverlayNode}
				</div>
			`;

			this.#bindDragEvents(layout);

			return layout;
		}

		return Tag.render`
			<div class="sign-blank-selector__list_item --${Text.encode(modifier)} --b2b">
				${children}
			</div>
		`;
	}

	#bindDragEvents(layout: HTMLElement): void
	{
		new DragDropHandler(layout, {
			onDragEnter: (event: DragEvent) => {
				const { onDragEnter } = this.getProps();
				if (onDragEnter)
				{
					onDragEnter(event);
				}
			},
		});
	}

	getLayout(): HTMLElement
	{
		if (this.#layout)
		{
			return this.#layout;
		}

		this.#layout = this.#createListItem();

		return this.#layout;
	}

	setTitle(title: string = ''): void
	{
		this.#titleNode.textContent = title;
		this.#titleNode.title = title;
		this.setProps({
			...this.getProps(),
			title,
		});
	}

	setDescription(description: string = ''): void
	{
		this.#descriptionNode.textContent = description;
		this.#descriptionNode.title = description;
		this.setProps({
			...this.getProps(),
			description,
		});
	}

	getProps(): ListItemProps
	{
		return this.#props;
	}

	setProps(props: ListItemProps): void
	{
		this.#props = props;
	}
}
