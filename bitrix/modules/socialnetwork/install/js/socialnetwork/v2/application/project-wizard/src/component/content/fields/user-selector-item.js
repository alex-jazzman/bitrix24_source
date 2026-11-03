import { Loc, Type } from 'main.core';
import { type Item, type ItemOptions } from 'ui.entity-selector';

import { EntitySelectorEntity } from 'socialnetwork.v2.const';

type ProjectMember = {
	id: number,
	type: string,
	withChildNodes?: boolean | null,
	name?: string | null,
	image?: { src?: string | null } | null,
	selectorItem?: ItemOptions,
};

const DEPARTMENT_TAG_TEXT_COLOR = 'var(--ui-color-base-2, #525c69)';

export function mapProjectMemberToItemOptions(member: ProjectMember): ItemOptions
{
	if (isValidDepartmentSelectorItem(member))
	{
		return {
			...member.selectorItem,
			tagOptions: {
				...member.selectorItem.tagOptions,
				textColor: DEPARTMENT_TAG_TEXT_COLOR,
			},
		};
	}

	const itemOptions: ItemOptions = {
		id: member.id,
		entityId: member.type,
		title: Type.isStringFilled(member.name)
			? member.name
			: Loc.getMessage('SONET_EXT_PROJECT_WIZARD_HIDDEN_USER'),
	};

	if (Type.isStringFilled(member.image?.src))
	{
		itemOptions.avatar = member.image.src;
	}

	return itemOptions;
}

export function mapItemToProjectMember(item: Item): ProjectMember
{
	const itemId = item.getId();
	const entityId = item.getEntityId();
	const avatar = item.getAvatar();

	const member: ProjectMember = {
		id: Type.isNumber(itemId) ? itemId : parseInt(itemId, 10),
		type: entityId,
		withChildNodes: entityId === EntitySelectorEntity.Department && Type.isNumber(itemId),
		name: item.getTitle(),
		image: Type.isStringFilled(avatar) ? { src: avatar } : null,
	};

	if (entityId === EntitySelectorEntity.Department)
	{
		member.selectorItem = buildDepartmentSelectorItem(item);
	}

	return member;
}

export function isValidDepartmentSelectorItem(member: ProjectMember): boolean
{
	if (member.type !== EntitySelectorEntity.Department || !Type.isPlainObject(member.selectorItem))
	{
		return false;
	}

	const expectedId = member.withChildNodes === false ? `${member.id}:F` : member.id;
	const title = member.selectorItem.title;

	return member.selectorItem.entityId === EntitySelectorEntity.Department
		&& member.selectorItem.id === expectedId
		&& (Type.isStringFilled(title) || Type.isPlainObject(title))
	;
}

function buildDepartmentSelectorItem(item: Item): ItemOptions
{
	const result = {
		id: item.getId(),
		entityId: item.getEntityId(),
		title: item.getTitle(),
	};

	if (Type.isStringFilled(item.getAvatar()))
	{
		result.avatar = item.getAvatar();
	}

	return result;
}
