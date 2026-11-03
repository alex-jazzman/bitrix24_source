/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Provider = this.BX.Tasks.V2.Provider || {};
(function (exports, main_core, tasks_v2_const, tasks_v2_core, tasks_v2_lib_apiClient) {
	'use strict';

	function mapDtoToModel(userDto) {
		return {
			id: userDto.id,
			name: userDto.name,
			image: userDto.image?.src,
			type: userDto.type
		};
	}
	function mapModelToDto(user) {
		return {
			id: user.id,
			name: user.name,
			image: {
				src: user.image
			},
			type: user.type
		};
	}

	class UserService {
		#loadingPromises = new Map();
		getUrl(id) {
			const settings = main_core.Extension.getSettings('tasks.v2.application.task-card');
			const urlTemplate = settings.userDetailUrlTemplate;
			if (!urlTemplate) {
				return `/company/personal/user/${id}/`;
			}
			return urlTemplate.replace('#USER_ID#', String(id));
		}
		async list(ids) {
			const unloadedIds = this.#getUnloadedIds(ids);
			const loadingPromises = new Set();
			const idsToLoad = unloadedIds.filter(id => {
				const loadingPromise = this.#loadingPromises.get(id);
				if (loadingPromise) {
					loadingPromises.add(loadingPromise);
					return false;
				}
				return true;
			});
			if (idsToLoad.length > 0) {
				const loadingPromise = this.#load(idsToLoad);
				idsToLoad.forEach(id => this.#loadingPromises.set(id, loadingPromise));
				void loadingPromise.finally(() => {
					idsToLoad.forEach(id => {
						if (this.#loadingPromises.get(id) === loadingPromise) {
							this.#loadingPromises.delete(id);
						}
					});
				});
				loadingPromises.add(loadingPromise);
			}
			await Promise.all(loadingPromises);
		}
		async #load(ids) {
			try {
				const data = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.UserList, {
					ids
				});
				const users = data.map(user => mapDtoToModel(user));
				await this.$store.dispatch(`${tasks_v2_const.Model.Users}/upsertMany`, users);
			} catch (error) {
				console.error('UserService: list error', error);
			}
		}
		hasUsers(ids) {
			return this.#getUnloadedIds(ids).length === 0;
		}
		#getUnloadedIds(ids) {
			const loadedUsers = this.$store.getters[`${tasks_v2_const.Model.Users}/getByIds`](ids);
			const loadedIds = new Set(loadedUsers.map(({
				id
			}) => id));
			return ids.filter(id => !loadedIds.has(id));
		}
		get $store() {
			return tasks_v2_core.Core.getStore();
		}
	}
	const userService = new UserService();

	const UserMappers = {
		mapDtoToModel,
		mapModelToDto
	};

	exports.UserMappers = UserMappers;
	exports.userService = userService;

})(this.BX.Tasks.V2.Provider.Service = this.BX.Tasks.V2.Provider.Service || {}, BX, BX.Tasks.V2.Const, BX.Tasks.V2, BX.Tasks.V2.Lib);
//# sourceMappingURL=user-service.bundle.js.map
