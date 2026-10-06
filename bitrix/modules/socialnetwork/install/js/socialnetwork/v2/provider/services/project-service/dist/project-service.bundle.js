/* eslint-disable */
this.BX = this.BX || {};
this.BX.Socialnetwork = this.BX.Socialnetwork || {};
this.BX.Socialnetwork.V2 = this.BX.Socialnetwork.V2 || {};
this.BX.Socialnetwork.V2.Provider = this.BX.Socialnetwork.V2.Provider || {};
(function (exports, socialnetwork_v2_const, socialnetwork_v2_lib_apiClient, main_core, socialnetwork_v2_model_project) {
	'use strict';

	class AccessRightsService {
		static getDefaultPermissions() {
			return Promise.resolve({
				project: {
					whoCanInvite: socialnetwork_v2_const.AccessRightsRoleKind.AllParticipants,
					manageMessages: socialnetwork_v2_const.AccessRightsRoleKind.AllParticipants,
					manageMessagesAutoDelete: socialnetwork_v2_const.AccessRightsRoleKind.OwnerAndModerators,
					messagesAutoDeleteDelay: '',
					showHistory: socialnetwork_v2_const.AccessRightsBoolKind.Yes,
					canGuestCopyText: socialnetwork_v2_const.AccessRightsBoolKind.Yes,
					canGuestScreenshot: socialnetwork_v2_const.AccessRightsBoolKind.Yes,
					allowGuestsInvitation: socialnetwork_v2_const.AccessRightsBoolKind.Yes
				},
				tasks: {
					view: socialnetwork_v2_const.AccessRightsRoleKind.AllParticipants,
					view_all: socialnetwork_v2_const.AccessRightsRoleKind.AllParticipants,
					sort: socialnetwork_v2_const.AccessRightsRoleKind.AllParticipants,
					createTasks: socialnetwork_v2_const.AccessRightsRoleKind.AllParticipants,
					editTasks: socialnetwork_v2_const.AccessRightsRoleKind.OwnerAndModerators,
					deleteTasks: socialnetwork_v2_const.AccessRightsRoleKind.OwnerAndModerators
				},
				blog: {
					view_post: socialnetwork_v2_const.AccessRightsRoleKind.AllParticipants,
					premoderate_post: socialnetwork_v2_const.AccessRightsRoleKind.AllParticipants,
					write_post: socialnetwork_v2_const.AccessRightsRoleKind.AllParticipants,
					moderate_post: socialnetwork_v2_const.AccessRightsRoleKind.OwnerAndModerators,
					full_post: socialnetwork_v2_const.AccessRightsRoleKind.Owner,
					view_comment: socialnetwork_v2_const.AccessRightsRoleKind.AllParticipants,
					premoderate_comment: socialnetwork_v2_const.AccessRightsRoleKind.AllParticipants,
					write_comment: socialnetwork_v2_const.AccessRightsRoleKind.AllParticipants,
					moderate_comment: socialnetwork_v2_const.AccessRightsRoleKind.OwnerAndModerators,
					full_comment: socialnetwork_v2_const.AccessRightsRoleKind.OwnerAndModerators
				},
				landingKnowledge: {
					read: socialnetwork_v2_const.AccessRightsRoleKind.AllParticipants,
					edit: socialnetwork_v2_const.AccessRightsRoleKind.AllParticipants,
					sett: socialnetwork_v2_const.AccessRightsRoleKind.AllParticipants,
					delete: socialnetwork_v2_const.AccessRightsRoleKind.AllParticipants
				}
			});
		}
	}

	const dtoToModelFeatureIdMap = Object.freeze({
		tasks: 'tasks',
		chat: 'chat',
		calendar: 'calendar',
		files: 'files',
		landing_knowledge: 'landingKnowledge',
		blog: 'blog',
		forum: 'forum',
		photo: 'photo',
		search: 'search',
		marketplace: 'marketplace',
		group_lists: 'groupLists',
		wiki: 'wiki'
	});
	const modelToDtoFeatureIdMap = Object.freeze(Object.entries(dtoToModelFeatureIdMap).reduce((acc, [dtoFeatureId, modelFeatureId]) => {
		acc[modelFeatureId] = dtoFeatureId;
		return acc;
	}, {}));
	function mapDtoFeatures(featuresDto) {
		const features = {
			...socialnetwork_v2_model_project.defaultProjectFeatures
		};
		if (!main_core.Type.isPlainObject(featuresDto)) {
			return features;
		}
		Object.entries(featuresDto).forEach(([dtoFeatureId, isActive]) => {
			const modelFeatureId = dtoToModelFeatureIdMap[dtoFeatureId];
			if (!modelFeatureId || !main_core.Type.isBoolean(isActive)) {
				return;
			}
			features[modelFeatureId] = isActive;
		});
		return features;
	}
	function mapDtoToggleableFeatures(toggleableFeatures) {
		if (!Array.isArray(toggleableFeatures)) {
			return [];
		}
		return toggleableFeatures.reduce((result, dtoFeatureId) => {
			const modelFeatureId = dtoToModelFeatureIdMap[dtoFeatureId];
			if (!modelFeatureId || result.includes(modelFeatureId)) {
				return result;
			}
			result.push(modelFeatureId);
			return result;
		}, []);
	}
	function mapModelFeaturesToDto(features, toggleableFeatures) {
		if (!Array.isArray(toggleableFeatures) || toggleableFeatures.length === 0) {
			return undefined;
		}
		const result = toggleableFeatures.reduce((acc, modelFeatureId) => {
			const dtoFeatureId = modelToDtoFeatureIdMap[modelFeatureId];
			const isActive = features?.[modelFeatureId];
			if (!dtoFeatureId || !main_core.Type.isBoolean(isActive)) {
				return acc;
			}
			acc[dtoFeatureId] = isActive;
			return acc;
		}, {});
		return Object.keys(result).length > 0 ? result : undefined;
	}

	function mapModelToDto(project) {
		const dto = {
			id: mapValue$1(project.id || undefined, project.id),
			name: project.title,
			description: project.description,
			goal: project.goal,
			privacyType: project.privacyType,
			ownerId: project.ownerId,
			members: project.members,
			moderatorMembers: project.moderators,
			permissions: {
				tasks: mapTaskPermissions(project.permissions.tasks),
				blog: mapBlogPermissions(project.permissions.blog),
				landingKnowledge: mapLandingKnowledgePermissions(project.permissions.landingKnowledge)
			},
			options: {
				...project.permissions.project
			},
			dates: mapValue$1(project.dates, mapDates$1(project.dates)),
			tags: mapValue$1(project.tags, [...project.tags])
		};
		if (main_core.Type.isBoolean(project.publication)) {
			dto.publication = project.publication;
		}
		const features = mapModelFeaturesToDto(project.features, project.toggleableFeatures);
		if (features) {
			dto.features = features;
		}
		dto.baseFeatureId = project.baseFeatureId;
		const encodedFile = project.avatar?.encodedFile;
		if (encodedFile) {
			dto.avatar = {
				...project.avatar
			};
		}
		if (project.notifications && isNotificationsDirty(project.notifications, project.notificationsInitial)) {
			const notificationPayload = {
				types: project.notifications.groups.flatMap(g => g.types).map(t => ({
					id: t.id,
					counterEnabled: t.counterEnabled
				}))
			};
			dto.notifications = notificationPayload;
		}
		return dto;
	}
	function isNotificationsDirty(current, initial) {
		if (!initial) {
			return true;
		}
		const toFlagsMap = catalog => {
			return new Map(catalog.groups.flatMap(g => g.types).map(t => [t.id, t.counterEnabled]));
		};
		const currentFlags = toFlagsMap(current);
		const initialFlags = toFlagsMap(initial);
		if (currentFlags.size !== initialFlags.size) {
			return true;
		}
		for (const [id, counterEnabled] of currentFlags) {
			if (!initialFlags.has(id) || initialFlags.get(id) !== counterEnabled) {
				return true;
			}
		}
		return false;
	}
	function mapValue$1(value, mappedValue, checkIsEmpty = main_core.Type.isNil) {
		return checkIsEmpty(value) ? value : mappedValue;
	}
	function mapTaskPermissions(tasks) {
		return {
			view: tasks.view,
			view_all: tasks.view_all,
			sort: tasks.sort,
			create_tasks: tasks.createTasks,
			edit_tasks: tasks.editTasks,
			delete_tasks: tasks.deleteTasks
		};
	}
	function mapBlogPermissions(blog) {
		return {
			view_post: blog.view_post,
			premoderate_post: blog.premoderate_post,
			write_post: blog.write_post,
			moderate_post: blog.moderate_post,
			full_post: blog.full_post,
			view_comment: blog.view_comment,
			premoderate_comment: blog.premoderate_comment,
			write_comment: blog.write_comment,
			moderate_comment: blog.moderate_comment,
			full_comment: blog.full_comment
		};
	}
	function mapLandingKnowledgePermissions(landingKnowledge) {
		return {
			read: landingKnowledge.read,
			edit: landingKnowledge.edit,
			sett: landingKnowledge.sett,
			delete: landingKnowledge.delete
		};
	}
	function mapDates$1({
		startTs,
		finishTs
	}) {
		const convertTs = ts => {
			return main_core.Type.isNumber(ts) && ts > 0 ? Math.floor(ts / 1000) : null;
		};
		return {
			startTs: convertTs(startTs),
			finishTs: convertTs(finishTs)
		};
	}

	const defaultProjectPermissions = Object.freeze({
		whoCanInvite: socialnetwork_v2_const.AccessRightsRoleKind.AllParticipants,
		manageMessages: socialnetwork_v2_const.AccessRightsRoleKind.AllParticipants,
		manageMessagesAutoDelete: socialnetwork_v2_const.AccessRightsRoleKind.OwnerAndModerators,
		messagesAutoDeleteDelay: '',
		showHistory: socialnetwork_v2_const.AccessRightsBoolKind.Yes,
		canGuestCopyText: socialnetwork_v2_const.AccessRightsBoolKind.Yes,
		canGuestScreenshot: socialnetwork_v2_const.AccessRightsBoolKind.Yes,
		allowGuestsInvitation: socialnetwork_v2_const.AccessRightsBoolKind.Yes
	});
	function mapDtoToModel(projectDto) {
		return {
			id: projectDto.id,
			avatar: {
				...projectDto.avatar
			},
			title: projectDto.name,
			description: projectDto.description,
			goal: projectDto.goal,
			privacyType: projectDto.privacyType,
			ownerId: projectDto.ownerId,
			chatId: projectDto.chatId ?? null,
			members: projectDto.members,
			moderators: projectDto.moderatorMembers,
			features: mapDtoFeatures(projectDto.features),
			baseFeatureId: projectDto.baseFeatureId ?? 'chat',
			availableFeatures: projectDto.availableFeatures,
			toggleableFeatures: mapDtoToggleableFeatures(projectDto.toggleableFeatures),
			permissions: mapPermissionsFromDtoToModel(projectDto),
			dates: mapDates(projectDto.dates),
			tags: mapValue(projectDto.tags, [...projectDto.tags]),
			publication: mapValue(projectDto.publication, projectDto.publication || false),
			notifications: projectDto.notificationCatalog ?? null
		};
	}
	function mapPermissionsFromDtoToModel(dto) {
		const mapProjectPermissions = projectDto => {
			return {
				...defaultProjectPermissions,
				...(main_core.Type.isPlainObject(projectDto.options) ? projectDto.options : {})
			};
		};
		const mapPermissions = (feature, projectDto) => {
			return projectDto.permissions.find(item => item.feature === feature)?.permissions || {};
		};
		function mapTaskPermissions(projectDto) {
			const tasksPermissions = mapPermissions('tasks', projectDto);
			return {
				view: tasksPermissions.view ?? socialnetwork_v2_const.AccessRightsRoleKind.AllParticipants,
				view_all: tasksPermissions.view_all ?? socialnetwork_v2_const.AccessRightsRoleKind.AllParticipants,
				sort: tasksPermissions.sort,
				createTasks: tasksPermissions.create_tasks,
				editTasks: tasksPermissions.edit_tasks,
				deleteTasks: tasksPermissions.delete_tasks
			};
		}
		return {
			project: mapProjectPermissions(dto),
			tasks: {
				...mapTaskPermissions(dto)
			},
			blog: {
				...mapPermissions('blog', dto)
			},
			landingKnowledge: {
				...mapPermissions('landing_knowledge', dto)
			}
		};
	}
	function mapValue(value, mappedValue, checkIsEmpty = main_core.Type.isNil) {
		return checkIsEmpty(value) ? value : mappedValue;
	}
	function mapDates(dates) {
		if (!dates || !dates.startTs && !dates.finishTs) {
			return {
				startTs: 0,
				finishTs: 0
			};
		}
		return {
			startTs: dates.startTs * 1000,
			finishTs: dates.finishTs * 1000
		};
	}

	class ProjectService {
		async get(projectId) {
			try {
				const data = await socialnetwork_v2_lib_apiClient.apiClient.post('Project.get', {
					projectId
				});
				return [null, mapDtoToModel(data)];
			} catch (error) {
				console.error('Get project error:', error);
				return [new Error(error.errors?.[0]?.message, 'Get project error', error.errors?.[0])];
			}
		}
		async add(project) {
			try {
				const projectDto = mapModelToDto(project);
				const data = await socialnetwork_v2_lib_apiClient.apiClient.post('Project.add', {
					project: projectDto
				});
				const createdProject = mapDtoToModel(data);
				return [null, createdProject];
			} catch (error) {
				console.error('Create project error:', error);
				return [error.errors?.[0], null];
			}
		}
		async getAvailableFeatures(projectId = null) {
			try {
				const endpoint = projectId > 0 ? 'Project.getFeatures' : 'Project.Feature.getAvailableFeatures';
				const data = await socialnetwork_v2_lib_apiClient.apiClient.post(endpoint, projectId > 0 ? {
					projectId
				} : {
					project: {}
				});
				return [null, data];
			} catch (error) {
				console.error('Get available project features error:', error);
				return [new Error(error.errors?.[0]?.message, 'Get available project features error', error.errors?.[0]), null];
			}
		}
		async update(project) {
			try {
				const projectDto = mapModelToDto(project);
				const data = await socialnetwork_v2_lib_apiClient.apiClient.post('Project.update', {
					project: projectDto
				});
				const updatedProject = mapDtoToModel(data);
				return [null, updatedProject];
			} catch (error) {
				console.error('Update project error:', error);
				return [error.errors?.[0], null];
			}
		}
		async copy(data) {
			try {
				const sourceProjectId = data.sourceProjectId;
				const projectRaw = {
					...data.project,
					id: null
				};
				const project = mapModelToDto(projectRaw);
				const copyOptions = data.copyOptions;
				const dataRequest = {
					sourceProjectId,
					project,
					copyOptions
				};
				const response = await socialnetwork_v2_lib_apiClient.apiClient.post('Project.copy', dataRequest);
				const createdProject = mapDtoToModel(response);
				return [null, createdProject];
			} catch (error) {
				console.error('Copy project error:', error);
				return [error.errors?.[0], null];
			}
		}
	}
	const projectService = new ProjectService();

	exports.AccessRightsService = AccessRightsService;
	exports.ProjectService = ProjectService;
	exports.projectService = projectService;

})(this.BX.Socialnetwork.V2.Provider.Services = this.BX.Socialnetwork.V2.Provider.Services || {}, BX.Socialnetwork.V2, BX.Socialnetwork.V2.Lib, BX, BX.Socialnetwork.V2.Model);
//# sourceMappingURL=project-service.bundle.js.map
