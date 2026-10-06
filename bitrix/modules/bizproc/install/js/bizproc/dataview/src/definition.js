import { Extension, Type } from 'main.core';

/** Stable source aliases the window assigns by order of first use (DTO-01 sources[].alias). */
export const SOURCE_ALIAS = Object.freeze({
	LEADING: 'a',
	SECOND: 'b',
});

/** Source aliases in canonical order (leading first). */
export const SOURCE_ALIASES = Object.freeze([SOURCE_ALIAS.LEADING, SOURCE_ALIAS.SECOND]);

/** Combine operations (DTO-01 operation). */
export const OPERATION = Object.freeze({
	JOIN: 'join',
	AGGREGATE: 'aggregate',
	PROJECT: 'project',
});

/** Aggregate functions (DTO-01 aggregate.functions[].fn). */
export const AGGREGATE_FUNCTION = Object.freeze({
	SUM: 'SUM',
	COUNT: 'COUNT',
	AVG: 'AVG',
	MIN: 'MIN',
	MAX: 'MAX',
});

const AGGREGATE_FUNCTIONS = Object.freeze(Object.values(AGGREGATE_FUNCTION));

/**
 * Storage service columns the backend mapper reserves (StorageItemMapper::getFieldsMap()).
 * A result column may not reuse one of these codes, so the client renames reserved codes here.
 */
const RESERVED_STORAGE_FIELD_CODES = Object.freeze(new Set([
	'ID',
	'CREATED_BY',
	'UPDATED_BY',
	'CREATED_TIME',
	'UPDATED_TIME',
	'STORAGE_ID',
	'DOCUMENT_ID',
	'WORKFLOW_ID',
	'TEMPLATE_ID',
	'CODE',
]));

/** Sources the window describes with a bare storage id, before the catalog gave it a module/entity. */
const STORAGE_SOURCE = Object.freeze({
	MODULE: 'bizproc',
	ENTITY: 'storage',
});

/** Period selection modes (DTO-01 period.mode). */
export const PERIOD_MODE = Object.freeze({
	CURRENT: 'current',
	PREVIOUS: 'previous',
	CALENDAR: 'calendar',
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
export function getAllowedFormulaFunctions(): ?Array<string>
{
	const functions = Extension.getSettings(EXTENSION_NAME).get('allowedFormulaFunctions');

	return Type.isArray(functions) ? functions : null;
}

/**
 * Splits an `"alias.FIELD"` reference into its parts.
 *
 * @return {{ alias: string, field: string }}
 */
export function splitSource(source: ?string): { alias: string, field: string }
{
	const value = Type.isStringFilled(source) ? source : '';
	const dot = value.indexOf('.');
	if (dot <= 0 || dot === value.length - 1)
	{
		return { alias: '', field: '' };
	}

	return { alias: value.slice(0, dot), field: value.slice(dot + 1) };
}

/**
 * Resolves the alias a storage should use inside the window: the alias already bound to the storage,
 * the next free alias (leading, then second), or null when both aliases are taken by other storages.
 *
 * @param {Array<{ alias: string, storageId: number }>} sources
 */
export function resolveAliasForStorage(sources: Array<Object>, storageId: number): ?string
{
	const existing = sources.find((source) => source.storageId === storageId);
	if (existing)
	{
		return existing.alias;
	}

	const usedAliases = new Set(sources.map((source) => source.alias));

	return SOURCE_ALIASES.find((alias) => !usedAliases.has(alias)) ?? null;
}

/**
 * Generates a unique result-column code from a source field code, mirroring the backend
 * {@see ColumnResolver::uniqueCode()} suffix scheme (`CODE`, `CODE_2`, `CODE_3`, ...).
 *
 * @param {Iterable<string>} usedCodes already assigned codes
 */
export function generateColumnCode(fieldCode: string, usedCodes: Iterable<string>): string
{
	const taken = new Set(usedCodes);
	const base = Type.isStringFilled(fieldCode) ? fieldCode : 'FIELD';
	if (!taken.has(base) && !RESERVED_STORAGE_FIELD_CODES.has(base.toUpperCase()))
	{
		return base;
	}

	let index = 2;
	while (taken.has(`${base}_${index}`))
	{
		index++;
	}

	return `${base}_${index}`;
}

/**
 * A source is usable once it names an entity of some module (a catalog pick, DTO-01 sources[]),
 * or — for the storage picker, which predates the catalog — once it carries a storage id.
 */
function isSourceComplete(source: ?Object): boolean
{
	if (!Type.isStringFilled(source?.alias))
	{
		return false;
	}

	if (Type.isStringFilled(source.module) && Type.isStringFilled(source.entity))
	{
		return true;
	}

	return Type.isNumber(source.storageId) && source.storageId > 0;
}

/**
 * @param {Array<{ alias: string }>} sources
 * @return {{ [alias: string]: Object }}
 */
function completeSourcesByAlias(sources: ?Array<Object>): Object
{
	const map = {};
	(Type.isArray(sources) ? sources : []).forEach((source) => {
		if (isSourceComplete(source))
		{
			map[source.alias] = source;
		}
	});

	return map;
}

/** Serializes one DTO-01 sources[] entry, defaulting a storage pick to the bizproc storage source. */
function buildSource(source: Object): Object
{
	if (Type.isStringFilled(source.module) && Type.isStringFilled(source.entity))
	{
		return {
			alias: source.alias,
			module: source.module,
			entity: source.entity,
			params: Type.isPlainObject(source.params) ? { ...source.params } : {},
		};
	}

	return {
		alias: source.alias,
		module: STORAGE_SOURCE.MODULE,
		entity: STORAGE_SOURCE.ENTITY,
		params: { storageTypeId: source.storageId },
	};
}

/** Operation of a window state; states written before aggregate/project existed carry no operation. */
function resolveOperation(state: ?Object): string
{
	if (state?.operation === OPERATION.AGGREGATE)
	{
		return OPERATION.AGGREGATE;
	}

	if (state?.operation === OPERATION.PROJECT)
	{
		return OPERATION.PROJECT;
	}

	return OPERATION.JOIN;
}

function isAggregateFunctionComplete(fn: ?Object): boolean
{
	return (
		Type.isStringFilled(fn?.column)
		&& AGGREGATE_FUNCTIONS.includes(fn?.fn)
		&& Type.isStringFilled(fn?.code)
	);
}

function isAggregateComplete(aggregate: ?Object): boolean
{
	if (!Type.isArrayFilled(aggregate?.groupBy) || !Type.isArrayFilled(aggregate?.functions))
	{
		return false;
	}

	return (
		aggregate.groupBy.every((column) => Type.isStringFilled(column))
		&& aggregate.functions.every(isAggregateFunctionComplete)
	);
}

function isPeriodComplete(period: ?Object): boolean
{
	if (!Type.isPlainObject(period))
	{
		return false;
	}

	if (period.sourceAlias !== SOURCE_ALIAS.LEADING && period.sourceAlias !== SOURCE_ALIAS.SECOND)
	{
		return false;
	}

	if (![PERIOD_MODE.CURRENT, PERIOD_MODE.PREVIOUS, PERIOD_MODE.CALENDAR].includes(period.mode))
	{
		return false;
	}

	if (period.mode === PERIOD_MODE.CALENDAR && !MONTH_REGEX.test(period.month ?? ''))
	{
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
export function isDefinitionComplete(state: Object): boolean
{
	if (!isPeriodComplete(state?.period))
	{
		return false;
	}

	const byAlias = completeSourcesByAlias(state?.sources);
	const operation = resolveOperation(state);

	if (operation === OPERATION.AGGREGATE)
	{
		return Object.keys(byAlias).length === 1 && isAggregateComplete(state?.aggregate);
	}

	if (operation === OPERATION.PROJECT)
	{
		return Object.keys(byAlias).length === 1 && Type.isArrayFilled(state?.columns);
	}

	if (!byAlias[SOURCE_ALIAS.LEADING] || !byAlias[SOURCE_ALIAS.SECOND])
	{
		return false;
	}

	if (!Type.isArrayFilled(state?.columns))
	{
		return false;
	}

	const join = state?.join;

	return Type.isStringFilled(join?.leftField) && Type.isStringFilled(join?.rightField);
}

/**
 * Assembles the DTO-01 definition strictly from window state. Columns are serialized explicitly
 * ({@see ColumnResolver} enriches title/type from the source schema; the join key column is kept in
 * the collection by the window). Returns null when the form is incomplete.
 */
export function buildDefinition(state: Object): ?Object
{
	if (!isDefinitionComplete(state))
	{
		return null;
	}

	const byAlias = completeSourcesByAlias(state.sources);

	const period: Object = {
		sourceAlias: state.period.sourceAlias,
		mode: state.period.mode,
	};
	if (state.period.mode === PERIOD_MODE.CALENDAR)
	{
		period.month = state.period.month;
	}

	const columns = buildColumns(state.columns);

	const operation = resolveOperation(state);

	if (operation === OPERATION.AGGREGATE)
	{
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
			period: { ...period, sourceAlias: alias },
			aggregate: {
				groupBy: state.aggregate.groupBy.map((code) => sourceOf.get(code) ?? code),
				functions: state.aggregate.functions.map((fn) => ({
					column: sourceOf.get(fn.column) ?? fn.column,
					fn: fn.fn,
					code: fn.code,
					title: fn.title,
				})),
			},
			columns,
		};
	}

	if (operation === OPERATION.PROJECT)
	{
		const [alias] = Object.keys(byAlias);

		// The window applies the period to the single source; pinning sourceAlias to that source keeps
		// the DTO consistent even when a stale period (e.g. left over from a join whose second source
		// carried the window) still names an alias the projection no longer has.
		return {
			version: 1,
			operation: OPERATION.PROJECT,
			sources: [buildSource(byAlias[alias])],
			period: { ...period, sourceAlias: alias },
			columns,
		};
	}

	return {
		version: 1,
		operation: OPERATION.JOIN,
		sources: SOURCE_ALIASES.map((alias) => buildSource(byAlias[alias])),
		period,
		joinKeys: [
			{
				left: `${SOURCE_ALIAS.LEADING}.${state.join.leftField}`,
				right: `${SOURCE_ALIAS.SECOND}.${state.join.rightField}`,
			},
		],
		columns,
	};
}

function buildColumns(columns: ?Array<Object>): Array<Object>
{
	return (Type.isArray(columns) ? columns : []).map((column) => {
		if (column?.kind === 'constant')
		{
			const serialized: Object = {
				code: column.code,
				title: column.title,
				kind: 'constant',
				constant: {
					module: column.constant?.module,
					entity: column.constant?.entity,
					params: Type.isPlainObject(column.constant?.params) ? { ...column.constant.params } : {},
				},
			};
			if (Type.isStringFilled(column.description))
			{
				serialized.description = column.description;
			}

			return serialized;
		}

		const serialized: Object = {
			code: column.code,
			title: column.title,
			source: column.source,
		};
		if (Type.isStringFilled(column.description))
		{
			serialized.description = column.description;
		}

		// An expression replacing the source value of the column ({@see ColumnFormula}); an empty one
		// is no formula at all, so the field is left out rather than sent blank.
		if (Type.isStringFilled(column.formula))
		{
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
function sourceByColumnCode(columns: ?Array<Object>): Map<string, string>
{
	const map = new Map();
	(Type.isArray(columns) ? columns : []).forEach((column) => {
		if (Type.isStringFilled(column?.code) && Type.isStringFilled(column?.source))
		{
			map.set(column.code, column.source);
		}
	});

	return map;
}
