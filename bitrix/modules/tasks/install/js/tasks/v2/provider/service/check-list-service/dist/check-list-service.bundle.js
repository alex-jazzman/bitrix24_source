/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Provider = this.BX.Tasks.V2.Provider || {};
(function (exports, tasks_v2_model_users, tasks_v2_provider_service_userService, main_core, tasks_v2_core, tasks_v2_const, tasks_v2_lib_apiClient, tasks_v2_lib_idUtils, tasks_v2_provider_service_taskService) {
	'use strict';

	function prepareCheckLists(checklist) {
		const parentNodeIdMap = new Map();
		checklist.forEach(item => {
			parentNodeIdMap.set(item.id, item.nodeId);
		});
		return checklist.map(item => {
			const parentNodeId = item.parentId ? parentNodeIdMap.get(item.parentId) : 0;
			return {
				...item,
				parentNodeId
			};
		});
	}

	// todo remove after features.isV2Enabled === true
	function prepareTitleCheckLists(checklist) {
		return checklist.map(item => {
			const title = prepareTitle(item);
			return {
				...item,
				title
			};
		});
	}
	function mapDtoToModel(checkList) {
		return {
			id: checkList.id,
			nodeId: checkList.nodeId,
			title: checkList.title,
			creator: checkList.creator ? tasks_v2_provider_service_userService.UserMappers.mapDtoToModel(checkList.creator) : null,
			toggledBy: checkList.toggledBy ? tasks_v2_provider_service_userService.UserMappers.mapDtoToModel(checkList.toggledBy) : null,
			toggledDate: checkList.toggledDate,
			accomplices: checkList.accomplices?.map(it => tasks_v2_provider_service_userService.UserMappers.mapDtoToModel(it)),
			auditors: checkList.auditors?.map(it => tasks_v2_provider_service_userService.UserMappers.mapDtoToModel(it)),
			attachments: checkList.attachments,
			isComplete: checkList.isComplete,
			isImportant: checkList.isImportant,
			parentId: checkList.parentId,
			parentNodeId: checkList.parentNodeId,
			sortIndex: checkList.sortIndex,
			actions: checkList.actions,
			panelIsShown: checkList.panelIsShown,
			myFilterActive: checkList.myFilterActive,
			collapsed: checkList.collapsed,
			expanded: checkList.expanded,
			localCompleteState: checkList.localCompleteState,
			localCollapsedState: checkList.localCollapsedState,
			areCompletedCollapsed: checkList.areCompletedCollapsed,
			hidden: checkList.hidden,
			groupMode: checkList.groupMode
		};
	}
	function mapModelToSliderData(checkLists) {
		return Object.fromEntries(checkLists.map(item => {
			const accomplices = item.accomplices?.map(accomplice => ({
				ID: accomplice.id,
				TYPE: 'A',
				NAME: accomplice.name,
				IMAGE: accomplice.image,
				IS_COLLABER: accomplice.type === tasks_v2_model_users.UserTypes.Collaber ? 1 : ''
			}));
			const auditors = item.auditors?.map(auditor => ({
				ID: auditor.id,
				TYPE: 'U',
				NAME: auditor.name,
				IMAGE: auditor.image,
				IS_COLLABER: auditor.type === tasks_v2_model_users.UserTypes.Collaber ? 1 : ''
			}));
			const attachments = Object.fromEntries(item.attachments?.map(key => [key, key]));
			const members = [...accomplices, ...auditors].reduce((acc, curr) => {
				acc[curr.ID] = curr;
				return acc;
			}, {});
			const title = prepareTitle(item);
			const node = Object.fromEntries(Object.entries({
				NODE_ID: item.nodeId,
				TITLE: title,
				CREATED_BY: item.creator?.id,
				TOGGLED_BY: item.toggledBy?.id,
				TOGGLED_DATE: item.toggledDate,
				MEMBERS: members,
				NEW_FILE_IDS: attachments,
				ATTACHMENTS: attachments,
				IS_COMPLETE: item.isComplete,
				IS_IMPORTANT: item.isImportant,
				PARENT_ID: item.parentId,
				SORT_INDEX: item.sortIndex,
				ACTIONS: {
					MODIFY: item.actions.modify,
					REMOVE: item.actions.remove,
					TOGGLE: item.actions.toggle
				}
			}).filter(([, value]) => value !== null && value !== undefined));
			return [item.nodeId, node];
		}));
	}
	function getUserIdsFromChecklists(checkLists, userType) {
		return checkLists.flatMap(item => (item[userType] || []).map(user => user.id)).filter((id, idx, arr) => arr.indexOf(id) === idx);
	}
	function prepareTitle(item) {
		const names = [...(item.accomplices ?? []).map(member => member.name), ...(item.auditors ?? []).map(member => member.name)].join(' ');
		if (names) {
			return `${item.title} ${names}`;
		}
		return item.title;
	}

	class CheckListService {
		#getPromises = {};
		#completeCheckListIds = {};
		#renewCheckListIds = {};
		#completePromises = {};
		#renewPromises = {};
		#completeDebounced = {};
		#renewDebounced = {};
		constructor() {
			main_core.Event.bind(window, 'beforeunload', this.handleBeforeUnload);
		}
		handleBeforeUnload = () => {
			void this.forceSaveAllPending();
		};
		async load(taskId, cloneTo) {
			const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
			if (!tasks_v2_lib_idUtils.idUtils.isReal(taskId) && task.templateId) {
				await this.load(tasks_v2_lib_idUtils.idUtils.boxTemplate(task.templateId), taskId);
				return;
			}
			const isTemplate = tasks_v2_lib_idUtils.idUtils.isTemplate(taskId);
			const toId = cloneTo ?? taskId;
			const urlCheckListGet = isTemplate ? 'Template.CheckList.get' : tasks_v2_const.Endpoint.CheckListGet;
			const idKey = isTemplate ? 'templateId' : 'taskId';
			// eslint-disable-next-line no-async-promise-executor
			this.#getPromises[toId] = new Promise(async (resolve, reject) => {
				try {
					const data = await tasks_v2_lib_apiClient.apiClient.post(urlCheckListGet, {
						[idKey]: tasks_v2_lib_idUtils.idUtils.unbox(taskId)
					});
					let checkLists = data.map(it => mapDtoToModel(it));
					if (cloneTo) {
						checkLists = this.#clone(checkLists);
					}
					await Promise.all([this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/upsertMany`, checkLists), tasks_v2_provider_service_taskService.taskService.updateStoreTask(toId, {
						containsChecklist: checkLists.length > 0,
						checklist: checkLists.map(({
							id
						}) => id)
					})]);
					resolve();
				} catch (error) {
					reject(error);
				}
			});
			await this.#getPromises[toId];
		}
		async save(taskId, checklists, skipNotification = false) {
			checklists = this.#excludeDeletingItems(checklists);

			// eslint-disable-next-line no-async-promise-executor
			return new Promise(async (resolve, reject) => {
				try {
					const isTemplate = tasks_v2_lib_idUtils.idUtils.isTemplate(taskId);
					const idPure = tasks_v2_lib_idUtils.idUtils.unbox(taskId);
					const urlCheckListSave = isTemplate ? 'Template.CheckList.save' : tasks_v2_const.Endpoint.CheckListSave;
					const entity = isTemplate ? 'template' : 'task';
					const features = tasks_v2_core.Core.getParams().features;

					// todo remove after features.isV2Enabled === true
					const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
					const canOpenFullCard = features.isV2Enabled || main_core.Type.isArray(features.allowedGroups) && features.allowedGroups.includes(task.groupId);
					if (!canOpenFullCard) {
						// todo remove after features.isV2Enabled === true
						// eslint-disable-next-line no-param-reassign
						checklists = prepareTitleCheckLists(checklists);
					}
					const savedList = await tasks_v2_lib_apiClient.apiClient.post(urlCheckListSave, {
						[entity]: {
							id: idPure,
							checklist: prepareCheckLists(checklists)
						},
						skipNotification
					});
					const checkLists = savedList.map(it => mapDtoToModel(it));
					await Promise.all([this.$store.dispatch(`${tasks_v2_const.Model.Interface}/setDisableCheckListAnimations`, true), this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/upsertMany`, checkLists)]);
					await this.#updateTask(taskId, checkLists);
					void this.$store.dispatch(`${tasks_v2_const.Model.Interface}/setDisableCheckListAnimations`, false);
					resolve();
				} catch (error) {
					reject(error);
				}
			});
		}
		async collapse(taskId, checkListId) {
			const isTemplate = tasks_v2_lib_idUtils.idUtils.isTemplate(taskId);
			const idPure = tasks_v2_lib_idUtils.idUtils.unbox(taskId);
			const urlCheckListCollapse = isTemplate ? 'Template.CheckList.collapse' : tasks_v2_const.Endpoint.CheckListCollapse;
			const entity = isTemplate ? 'template' : 'task';
			await tasks_v2_lib_apiClient.apiClient.post(urlCheckListCollapse, {
				[`${entity}Id`]: idPure,
				checkListId
			});
			void this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/update`, {
				id: checkListId,
				fields: {
					collapsed: true,
					expanded: false
				}
			});
		}
		async expand(taskId, checkListId) {
			const isTemplate = tasks_v2_lib_idUtils.idUtils.isTemplate(taskId);
			const idPure = tasks_v2_lib_idUtils.idUtils.unbox(taskId);
			const urlCheckListExpand = isTemplate ? 'Template.CheckList.expand' : tasks_v2_const.Endpoint.CheckListExpand;
			const entity = isTemplate ? 'template' : 'task';
			await tasks_v2_lib_apiClient.apiClient.post(urlCheckListExpand, {
				[`${entity}Id`]: idPure,
				checkListId
			});
			void this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/update`, {
				id: checkListId,
				fields: {
					collapsed: false,
					expanded: true
				}
			});
		}
		async complete(taskId, checkListId) {
			await this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/update`, {
				id: checkListId,
				fields: {
					isComplete: true
				}
			});
			this.#completeCheckListIds[taskId] ??= new Set();
			this.#completeCheckListIds[taskId].add(checkListId);
			this.#completePromises[taskId] ??= new Resolvable();
			this.#completeDebounced[taskId] ??= main_core.Runtime.debounce(this.#completeCheckLists, 1500, this);
			this.#completeDebounced[taskId](taskId);
			await this.#completePromises[taskId];
		}
		async renew(taskId, checkListId) {
			await this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/update`, {
				id: checkListId,
				fields: {
					isComplete: false
				}
			});
			this.#renewCheckListIds[taskId] ??= new Set();
			this.#renewCheckListIds[taskId].add(checkListId);
			this.#renewPromises[taskId] ??= new Resolvable();
			this.#renewDebounced[taskId] ??= main_core.Runtime.debounce(this.#renewCheckLists, 1500, this);
			this.#renewDebounced[taskId](taskId);
			await this.#renewPromises[taskId];
		}
		async delete(taskId, checkListId) {
			const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
			const checklists = this.$store.getters[`${tasks_v2_const.Model.CheckList}/getByIds`](task.checklist);
			await this.save(taskId, checklists);
		}
		async #completeCheckLists(taskId) {
			const isTemplate = tasks_v2_lib_idUtils.idUtils.isTemplate(taskId);
			const idPure = tasks_v2_lib_idUtils.idUtils.unbox(taskId);
			const urlCheckListComplete = isTemplate ? 'Template.CheckList.complete' : tasks_v2_const.Endpoint.CheckListComplete;
			const entity = isTemplate ? 'template' : 'task';
			const checkListIds = this.#completeCheckListIds[taskId];
			delete this.#completeCheckListIds[taskId];
			const promise = this.#completePromises[taskId];
			delete this.#completePromises[taskId];
			if (!checkListIds || checkListIds.size === 0) {
				promise?.resolve();
				return;
			}
			try {
				const checkLists = await Promise.all([...checkListIds].map(checkListId => {
					return this.$store.getters[`${tasks_v2_const.Model.CheckList}/getById`](checkListId);
				}));
				await tasks_v2_lib_apiClient.apiClient.post(urlCheckListComplete, {
					[entity]: {
						id: idPure,
						checklist: prepareCheckLists(checkLists)
					}
				});
				promise?.resolve();
			} catch {
				promise?.resolve();
			}
		}
		async #renewCheckLists(taskId) {
			const isTemplate = tasks_v2_lib_idUtils.idUtils.isTemplate(taskId);
			const idPure = tasks_v2_lib_idUtils.idUtils.unbox(taskId);
			const urlCheckListRenew = isTemplate ? 'Template.CheckList.renew' : tasks_v2_const.Endpoint.CheckListRenew;
			const entity = isTemplate ? 'template' : 'task';
			const checkListIds = this.#renewCheckListIds[taskId];
			delete this.#renewCheckListIds[taskId];
			const promise = this.#renewPromises[taskId];
			delete this.#renewPromises[taskId];
			if (!checkListIds || checkListIds.size === 0) {
				promise?.resolve();
				return;
			}
			try {
				const checkLists = await Promise.all([...checkListIds].map(async checkListId => {
					return this.$store.getters[`${tasks_v2_const.Model.CheckList}/getById`](checkListId);
				}));
				await tasks_v2_lib_apiClient.apiClient.post(urlCheckListRenew, {
					[entity]: {
						id: idPure,
						checklist: prepareCheckLists(checkLists)
					}
				});
				promise?.resolve();
			} catch {
				promise?.resolve();
			}
		}
		#excludeDeletingItems(checkLists) {
			const deletingMap = this.$store.getters[`${tasks_v2_const.Model.Interface}/deletingCheckListIds`] ?? {};
			const deletingIds = new Set(Object.values(deletingMap));
			if (deletingIds.size === 0) {
				return checkLists;
			}
			const queue = [...deletingIds];
			while (queue.length > 0) {
				const parentId = queue.shift();
				checkLists.forEach(item => {
					if (!deletingIds.has(item.id) && item.parentId === parentId) {
						deletingIds.add(item.id);
						queue.push(item.id);
					}
				});
			}
			return checkLists.filter(item => !deletingIds.has(item.id));
		}
		isCheckListExists(checkListId) {
			return this.#getById(checkListId) !== null;
		}
		filterItemsBelongingToCheckList(checkListId, checkListItemIds) {
			const result = [];
			checkListItemIds.forEach(checkListItemId => {
				const rootId = this.#getRootId(checkListItemId);
				if (rootId === checkListId) {
					result.push(checkListItemId);
				}
			});
			return result;
		}
		#getRootId(checkListItemId) {
			const item = this.#getById(checkListItemId);
			if (!item) {
				return 0;
			}
			if (item.parentId === 0) {
				return item.id;
			}
			return this.#getRootId(item.parentId);
		}
		#getById(checkListId) {
			return this.$store.getters[`${tasks_v2_const.Model.CheckList}/getById`](checkListId) ?? null;
		}
		async #updateTask(taskId, checkLists) {
			const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
			const accomplicesIdsSet = new Set(task?.accomplicesIds);
			const auditorsIdsSet = new Set(task?.auditorsIds);
			const users = [];
			checkLists.forEach(item => {
				item.accomplices?.forEach(accomplice => {
					users.push(accomplice);
					accomplicesIdsSet.add(accomplice.id);
				});
				item.auditors?.forEach(auditor => {
					users.push(auditor);
					auditorsIdsSet.add(auditor.id);
				});
			});
			const accomplicesIds = [...accomplicesIdsSet];
			const auditorsIds = [...auditorsIdsSet];
			await tasks_v2_core.Core.getStore().dispatch(`${tasks_v2_const.Model.Users}/upsertMany`, users);
			await tasks_v2_provider_service_taskService.taskService.updateStoreTask(taskId, {
				containsChecklist: checkLists.length > 0,
				checklist: checkLists.map(item => item.id),
				accomplicesIds,
				auditorsIds
			});
		}
		async forceCompletePending(taskId) {
			if (this.#completeCheckListIds[taskId]?.size > 0) {
				await this.#completeCheckLists(taskId);
			}
		}
		async forceRenewPending(taskId) {
			if (this.#renewCheckListIds[taskId]?.size > 0) {
				await this.#renewCheckLists(taskId);
			}
		}
		async forceSavePending(taskId) {
			await Promise.all([this.forceCompletePending(taskId), this.forceRenewPending(taskId)]);
		}
		async forceSaveAllPending() {
			const allTaskIds = new Set([...Object.keys(this.#completeCheckListIds), ...Object.keys(this.#renewCheckListIds)]);
			await Promise.all([...allTaskIds].map(taskId => this.forceSavePending(parseInt(taskId, 10))));
		}
		#clone(checkLists) {
			const {
				idsMap,
				nodeIdsMap
			} = checkLists.reduce((maps, {
				id,
				nodeId
			}) => {
				maps.idsMap.set(id, main_core.Text.getRandom());
				if (nodeId) {
					maps.nodeIdsMap.set(nodeId, main_core.Text.getRandom());
				}
				return maps;
			}, {
				idsMap: new Map(),
				nodeIdsMap: new Map()
			});
			return checkLists.map(checkList => ({
				...checkList,
				id: idsMap.get(checkList.id),
				copiedId: checkList.id,
				nodeId: nodeIdsMap.get(checkList.nodeId) ?? main_core.Text.getRandom(),
				parentId: idsMap.get(checkList.parentId) ?? 0,
				parentNodeId: nodeIdsMap.get(checkList.parentNodeId) ?? null,
				actions: {
					modify: true,
					remove: true,
					toggle: true
				}
			}));
		}
		get $store() {
			return tasks_v2_core.Core.getStore();
		}
	}
	const checkListService = new CheckListService();
	function Resolvable() {
		const promise = new Promise(resolve => {
			this.resolve = resolve;
		});
		promise.resolve = this.resolve;
		return promise;
	}

	const CheckListMappers = {
		mapModelToSliderData,
		getUserIdsFromChecklists
	};

	exports.CheckListMappers = CheckListMappers;
	exports.checkListService = checkListService;

})(this.BX.Tasks.V2.Provider.Service = this.BX.Tasks.V2.Provider.Service || {}, BX.Tasks.V2.Model, BX.Tasks.V2.Provider.Service, BX, BX.Tasks.V2, BX.Tasks.V2.Const, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Tasks.V2.Provider.Service);
//# sourceMappingURL=check-list-service.bundle.js.map
