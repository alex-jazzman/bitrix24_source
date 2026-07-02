/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Provider = this.BX.Tasks.V2.Provider || {};
(function (exports, main_core, tasks_v2_core, tasks_v2_const, tasks_v2_lib_idUtils, main_core_events, tasks_v2_lib_apiClient, tasks_v2_provider_service_taskService, tasks_v2_provider_service_checkListService, tasks_v2_provider_service_relationService, tasks_v2_component_fields_userFields) {
	'use strict';

	var _Class_brand$1;
	function _classPrivateMethodInitSpec$1(e, a) { _checkPrivateRedeclaration$1(e, a), a.add(e); }
	function _checkPrivateRedeclaration$1(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
	function _assertClassBrand$1(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
	const permissionBuilder = new (_Class_brand$1 = /*#__PURE__*/new WeakSet(), class {
		constructor() {
			_classPrivateMethodInitSpec$1(this, _Class_brand$1);
		}
		getPermissions(task) {
			var _task$permissions;
			const currentUserId = tasks_v2_core.Core.getParams().currentUser.id;
			const permissions = ((_task$permissions = task.permissions) !== null && _task$permissions !== void 0 ? _task$permissions : []).map(p => ({
				...p
			}));
			_assertClassBrand$1(_Class_brand$1, this, _grantUser).call(this, currentUserId, permissions);
			if (!tasks_v2_lib_idUtils.idUtils.isReal(task.id) && task.creatorId !== currentUserId) {
				_assertClassBrand$1(_Class_brand$1, this, _grantUser).call(this, task.creatorId, permissions);
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
			return "".concat(entityType, ":").concat(entityId);
		}
	})();
	function _grantUser(userId, permissions) {
		if (!_assertClassBrand$1(_Class_brand$1, this, _userGranted).call(this, userId, permissions)) {
			permissions.push(_assertClassBrand$1(_Class_brand$1, this, _buildUser).call(this, userId));
		}
		return permissions;
	}
	function _userGranted(userId, permissions) {
		return permissions.find(it => it.entityType === tasks_v2_const.EntitySelectorEntity.User && it.entityId === userId);
	}
	function _buildUser(userId) {
		const user = tasks_v2_core.Core.getStore().getters["".concat(tasks_v2_const.Model.Users, "/getById")](userId);
		return {
			id: this.buildId(tasks_v2_const.EntitySelectorEntity.User, user.id),
			entityType: tasks_v2_const.EntitySelectorEntity.User,
			entityId: user.id,
			title: user.name,
			image: user.image,
			permission: tasks_v2_const.PermissionType.Full
		};
	}

	const mapPermissionDtoToModel = dto => {
		var _dto$accessEntity;
		return {
			id: permissionBuilder.buildId(dto.accessEntity.type, dto.accessEntity.id),
			entityId: dto.accessEntity.id,
			entityType: dto.accessEntity.type,
			title: dto.accessEntity.name,
			image: (_dto$accessEntity = dto.accessEntity) === null || _dto$accessEntity === void 0 || (_dto$accessEntity = _dto$accessEntity.image) === null || _dto$accessEntity === void 0 ? void 0 : _dto$accessEntity.src,
			permission: dto.permissionId
		};
	};
	const mapPermissionModelToDto = permission => ({
		accessEntity: {
			id: permission.entityId,
			type: permission.entityType
		},
		permissionId: permission.permission
	});
	const mapRights = _ref => {
		let {
			read,
			edit,
			remove,
			create
		} = _ref;
		return {
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
		};
	};
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

	var _updateFields, _updateTaskBefore, _updatePromises, _updateServerTaskDebounced, _Class_brand;
	function _classPrivateMethodInitSpec(e, a) { _checkPrivateRedeclaration(e, a), a.add(e); }
	function _classPrivateFieldInitSpec(e, t, a) { _checkPrivateRedeclaration(e, t), t.set(e, a); }
	function _checkPrivateRedeclaration(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
	function _classPrivateFieldGet(s, a) { return s.get(_assertClassBrand(s, a)); }
	function _assertClassBrand(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
	const templateService = new (_updateFields = /*#__PURE__*/new WeakMap(), _updateTaskBefore = /*#__PURE__*/new WeakMap(), _updatePromises = /*#__PURE__*/new WeakMap(), _updateServerTaskDebounced = /*#__PURE__*/new WeakMap(), _Class_brand = /*#__PURE__*/new WeakSet(), class {
		constructor() {
			_classPrivateMethodInitSpec(this, _Class_brand);
			_classPrivateFieldInitSpec(this, _updateFields, {});
			_classPrivateFieldInitSpec(this, _updateTaskBefore, {});
			_classPrivateFieldInitSpec(this, _updatePromises, {});
			_classPrivateFieldInitSpec(this, _updateServerTaskDebounced, {});
			main_core.Event.bind(window, 'beforeunload', () => {
				setTimeout(() => {
					const pendingIds = Object.keys(_classPrivateFieldGet(_updatePromises, this));
					pendingIds.forEach(id => _assertClassBrand(_Class_brand, this, _requestUpdate).call(this, id));
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
			var _template$checklist;
			const template = await this.get(id);
			if (((_template$checklist = template.checklist) === null || _template$checklist === void 0 ? void 0 : _template$checklist.length) > 0) {
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
				var _template$checklist2;
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
				if (((_template$checklist2 = template.checklist) === null || _template$checklist2 === void 0 ? void 0 : _template$checklist2.length) > 0) {
					void tasks_v2_provider_service_checkListService.checkListService.save(data.id, this.$store.getters["".concat(tasks_v2_const.Model.CheckList, "/getByIds")](template.checklist));
				}
				return [data.id, null];
			} catch (error) {
				var _error$errors;
				console.error(tasks_v2_const.Endpoint.TemplateAdd, error);
				return [0, new Error((_error$errors = error.errors) === null || _error$errors === void 0 || (_error$errors = _error$errors[0]) === null || _error$errors === void 0 ? void 0 : _error$errors.message)];
			}
		}
		async copy(template) {
			try {
				var _template$checklist3;
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
				if (((_template$checklist3 = template.checklist) === null || _template$checklist3 === void 0 ? void 0 : _template$checklist3.length) > 0) {
					void tasks_v2_provider_service_checkListService.checkListService.save(data.id, this.$store.getters["".concat(tasks_v2_const.Model.CheckList, "/getByIds")](template.checklist));
				}
				return [data.id, null];
			} catch (error) {
				var _error$errors2;
				console.error(tasks_v2_const.Endpoint.TemplateCopy, error);
				return [0, new Error((_error$errors2 = error.errors) === null || _error$errors2 === void 0 || (_error$errors2 = _error$errors2[0]) === null || _error$errors2 === void 0 ? void 0 : _error$errors2.message)];
			}
		}
		async getTask(templateId, taskId) {
			try {
				var _data$responsible, _data$group, _data$stage, _data$checklist;
				const data = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskFromTemplateGet, {
					templateId
				});
				data.id = taskId;
				data.templateId = templateId;
				const isAdmin = tasks_v2_core.Core.getParams().rights.user.admin;
				if (!isAdmin && (((_data$responsible = data.responsible) === null || _data$responsible === void 0 ? void 0 : _data$responsible.id) !== tasks_v2_core.Core.getParams().currentUser.id || main_core.Type.isArrayFilled(data.multiResponsibles))) {
					data.creator = tasks_v2_core.Core.getParams().currentUser;
				}
				(_data$group = data.group) !== null && _data$group !== void 0 ? _data$group : data.group = {
					id: 0
				};
				(_data$stage = data.stage) !== null && _data$stage !== void 0 ? _data$stage : data.stage = {
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
				if (((_data$checklist = data.checklist) === null || _data$checklist === void 0 ? void 0 : _data$checklist.length) > 0) {
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
				return [data.id, null];
			} catch (error) {
				var _error$errors3;
				console.error(tasks_v2_const.Endpoint.TaskFromTemplateAdd, error);
				return [0, new Error((_error$errors3 = error.errors) === null || _error$errors3 === void 0 || (_error$errors3 = _error$errors3[0]) === null || _error$errors3 === void 0 ? void 0 : _error$errors3.message)];
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
			return _assertClassBrand(_Class_brand, this, _updateDebounced).call(this, id, fields, templateBefore);
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
			await this.$store.dispatch("".concat(tasks_v2_const.Model.Tasks, "/insert"), {
				...task,
				permissions: []
			});
		}
		get $store() {
			return tasks_v2_core.Core.getStore();
		}
	})();
	function _updateDebounced(id, fields, templateBefore) {
		var _classPrivateFieldGet2, _classPrivateFieldGet3, _classPrivateFieldGet4, _classPrivateFieldGet5, _classPrivateFieldGet6, _classPrivateFieldGet7;
		_classPrivateFieldGet(_updateFields, this)[id] = {
			..._classPrivateFieldGet(_updateFields, this)[id],
			...fields
		};
		(_classPrivateFieldGet3 = (_classPrivateFieldGet2 = _classPrivateFieldGet(_updateTaskBefore, this))[id]) !== null && _classPrivateFieldGet3 !== void 0 ? _classPrivateFieldGet3 : _classPrivateFieldGet2[id] = templateBefore;
		(_classPrivateFieldGet5 = (_classPrivateFieldGet4 = _classPrivateFieldGet(_updatePromises, this))[id]) !== null && _classPrivateFieldGet5 !== void 0 ? _classPrivateFieldGet5 : _classPrivateFieldGet4[id] = new Resolvable();
		(_classPrivateFieldGet7 = (_classPrivateFieldGet6 = _classPrivateFieldGet(_updateServerTaskDebounced, this))[id]) !== null && _classPrivateFieldGet7 !== void 0 ? _classPrivateFieldGet7 : _classPrivateFieldGet6[id] = main_core.Runtime.debounce(_assertClassBrand(_Class_brand, this, _requestUpdate), 500, this);
		_classPrivateFieldGet(_updateServerTaskDebounced, this)[id](id);
		return _classPrivateFieldGet(_updatePromises, this)[id];
	}
	async function _requestUpdate(id) {
		const fields = _classPrivateFieldGet(_updateFields, this)[id];
		delete _classPrivateFieldGet(_updateFields, this)[id];
		const templateBefore = _classPrivateFieldGet(_updateTaskBefore, this)[id];
		delete _classPrivateFieldGet(_updateTaskBefore, this)[id];
		const promise = _classPrivateFieldGet(_updatePromises, this)[id];
		delete _classPrivateFieldGet(_updatePromises, this)[id];
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

})(this.BX.Tasks.V2.Provider.Service = this.BX.Tasks.V2.Provider.Service || {}, BX, BX.Tasks.V2, BX.Tasks.V2.Const, BX.Tasks.V2.Lib, BX.Event, BX.Tasks.V2.Lib, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Component.Fields);
//# sourceMappingURL=template-service.bundle.js.map
