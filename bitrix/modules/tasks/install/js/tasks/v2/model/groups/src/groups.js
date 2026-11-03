import { BuilderEntityModel } from 'ui.vue3.vuex';
import { Model } from 'tasks.v2.const';
import type { GroupDto } from 'tasks.v2.provider.service.group-service';

import type { GroupModel, GroupsModelState } from './types';
import { mapDtoToModel } from './mappers';

export class Groups extends BuilderEntityModel<GroupsModelState, GroupModel>
{
	static createWithGroups(groups: GroupDto[]): BuilderEntityModel
	{
		return Groups.create().setVariables({
			groups: groups.map((groupDto: GroupDto) => mapDtoToModel(groupDto)),
		});
	}

	getName(): string
	{
		return Model.Groups;
	}

	getState(): GroupsModelState
	{
		const groups: GroupModel[] = this.getVariable('groups', []);

		return {
			collection: Object.fromEntries(groups.map((group: GroupModel) => [group.id, group])),
		};
	}

	getElementState(): GroupModel
	{
		return {
			id: 0,
			name: '',
			image: '',
			url: '',
			type: '',
			stagesIds: [],
			isRestrictedView: false,
		};
	}
}
