/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core) {
	'use strict';

	const DataViewAction = Object.freeze({
		PREVIEW: 'bizproc.v2.DataView.preview',
		SAVE: 'bizproc.v2.DataView.save',
		LIST: 'bizproc.v2.DataView.list',
		GET: 'bizproc.v2.DataView.get',
		DELETE: 'bizproc.v2.DataView.delete',
		GET_SOURCES: 'bizproc.v2.DataView.getSources',
		GET_SOURCE_SCHEMA: 'bizproc.v2.DataView.getSourceSchema',
		GET_STAMP_CONSTANTS: 'bizproc.v2.DataView.getStampConstants'
	});
	const PREVIEW_LIMIT_MAX = 50;
	const PREVIEW_LIMIT_DEFAULT = 50;
	const PREVIEW_PAGE_SIZE_MAX = 50;
	const PREVIEW_PAGE_SIZE_DEFAULT = 20;
	const ERROR_MESSAGE_CODE = Object.freeze({
		ACCESS_DENIED: 'BIZPROC_JS_DATAVIEW_ERROR_ACCESS_DENIED',
		DATA_VIEW_VALIDATION_FAILED: 'BIZPROC_JS_DATAVIEW_ERROR_VALIDATION_FAILED',
		DATA_VIEW_ROWS_LIMIT_EXCEEDED: 'BIZPROC_JS_DATAVIEW_ERROR_ROWS_LIMIT_EXCEEDED',
		DATA_VIEW_SOURCE_UNAVAILABLE: 'BIZPROC_JS_DATAVIEW_ERROR_SOURCE_UNAVAILABLE',
		DATA_VIEW_RECOMPUTE_IN_PROGRESS: 'BIZPROC_JS_DATAVIEW_ERROR_RECOMPUTE_IN_PROGRESS',
		DATA_VIEW_UNEXPECTED_ERROR: 'BIZPROC_JS_DATAVIEW_ERROR_UNEXPECTED'
	});
	const GENERIC_ERROR_MESSAGE_CODE = 'BIZPROC_JS_DATAVIEW_ERROR_GENERIC';
	function resolveErrorMessageCode(code) {
		if (main_core.Type.isStringFilled(code) && Object.hasOwn(ERROR_MESSAGE_CODE, code)) {
			return ERROR_MESSAGE_CODE[code];
		}
		return GENERIC_ERROR_MESSAGE_CODE;
	}
	class DataViewApiError extends Error {
		constructor(code, messageCode, message, customData = null, errors = []) {
			super(message);
			this.name = 'DataViewApiError';
			this.code = code;
			this.messageCode = messageCode;
			this.customData = customData;
			this.errors = errors;
		}
	}
	class DataViewApiClient {
		#runAction;
		constructor(runAction = null) {
			this.#runAction = runAction ?? defaultRunAction;
		}

		/**
		 * Preview a definition. Pass a number for the legacy single-page limit, or an options object
		 * `{ page, pageSize }` for the paginated API-03 v2 response (`{ ..., page, pageSize, totalRows }`).
		 * `ownerTemplateId` names the template the definition belongs to (API-08); a definition reading
		 * sources of that template previews only under its owner.
		 */
		preview(definition, options = PREVIEW_LIMIT_DEFAULT) {
			if (main_core.Type.isNumber(options)) {
				return runRequest(this.#runAction, DataViewAction.PREVIEW, {
					definition,
					limit: normalizeLimit(options)
				});
			}
			const data = main_core.Type.isNumber(options?.page) ? {
				definition,
				page: Math.max(1, Math.trunc(options.page)),
				pageSize: normalizePageSize(options?.pageSize)
			} : {
				definition,
				limit: normalizeLimit(options?.limit)
			};
			if (isTemplateContextId(options?.ownerTemplateId)) {
				data.ownerTemplateId = Number(options.ownerTemplateId);
			}
			return runRequest(this.#runAction, DataViewAction.PREVIEW, data);
		}
		save(params) {
			const data = {
				title: params.title,
				definition: params.definition
			};
			if (main_core.Type.isNumber(params.storageTypeId)) {
				data.storageTypeId = params.storageTypeId;
			}
			if (main_core.Type.isStringFilled(params.code)) {
				data.code = params.code;
			}
			if (main_core.Type.isString(params.description)) {
				data.description = params.description;
			}
			if (isTemplateContextId(params.ownerTemplateId)) {
				data.ownerTemplateId = Number(params.ownerTemplateId);
			}
			if (main_core.Type.isStringFilled(params.ownerActivityName)) {
				data.ownerActivityName = params.ownerActivityName;
			}
			return runRequest(this.#runAction, DataViewAction.SAVE, data);
		}
		list(templateId, activityName) {
			return runRequest(this.#runAction, DataViewAction.LIST, {
				templateId: Number(templateId),
				activityName
			});
		}
		get(storageTypeId) {
			return runRequest(this.#runAction, DataViewAction.GET, {
				storageTypeId
			});
		}
		remove(storageTypeId) {
			return runRequest(this.#runAction, DataViewAction.DELETE, {
				storageTypeId
			});
		}

		/**
		 * Catalog of data sources available to the current user (API-04). `templateId` names the template
		 * the catalog is opened for (API-06). Only then does it also list that template's own constants
		 * and variables; a standalone view asks without one.
		 *
		 * @return {Promise<{ sources: Array<Object> }>}
		 */
		getSources(params = {}) {
			const data = {};
			if (isTemplateContextId(params.templateId)) {
				data.templateId = Number(params.templateId);
			}
			return runRequest(this.#runAction, DataViewAction.GET_SOURCES, data);
		}

		/**
		 * Scalar constants available as stamp columns (API-09). The backend owns visibility, type and
		 * multiplicity checks; the client only passes the current template context.
		 *
		 * @return {Promise<{ constants: Array<Object> }>}
		 */
		getStampConstants(params = {}) {
			const data = {};
			if (isTemplateContextId(params.templateId)) {
				data.templateId = Number(params.templateId);
			}
			return runRequest(this.#runAction, DataViewAction.GET_STAMP_CONSTANTS, data);
		}

		/**
		 * Fields and relations of a single source (API-05). `params` is sent only when it carries values —
		 * unbounded sources describe themselves without one; `templateId` carries the same catalog context
		 * as {@see getSources} (API-07).
		 *
		 * @return {Promise<{ fields: Array<Object>, relations: Array<Object> }>}
		 */
		getSourceSchema(params) {
			const data = {
				module: params.module,
				entity: params.entity
			};
			if (main_core.Type.isPlainObject(params.params)) {
				data.params = params.params;
			}
			if (isTemplateContextId(params.templateId)) {
				data.templateId = Number(params.templateId);
			}
			return runRequest(this.#runAction, DataViewAction.GET_SOURCE_SCHEMA, data);
		}
	}
	function defaultRunAction(action, config) {
		return main_core.ajax.runAction(action, config);
	}
	async function runRequest(runAction, action, data) {
		try {
			const response = await runAction(action, {
				data
			});
			return response?.data ?? null;
		} catch (response) {
			throw toApiError(response);
		}
	}

	/**
	 * Whether a template context is worth sending. The catalog, the preview and the save take the
	 * template id as an optional parameter (API-06..API-08), so anything but a positive integer means
	 * "no context" and the request goes out exactly as it did before the context existed. A numeric
	 * string counts: source params come back from the backend as strings.
	 */
	function isTemplateContextId(templateId) {
		if (!main_core.Type.isNumber(templateId) && !main_core.Type.isStringFilled(templateId)) {
			return false;
		}
		const value = Number(templateId);
		return Number.isInteger(value) && value > 0;
	}
	function normalizeLimit(limit) {
		const value = Number(limit);
		if (!Number.isInteger(value) || value <= 0) {
			return PREVIEW_LIMIT_DEFAULT;
		}
		return Math.min(value, PREVIEW_LIMIT_MAX);
	}
	function normalizePageSize(pageSize) {
		const value = Number(pageSize);
		if (!Number.isInteger(value) || value <= 0) {
			return PREVIEW_PAGE_SIZE_DEFAULT;
		}
		return Math.min(value, PREVIEW_PAGE_SIZE_MAX);
	}
	function toApiError(response) {
		const errors = extractErrors(response);
		const [firstError] = errors;
		const code = firstError?.code ?? '';
		const messageCode = resolveErrorMessageCode(code);
		const customData = main_core.Type.isPlainObject(firstError?.customData) ? firstError.customData : null;
		const message = main_core.Type.isStringFilled(firstError?.message) ? firstError.message : main_core.Loc.getMessage(messageCode);
		return new DataViewApiError(code, messageCode, message, customData, errors.map(error => toErrorItem(error)));
	}
	function extractErrors(response) {
		const errors = response?.errors;
		return main_core.Type.isArrayFilled(errors) ? errors : [];
	}
	function toErrorItem(error) {
		const customData = main_core.Type.isPlainObject(error?.customData) ? error.customData : null;
		const field = main_core.Type.isStringFilled(customData?.field) ? customData.field : null;
		const code = main_core.Type.isStringFilled(customData?.code) ? customData.code : main_core.Type.isStringFilled(error?.code) ? error.code : '';
		const message = main_core.Type.isStringFilled(error?.message) ? error.message : '';
		return {
			field,
			code,
			message
		};
	}

	/**
	 * How a consumer should treat a failed request. The mapper classifies; the presentation
	 * (inline hint, retry, upsell, blocking message) is the consumer's decision.
	 */
	const ERROR_CATEGORY = Object.freeze({
		/** The definition is wrong and the user can fix it in place. */
		VALIDATION: 'validation',
		/** The same request may succeed later, unchanged. */
		RETRYABLE: 'retryable',
		/** The plan does not include the feature. */
		TARIFF: 'tariff',
		/** Nothing the user can do here. */
		FATAL: 'fatal'
	});
	const TARIFF_CODE_PREFIX = 'TARIFF_';
	const CATEGORY_BY_CODE = Object.freeze({
		DATA_VIEW_VALIDATION_FAILED: ERROR_CATEGORY.VALIDATION,
		DATA_VIEW_ROWS_LIMIT_EXCEEDED: ERROR_CATEGORY.VALIDATION,
		DATA_VIEW_RECOMPUTE_IN_PROGRESS: ERROR_CATEGORY.RETRYABLE,
		ACCESS_DENIED: ERROR_CATEGORY.FATAL,
		DATA_VIEW_SOURCE_UNAVAILABLE: ERROR_CATEGORY.FATAL
	});
	const GENERAL_FIELD = 'general';

	// DTO-01 field vocabulary: the controls the editor can point a validation error at.
	const FIELD_CONTROLS = Object.freeze([GENERAL_FIELD, 'sources', 'columns', 'joinKeys', 'period', 'aggregate']);
	/**
	 * Classifies a {@see DataViewApiError} by its backend code (ERR-01). Unknown codes — including
	 * a missing one — are fatal: an unclassified failure must not look recoverable.
	 *
	 * `field` is present for the validation category only, and is null when the backend did not
	 * point at a specific definition field.
	 */
	function mapError(error) {
		const code = main_core.Type.isStringFilled(error?.code) ? error.code : '';
		const messageCode = main_core.Type.isStringFilled(error?.messageCode) ? error.messageCode : resolveErrorMessageCode(code);
		const category = resolveCategory(code);
		if (category === ERROR_CATEGORY.VALIDATION) {
			// Only a failed validation points at a field; the rows limit is about the period as a whole.
			const field = code === 'DATA_VIEW_VALIDATION_FAILED' ? resolveField(error) : null;
			return {
				category,
				field,
				messageCode
			};
		}
		return {
			category,
			messageCode
		};
	}
	function resolveCategory(code) {
		// Forward-looking: the tariff gate is out of the current scope, so no TARIFF_* code reaches
		// the client yet. The branch keeps the category stable for when the gate lands.
		if (code.startsWith(TARIFF_CODE_PREFIX)) {
			return ERROR_CATEGORY.TARIFF;
		}
		return CATEGORY_BY_CODE[code] ?? ERROR_CATEGORY.FATAL;
	}
	function resolveField(error) {
		const field = error?.customData?.field;
		return main_core.Type.isStringFilled(field) ? field : null;
	}
	/**
	 * Turns the whole errors[] list of a rejected request (DTO-01) into a field-addressed map the
	 * editor renders under the matching control. A field routes an error, not its code, so a new
	 * validator code lands under its control without a frontend change. The first error of a field
	 * wins its control; the rest of that field are kept for diagnostics. An error the backend did not
	 * address to a field (access, retryable) is left out — it has no control to sit under.
	 */
	function mapErrors(errors) {
		const map = {};
		if (!main_core.Type.isArrayFilled(errors)) {
			return map;
		}
		errors.forEach(error => {
			const field = routeFieldError(error);
			if (field === null) {
				return;
			}
			if (Object.hasOwn(map, field)) {
				map[field].more.push(toDiagnostic(error));
				return;
			}
			map[field] = toFieldError(error);
		});
		return map;
	}
	function routeFieldError(error) {
		if (main_core.Type.isStringFilled(error?.field)) {
			return FIELD_CONTROLS.includes(error.field) ? error.field : GENERAL_FIELD;
		}

		// No field: keep only what the validator still owns (e.g. the rows limit) under the form banner.
		return mapError(error).category === ERROR_CATEGORY.VALIDATION ? GENERAL_FIELD : null;
	}
	function toFieldError(error) {
		return {
			...toDiagnostic(error),
			category: ERROR_CATEGORY.VALIDATION,
			more: []
		};
	}
	function toDiagnostic(error) {
		const code = main_core.Type.isStringFilled(error?.code) ? error.code : '';
		const message = main_core.Type.isStringFilled(error?.message) ? error.message : main_core.Loc.getMessage(resolveErrorMessageCode(code));
		return {
			message,
			code
		};
	}

	/** Stable source aliases the window assigns by order of first use (DTO-01 sources[].alias). */
	const SOURCE_ALIAS = Object.freeze({
		LEADING: 'a',
		SECOND: 'b'
	});

	/** Source aliases in canonical order (leading first). */
	const SOURCE_ALIASES = Object.freeze([SOURCE_ALIAS.LEADING, SOURCE_ALIAS.SECOND]);

	/** Combine operations (DTO-01 operation). */
	const OPERATION = Object.freeze({
		JOIN: 'join',
		AGGREGATE: 'aggregate',
		PROJECT: 'project'
	});

	/** Aggregate functions (DTO-01 aggregate.functions[].fn). */
	const AGGREGATE_FUNCTION = Object.freeze({
		SUM: 'SUM',
		COUNT: 'COUNT',
		AVG: 'AVG',
		MIN: 'MIN',
		MAX: 'MAX'
	});
	const AGGREGATE_FUNCTIONS = Object.freeze(Object.values(AGGREGATE_FUNCTION));

	/**
	 * Storage service columns the backend mapper reserves (StorageItemMapper::getFieldsMap()).
	 * A result column may not reuse one of these codes, so the client renames reserved codes here.
	 */
	const RESERVED_STORAGE_FIELD_CODES = Object.freeze(new Set(['ID', 'CREATED_BY', 'UPDATED_BY', 'CREATED_TIME', 'UPDATED_TIME', 'STORAGE_ID', 'DOCUMENT_ID', 'WORKFLOW_ID', 'TEMPLATE_ID', 'CODE']));

	/** Sources the window describes with a bare storage id, before the catalog gave it a module/entity. */
	const STORAGE_SOURCE = Object.freeze({
		MODULE: 'bizproc',
		ENTITY: 'storage'
	});

	/** Period selection modes (DTO-01 period.mode). */
	const PERIOD_MODE = Object.freeze({
		CURRENT: 'current',
		PREVIOUS: 'previous',
		CALENDAR: 'calendar'
	});
	const MONTH_REGEX = /^\d{4}-\d{2}$/;
	const EXTENSION_NAME = 'bizproc.dataview';

	/**
	 * Names of the functions a column formula may call, published by the extension settings from
	 * {@see ColumnFormula::allowedFunctions()} — the same list the server validates a saved definition
	 * against. `null` means the settings are not on the page: no answer at all, as opposed to an empty
	 * list, so a caller offering the functions to the user can fall back to offering them all and leave
	 * the verdict to the server.
	 *
	 * @return {?Array<string>}
	 */
	function getAllowedFormulaFunctions() {
		const functions = main_core.Extension.getSettings(EXTENSION_NAME).get('allowedFormulaFunctions');
		return main_core.Type.isArray(functions) ? functions : null;
	}

	/**
	 * Splits an `"alias.FIELD"` reference into its parts.
	 *
	 * @return {{ alias: string, field: string }}
	 */
	function splitSource(source) {
		const value = main_core.Type.isStringFilled(source) ? source : '';
		const dot = value.indexOf('.');
		if (dot <= 0 || dot === value.length - 1) {
			return {
				alias: '',
				field: ''
			};
		}
		return {
			alias: value.slice(0, dot),
			field: value.slice(dot + 1)
		};
	}

	/**
	 * Resolves the alias a storage should use inside the window: the alias already bound to the storage,
	 * the next free alias (leading, then second), or null when both aliases are taken by other storages.
	 *
	 * @param {Array<{ alias: string, storageId: number }>} sources
	 */
	function resolveAliasForStorage(sources, storageId) {
		const existing = sources.find(source => source.storageId === storageId);
		if (existing) {
			return existing.alias;
		}
		const usedAliases = new Set(sources.map(source => source.alias));
		return SOURCE_ALIASES.find(alias => !usedAliases.has(alias)) ?? null;
	}

	/**
	 * Generates a unique result-column code from a source field code, mirroring the backend
	 * {@see ColumnResolver::uniqueCode()} suffix scheme (`CODE`, `CODE_2`, `CODE_3`, ...).
	 *
	 * @param {Iterable<string>} usedCodes already assigned codes
	 */
	function generateColumnCode(fieldCode, usedCodes) {
		const taken = new Set(usedCodes);
		const base = main_core.Type.isStringFilled(fieldCode) ? fieldCode : 'FIELD';
		if (!taken.has(base) && !RESERVED_STORAGE_FIELD_CODES.has(base.toUpperCase())) {
			return base;
		}
		let index = 2;
		while (taken.has(`${base}_${index}`)) {
			index++;
		}
		return `${base}_${index}`;
	}

	/**
	 * A source is usable once it names an entity of some module (a catalog pick, DTO-01 sources[]),
	 * or — for the storage picker, which predates the catalog — once it carries a storage id.
	 */
	function isSourceComplete(source) {
		if (!main_core.Type.isStringFilled(source?.alias)) {
			return false;
		}
		if (main_core.Type.isStringFilled(source.module) && main_core.Type.isStringFilled(source.entity)) {
			return true;
		}
		return main_core.Type.isNumber(source.storageId) && source.storageId > 0;
	}

	/**
	 * @param {Array<{ alias: string }>} sources
	 * @return {{ [alias: string]: Object }}
	 */
	function completeSourcesByAlias(sources) {
		const map = {};
		(main_core.Type.isArray(sources) ? sources : []).forEach(source => {
			if (isSourceComplete(source)) {
				map[source.alias] = source;
			}
		});
		return map;
	}

	/** Serializes one DTO-01 sources[] entry, defaulting a storage pick to the bizproc storage source. */
	function buildSource(source) {
		if (main_core.Type.isStringFilled(source.module) && main_core.Type.isStringFilled(source.entity)) {
			return {
				alias: source.alias,
				module: source.module,
				entity: source.entity,
				params: main_core.Type.isPlainObject(source.params) ? {
					...source.params
				} : {}
			};
		}
		return {
			alias: source.alias,
			module: STORAGE_SOURCE.MODULE,
			entity: STORAGE_SOURCE.ENTITY,
			params: {
				storageTypeId: source.storageId
			}
		};
	}

	/** Operation of a window state; states written before aggregate/project existed carry no operation. */
	function resolveOperation(state) {
		if (state?.operation === OPERATION.AGGREGATE) {
			return OPERATION.AGGREGATE;
		}
		if (state?.operation === OPERATION.PROJECT) {
			return OPERATION.PROJECT;
		}
		return OPERATION.JOIN;
	}
	function isAggregateFunctionComplete(fn) {
		return main_core.Type.isStringFilled(fn?.column) && AGGREGATE_FUNCTIONS.includes(fn?.fn) && main_core.Type.isStringFilled(fn?.code);
	}
	function isAggregateComplete(aggregate) {
		if (!main_core.Type.isArrayFilled(aggregate?.groupBy) || !main_core.Type.isArrayFilled(aggregate?.functions)) {
			return false;
		}
		return aggregate.groupBy.every(column => main_core.Type.isStringFilled(column)) && aggregate.functions.every(isAggregateFunctionComplete);
	}
	function isPeriodComplete(period) {
		if (!main_core.Type.isPlainObject(period)) {
			return false;
		}
		if (period.sourceAlias !== SOURCE_ALIAS.LEADING && period.sourceAlias !== SOURCE_ALIAS.SECOND) {
			return false;
		}
		if (![PERIOD_MODE.CURRENT, PERIOD_MODE.PREVIOUS, PERIOD_MODE.CALENDAR].includes(period.mode)) {
			return false;
		}
		if (period.mode === PERIOD_MODE.CALENDAR && !MONTH_REGEX.test(period.month ?? '')) {
			return false;
		}
		return true;
	}

	/**
	 * Returns whether the window state carries every part DTO-01 requires for its operation:
	 * a join needs two sources (aliases a and b), at least one column and a join pair; an aggregate
	 * needs a single source with a non-empty groupBy and function list; a project needs a single source
	 * and at least one column. Every operation needs a valid period.
	 */
	function isDefinitionComplete(state) {
		if (!isPeriodComplete(state?.period)) {
			return false;
		}
		const byAlias = completeSourcesByAlias(state?.sources);
		const operation = resolveOperation(state);
		if (operation === OPERATION.AGGREGATE) {
			return Object.keys(byAlias).length === 1 && isAggregateComplete(state?.aggregate);
		}
		if (operation === OPERATION.PROJECT) {
			return Object.keys(byAlias).length === 1 && main_core.Type.isArrayFilled(state?.columns);
		}
		if (!byAlias[SOURCE_ALIAS.LEADING] || !byAlias[SOURCE_ALIAS.SECOND]) {
			return false;
		}
		if (!main_core.Type.isArrayFilled(state?.columns)) {
			return false;
		}
		const join = state?.join;
		return main_core.Type.isStringFilled(join?.leftField) && main_core.Type.isStringFilled(join?.rightField);
	}

	/**
	 * Assembles the DTO-01 definition strictly from window state. Columns are serialized explicitly
	 * ({@see ColumnResolver} enriches title/type from the source schema; the join key column is kept in
	 * the collection by the window). Returns null when the form is incomplete.
	 */
	function buildDefinition(state) {
		if (!isDefinitionComplete(state)) {
			return null;
		}
		const byAlias = completeSourcesByAlias(state.sources);
		const period = {
			sourceAlias: state.period.sourceAlias,
			mode: state.period.mode
		};
		if (state.period.mode === PERIOD_MODE.CALENDAR) {
			period.month = state.period.month;
		}
		const columns = buildColumns(state.columns);
		const operation = resolveOperation(state);
		if (operation === OPERATION.AGGREGATE) {
			const [alias] = Object.keys(byAlias);
			const sourceOf = sourceByColumnCode(state.columns);

			// The panel keeps grouping and function arguments as projection column codes; the backend combine
			// engine ({@see ColumnResolver::resolveAggregateField}) reads them as `alias.FIELD`. Resolving each
			// code through its column source is what lets a saved grouping actually return rows; the editor
			// store maps them back to codes on reload. A code no column claims is kept as is — the panel's
			// pruneAggregate already holds groupBy/functions within the projected columns.
			return {
				version: 1,
				operation: OPERATION.AGGREGATE,
				sources: [buildSource(byAlias[alias])],
				period: {
					...period,
					sourceAlias: alias
				},
				aggregate: {
					groupBy: state.aggregate.groupBy.map(code => sourceOf.get(code) ?? code),
					functions: state.aggregate.functions.map(fn => ({
						column: sourceOf.get(fn.column) ?? fn.column,
						fn: fn.fn,
						code: fn.code,
						title: fn.title
					}))
				},
				columns
			};
		}
		if (operation === OPERATION.PROJECT) {
			const [alias] = Object.keys(byAlias);

			// The window applies the period to the single source; pinning sourceAlias to that source keeps
			// the DTO consistent even when a stale period (e.g. left over from a join whose second source
			// carried the window) still names an alias the projection no longer has.
			return {
				version: 1,
				operation: OPERATION.PROJECT,
				sources: [buildSource(byAlias[alias])],
				period: {
					...period,
					sourceAlias: alias
				},
				columns
			};
		}
		return {
			version: 1,
			operation: OPERATION.JOIN,
			sources: SOURCE_ALIASES.map(alias => buildSource(byAlias[alias])),
			period,
			joinKeys: [{
				left: `${SOURCE_ALIAS.LEADING}.${state.join.leftField}`,
				right: `${SOURCE_ALIAS.SECOND}.${state.join.rightField}`
			}],
			columns
		};
	}
	function buildColumns(columns) {
		return (main_core.Type.isArray(columns) ? columns : []).map(column => {
			if (column?.kind === 'constant') {
				const serialized = {
					code: column.code,
					title: column.title,
					kind: 'constant',
					constant: {
						module: column.constant?.module,
						entity: column.constant?.entity,
						params: main_core.Type.isPlainObject(column.constant?.params) ? {
							...column.constant.params
						} : {}
					}
				};
				if (main_core.Type.isStringFilled(column.description)) {
					serialized.description = column.description;
				}
				return serialized;
			}
			const serialized = {
				code: column.code,
				title: column.title,
				source: column.source
			};
			if (main_core.Type.isStringFilled(column.description)) {
				serialized.description = column.description;
			}

			// An expression replacing the source value of the column ({@see ColumnFormula}); an empty one
			// is no formula at all, so the field is left out rather than sent blank.
			if (main_core.Type.isStringFilled(column.formula)) {
				serialized.formula = column.formula;
			}
			return serialized;
		});
	}

	/**
	 * Maps each projection column code to its `alias.FIELD` source reference — the inverse of the
	 * `column.source` the picker stores. The aggregate branch resolves grouping and function-argument
	 * codes through it, so the DTO addresses source fields the way {@see ColumnResolver} expects.
	 *
	 * @return {Map<string, string>}
	 */
	function sourceByColumnCode(columns) {
		const map = new Map();
		(main_core.Type.isArray(columns) ? columns : []).forEach(column => {
			if (main_core.Type.isStringFilled(column?.code) && main_core.Type.isStringFilled(column?.source)) {
				map.set(column.code, column.source);
			}
		});
		return map;
	}

	exports.AGGREGATE_FUNCTION = AGGREGATE_FUNCTION;
	exports.DataViewAction = DataViewAction;
	exports.DataViewApiClient = DataViewApiClient;
	exports.DataViewApiError = DataViewApiError;
	exports.ERROR_CATEGORY = ERROR_CATEGORY;
	exports.OPERATION = OPERATION;
	exports.PERIOD_MODE = PERIOD_MODE;
	exports.PREVIEW_LIMIT_DEFAULT = PREVIEW_LIMIT_DEFAULT;
	exports.PREVIEW_LIMIT_MAX = PREVIEW_LIMIT_MAX;
	exports.PREVIEW_PAGE_SIZE_DEFAULT = PREVIEW_PAGE_SIZE_DEFAULT;
	exports.PREVIEW_PAGE_SIZE_MAX = PREVIEW_PAGE_SIZE_MAX;
	exports.SOURCE_ALIAS = SOURCE_ALIAS;
	exports.SOURCE_ALIASES = SOURCE_ALIASES;
	exports.buildDefinition = buildDefinition;
	exports.generateColumnCode = generateColumnCode;
	exports.getAllowedFormulaFunctions = getAllowedFormulaFunctions;
	exports.isDefinitionComplete = isDefinitionComplete;
	exports.isTemplateContextId = isTemplateContextId;
	exports.mapError = mapError;
	exports.mapErrors = mapErrors;
	exports.resolveAliasForStorage = resolveAliasForStorage;
	exports.resolveErrorMessageCode = resolveErrorMessageCode;
	exports.splitSource = splitSource;

})(this.BX.Bizproc = this.BX.Bizproc || {}, BX);
//# sourceMappingURL=dataview.bundle.js.map
