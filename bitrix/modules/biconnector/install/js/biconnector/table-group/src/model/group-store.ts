/* eslint-disable no-param-reassign */
import { Runtime } from 'main.core';
import { createStore } from 'ui.vue3.vuex';
import type { Store as VuexStore } from 'ui.vue3.vuex';
import { type Table, type TableGroup, type TableGroupAppState, TableGroupType } from '../const/type';

const NEW_GROUP_ID_PREFIX = 'new_';

// The getters one getter asks another by; vuex hands them over untyped.
type GroupGetters = {
	isOnlyGroupOfTable: (tableCode: string) => boolean,
};

const areSetsEqual = (setA: Set<string>, setB: Set<string>): boolean => {
	if (setA.size !== setB.size)
	{
		return false;
	}

	for (const item of setA)
	{
		if (!setB.has(item))
		{
			return false;
		}
	}

	return true;
};

export class Store
{
	static initialGroup: TableGroup;

	static buildStore(defaultValues: TableGroupAppState): VuexStore<TableGroupAppState>
	{
		Store.initialGroup = Runtime.clone(defaultValues.group);

		return createStore({
			state(): TableGroupAppState
			{
				return defaultValues;
			},
			mutations: {
				setGroupName(state: TableGroupAppState, groupName: string)
				{
					// The server trims the name before writing it, and the row of the matrix is rematched by
					// the equality of the sent name and the returned title: an untrimmed name loses that match.
					state.group.name = groupName.trim();
				},
				setEmptyGroupName(state: TableGroupAppState, groupName: string)
				{
					state.group.name = groupName;
					Store.initialGroup.name = groupName;
				},
				addTable(state: TableGroupAppState, tableCode: string)
				{
					if (state.group.tableCodes.includes(tableCode))
					{
						return;
					}

					state.group.tableCodes.unshift(tableCode);
				},
				removeTable(state: TableGroupAppState, tableCode: string)
				{
					state.group.tableCodes = state.group.tableCodes.filter((code: string) => code !== tableCode);
				},
			},
			getters: {
				groupName(state: TableGroupAppState): string
				{
					return state.group.name;
				},
				isSystemGroup(state: TableGroupAppState): boolean
				{
					return state.group.type === TableGroupType.system;
				},
				isSaveEnabled(state: TableGroupAppState): boolean
				{
					return state.saveEnabled === true;
				},
				isNewGroup(state: TableGroupAppState): boolean
				{
					return String(state.group.id ?? '').startsWith(NEW_GROUP_ID_PREFIX);
				},
				groupTableCodes(state: TableGroupAppState): string[]
				{
					return state.group.tableCodes;
				},
				groupTables(state: TableGroupAppState): Table[]
				{
					// A code without a row in the catalogue is skipped: the composition outlives the catalogue it was read with.
					return state.group.tableCodes
						.map((code: string) => state.tables.get(code))
						.filter((table: Table | undefined): table is Table => table !== undefined)
					;
				},
				isOnlyGroupOfTable(state: TableGroupAppState): (tableCode: string) => boolean
				{
					return (tableCode: string): boolean => !state.otherGroups.some(
						(group: TableGroup) => group.tableCodes.includes(tableCode),
					);
				},
				/**
				 * Codes of the tables the popup would leave out of every group, read against the
				 * composition it was opened with.
				 *
				 * A table added in this very popup and taken back is no loss: it stands where it stood
				 * before the popup was opened, so only the composition of the opening is asked.
				 */
				tablesLeftWithoutGroup(state: TableGroupAppState, getters: GroupGetters): string[]
				{
					return Store.initialGroup.tableCodes.filter(
						(code: string) => !state.group.tableCodes.includes(code) && getters.isOnlyGroupOfTable(code),
					);
				},
				groupData(state: TableGroupAppState): TableGroup
				{
					return {
						id: state.group.id,
						name: state.group.name,
						type: state.group.type,
						tableCodes: state.group.tableCodes,
					};
				},
				isTitleEdited(state: TableGroupAppState): boolean
				{
					return state.group.name !== Store.initialGroup.name;
				},
				isTableListEdited(state: TableGroupAppState): boolean
				{
					return !areSetsEqual(
						new Set(Store.initialGroup.tableCodes),
						new Set(state.group.tableCodes),
					);
				},
			},
		});
	}
}
