/* eslint-disable */
this.BX = this.BX || {};
this.BX.Socialnetwork = this.BX.Socialnetwork || {};
this.BX.Socialnetwork.V2 = this.BX.Socialnetwork.V2 || {};
(function (exports, main_core, ui_vue3_pinia) {
	'use strict';

	const useUsersStore = ui_vue3_pinia.defineStore('users', {
		state: () => ({
			collection: {}
		}),
		getters: {
			getById: state => userId => {
				return state.collection[userId] ?? null;
			},
			getByIds: state => userIds => {
				return userIds.map(userId => state.collection[userId]).filter(user => !main_core.Type.isNil(user));
			}
		},
		actions: {
			createWithCurrentUser(user) {
				const currentUser = user ?? this.getElementState();
				this.collection = {
					[currentUser.id]: currentUser
				};
			},
			upsertMany(users) {
				users.forEach(user => {
					const userItem = this.collection[user.id] || this.getElementState();
					this.collection[user.id] = {
						...userItem,
						...user
					};
				});
			},
			getState() {
				return {
					collection: this.collection
				};
			},
			getElementState() {
				return {
					id: 0,
					name: '',
					image: '',
					type: ''
				};
			}
		}
	});

	const UserTypes = Object.freeze({
		Employee: 'employee',
		Collaber: 'collaber',
		Extranet: 'extranet'
	});

	exports.UserTypes = UserTypes;
	exports.useUsersStore = useUsersStore;

})(this.BX.Socialnetwork.V2.Model = this.BX.Socialnetwork.V2.Model || {}, BX, BX.Vue3.Pinia);
//# sourceMappingURL=users.bundle.js.map
