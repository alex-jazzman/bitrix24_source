import { Type, Loc } from 'main.core';

import { resolveErrorMessageCode } from './api/client';

/**
 * How a consumer should treat a failed request. The mapper classifies; the presentation
 * (inline hint, retry, upsell, blocking message) is the consumer's decision.
 */
export const ERROR_CATEGORY = Object.freeze({
	/** The definition is wrong and the user can fix it in place. */
	VALIDATION: 'validation',
	/** The same request may succeed later, unchanged. */
	RETRYABLE: 'retryable',
	/** The plan does not include the feature. */
	TARIFF: 'tariff',
	/** Nothing the user can do here. */
	FATAL: 'fatal',
});

const TARIFF_CODE_PREFIX = 'TARIFF_';

const CATEGORY_BY_CODE = Object.freeze({
	DATA_VIEW_VALIDATION_FAILED: ERROR_CATEGORY.VALIDATION,
	DATA_VIEW_ROWS_LIMIT_EXCEEDED: ERROR_CATEGORY.VALIDATION,
	DATA_VIEW_RECOMPUTE_IN_PROGRESS: ERROR_CATEGORY.RETRYABLE,
	ACCESS_DENIED: ERROR_CATEGORY.FATAL,
	DATA_VIEW_SOURCE_UNAVAILABLE: ERROR_CATEGORY.FATAL,
});

const GENERAL_FIELD = 'general';

// DTO-01 field vocabulary: the controls the editor can point a validation error at.
const FIELD_CONTROLS = Object.freeze([
	GENERAL_FIELD,
	'sources',
	'columns',
	'joinKeys',
	'period',
	'aggregate',
]);

type MappedError = {
	category: string,
	field?: ?string,
	messageCode: string,
};

/**
 * Classifies a {@see DataViewApiError} by its backend code (ERR-01). Unknown codes — including
 * a missing one — are fatal: an unclassified failure must not look recoverable.
 *
 * `field` is present for the validation category only, and is null when the backend did not
 * point at a specific definition field.
 */
export function mapError(error: ?Object): MappedError
{
	const code = Type.isStringFilled(error?.code) ? error.code : '';
	const messageCode = Type.isStringFilled(error?.messageCode)
		? error.messageCode
		: resolveErrorMessageCode(code)
	;

	const category = resolveCategory(code);
	if (category === ERROR_CATEGORY.VALIDATION)
	{
		// Only a failed validation points at a field; the rows limit is about the period as a whole.
		const field = code === 'DATA_VIEW_VALIDATION_FAILED' ? resolveField(error) : null;

		return { category, field, messageCode };
	}

	return { category, messageCode };
}

function resolveCategory(code: string): string
{
	// Forward-looking: the tariff gate is out of the current scope, so no TARIFF_* code reaches
	// the client yet. The branch keeps the category stable for when the gate lands.
	if (code.startsWith(TARIFF_CODE_PREFIX))
	{
		return ERROR_CATEGORY.TARIFF;
	}

	return CATEGORY_BY_CODE[code] ?? ERROR_CATEGORY.FATAL;
}

function resolveField(error: ?Object): ?string
{
	const field = error?.customData?.field;

	return Type.isStringFilled(field) ? field : null;
}

type FieldError = {
	message: string,
	code: string,
	category: string,
	more: Array<{ message: string, code: string }>,
};

/**
 * Turns the whole errors[] list of a rejected request (DTO-01) into a field-addressed map the
 * editor renders under the matching control. A field routes an error, not its code, so a new
 * validator code lands under its control without a frontend change. The first error of a field
 * wins its control; the rest of that field are kept for diagnostics. An error the backend did not
 * address to a field (access, retryable) is left out — it has no control to sit under.
 */
export function mapErrors(errors: ?Array<Object>): { [string]: FieldError }
{
	const map = {};
	if (!Type.isArrayFilled(errors))
	{
		return map;
	}

	errors.forEach((error) => {
		const field = routeFieldError(error);
		if (field === null)
		{
			return;
		}

		if (Object.hasOwn(map, field))
		{
			map[field].more.push(toDiagnostic(error));

			return;
		}

		map[field] = toFieldError(error);
	});

	return map;
}

function routeFieldError(error: ?Object): ?string
{
	if (Type.isStringFilled(error?.field))
	{
		return FIELD_CONTROLS.includes(error.field) ? error.field : GENERAL_FIELD;
	}

	// No field: keep only what the validator still owns (e.g. the rows limit) under the form banner.
	return mapError(error).category === ERROR_CATEGORY.VALIDATION ? GENERAL_FIELD : null;
}

function toFieldError(error: ?Object): FieldError
{
	return {
		...toDiagnostic(error),
		category: ERROR_CATEGORY.VALIDATION,
		more: [],
	};
}

function toDiagnostic(error: ?Object): { message: string, code: string }
{
	const code = Type.isStringFilled(error?.code) ? error.code : '';
	const message = Type.isStringFilled(error?.message)
		? error.message
		: Loc.getMessage(resolveErrorMessageCode(code))
	;

	return { message, code };
}
