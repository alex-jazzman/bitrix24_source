import { Type, Dom, Tag, Text } from 'main.core';
import { Popup } from 'main.popup';
import type { Entity } from './types';
import { EntityTypes } from './types';
import './style.css';
import 'ui.icons.b24';
import 'ui.icon';

export type EntityListPopupType = {
	entities: Array<Entity>,
	targetNode: HTMLElement,
}

export class EntityListPopup
{
	#entities: Array<Entity>;
	#popup: Popup;
	#targetNode: HTMLElement;

	constructor(params: EntityListPopupType)
	{
		this.#entities = params.entities;
		this.#targetNode = params.targetNode;
	}

	#renderEntity(entity: Entity): HTMLElement
	{
		if (entity.type === EntityTypes.USER)
		{
			const userpicSize = 20;
			let avatarNode = null;
			if (Type.isStringFilled(entity.avatar?.src))
			{
				const avatar = new BX.UI.AvatarRound({
					size: userpicSize,
					userName: entity.name,
					userpicPath: encodeURI(entity.avatar.src),
				});

				avatarNode = avatar.getContainer();
			}
			else
			{
				const avatar = new BX.UI.AvatarRound({
					size: userpicSize,
				});

				avatarNode = avatar.getContainer();
			}

			if (Type.isStringFilled(entity.pathToProfile))
			{
				return Tag.render`
					<a
						href="${entity.pathToProfile}"
						target="_blank"
						title="${Text.encode(entity.name)}"
						class="mailbox-grid_user-list-popup-popup-img"
					>
						<span class="mailbox-grid_user-list-popup-popup-avatar-new">${avatarNode}</span>
						<span class="mailbox-grid_user-list-popup-popup-name-link">${Text.encode(entity.name)}</span>
					</a>
				`;
			}

			return Tag.render`
				<div
					class="mailbox-grid_user-list-popup-popup-img"
					title="${Text.encode(entity.name)}"
				>
					<span class="mailbox-grid_user-list-popup-popup-avatar-new">${avatarNode}</span>
					<span class="mailbox-grid_user-list-popup-popup-name">${Text.encode(entity.name)}</span>
				</div>
			`;
		}

		if (entity.type === EntityTypes.DEPARTMENT)
		{
			const iconNode = Tag.render`<div class="ui-icon ui-icon-common-company"><i></i></div>`;

			if (Type.isStringFilled(entity.pathToStructure))
			{
				return Tag.render`
					<a
						href="${entity.pathToStructure}"
						target="_blank"
						title="${Text.encode(entity.name)}"
						class="mailbox-grid_user-list-popup-popup-img --icon"
					>
						<span class="mailbox-grid_user-list-popup-popup-avatar-new --icon">${iconNode}</span>
						<span class="mailbox-grid_user-list-popup-popup-name-link">${Text.encode(entity.name)}</span>
					</a>
				`;
			}

			return Tag.render`
				<div
					class="mailbox-grid_user-list-popup-popup-img --icon"
					title="${Text.encode(entity.name)}"
				>
					<span class="mailbox-grid_user-list-popup-popup-avatar-new --icon">${iconNode}</span>
					<span class="mailbox-grid_user-list-popup-popup-name">${Text.encode(entity.name)}</span>
				</div>
			`;
		}

		return null;
	}

	#getContent(): HTMLElement
	{
		const entityNodes = document.createDocumentFragment();
		this.#entities.forEach((entity) => {
			const entityNode = this.#renderEntity(entity);
			if (entityNode)
			{
				Dom.append(entityNode, entityNodes);
			}
		});

		return Tag.render`
			<div class="mailbox-grid_user-list-popup-wrap-block">
				<div class="mailbox-grid_user-list-popup-popup-outer">
					<div class="mailbox-grid_user-list-popup-popup">
						${entityNodes}
					</div>
				</div>
			</div>
		`;
	}

	show(): void
	{
		if (this.#popup)
		{
			this.#popup.show();

			return;
		}

		this.#popup = new Popup({
			id: `entities-with-avatars-popup-${Text.getRandom()}`,
			bindElement: this.#targetNode,
			content: this.#getContent(),
			lightShadow: true,
			autoHide: true,
			closeByEsc: true,
			className: 'popup-window-mailbox-entity-list',
			bindOptions: {
				position: 'top',
			},
			animationOptions: {
				show: { type: 'opacity-transform' },
				close: { type: 'opacity' },
			},
		});

		this.#popup.show();
	}
}
