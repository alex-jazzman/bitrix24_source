/**
 * @module tasks/statemanager/redux/slices/templates/reducer
 */
jn.define('tasks/statemanager/redux/slices/templates/reducer', (require, exports, module) => {
	const {
		defaultSorting,
		templatesAdapter,
	} = require('tasks/statemanager/redux/slices/templates/meta');

	const defaultTemplate = {
		id: 0,
		name: '',
		description: '',
		priority: 1,
		creatorId: 0,
		responsibleId: 0,
		accomplices: [],
		auditors: [],
		files: [],
		checklist: null,
		checklistTree: null,
		tags: [],
		crm: [],
		groupId: null,
		isRepeatable: false,
		replicateParams: null,
		deadlineAfter: 0,
		allowChangeDeadline: false,
		allowTimeTracking: false,
		allowTaskControl: false,
		isMatchWorkTime: false,
		isResultRequired: false,
		timeEstimate: 0,
		startDatePlanAfter: 0,
		endDatePlanAfter: 0,
		addInReport: false,
		descriptionInBbcode: true,
		userFields: [],
		detailLoaded: false,
	};

	const ensureSorting = (state) => {
		if (!state.sorting)
		{
			// eslint-disable-next-line no-param-reassign
			state.sorting = { ...defaultSorting };
		}
	};

	const ensureEntityState = (state) => {
		if (!Array.isArray(state.ids))
		{
			// eslint-disable-next-line no-param-reassign
			state.ids = [];
		}

		if (!state.entities)
		{
			// eslint-disable-next-line no-param-reassign
			state.entities = {};
		}
	};

	const countChecklistItems = (item) => {
		const descendants = Array.isArray(item?.descendants) ? item.descendants : [];

		return descendants.reduce(
			(result, descendant) => {
				const isComplete = Boolean(descendant?.fields?.isComplete);
				const nested = countChecklistItems(descendant);

				return {
					completed: result.completed + (isComplete ? 1 : 0) + nested.completed,
					uncompleted: result.uncompleted + (isComplete ? 0 : 1) + nested.uncompleted,
				};
			},
			{ completed: 0, uncompleted: 0 },
		);
	};

	const getChecklistSummary = (checklistTree) => {
		if (!checklistTree || !Array.isArray(checklistTree.descendants))
		{
			return null;
		}

		return checklistTree.descendants.reduce(
			(result, checklist) => {
				const counts = countChecklistItems(checklist);

				return {
					completed: result.completed + counts.completed,
					uncompleted: result.uncompleted + counts.uncompleted,
				};
			},
			{ completed: 0, uncompleted: 0 },
		);
	};

	const getTemplateDescription = (template, existingTemplate, options = {}) => {
		if (options.isDetail)
		{
			return template?.description ?? existingTemplate?.description ?? defaultTemplate.description;
		}

		if (existingTemplate?.detailLoaded)
		{
			return existingTemplate?.description ?? defaultTemplate.description;
		}

		return template?.description ?? existingTemplate?.description ?? defaultTemplate.description;
	};

	const getTemplateChecklistTree = (template, existingTemplate = {}) => {
		if (
			template?.checklist
			&& !Array.isArray(template.checklist)
			&& Array.isArray(template.checklist?.descendants)
		)
		{
			return template.checklist;
		}

		return existingTemplate?.checklistTree ?? null;
	};

	const getTemplateChecklist = (template, existingTemplate = {}, checklistTree = null) => {
		if (checklistTree)
		{
			return getChecklistSummary(checklistTree);
		}

		return template?.checklist ?? existingTemplate?.checklist ?? null;
	};

	const getTemplateCreatorId = (template, existingTemplate = {}) => {
		return Number(template?.creatorId ?? existingTemplate?.creatorId ?? 0);
	};

	const getTemplateResponsibleId = (template, existingTemplate = {}) => {
		return Number(template?.responsibleId ?? existingTemplate?.responsibleId ?? 0);
	};

	const getTemplateAccomplices = (template, existingTemplate = {}) => {
		return Array.isArray(template?.accomplices)
			? template.accomplices.map(Number)
			: (existingTemplate?.accomplices ?? []);
	};

	const getTemplateAuditors = (template, existingTemplate = {}) => {
		return Array.isArray(template?.auditors)
			? template.auditors.map(Number)
			: (existingTemplate?.auditors ?? []);
	};

	const normalizeTemplate = (template, existingTemplate = {}, options = {}) => {
		const templateId = Number(template?.id);
		if (!templateId)
		{
			return null;
		}

		const description = getTemplateDescription(template, existingTemplate, options);
		const checklistTree = getTemplateChecklistTree(template, existingTemplate);
		const checklist = getTemplateChecklist(template, existingTemplate, checklistTree);
		const scalarFields = {
			id: templateId,
			priority: Number(template?.priority ?? existingTemplate?.priority ?? defaultTemplate.priority),
			creatorId: getTemplateCreatorId(template, existingTemplate),
			responsibleId: getTemplateResponsibleId(template, existingTemplate),
			groupId: template?.groupId ?? existingTemplate?.groupId ?? null,
			isRepeatable: Boolean(template?.isRepeatable ?? existingTemplate?.isRepeatable),
			allowChangeDeadline: Boolean(template?.allowChangeDeadline ?? existingTemplate?.allowChangeDeadline),
			allowTimeTracking: Boolean(template?.allowTimeTracking ?? existingTemplate?.allowTimeTracking),
			allowTaskControl: Boolean(template?.allowTaskControl ?? existingTemplate?.allowTaskControl),
			isMatchWorkTime: Boolean(template?.isMatchWorkTime ?? existingTemplate?.isMatchWorkTime),
			isResultRequired: Boolean(template?.isResultRequired ?? existingTemplate?.isResultRequired),
			addInReport: Boolean(template?.addInReport ?? existingTemplate?.addInReport),
			description,
			descriptionInBbcode: Boolean(template?.descriptionInBbcode ?? existingTemplate?.descriptionInBbcode ?? true),
		};
		const collectionFields = {
			accomplices: getTemplateAccomplices(template, existingTemplate),
			auditors: getTemplateAuditors(template, existingTemplate),
		};
		const stateFields = {
			checklist,
			checklistTree,
			detailLoaded: Boolean(existingTemplate?.detailLoaded || options.isDetail),
		};

		return {
			...defaultTemplate,
			...existingTemplate,
			...template,
			...scalarFields,
			...collectionFields,
			...stateFields,
		};
	};

	const prepareTemplates = (state, templates, options = {}) => {
		ensureEntityState(state);

		return templates
			.map((template) => normalizeTemplate(template, state.entities?.[template?.id], options))
			.filter(Boolean);
	};

	const templatesSortingSet = (state, action) => {
		ensureSorting(state);

		const type = action?.payload?.type;
		if (!type)
		{
			return;
		}

		// eslint-disable-next-line no-param-reassign
		state.sorting.type = String(type);
	};

	const templatesSortingToggled = (state) => {
		ensureSorting(state);

		// eslint-disable-next-line no-param-reassign
		state.sorting.isASC = !state.sorting.isASC;
	};

	const templatesAdded = (state, action) => {
		const templates = action?.payload?.templates ?? [];
		const preparedTemplates = prepareTemplates(state, templates, {
			isDetail: action?.payload?.isDetail === true,
		});

		templatesAdapter.addMany(state, preparedTemplates);
	};

	const templatesUpserted = (state, action) => {
		const templates = action?.payload?.templates ?? [];
		const preparedTemplates = prepareTemplates(state, templates, {
			isDetail: action?.payload?.isDetail === true,
		});

		templatesAdapter.upsertMany(state, preparedTemplates);
	};

	module.exports = {
		templatesAdded,
		templatesUpserted,
		templatesSortingSet,
		templatesSortingToggled,
	};
});
