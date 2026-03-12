import { Type, Dom, Tag, Text, Event } from 'main.core';
import { BaseField } from './base-field';
import { EntityListPopup } from './component/entity-list-popup';
import { AvatarRound } from 'ui.avatar';
import type { User, Entity } from './component/types';
import { EntityTypes } from './component/types';
import 'ui.icons.b24';
import 'ui.icon';

export type EntitiesWithAvatarsFieldType = {
	entities: Array<Entity>,
}

export class EntitiesWithAvatarsField extends BaseField
{
	#entities: Array;
	#popup: EntityListPopup;

	render(params: EntitiesWithAvatarsFieldType): void
	{
		this.#entities = Type.isArray(params.entities) ? params.entities : [];

		if (this.#entities.length === 0)
		{
			this.#renderEmpty();

			return;
		}

		this.#renderEntities();
	}

	#renderEmpty(): void
	{
		const emptyContainer = Tag.render`
			<div class="mailbox-grid_list-members --empty"></div>
		`;

		this.appendToFieldNode(emptyContainer);
	}

	#renderEntities(): void
	{
		if (this.#entities.length === 1)
		{
			const entityNode = this.#renderSingleEntityLayout();
			this.appendToFieldNode(entityNode);
		}
		else
		{
			const entitiesNode = this.#renderMultipleEntitiesLayout();
			Event.bind(entitiesNode, 'click', () => this.#showPopup(entitiesNode));
			this.appendToFieldNode(entitiesNode);
		}
	}

	#renderSingleEntityLayout(): HTMLElement
	{
		const entity = this.#entities[0];
		const name = Text.encode(entity.name) || '';
		const nameNode = Tag.render`<span class="mailbox-grid_list-members-name">${name}</span>`;

		if (entity.type === EntityTypes.USER)
		{
			const container = Tag.render`
				<a href="${entity.pathToProfile}" class="mailbox-grid_list-members --single-member --link"></a>
			`;

			const avatar = this.#renderUserAvatar(entity);
			Dom.append(avatar, container);
			Dom.append(nameNode, container);

			return container;
		}

		const icon = this.#renderDepartmentIcon();
		let container = Tag.render`
			<div class="mailbox-grid_list-members --single-member"></div>
		`;

		if (Type.isStringFilled(entity.pathToStructure))
		{
			container = Tag.render`
				<a href="${entity.pathToStructure}" class="mailbox-grid_list-members --single-member --link"></a>
			`;
		}

		Dom.append(icon, container);
		Dom.append(nameNode, container);

		return container;
	}

	#renderMultipleEntitiesLayout(): HTMLElement
	{
		const maxVisibleIcons = 3;
		const visibleEntities = this.#entities.slice(0, maxVisibleIcons);
		const remainingCount = this.#entities.length - visibleEntities.length;
		const iconsContainer = Tag.render`<div class="mailbox-grid_list-members"></div>`;

		visibleEntities.forEach((entity) => {
			const icon = this.#renderEntityIcon(entity);
			if (icon)
			{
				Dom.append(icon, iconsContainer);
			}
		});

		if (remainingCount > 0)
		{
			Dom.append(this.#renderCounter(remainingCount), iconsContainer);
		}

		return iconsContainer;
	}

	#renderEntityIcon(entity: Entity): HTMLElement | null
	{
		switch (entity.type)
		{
			case EntityTypes.USER:
				return this.#renderUserAvatar(entity);
			case EntityTypes.DEPARTMENT:
				return this.#renderDepartmentIcon();
			default:
				return null;
		}
	}

	#showPopup(targetElement: HTMLElement): void
	{
		if (!this.#popup)
		{
			this.#popup = new EntityListPopup({
				entities: this.#entities,
				targetNode: targetElement,
			});
		}

		this.#popup.show();
	}

	#renderUserAvatar(user: User): HTMLElement
	{
		const avatarSrc = encodeURI(user.avatar?.src) || '';
		const userName = Text.encode(user.name) || '';
		const userpicSize = 28;

		let avatar = null;
		if (Type.isStringFilled(user.avatar?.src))
		{
			avatar = new AvatarRound({
				size: userpicSize,
				userName,
				userpicPath: avatarSrc,
			});
		}
		else
		{
			avatar = new AvatarRound({
				size: userpicSize,
			});
		}

		const avatarNode = avatar.getContainer();
		Dom.addClass(avatarNode, 'mailbox-grid_list-members-icon_element');

		return avatarNode;
	}

	#renderDepartmentIcon(): HTMLElement
	{
		return Tag.render`
			<div class="mailbox-grid_list-members-icon_element">
				<div class="ui-icon ui-icon-common-company"><i></i></div> 
			</div>
		`;
	}

	#renderCounter(count: number): HTMLElement
	{
		return Tag.render`
			<div class="mailbox-grid_list-members-icon_element --count">
				<span class="mailbox-grid_warning-icon_element-plus">+</span>
				<span class="mailbox-grid_warning-icon_element-number">${count}</span>
			</div>
		`;
	}
}
