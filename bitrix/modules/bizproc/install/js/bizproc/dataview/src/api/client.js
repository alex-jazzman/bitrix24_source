import { ajax, Type, Loc } from 'main.core';

export const DataViewAction = Object.freeze({
	PREVIEW: 'bizproc.v2.DataView.preview',
	SAVE: 'bizproc.v2.DataView.save',
	LIST: 'bizproc.v2.DataView.list',
	GET: 'bizproc.v2.DataView.get',
	DELETE: 'bizproc.v2.DataView.delete',
	GET_SOURCES: 'bizproc.v2.DataView.getSources',
	GET_SOURCE_SCHEMA: 'bizproc.v2.DataView.getSourceSchema',
	GET_STAMP_CONSTANTS: 'bizproc.v2.DataView.getStampConstants',
});

export const PREVIEW_LIMIT_MAX = 50;
export const PREVIEW_LIMIT_DEFAULT = 50;
export const PREVIEW_PAGE_SIZE_MAX = 50;
export const PREVIEW_PAGE_SIZE_DEFAULT = 20;

const ERROR_MESSAGE_CODE = Object.freeze({
	ACCESS_DENIED: 'BIZPROC_JS_DATAVIEW_ERROR_ACCESS_DENIED',
	DATA_VIEW_VALIDATION_FAILED: 'BIZPROC_JS_DATAVIEW_ERROR_VALIDATION_FAILED',
	DATA_VIEW_ROWS_LIMIT_EXCEEDED: 'BIZPROC_JS_DATAVIEW_ERROR_ROWS_LIMIT_EXCEEDED',
	DATA_VIEW_SOURCE_UNAVAILABLE: 'BIZPROC_JS_DATAVIEW_ERROR_SOURCE_UNAVAILABLE',
	DATA_VIEW_RECOMPUTE_IN_PROGRESS: 'BIZPROC_JS_DATAVIEW_ERROR_RECOMPUTE_IN_PROGRESS',
	DATA_VIEW_UNEXPECTED_ERROR: 'BIZPROC_JS_DATAVIEW_ERROR_UNEXPECTED',
});

const GENERIC_ERROR_MESSAGE_CODE = 'BIZPROC_JS_DATAVIEW_ERROR_GENERIC';

export function resolveErrorMessageCode(code: ?string): string
{
	if (Type.isStringFilled(code) && Object.hasOwn(ERROR_MESSAGE_CODE, code))
	{
		return ERROR_MESSAGE_CODE[code];
	}

	return GENERIC_ERROR_MESSAGE_CODE;
}

export type DataViewErrorItem = {
	field: ?string,
	code: string,
	message: string,
};

export class DataViewApiError extends Error
{
	code: string;
	messageCode: string;
	customData: ?Object;
	errors: Array<DataViewErrorItem>;

	constructor(
		code: string,
		messageCode: string,
		message: string,
		customData: ?Object = null,
		errors: Array<DataViewErrorItem> = [],
	)
	{
		super(message);
		this.name = 'DataViewApiError';
		this.code = code;
		this.messageCode = messageCode;
		this.customData = customData;
		this.errors = errors;
	}
}

type SaveParams = {
	storageTypeId?: ?number,
	title: string,
	code?: ?string,
	description?: ?string,
	definition: Object,
	ownerTemplateId?: ?(number | string),
	ownerActivityName?: ?string,
};

type SourcesParams = {
	templateId?: ?(number | string),
};

type StampConstantsParams = {
	templateId?: ?(number | string),
};

type SourceSchemaParams = {
	module: string,
	entity: string,
	params?: ?Object,
	templateId?: ?(number | string),
};

type PreviewOptions = {
	page?: ?number,
	pageSize?: ?number,
	limit?: ?number,
	ownerTemplateId?: ?(number | string),
};

export class DataViewApiClient
{
	#runAction: Function;

	constructor(runAction: ?Function = null)
	{
		this.#runAction = runAction ?? defaultRunAction;
	}

	/**
	 * Preview a definition. Pass a number for the legacy single-page limit, or an options object
	 * `{ page, pageSize }` for the paginated API-03 v2 response (`{ ..., page, pageSize, totalRows }`).
	 * `ownerTemplateId` names the template the definition belongs to (API-08); a definition reading
	 * sources of that template previews only under its owner.
	 */
	preview(definition: Object, options: PreviewOptions | number = PREVIEW_LIMIT_DEFAULT): Promise<Object>
	{
		if (Type.isNumber(options))
		{
			return runRequest(this.#runAction, DataViewAction.PREVIEW, {
				definition,
				limit: normalizeLimit(options),
			});
		}

		const data: Object = Type.isNumber(options?.page)
			? {
				definition,
				page: Math.max(1, Math.trunc(options.page)),
				pageSize: normalizePageSize(options?.pageSize),
			}
			: {
				definition,
				limit: normalizeLimit(options?.limit),
			}
		;

		if (isTemplateContextId(options?.ownerTemplateId))
		{
			data.ownerTemplateId = Number(options.ownerTemplateId);
		}

		return runRequest(this.#runAction, DataViewAction.PREVIEW, data);
	}

	save(params: SaveParams): Promise<Object>
	{
		const data = {
			title: params.title,
			definition: params.definition,
		};

		if (Type.isNumber(params.storageTypeId))
		{
			data.storageTypeId = params.storageTypeId;
		}

		if (Type.isStringFilled(params.code))
		{
			data.code = params.code;
		}

		if (Type.isString(params.description))
		{
			data.description = params.description;
		}

		if (isTemplateContextId(params.ownerTemplateId))
		{
			data.ownerTemplateId = Number(params.ownerTemplateId);
		}

		if (Type.isStringFilled(params.ownerActivityName))
		{
			data.ownerActivityName = params.ownerActivityName;
		}

		return runRequest(this.#runAction, DataViewAction.SAVE, data);
	}

	list(templateId: number | string, activityName: string): Promise<Object> {
		return runRequest(this.#runAction, DataViewAction.LIST, {
			templateId: Number(templateId),
			activityName,
		});
	}

	get(storageTypeId: number): Promise<Object> {
		return runRequest(this.#runAction, DataViewAction.GET, { storageTypeId });
	}

	remove(storageTypeId: number): Promise<Object> {
		return runRequest(this.#runAction, DataViewAction.DELETE, { storageTypeId });
	}

	/**
	 * Catalog of data sources available to the current user (API-04). `templateId` names the template
	 * the catalog is opened for (API-06). Only then does it also list that template's own constants
	 * and variables; a standalone view asks without one.
	 *
	 * @return {Promise<{ sources: Array<Object> }>}
	 */
	getSources(params: SourcesParams = {}): Promise<Object> {
		const data = {};

		if (isTemplateContextId(params.templateId))
		{
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
	getStampConstants(params: StampConstantsParams = {}): Promise<Object> {
		const data = {};

		if (isTemplateContextId(params.templateId))
		{
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
	getSourceSchema(params: SourceSchemaParams): Promise<Object> {
		const data = {
			module: params.module,
			entity: params.entity,
		};

		if (Type.isPlainObject(params.params))
		{
			data.params = params.params;
		}

		if (isTemplateContextId(params.templateId))
		{
			data.templateId = Number(params.templateId);
		}

		return runRequest(this.#runAction, DataViewAction.GET_SOURCE_SCHEMA, data);
	}
}

function defaultRunAction(action: string, config: Object): Promise<Object>
{
	return ajax.runAction(action, config);
}

async function runRequest(runAction: Function, action: string, data: Object): Promise<Object>
{
	try
	{
		const response = await runAction(action, { data });

		return response?.data ?? null;
	}
	catch (response)
	{
		throw toApiError(response);
	}
}

/**
 * Whether a template context is worth sending. The catalog, the preview and the save take the
 * template id as an optional parameter (API-06..API-08), so anything but a positive integer means
 * "no context" and the request goes out exactly as it did before the context existed. A numeric
 * string counts: source params come back from the backend as strings.
 */
export function isTemplateContextId(templateId: ?(number | string)): boolean
{
	if (!Type.isNumber(templateId) && !Type.isStringFilled(templateId))
	{
		return false;
	}

	const value = Number(templateId);

	return Number.isInteger(value) && value > 0;
}

function normalizeLimit(limit: ?number): number
{
	const value = Number(limit);
	if (!Number.isInteger(value) || value <= 0)
	{
		return PREVIEW_LIMIT_DEFAULT;
	}

	return Math.min(value, PREVIEW_LIMIT_MAX);
}

function normalizePageSize(pageSize: ?number): number
{
	const value = Number(pageSize);
	if (!Number.isInteger(value) || value <= 0)
	{
		return PREVIEW_PAGE_SIZE_DEFAULT;
	}

	return Math.min(value, PREVIEW_PAGE_SIZE_MAX);
}

function toApiError(response: ?Object): DataViewApiError
{
	const errors = extractErrors(response);
	const [firstError] = errors;
	const code = firstError?.code ?? '';
	const messageCode = resolveErrorMessageCode(code);
	const customData = Type.isPlainObject(firstError?.customData) ? firstError.customData : null;
	const message = Type.isStringFilled(firstError?.message)
		? firstError.message
		: Loc.getMessage(messageCode)
	;

	return new DataViewApiError(
		code,
		messageCode,
		message,
		customData,
		errors.map((error) => toErrorItem(error)),
	);
}

function extractErrors(response: ?Object): Array<Object>
{
	const errors = response?.errors;

	return Type.isArrayFilled(errors) ? errors : [];
}

function toErrorItem(error: ?Object): DataViewErrorItem
{
	const customData = Type.isPlainObject(error?.customData) ? error.customData : null;
	const field = Type.isStringFilled(customData?.field) ? customData.field : null;
	const code = Type.isStringFilled(customData?.code)
		? customData.code
		: (Type.isStringFilled(error?.code) ? error.code : '')
	;
	const message = Type.isStringFilled(error?.message) ? error.message : '';

	return { field, code, message };
}
