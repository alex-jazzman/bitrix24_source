import { defineStore } from 'ui.vue3.pinia';
import { Type } from 'main.core';
import {
	buildDefinition,
	isDefinitionComplete,
	isTemplateContextId,
	mapErrors,
	OPERATION,
	PERIOD_MODE,
	SOURCE_ALIAS,
	splitSource,
} from 'bizproc.dataview';

import { dataViewEditorApi } from '../api';

export const EDITOR_MODE = Object.freeze({
	CREATE: 'create',
	EDIT: 'edit',
});

/** Key holding a validation message the backend did not attach to a specific definition field. */
export const GENERAL_VALIDATION_FIELD = 'general';

export type EditorSource = {
	alias: string,
	module: string,
	entity: string,
	params: Object,
	storageId?: ?number,
};

type DefinitionState = {
	templateId: number | null,
	activityName: string,
	storageTypeId: number | null,
	instanceKey: string,
	title: string,
	description: string,
	sources: Array<EditorSource>,
	join: { leftField: string, rightField: string },
	columns: Array<Object>,
	period: { mode: string, month: string, sourceAlias: string },
	operation: string,
	aggregate: { groupBy: Array<string>, functions: Array<Object> },
	isOpen: boolean,
	isDirty: boolean,
	isSaving: boolean,
	isHydrating: boolean,
	validationErrors: Object,
	onSaved: Function | null,
	lastFetchId: number,
};

function emptyPeriod(): Object
{
	return { mode: PERIOD_MODE.CURRENT, month: '', sourceAlias: SOURCE_ALIAS.LEADING };
}

function emptyAggregate(): Object
{
	return { groupBy: [], functions: [] };
}

/**
 * Normalizes an operation to one the editor knows. A definition written before an operation was
 * persisted, or one whose operation the current code no longer recognizes, is read as a join — the
 * shape the first release could always produce (backward compatibility).
 */
function normalizeOperation(operation: ?string): string
{
	if (operation === OPERATION.AGGREGATE)
	{
		return OPERATION.AGGREGATE;
	}

	if (operation === OPERATION.PROJECT)
	{
		return OPERATION.PROJECT;
	}

	return OPERATION.JOIN;
}

/**
 * The slice of state {@see buildDefinition} reads. Keeping it in one place is what makes the
 * `definition` getter and `save()` serialize the very same thing.
 */
function definitionState(state: DefinitionState): Object
{
	return {
		sources: state.sources,
		columns: state.columns,
		join: state.join,
		period: state.period,
		operation: state.operation,
		aggregate: state.aggregate,
	};
}

/**
 * Restores one `sources[]` entry of a stored definition. A bizproc storage source additionally
 * carries its storage id lifted out of params — the picker addresses storages by id.
 */
function hydrateSource(source: Object): ?EditorSource
{
	if (!Type.isStringFilled(source?.alias))
	{
		return null;
	}

	const params = Type.isPlainObject(source.params) ? { ...source.params } : {};
	const restored: EditorSource = {
		alias: source.alias,
		module: String(source.module ?? ''),
		entity: String(source.entity ?? ''),
		params,
	};

	const storageId = Number(params.storageTypeId);
	if (Number.isInteger(storageId) && storageId > 0)
	{
		restored.storageId = storageId;
	}

	return restored;
}

function hydrateColumn(column: Object): Object
{
	if (column?.kind === 'constant')
	{
		return {
			code: String(column?.code ?? ''),
			title: String(column?.title ?? ''),
			kind: 'constant',
			constant: {
				module: String(column?.constant?.module ?? ''),
				entity: String(column?.constant?.entity ?? ''),
				params: Type.isPlainObject(column?.constant?.params) ? { ...column.constant.params } : {},
			},
		};
	}

	const mapped: Object = {
		code: String(column?.code ?? ''),
		title: String(column?.title ?? ''),
		source: String(column?.source ?? ''),
	};

	if (Type.isStringFilled(column?.formula))
	{
		mapped.formula = column.formula;
	}

	return mapped;
}

/**
 * Restores the aggregate block. A saved definition carries groupBy and functions[].column as the
 * backend `alias.FIELD` references ({@see buildDefinition}), while the panel works in projection
 * column codes (its checkboxes and function pickers compare against `column.code`). Given the
 * projected columns, each reference is mapped back to its column code so a reopened grouping restores
 * its checks; a reference no column claims is kept verbatim, which tolerates both the panel's own
 * code-form input (it passes no columns) and legacy data.
 */
function hydrateAggregate(aggregate: ?Object, columns: ?Array<Object> = null): Object
{
	if (!Type.isPlainObject(aggregate))
	{
		return emptyAggregate();
	}

	const codeBySource = new Map();
	(Type.isArray(columns) ? columns : []).forEach((column) => {
		if (Type.isStringFilled(column?.source) && Type.isStringFilled(column?.code))
		{
			codeBySource.set(column.source, column.code);
		}
	});
	const toCode = (ref: string): string => codeBySource.get(ref) ?? ref;

	return {
		groupBy: (Type.isArray(aggregate.groupBy) ? aggregate.groupBy : []).map((ref) => toCode(String(ref))),
		functions: (Type.isArray(aggregate.functions) ? aggregate.functions : []).map((fn) => ({
			column: toCode(String(fn?.column ?? '')),
			fn: String(fn?.fn ?? ''),
			code: String(fn?.code ?? ''),
			title: String(fn?.title ?? ''),
		})),
	};
}

/**
 * Sole owner of the data view definition being edited: the window and its panels read it from here
 * and mutate it field by field, never keeping a second copy of their own.
 */
export const useDataViewDefinitionStore = defineStore('bizprocdesigner-editor-data-view-definition', {
	state: (): DefinitionState => ({
		templateId: null,
		activityName: '',
		storageTypeId: null,
		instanceKey: '',
		title: '',
		description: '',
		sources: [],
		join: { leftField: '', rightField: '' },
		columns: [],
		period: emptyPeriod(),
		// A new view opens as a plain one-source table: a single source and simple fields already
		// preview. Merge and grouping are reached from the "add parameter" dialog.
		operation: OPERATION.PROJECT,
		aggregate: emptyAggregate(),
		isOpen: false,
		isDirty: false,
		isSaving: false,
		isHydrating: false,
		validationErrors: {},
		onSaved: null,
		lastFetchId: 0,
	}),
	getters:
	{
		mode: (state: DefinitionState): string => (
			Type.isNumber(state.storageTypeId) && state.storageTypeId > 0 ? EDITOR_MODE.EDIT : EDITOR_MODE.CREATE
		),
		definition: (state: DefinitionState): ?Object => buildDefinition(definitionState(state)),
		isComplete: (state: DefinitionState): boolean => isDefinitionComplete(definitionState(state)),
		canSave(state: DefinitionState): boolean
		{
			return this.isComplete
				&& Type.isStringFilled(state.title.trim())
				&& !state.isSaving
				&& !state.isHydrating
			;
		},
	},
	actions:
	{
		open(context: Object = {}): void
		{
			this.reset();
			this.templateId = isTemplateContextId(context.templateId) ? Number(context.templateId) : null;
			this.activityName = Type.isStringFilled(context.activityName) ? context.activityName : '';
			this.storageTypeId = Type.isNumber(context.storageTypeId) && context.storageTypeId > 0
				? context.storageTypeId
				: null
			;
			this.instanceKey = Type.isStringFilled(context.instanceKey) ? context.instanceKey : '';
			this.onSaved = Type.isFunction(context.onSaved) ? context.onSaved : null;
			this.isOpen = true;
		},
		close(): void
		{
			this.reset();
		},
		/** Loads the edited view and hands the API-02 payload to {@see hydrate}. */
		async load(): Promise<void>
		{
			if (this.mode !== EDITOR_MODE.EDIT)
			{
				return;
			}

			const fetchId = ++this.lastFetchId;
			this.isHydrating = true;
			try
			{
				const item = await dataViewEditorApi.get(this.storageTypeId);
				if (this.lastFetchId !== fetchId)
				{
					return;
				}

				this.hydrate(item);
			}
			finally
			{
				if (this.lastFetchId === fetchId)
				{
					this.isHydrating = false;
				}
			}
		},
		/** Restores state from a `get()` response (API-02). A hydrated state is not dirty. */
		hydrate(item: ?Object): void
		{
			this.title = String(item?.title ?? '');
			this.description = String(item?.description ?? '');

			const definition = Type.isPlainObject(item?.definition) ? item.definition : {};

			this.operation = normalizeOperation(definition.operation);

			this.sources = (Type.isArray(definition.sources) ? definition.sources : [])
				.map(hydrateSource)
				.filter((source) => source !== null)
			;

			const joinKey = Type.isArrayFilled(definition.joinKeys) ? definition.joinKeys[0] : null;
			this.join = joinKey
				? { leftField: splitSource(joinKey.left).field, rightField: splitSource(joinKey.right).field }
				: { leftField: '', rightField: '' }
			;

			this.columns = (Type.isArray(definition.columns) ? definition.columns : []).map(hydrateColumn);
			// The columns are restored first: mapping the aggregate's `alias.FIELD` refs back to their
			// projection codes needs them (the panel compares grouping/functions against `column.code`).
			this.aggregate = hydrateAggregate(definition.aggregate, this.columns);

			const period = Type.isPlainObject(definition.period) ? definition.period : {};
			this.period = {
				mode: Type.isStringFilled(period.mode) ? period.mode : PERIOD_MODE.CURRENT,
				month: Type.isStringFilled(period.month) ? period.month : '',
				sourceAlias: Type.isStringFilled(period.sourceAlias) ? period.sourceAlias : SOURCE_ALIAS.LEADING,
			};

			this.validationErrors = {};
			this.isDirty = false;
		},
		setTitle(title: string): void
		{
			this.title = String(title ?? '');
			this.touch('title');
		},
		setDescription(description: string): void
		{
			this.description = String(description ?? '');
			this.touch('description');
		},
		setOperation(operation: string): void
		{
			this.operation = normalizeOperation(operation);
			this.touch('operation');
		},
		setSources(sources: Array<EditorSource>): void
		{
			this.sources = Type.isArray(sources) ? [...sources] : [];
			this.touch('sources');
		},
		setJoin(join: Object): void
		{
			this.join = {
				leftField: String(join?.leftField ?? ''),
				rightField: String(join?.rightField ?? ''),
			};
			this.touch('joinKeys');
		},
		setColumns(columns: Array<Object>): void
		{
			this.columns = Type.isArray(columns) ? [...columns] : [];
			this.touch('columns');
		},
		/**
		 * Binds an expression to a column, replacing the value it takes from its source
		 * ({@see ValueModifierDialog}). An empty formula is no formula: the field leaves the column
		 * rather than travelling to the backend blank. A stamp holds a constant instead of a source
		 * value, so it takes no formula ({@see ColumnFormula}).
		 */
		setColumnFormula(code: string, formula: string): void
		{
			const target = String(code ?? '');
			const expression = String(formula ?? '').trim();

			this.columns = this.columns.map((column) => {
				if (column.code !== target || column.kind === 'constant')
				{
					return column;
				}

				const next = { ...column };
				if (Type.isStringFilled(expression))
				{
					next.formula = expression;
				}
				else
				{
					delete next.formula;
				}

				return next;
			});
			this.touch('columns');
		},
		setPeriod(period: Object): void
		{
			this.period = {
				mode: Type.isStringFilled(period?.mode) ? period.mode : PERIOD_MODE.CURRENT,
				month: Type.isStringFilled(period?.month) ? period.month : '',
				sourceAlias: Type.isStringFilled(period?.sourceAlias) ? period.sourceAlias : SOURCE_ALIAS.LEADING,
			};
			this.touch('period');
		},
		setAggregate(aggregate: Object): void
		{
			this.aggregate = hydrateAggregate(aggregate);
			this.touch('aggregate');
		},
		/** Marks the definition edited and drops the stale verdict on the field just changed. */
		touch(field: ?string = null): void
		{
			this.isDirty = true;
			if (Type.isStringFilled(field) && field in this.validationErrors)
			{
				const { [field]: dropped, ...rest } = this.validationErrors;
				this.validationErrors = rest;
			}
		},
		/**
		 * Persists the definition (API-01). A rejected validation lands in `validationErrors` and is
		 * not thrown — the user fixes it in place; every other failure is the caller's to present.
		 *
		 * @return {Promise<?Object>} the saved item, or null when the definition was rejected
		 */
		async save(): Promise<?Object>
		{
			const definition = this.definition;
			if (definition === null)
			{
				return null;
			}

			this.isSaving = true;
			this.validationErrors = {};
			try
			{
				const params: Object = {
					title: this.title.trim(),
					description: this.description.trim(),
					definition,
				};
				if (this.mode === EDITOR_MODE.EDIT)
				{
					params.storageTypeId = this.storageTypeId;
				}
				if (isTemplateContextId(this.templateId))
				{
					params.ownerTemplateId = this.templateId;
				}
				if (Type.isStringFilled(this.activityName))
				{
					params.ownerActivityName = this.activityName;
				}

				const result = await dataViewEditorApi.save(params);
				this.isDirty = false;

				// A just-created view is an existing one from here on: adopting the id the server issued is
				// what makes the next save in this same session update it instead of storing a duplicate.
				const savedStorageTypeId = Number(result?.storageTypeId);
				if (Number.isInteger(savedStorageTypeId) && savedStorageTypeId > 0)
				{
					this.storageTypeId = savedStorageTypeId;
				}

				// The save response (API-01) carries no title/description, but the list item needs them.
				return { ...result, title: params.title, description: params.description };
			}
			catch (error)
			{
				this.adoptSavedStorageTypeId(error);

				if (this.applyServerValidation(error))
				{
					return null;
				}

				throw error;
			}
			finally
			{
				this.isSaving = false;
			}
		},
		/**
		 * Routes the field errors of a rejected request (DTO-01) under their controls and reports whether
		 * the backend addressed any field. Shared by save and the live preview; a failure the backend did
		 * not address to a field is left for the caller to present. Only the verdict changes here — never
		 * the values the user entered.
		 *
		 * @return {boolean} true when at least one field error was shown
		 */
		applyServerValidation(error: ?Object): boolean
		{
			const errors = mapErrors(error?.errors);
			if (Object.keys(errors).length === 0)
			{
				return false;
			}

			this.validationErrors = { ...errors };

			return true;
		},
		/** Drops every field verdict — a definition that previews validates as a whole. */
		clearValidationErrors(): void
		{
			if (Object.keys(this.validationErrors).length > 0)
			{
				this.validationErrors = {};
			}
		},
		/**
		 * A failed materialize may still have persisted the definition: the server reports the id of the
		 * created view in the error customData. Adopting it turns the next save into an update of that
		 * view instead of storing a duplicate.
		 */
		adoptSavedStorageTypeId(error: ?Object): void
		{
			const savedId = Number(error?.customData?.storageTypeId);
			if (this.mode === EDITOR_MODE.CREATE && Number.isInteger(savedId) && savedId > 0)
			{
				this.storageTypeId = savedId;
			}
		},
		/** Reports a saved item to the opener and closes the editor. */
		handleSaved(item: ?Object): void
		{
			const onSaved = this.onSaved;
			if (Type.isFunction(onSaved))
			{
				onSaved(item);
			}

			this.close();
		},
		reset(): void
		{
			// Dropping the state invalidates every load still in flight: advancing the counter past
			// their fetch id is what stops a late response from hydrating the next session.
			const { lastFetchId } = this;
			this.$reset();
			this.lastFetchId = lastFetchId + 1;
		},
	},
});
