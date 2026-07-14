/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Provider = this.BX.Tasks.V2.Provider || {};
(function (exports, main_core, tasks_v2_core, tasks_v2_const, tasks_v2_lib_idUtils, main_core_events, tasks_v2_lib_apiClient, tasks_v2_provider_service_taskService, tasks_v2_provider_service_checkListService, tasks_v2_provider_service_fileService, tasks_v2_provider_service_relationService, tasks_v2_component_fields_userFields) {
	'use strict';

	const permissionBuilder = new class {
		getPermissions(task) {
			const currentUserId = tasks_v2_core.Core.getParams().currentUser.id;
			const permissions = (task.permissions ?? []).map(p => ({
				...p
			}));
			this.#grantUser(currentUserId, permissions);
			if (!tasks_v2_lib_idUtils.idUtils.isReal(task.id) && task.creatorId !== currentUserId) {
				this.#grantUser(task.creatorId, permissions);
			}
			return permissions;
		}
		buildFromItem(item) {
			const entityId = item.getId();
			let entityType = item.getEntityId();
			if ([tasks_v2_const.EntitySelectorEntity.Group, tasks_v2_const.EntitySelectorEntity.Project].includes(entityType)) {
				entityType = tasks_v2_const.EntitySelectorEntity.Group;
			}
			return {
				id: this.buildId(entityType, entityId),
				entityType,
				entityId,
				title: item.getTitle(),
				image: item.getAvatar(),
				permission: tasks_v2_const.PermissionType.Full
			};
		}
		buildItemId(permission) {
			const mainDepartmentId = tasks_v2_core.Core.getParams().mainDepartmentUfId;
			let type = permission.entityType;
			let id = permission.entityId;
			if (type === tasks_v2_const.EntitySelectorEntity.Group) {
				type = tasks_v2_const.EntitySelectorEntity.Project;
			}
			if (type === tasks_v2_const.EntitySelectorEntity.Department && permission.entityId === mainDepartmentId) {
				type = tasks_v2_const.EntitySelectorEntity.MetaUser;
				id = tasks_v2_const.EntitySelectorEntity.AllUser;
			}
			return [type, id];
		}
		buildId(entityType, entityId) {
			return `${entityType}:${entityId}`;
		}
		#grantUser(userId, permissions) {
			if (!this.#userGranted(userId, permissions)) {
				permissions.push(this.#buildUser(userId));
			}
			return permissions;
		}
		#userGranted(userId, permissions) {
			return permissions.find(it => it.entityType === tasks_v2_const.EntitySelectorEntity.User && it.entityId === userId);
		}
		#buildUser(userId) {
			const user = tasks_v2_core.Core.getStore().getters[`${tasks_v2_const.Model.Users}/getById`](userId);
			return {
				id: this.buildId(tasks_v2_const.EntitySelectorEntity.User, user.id),
				entityType: tasks_v2_const.EntitySelectorEntity.User,
				entityId: user.id,
				title: user.name,
				image: user.image,
				permission: tasks_v2_const.PermissionType.Full
			};
		}
	}();

	const mapPermissionDtoToModel = dto => ({
		id: permissionBuilder.buildId(dto.accessEntity.type, dto.accessEntity.id),
		entityId: dto.accessEntity.id,
		entityType: dto.accessEntity.type,
		title: dto.accessEntity.name,
		image: dto.accessEntity?.image?.src,
		permission: dto.permissionId
	});
	const mapPermissionModelToDto = permission => ({
		accessEntity: {
			id: permission.entityId,
			type: permission.entityType
		},
		permissionId: permission.permission
	});
	const mapRights = ({
		read,
		edit,
		remove,
		create
	}) => ({
		read,
		edit,
		remove,
		create,
		complete: edit,
		approve: edit,
		disapprove: edit,
		start: edit,
		take: edit,
		delegate: edit,
		defer: edit,
		renew: edit,
		deadline: edit,
		datePlan: edit,
		changeDirector: edit,
		changeResponsible: edit,
		changeAccomplices: edit,
		pause: edit,
		timeTracking: edit,
		rate: edit,
		changeStatus: edit,
		reminder: edit,
		addAuditors: edit,
		elapsedTime: edit,
		favorite: edit,
		checklistAdd: edit,
		checklistEdit: edit,
		checklistSave: edit,
		checklistToggle: edit,
		automate: edit,
		resultEdit: edit,
		completeResult: edit,
		removeResult: edit,
		resultRead: edit,
		admin: edit,
		watch: edit,
		mute: edit,
		createSubtask: edit,
		copy: edit,
		createFromTemplate: edit,
		saveAsTemplate: edit,
		attachFile: edit,
		detachFile: edit,
		detachParent: edit,
		detachRelated: edit,
		changeDependence: edit,
		createGanttDependence: edit,
		sort: edit
	});
	const mapDtoToTaskDto = templateDto => ({
		title: templateDto.title,
		responsibleCollection: templateDto.responsibleCollection,
		deadlineTs: mapValue(templateDto.deadlineAfter, ceilTs(Date.now() + templateDto.deadlineAfter * 1000) / 1000),
		matchesWorkTime: templateDto.matchesWorkTime,
		subTaskIds: templateDto.subTemplateIds
	});
	const step = 60 * 1000;
	const ceilTs = timestamp => Math.ceil(timestamp / step) * step;
	const mapValue = (value, mapped) => main_core.Type.isNil(value) ? value : mapped;

	const templateService = new class {
		constructor() {
			main_core.Event.bind(window, 'beforeunload', () => {
				setTimeout(() => {
					const pendingIds = Object.keys(this.#updatePromises);
					pendingIds.forEach(id => this.#requestUpdate(id));
				});
			});
		}
		async get(id) {
			try {
				const data = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TemplateGet, {
					templateId: tasks_v2_lib_idUtils.idUtils.unbox(id)
				});
				if (!data) {
					return null;
				}
				data.id = id;
				tasks_v2_provider_service_taskService.taskService.extractTask({
					...data,
					rights: mapRights(data.rights)
				}, false);
			} catch (error) {
				console.error(tasks_v2_const.Endpoint.TemplateGet, error);
			}
			return tasks_v2_provider_service_taskService.taskService.getStoreTask(id);
		}
		async getCopy(id, tmpId) {
			const template = await this.get(id);
			if (template.checklist?.length > 0) {
				await tasks_v2_provider_service_checkListService.checkListService.load(id, tmpId);
			}
			const fields = {
				title: template.title,
				description: template.description,
				creatorId: template.creatorId,
				responsibleIds: template.isForNewUser ? [0] : template.responsibleIds,
				deadlineAfter: template.deadlineAfter,
				needsControl: template.needsControl,
				startDatePlanAfter: template.startDatePlanAfter,
				endDatePlanAfter: template.endDatePlanAfter,
				fileIds: template.fileIds,
				groupId: template.groupId,
				isImportant: template.isImportant,
				accomplicesIds: template.accomplicesIds,
				auditorsIds: template.auditorsIds,
				parentId: template.parentId,
				allowsChangeDeadline: template.allowsChangeDeadline,
				matchesWorkTime: template.matchesWorkTime,
				tags: template.tags,
				crmItemIds: template.crmItemIds,
				containsRelatedTasks: template.containsRelatedTasks,
				relatedTaskIds: template.relatedTaskIds,
				allowsTimeTracking: template.allowsTimeTracking,
				estimatedTime: template.estimatedTime,
				permissions: [],
				userFields: template.userFields,
				isForNewUser: template.isForNewUser,
				replicate: template.replicate,
				replicateParams: template.replicateParams,
				requireResult: template.requireResult
			};
			fields.permissions = permissionBuilder.getPermissions(fields);
			if (main_core.Type.isArrayFilled(fields.userFields)) {
				fields.userFields = tasks_v2_component_fields_userFields.userFieldsManager.prepareUserFieldsForTaskFromTemplate(fields.userFields, tasks_v2_core.Core.getParams().templateUserFieldScheme);
			}
			tasks_v2_provider_service_taskService.taskService.updateStoreTask(tmpId, fields);
		}
		async add(template) {
			try {
				const data = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TemplateAdd, {
					template: tasks_v2_provider_service_taskService.TaskMappers.mapModelToDto(template)
				});
				data.id = tasks_v2_lib_idUtils.idUtils.boxTemplate(data.id);
				tasks_v2_provider_service_taskService.taskService.updateStoreTask(template.id, {
					id: data.id
				});
				tasks_v2_provider_service_taskService.taskService.extractTask({
					...data,
					rights: mapRights(data.rights)
				});
				main_core_events.EventEmitter.emit(tasks_v2_const.EventName.TemplateAdded, {
					template: tasks_v2_provider_service_taskService.taskService.getStoreTask(data.id),
					initialTemplate: template
				});
				if (template.parentId) {
					tasks_v2_provider_service_relationService.subTasksService.addStore(template.parentId, [data.id]);
				}
				if (template.checklist?.length > 0) {
					void tasks_v2_provider_service_checkListService.checkListService.save(data.id, this.$store.getters[`${tasks_v2_const.Model.CheckList}/getByIds`](template.checklist));
				}
				return [data.id, null];
			} catch (error) {
				console.error(tasks_v2_const.Endpoint.TemplateAdd, error);
				return [0, new Error(error.errors?.[0]?.message)];
			}
		}
		async copy(template) {
			try {
				const data = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TemplateCopy, {
					template: tasks_v2_provider_service_taskService.TaskMappers.mapModelToDto({
						...template,
						id: template.copiedFromId
					})
				});
				data.id = tasks_v2_lib_idUtils.idUtils.boxTemplate(data.id);
				tasks_v2_provider_service_taskService.taskService.updateStoreTask(template.id, {
					id: data.id
				});
				tasks_v2_provider_service_taskService.taskService.extractTask({
					...data,
					rights: mapRights(data.rights)
				});
				main_core_events.EventEmitter.emit(tasks_v2_const.EventName.TemplateAdded, {
					template: tasks_v2_provider_service_taskService.taskService.getStoreTask(data.id),
					initialTemplate: template
				});
				if (template.checklist?.length > 0) {
					void tasks_v2_provider_service_checkListService.checkListService.save(data.id, this.$store.getters[`${tasks_v2_const.Model.CheckList}/getByIds`](template.checklist));
				}
				return [data.id, null];
			} catch (error) {
				console.error(tasks_v2_const.Endpoint.TemplateCopy, error);
				return [0, new Error(error.errors?.[0]?.message)];
			}
		}
		async getTask(templateId, taskId) {
			try {
				const data = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskFromTemplateGet, {
					templateId
				});
				data.id = taskId;
				data.templateId = templateId;
				const isAdmin = tasks_v2_core.Core.getParams().rights.user.admin;
				if (!isAdmin && (data.responsible?.id !== tasks_v2_core.Core.getParams().currentUser.id || main_core.Type.isArrayFilled(data.multiResponsibles))) {
					data.creator = tasks_v2_core.Core.getParams().currentUser;
				}
				data.group ??= {
					id: 0
				};
				data.stage ??= {
					id: 0
				};
				const tmpTask = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
				if (tmpTask.flowId) {
					data.creator = tasks_v2_core.Core.getParams().currentUser;
					data.responsible = tasks_v2_core.Core.getParams().currentUser;
					data.description = tmpTask.description + data.description;
					delete data.multiResponsibles;
					delete data.deadlineTs;
					delete data.group;
				}
				if (main_core.Type.isArrayFilled(tmpTask.crmItemIds)) {
					const uniqueCrmItemIds = new Set([...(tmpTask.crmItemIds || []), ...(data.crmItemIds || [])]);
					data.crmItemIds = [...uniqueCrmItemIds];
					const uniqueTags = new Set();
					[...(tmpTask.tags || []), ...(data.tags || [])].forEach(tag => {
						if (main_core.Type.isString(tag)) {
							uniqueTags.add(tag);
							return;
						}
						uniqueTags.add(tag.name);
					});
					data.tags = [...uniqueTags].map(tag => ({
						name: tag
					}));
				}
				if (main_core.Type.isArrayFilled(data.userFields)) {
					data.userFields = tasks_v2_component_fields_userFields.userFieldsManager.prepareUserFieldsForTaskFromTemplate(data.userFields, tasks_v2_core.Core.getParams().taskUserFieldScheme);
				}
				tasks_v2_provider_service_taskService.taskService.extractTask(data, false);
				if (data.checklist?.length > 0) {
					await tasks_v2_provider_service_checkListService.checkListService.load(taskId);
				}
			} catch (error) {
				console.error(tasks_v2_const.Endpoint.TaskFromTemplateGet, error);
			}
		}
		async addTask(templateId, task, withSubTasks, view) {
			try {
				const data = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskFromTemplateAdd, {
					template: {
						id: templateId
					},
					task: tasks_v2_provider_service_taskService.TaskMappers.mapModelToDto(task),
					withSubTasks,
					view
				});
				data.templateId = 0;
				await tasks_v2_provider_service_taskService.taskService.onAfterTaskAdded(task, data);
				if (main_core.Type.isArrayFilled(data.files)) {
					tasks_v2_provider_service_fileService.fileService.get(data.id).loadFilesFromData(data.files);
				}
				return [data.id, null];
			} catch (error) {
				console.error(tasks_v2_const.Endpoint.TaskFromTemplateAdd, error);
				return [0, new Error(error.errors?.[0]?.message)];
			}
		}
		async update(id, fields) {
			const templateBefore = tasks_v2_provider_service_taskService.taskService.getStoreTask(id);
			if (!tasks_v2_provider_service_taskService.taskService.hasChanges(templateBefore, fields)) {
				return {};
			}
			tasks_v2_provider_service_taskService.taskService.updateStoreTask(id, fields);
			if (!tasks_v2_lib_idUtils.idUtils.isReal(id)) {
				return {};
			}
			main_core_events.EventEmitter.emit(tasks_v2_const.EventName.TemplateBeforeUpdate, {
				template: tasks_v2_provider_service_taskService.taskService.getStoreTask(id),
				fields: {
					id,
					...fields
				}
			});
			return this.#updateDebounced(id, fields, templateBefore);
		}
		async delete(id) {
			const templateBeforeDelete = tasks_v2_provider_service_taskService.taskService.getStoreTask(id);
			await tasks_v2_provider_service_taskService.taskService.deleteStore(id);
			if (!tasks_v2_lib_idUtils.idUtils.isReal(id)) {
				return;
			}
			const templateId = tasks_v2_lib_idUtils.idUtils.unbox(id);
			try {
				await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TemplateDelete, {
					templateId
				});
				main_core_events.EventEmitter.emit(tasks_v2_const.EventName.TemplateDeleted, {
					id: templateId
				});
			} catch (error) {
				await tasks_v2_provider_service_taskService.taskService.insertStoreTask(templateBeforeDelete);
				console.error(tasks_v2_const.Endpoint.TemplateDelete, error);
			}
		}
		async insertStoreTask(task) {
			await this.$store.dispatch(`${tasks_v2_const.Model.Tasks}/insert`, {
				...task,
				permissions: []
			});
		}
		#updateFields = {};
		#updateTaskBefore = {};
		#updatePromises = {};
		#updateServerTaskDebounced = {};
		#updateDebounced(id, fields, templateBefore) {
			this.#updateFields[id] = {
				...this.#updateFields[id],
				...fields
			};
			this.#updateTaskBefore[id] ??= templateBefore;
			this.#updatePromises[id] ??= new Resolvable();
			this.#updateServerTaskDebounced[id] ??= main_core.Runtime.debounce(this.#requestUpdate, 500, this);
			this.#updateServerTaskDebounced[id](id);
			return this.#updatePromises[id];
		}
		async #requestUpdate(id) {
			const fields = this.#updateFields[id];
			delete this.#updateFields[id];
			const templateBefore = this.#updateTaskBefore[id];
			delete this.#updateTaskBefore[id];
			const promise = this.#updatePromises[id];
			delete this.#updatePromises[id];
			const templateId = tasks_v2_lib_idUtils.idUtils.unbox(id);
			try {
				await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TemplateUpdate, {
					template: tasks_v2_provider_service_taskService.TaskMappers.mapModelToDto({
						id: templateId,
						...fields
					})
				});
				promise.resolve({});
			} catch (error) {
				tasks_v2_provider_service_taskService.taskService.updateStoreTask(id, templateBefore);
				console.error(tasks_v2_const.Endpoint.TemplateUpdate, error);
				promise.resolve({
					[tasks_v2_const.Endpoint.TemplateUpdate]: error.errors
				});
			}
		}
		get $store() {
			return tasks_v2_core.Core.getStore();
		}
	}();
	function Resolvable() {
		const promise = new Promise(resolve => {
			this.resolve = resolve;
		});
		promise.resolve = this.resolve;
		return promise;
	}

	const TemplateMappers = {
		mapPermissionDtoToModel,
		mapPermissionModelToDto,
		mapDtoToTaskDto,
		mapRights
	};

	exports.TemplateMappers = TemplateMappers;
	exports.permissionBuilder = permissionBuilder;
	exports.templateService = templateService;

})(this.BX.Tasks.V2.Provider.Service = this.BX.Tasks.V2.Provider.Service || {}, BX, BX.Tasks.V2, BX.Tasks.V2.Const, BX.Tasks.V2.Lib, BX.Event, BX.Tasks.V2.Lib, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Component.Fields);
//# sourceMappingURL=template-service.bundle.js.map
