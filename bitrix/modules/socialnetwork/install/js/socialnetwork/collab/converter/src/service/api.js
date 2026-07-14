import { ajax } from 'main.core';
import { mapGroupDtoToModel } from './mappers';

class Api
{
	async getGroup(groupId: number): Promise<void>
	{
		const result = await ajax.runAction('socialnetwork.api.workgroup.get', {
			data: {
				params: {
					groupId,
					select: [
						'LIST_OF_MEMBERS',
						'AVATAR',
						'AVATAR_TYPES',
						'FEATURES',
					],
				},
			},
		});

		return mapGroupDtoToModel(result.data);
	}

	async convertToCollab(groupId: number): Promise<void>
	{
		const result = await ajax.runAction('socialnetwork.v2.Convert.convertToProject', {
			data: {
				group: {
					id: groupId,
				},
			},
		});

		return result.data;
	}
}

export const api = new Api();
