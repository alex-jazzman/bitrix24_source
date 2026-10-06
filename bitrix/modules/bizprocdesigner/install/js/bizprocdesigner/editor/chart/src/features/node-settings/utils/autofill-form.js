import { ajax, Type } from 'main.core';

/**
 * DOM helpers for the legacy activity settings form used by relation autofill.
 * The utility knows only about the form DOM — never about the store or the diagram.
 * Reading reuses ajax.prepareForm (the same path the rest of the form relies on), so
 * emptiness detection matches what the backend will later receive; writing repeats the
 * single existing pattern in the codebase (el.value = expr; dispatch a 'change' event).
 */

function readFormData(form: HTMLFormElement): Object
{
	return ajax.prepareForm(form).data;
}

/**
 * Locates the control for a field code, matching both the scalar `name` and the Multiple `name[]`
 * shape. Single source of the field lookup, shared by hasField/setFieldValue here and the
 * required-field UI in edit-extended-action (locateFieldInput).
 */
export function locateField(form: ?HTMLFormElement, fieldCode: string): HTMLElement | null
{
	if (!form || !Type.isStringFilled(fieldCode))
	{
		return null;
	}

	const escaped = CSS.escape(fieldCode);

	return form.querySelector(`[name="${escaped}"]`)
		?? form.querySelector(`[name="${escaped}[]"]`)
		?? null;
}

/**
 * True when the form actually exposes a control for the given field code.
 */
export function hasField(form: ?HTMLFormElement, fieldCode: string): boolean
{
	return locateField(form, fieldCode) !== null;
}

/**
 * Single-value emptiness: the criterion validateForm uses (`!value || trimmed string is empty`),
 * extended with Multiple (array) fields. An absent key is `undefined`, which counts as empty.
 */
function isValueEmpty(value: mixed): boolean
{
	if (Array.isArray(value))
	{
		return value.length === 0;
	}

	return !value || (Type.isString(value) && value.trim() === '');
}

/**
 * A field is empty when BOTH its main control (`fieldCode`) and its paired expression control
 * (`fieldCode_text`, where a bizproc expression lives) are empty. This mirrors the server, which
 * reads `fieldCode_text` as the expression only while the main control is empty (Base::extractValue).
 * Conservative by design: an unknown main control (absent from the prepared form data) is treated as
 * NOT empty, so autofill never touches an unrecognized control shape; a missing `_text` key counts as
 * empty, so plain fields without an expression control stay unaffected.
 *
 * Callers looping over many fields can pass a pre-taken form snapshot (readFormData/snapshotValues)
 * to avoid re-running ajax.prepareForm per field; omitting it keeps the original single-field behaviour.
 */
export function isFieldEmpty(form: ?HTMLFormElement, fieldCode: string, snapshot: ?Object = null): boolean
{
	if (!form || !Type.isStringFilled(fieldCode))
	{
		return false;
	}

	const data = snapshot ?? readFormData(form);
	if (!(fieldCode in data))
	{
		return false;
	}

	return isValueEmpty(data[fieldCode]) && isValueEmpty(data[`${fieldCode}_text`]);
}

/**
 * Locates the control that must RECEIVE a bizproc expression for a field code. The expression belongs
 * to the paired expression control `fieldCode_text` (a textarea rendered by Base::renderControlSelector
 * in text mode), not to the main entity control. Falls back to the main control (locateField) for plain
 * fields and the single-control 'combine' mode, which expose no `_text`. Escapes the field code the same
 * way locateField does.
 */
export function locateValueTarget(form: ?HTMLFormElement, fieldCode: string): HTMLElement | null
{
	if (!form || !Type.isStringFilled(fieldCode))
	{
		return null;
	}

	const escaped = CSS.escape(fieldCode);

	return form.querySelector(`[name="${escaped}_text"]`) ?? locateField(form, fieldCode);
}

/**
 * Writes a scalar expression into a form field's expression control and notifies listeners, repeating
 * the only existing write pattern in the codebase. Non-string values are skipped on purpose: the legacy
 * scalar-input pattern cannot safely populate multiple-value controls.
 */
export function setFieldValue(form: ?HTMLFormElement, fieldCode: string, value: mixed): boolean
{
	if (!form || !Type.isString(value))
	{
		return false;
	}

	const field = locateValueTarget(form, fieldCode);
	if (!field)
	{
		return false;
	}

	field.value = value;
	// Local (non-bubbling) change: notifies the control itself (e.g. its own inline required-error
	// clear listener) without waking the form-level FormInputTracker on every write. Mass callers
	// (fillEmptyFields / recompute) fire the form-level reaction once after the whole pass, so a
	// batch autofill triggers O(1) rawActivityData rebuilds instead of O(fields).
	field.dispatchEvent(new window.Event('change'));

	return true;
}

/**
 * Snapshot of the current form values via ajax.prepareForm. Session-only; it is
 * never serialized to the server.
 */
export function snapshotValues(form: ?HTMLFormElement): Object
{
	if (!form)
	{
		return {};
	}

	return { ...readFormData(form) };
}

/**
 * Writes each [fieldCode, expr] pair into the form, but only where the field exists and is
 * empty, returning the codes actually filled. Shared by apply-on-select and session
 * restore so the "empty-only" invariant lives in a single place.
 */
export function fillEmptyFields(form: ?HTMLFormElement, values: ?Object): Array<string>
{
	const filled = [];
	if (!form || !Type.isPlainObject(values))
	{
		return filled;
	}

	// One prepareForm snapshot for the whole pass: each field is written at most once and never
	// re-read, so a single snapshot stays valid while avoiding the per-field O(controls) rescan.
	const snapshot = readFormData(form);

	for (const [fieldCode, expr] of Object.entries(values))
	{
		if (!hasField(form, fieldCode) || !isFieldEmpty(form, fieldCode, snapshot))
		{
			continue;
		}

		if (setFieldValue(form, fieldCode, expr))
		{
			filled.push(fieldCode);
		}
	}

	// One form-level reaction for the whole batch: each setFieldValue above fired only a local
	// change, so wake the form-level FormInputTracker once here instead of once per filled field.
	// bubbles so it also reaches a tracker bound on the form's ancestor (legacy property-dialog
	// container). Skipped when nothing was written, matching the pre-batch "no write, no change".
	if (filled.length > 0)
	{
		form.dispatchEvent(new window.Event('change', { bubbles: true }));
	}

	return filled;
}
