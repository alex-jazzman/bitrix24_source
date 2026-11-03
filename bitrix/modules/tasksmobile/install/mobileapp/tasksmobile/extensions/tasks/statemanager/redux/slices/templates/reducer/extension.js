/**
 * @module tasks/statemanager/redux/slices/templates/reducer
 */
jn.define('tasks/statemanager/redux/slices/templates/reducer', (require, exports, module) => {
	const {
		defaultSorting,
		templatesAdapter,
	} = require('tasks/statemanager/redux/slices/templates/meta');
	const { isRootRaw } = require('tasks/statemanager/redux/slices/checklists/model');

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

	const getChecklistSummaryFromV2 = (items) => {
		if (!Array.isArray(items))
		{
			return null;
		}

		return items.reduce(
			(result, item) => {
				// only checklist items are counted; `isRootRaw` is the same predicate `splitFlatList` uses,
				// and a copy-prepared template payload keeps its hierarchy in `parentNodeId`, not `parentId`
				if (isRootRaw(item ?? {}))
				{
					return result;
				}

				const isComplete = Boolean(item?.isComplete);

				return {
					completed: result.completed + (isComplete ? 1 : 0),
					uncompleted: result.uncompleted + (isComplete ? 0 : 1),
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
		if (Array.isArray(template?.checklist))
		{
			return template.checklist;
		}

		return existingTemplate?.checklistTree ?? null;
	};

	const getTemplateChecklist = (template, existingTemplate = {}, checklistTree = null) => {
		if (Array.isArray(checklistTree))
		{
			return getChecklistSummaryFromV2(checklistTree);
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
