/**
 * @module tasks/layout/task/create-new/src/apply-template
 */
jn.define('tasks/layout/task/create-new/src/apply-template', (require, exports, module) => {
	const { Type } = require('type');
	const store = require('statemanager/redux/store');
	const { batchActions } = require('statemanager/redux/batched-actions');
	const { usersSelector, usersUpserted } = require('statemanager/redux/slices/users');
	const { groupsUpserted, selectGroupById } = require('tasks/statemanager/redux/slices/groups');
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { clone } = require('utils/object');
	const { selectById: selectTemplateById, upsertTemplates } = require('tasks/statemanager/redux/slices/templates');
	const {
		convertGroupToEntitySelectorFormat,
		convertUsersCollectionToEntitySelectorFormat,
	} = require('tasks/layout/task/create-new/src/converters');

	const CACHE_TTL_HOUR = 3600;

	function safeArray(value)
	{
		return Array.isArray(value) ? value : [];
	}

	function buildPlannedDatesFromTemplateOffsets(template, nowMs = Date.now())
	{
		const deadline = (
			template.deadlineAfter
				? new Date(nowMs + template.deadlineAfter * 1000)
				: null
		);

		const startDatePlan = (
			template.startDatePlanAfter
				? (nowMs / 1000) + template.startDatePlanAfter
				: null
		);

		const endDatePlan = (
			template.endDatePlanAfter
				? (nowMs / 1000) + template.endDatePlanAfter
				: null
		);

		return { deadline, startDatePlan, endDatePlan };
	}

	function mergeUserFields(task, userFields)
	{
		if (!Type.isArrayFilled(userFields))
		{
			return {
				...task,
				userFields: null,
			};
		}

		const nextTask = { ...task };

		userFields.forEach((userField) => {
			const fieldName = userField?.fieldName;

			if (!fieldName || !(fieldName in nextTask))
			{
				return;
			}

			nextTask[fieldName] = {
				...nextTask[fieldName],
				...userField,
				value: userField.value,
			};
		});

		return nextTask;
	}

	function getUserByIdOrCurrent(userId)
	{
		const id = userId || env.userId;
		const state = store.getState();
		const user = usersSelector.selectById(state, id);

		if (!user)
		{
			return null;
		}

		return {
			id: user.id,
			name: user.fullName ?? user.name,
			icon: user.avatarSize100 ?? user.image ?? null,
			workPosition: user.workPosition,
		};
	}

	function mapUsersFromIds(userIds)
	{
		if (!Type.isArrayFilled(userIds))
		{
			return [];
		}

		const state = store.getState();

		return userIds
			.map((userId) => usersSelector.selectById(state, Number(userId)))
			.filter(Boolean);
	}

	function buildTaskFromTemplate({
		currentTask,
		template,
		nowMs = Date.now(),
	})
	{
		const state = store.getState();

		let nextTask = { ...currentTask };

		nextTask.title = template.name ?? null;
		nextTask.description = template.description ?? null;
		nextTask.priority = template.priority ?? null;
		nextTask.files = clone(safeArray(template.files));
		nextTask.tags = clone(safeArray(template.tags));
		nextTask.crm = clone(safeArray(template.crm));
		nextTask.allowTimeTracking = template.allowTimeTracking;
		nextTask.timeEstimate = template.timeEstimate ?? null;

		nextTask.responsible = getUserByIdOrCurrent(template.responsibleId);

		nextTask.group = null;
		if (template.groupId)
		{
			nextTask.group = convertGroupToEntitySelectorFormat(selectGroupById(state, template.groupId)) ?? null;
		}
		else
		{
			nextTask.group = null;
		}

		if (Type.isArrayFilled(template.accomplices))
		{
			nextTask.accomplices = convertUsersCollectionToEntitySelectorFormat(
				mapUsersFromIds(template.accomplices),
			);
		}
		else
		{
			nextTask.accomplices = [];
		}

		if (Type.isArrayFilled(template.auditors))
		{
			nextTask.auditors = convertUsersCollectionToEntitySelectorFormat(
				mapUsersFromIds(template.auditors),
			);
		}
		else
		{
			nextTask.auditors = [];
		}

		const plannedDates = buildPlannedDatesFromTemplateOffsets(template, nowMs);
		nextTask.deadline = plannedDates.deadline;
		nextTask.startDatePlan = plannedDates.startDatePlan;
		nextTask.endDatePlan = plannedDates.endDatePlan;

		nextTask = mergeUserFields(nextTask, template.userFields);

		return nextTask;
	}

	function getStoredTemplate(templateId)
	{
		return selectTemplateById(store.getState(), templateId);
	}

	function getTemplateRelatedUserIds(template)
	{
		return [
			template?.responsibleId,
			...safeArray(template?.accomplices),
			...safeArray(template?.auditors),
		].filter(Boolean);
	}

	function hasTemplateRelatedEntities(template)
	{
		const state = store.getState();

		return (
			getTemplateRelatedUserIds(template).every((userId) => usersSelector.selectById(state, Number(userId)))
			&& (!template?.groupId || Boolean(selectGroupById(state, template.groupId)))
		);
	}

	function isTemplateReadyInStore(template)
	{
		return (
			Boolean(template?.detailLoaded)
			&& hasTemplateRelatedEntities(template)
		);
	}

	function prepareTemplateFromStore(template)
	{
		if (!template)
		{
			return null;
		}

		return {
			...template,
			checklist: template.checklistTree ?? template.checklist,
		};
	}

	function applyTemplateFromStore({
		templateId,
		currentTask,
		checklistController,
	})
	{
		const storedTemplate = getStoredTemplate(templateId);
		if (!isTemplateReadyInStore(storedTemplate))
		{
			return null;
		}

		const template = prepareTemplateFromStore(storedTemplate);

		return buildApplyTemplateResult({
			currentTask,
			template,
			checklistController,
		});
	}

	function applyChecklist(checklistController, checklist)
	{
		if (!checklistController)
		{
			return;
		}

		checklistController.clearChecklists();
		if (checklist)
		{
			checklistController.setChecklistTree(clone(checklist));
		}
	}

	function upsertEntitiesFromResponse({ groups, users })
	{
		const actions = [];

		if (Type.isArrayFilled(groups))
		{
			actions.push(groupsUpserted(groups));
		}

		if (Type.isArrayFilled(users))
		{
			actions.push(usersUpserted(users));
		}

		if (actions.length > 0)
		{
			store.dispatch(batchActions(actions));
		}
	}

	function upsertTemplateFromResponse(template)
	{
		if (!template)
		{
			return;
		}

		store.dispatch(upsertTemplates({
			templates: [template],
			isDetail: true,
		}));
	}

	function createExecutor(templateId)
	{
		const executor = new RunActionExecutor('tasksmobile.Template.getTemplate', { templateId });

		return executor
			.setCacheTtl(CACHE_TTL_HOUR)
			.setCacheHandler((cachedResponse) => {
				const { template, groups, users } = cachedResponse?.data || {};
				upsertTemplateFromResponse(template);
				upsertEntitiesFromResponse({ groups, users });
			})
			.setSkipRequestIfCacheExists();
	}

	function buildApplyTemplateResult({
		currentTask,
		template,
		checklistController,
		response,
	})
	{
		const task = buildTaskFromTemplate({
			currentTask,
			template,
		});

		applyChecklist(checklistController, template.checklist);

		return {
			task,
			template,
			response,
		};
	}

	/**
	 * @public
	 * @param {object} params
	 * @param {number} params.templateId
	 * @param {object} params.currentTask
	 * @param {ChecklistController|null} params.checklistController
	 * @returns {Promise<{task: object|null, template: object|null, response?: object}>}
	 */
	async function applyTemplate({
		templateId,
		currentTask,
		checklistController,
	})
	{
		const templateFromStore = applyTemplateFromStore({
			templateId,
			currentTask,
			checklistController,
		});
		if (templateFromStore)
		{
			return templateFromStore;
		}

		const executor = createExecutor(templateId);
		const response = await executor.call(true);

		if (response?.status !== 'success')
		{
			return { task: null, template: null, response };
		}

		const { template = null, groups, users } = response.data || {};
		if (!template)
		{
			return { task: null, template: null, response };
		}

		upsertTemplateFromResponse(template);
		upsertEntitiesFromResponse({ groups, users });

		return buildApplyTemplateResult({
			currentTask,
			template,
			checklistController,
			response,
		});
	}

	module.exports = {
		applyTemplate,
		applyTemplateFromStore,
	};
});
