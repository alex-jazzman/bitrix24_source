import { Type } from 'main.core';
import { defineStore } from 'ui.vue3.pinia';
import type { UserModel, UsersModelState } from './types';

export const useUsersStore = defineStore('users', {
	state: (): UsersModelState => ({
		collection: {},
	}),
	getters: {
		getById: (state: UsersModelState) => (userId: string | number): ?UserModel => {
			return state.collection[userId] ?? null;
		},
		getByIds: (state: UsersModelState) => (userIds: Array<string | number>): UserModel[] => {
			return userIds
				.map((userId) => state.collection[userId])
				.filter((user) => !Type.isNil(user));
		},
	},
	actions: {
		createWithCurrentUser(user: UserModel): void
		{
			const currentUser = user ?? this.getElementState();

			this.collection = {
				[currentUser.id]: currentUser,
			};
		},
		upsertMany(users: UserModel[]): void
		{
			users.forEach((user: UserModel) => {
				const userItem = this.collection[user.id] || this.getElementState();
				this.collection[user.id] = { ...userItem, ...user };
			});
		},
		getState(): UsersModelState
		{
			return {
				collection: this.collection,
			};
		},
		getElementState(): UserModel
		{
			return {
				id: 0,
				name: '',
				image: '',
				type: '',
			};
		},
	},
});
