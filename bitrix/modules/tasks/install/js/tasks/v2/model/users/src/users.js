import { BuilderEntityModel } from 'ui.vue3.vuex';
import { Model } from 'tasks.v2.const';
import { UserMappers, type UserDto } from 'tasks.v2.provider.service.user-service';

import type { UserModel, UsersModelState } from './types';

export class Users extends BuilderEntityModel<UsersModelState, UserModel>
{
	static createWithCurrentUser(userDto: UserDto): BuilderEntityModel
	{
		return Users.create().setVariables({
			currentUser: UserMappers.mapDtoToModel(userDto),
		});
	}

	getName(): string
	{
		return Model.Users;
	}

	getState(): UsersModelState
	{
		const currentUser: UserModel = this.getVariable('currentUser', null);

		return {
			collection: {
				[currentUser.id]: currentUser,
			},
		};
	}

	getElementState(): UserModel
	{
		return {
			id: 0,
			name: '',
			image: '',
			type: '',
		};
	}
}
