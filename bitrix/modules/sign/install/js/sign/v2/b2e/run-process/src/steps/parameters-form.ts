import { Type } from 'main.core';

/**
 * A start field of the process as `\Bitrix\Bizproc\FieldType::normalizePropertyList()` gives it out
 * (API-02). The shape belongs to bizproc and reaches its controls untouched, so nothing here rewrites it:
 * named are only the keys the form itself reads.
 */
export type StartField = {
	Id: string,
	Type?: string | null,
	Name?: string | null,
	Required?: boolean,
	Multiple?: boolean,
	Default?: unknown,
};

/**
 * Answer of API-02, as wide as a refused or a half-built one may come: the form is drawn from whatever
 * really arrived and not from what the contract promises.
 */
export type StartFieldsResponse = {
	documentType?: unknown,
	fields?: unknown,
};

/** One field as the renderer of bizproc takes it: the description as it came, its name and its value. */
export type FieldRenderItem = {
	property: StartField,
	fieldName: string,
	value: string | string[] | null,
};

export type StartForm = {
	documentType: string[],
	items: FieldRenderItem[],
};

/**
 * One message of the form and the start field it belongs to. An empty `name` is a message the server
 * bound to no field: it is shown, but marks no control.
 */
export type FormError = {
	name: string,
	message: string,
};

/**
 * Whether a refusal speaks about the form at all. An error the server bound to no start field says nothing
 * about the fields and must not send the officer back to them (ERR-003).
 */
export function hasFieldErrors(errors: FormError[]): boolean
{
	return errors.some((error: FormError) => error.name !== '');
}

/**
 * The form of one process out of the answer of API-02. The order of the fields is the order the server
 * sent them in; a description without an id is dropped, because a value read off it would reach the
 * launch under no name.
 */
export function readStartForm(response: StartFieldsResponse | null): StartForm
{
	return {
		documentType: readDocumentType(response?.documentType),
		items: readItems(response?.fields),
	};
}

/**
 * Messages of a refused request. The transport rejects with the answer of the server where it has one and
 * with a plain error where it has not, so both shapes are read here. `customData.parameter` is the start
 * field the server refused - it is what binds a message to a control of the form (ERR-003).
 */
export function readErrors(exception: unknown): FormError[]
{
	if (!Type.isObjectLike(exception))
	{
		return [];
	}

	if (Type.isArray(exception.errors))
	{
		return exception.errors
			.map((error: unknown) => readError(error))
			.filter((error: FormError) => error.message !== '')
		;
	}

	return Type.isStringFilled(exception.message) ? [{ name: '', message: exception.message }] : [];
}

function readDocumentType(documentType: unknown): string[]
{
	if (!Type.isArray(documentType))
	{
		return [];
	}

	return documentType.filter((part: unknown): part is string => Type.isString(part));
}

function readItems(fields: unknown): FieldRenderItem[]
{
	if (!Type.isArray(fields))
	{
		return [];
	}

	return fields
		.filter((field: unknown): field is StartField => (
			Type.isPlainObject(field) && Type.isStringFilled(field.Id)
		))
		.map((field: StartField) => ({
			property: field,
			fieldName: field.Id,
			value: readValue(field.Default),
		}))
	;
}

/**
 * The value the control opens on. Only what a control can carry travels: a description whose default came
 * in another shape opens the field empty instead of putting the shape itself into the input.
 */
function readValue(value: unknown): string | string[] | null
{
	if (Type.isArray(value))
	{
		return value.filter((item: unknown): item is string => Type.isString(item));
	}

	if (Type.isString(value))
	{
		return value;
	}

	return Type.isNumber(value) || Type.isBoolean(value) ? String(value) : null;
}

function readError(error: unknown): FormError
{
	if (!Type.isPlainObject(error))
	{
		return { name: '', message: '' };
	}

	const parameter = Type.isPlainObject(error.customData) ? error.customData.parameter : null;

	return {
		name: Type.isStringFilled(parameter) ? parameter : '',
		message: Type.isStringFilled(error.message) ? error.message : '',
	};
}
