import { Loc, Runtime, Type } from 'main.core';
import { type ItemOptions } from 'ui.entity-selector';
import type { AccessRightItem, Variable, VariableCollection } from '../../store/model/access-rights-model';
import type { UserGroup, UserGroupsCollection } from '../../store/model/user-groups-model';
import { EntitySelectorEntities } from './dictionary';

// what the host module puts in its title pattern where the value of the right goes
export const UNLOADED_VARIABLE_VALUE_PLACEHOLDER = '#VALUE#';

export class ItemsMapper
{
	static mapUserGroups(userGroups: UserGroupsCollection): ItemOptions[]
	{
		const result: ItemOptions[] = [];

		for (const userGroup: UserGroup of userGroups.values())
		{
			result.push({
				id: userGroup.id,
				entityId: EntitySelectorEntities.ROLE,
				title: userGroup.title,
				supertitle: Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_ROLE'),
				avatar: '/bitrix/js/ui/accessrights/v2/images/role-avatar.svg',
				tabs: [
					'recents',
				],
			});
		}

		return result;
	}

	static mapVariables(variables: VariableCollection): ItemOptions[]
	{
		const items: ItemOptions[] = [];

		for (const variable: Variable of variables.values())
		{
			const item = Runtime.clone(variable);
			item.entityId = item.entityId || EntitySelectorEntities.VARIABLE;
			item.tabs = 'recents';

			items.push(item);
		}

		return items;
	}

	/**
	 * A selected value the source did not return an item for: the title is the one the server already put in
	 * the variables of the right, so the value stays visible and can be unchecked like any other.
	 *
	 * The dialog builds a nameless placeholder for such a value on its own, so these options describe both a
	 * locally added item and the repair of that placeholder: hence the flags it has to override are explicit.
	 */
	static mapUnloadedVariable(
		entityId: string,
		value: string,
		variable: ?Variable,
		titlePattern: ?string = null,
	): ItemOptions
	{
		return {
			id: value,
			entityId,
			title: ItemsMapper.#unloadedVariableTitle(value, variable, titlePattern),
			hidden: false,
			deselectable: true,
			saveable: false,
			selected: true,
			searchable: false,
			tabs: 'recents',
		};
	}

	/**
	 * The dictionary of the right names only part of the values a source-fed right may hold, so a value past
	 * that part is captioned by the pattern of the host module. Without a pattern the value itself is shown,
	 * the way it was before the pattern existed.
	 */
	static #unloadedVariableTitle(value: string, variable: ?Variable, titlePattern: ?string): string
	{
		const dictionaryTitle: ?string = variable?.title ?? null;
		if (dictionaryTitle !== null)
		{
			return dictionaryTitle;
		}

		if (!Type.isStringFilled(titlePattern))
		{
			return value;
		}

		return titlePattern.split(UNLOADED_VARIABLE_VALUE_PLACEHOLDER).join(value);
	}

	static mapAllSelectedVariable(right: AccessRightItem, isSelected: boolean): ItemOptions
	{
		return {
			id: right.allSelectedCode,
			// a synthetic entity keeps the choice out of the recent items the server knows about
			entityId: EntitySelectorEntities.VARIABLE,
			title: right.allSelectedTitle ?? Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_ALL_ACCEPTED'),
			saveable: false,
			selected: isSelected,
			searchable: false,
			tabs: 'recents',
		};
	}
}
