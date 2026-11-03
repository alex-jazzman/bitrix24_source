import { ajax, Text, Type } from 'main.core';

import { type TaskField } from './types';

const TASK_DECISION_EVENT = 'bp-performer-task-decision';

// Appended to the form for this very task, so they say nothing about the decision itself.
const SERVICE_FIELD_NAMES = new Set(['taskId', 'workflowId', 'taskName']);

// The key the values of the fields travel under, and so a name the decision itself cannot carry.
const FIELDS_KEY = 'fields';

// The base types whose control comes with a companion of its own - see {@see companionNames}.
const DATE_BASE_TYPES = new Set(['date', 'datetime']);

// The base type of a field asking for a file - see {@see hasFileField}.
const FILE_BASE_TYPE = 'file';

// The identifiers a value cannot travel to the server under: `hasOwnProperty` shadows the very method
// `BX.ajax.prepareData` walks the object of the values by, and `__proto__` is not kept as a value at all -
// it sets the prototype of that object instead.
const UNSENDABLE_FIELD_IDS = new Set(['__proto__', 'hasOwnProperty']);

export function doTaskAction(
	data: FormData | {},
	slider: BX.SidePanel,
	isLast: boolean,
	taskFields: ?Array<TaskField> = null,
): Promise
{
	BX.SidePanel.Instance.postMessage(window, 'try-do-bp-task-event', { workflowId: data.get('workflowId') });

	return new Promise((resolve, reject) => {
		ajax.runAction('bizproc.task.do', { data })
			.then((response) => {
				if (isLast)
				{
					BX.SidePanel.Instance.postMessage(slider, 'success-do-bp-task-event', { taskName: data.get('taskName') });
				}

				try
				{
					publishTaskDecision(data, slider, taskFields);
				}
				catch
				{
					// a decision nobody could read out of the form is not repeated for a group: the pass
					// hears the step out either way, and the buttons of the task do not stay dead
					publishDecision(data, slider, { taskRequest: null, hasFileFields: false });
				}

				resolve(response);
			})
			.catch((response) => {
				BX.SidePanel.Instance.postMessage(slider, 'error-do-bp-task-event', { workflowId: data.get('workflowId') });
				reject(response);
			});
	});
}

/**
 * EVENT-02: the decision just made, in the shape a group call reads it, so a group pass can repeat it
 * for the tasks like this one.
 */
function publishTaskDecision(data: FormData, slider: BX.SidePanel, taskFields: ?Array<TaskField>): void
{
	publishDecision(data, slider, buildTaskDecision(data, taskFields));
}

/** The decision of the task on the bus of the side panels, whatever it turned out to be. */
function publishDecision(data: FormData, slider: BX.SidePanel, decision: TaskDecision): void
{
	BX.SidePanel.Instance.postMessage(slider, TASK_DECISION_EVENT, {
		taskId: Text.toInteger(data.get('taskId')),
		taskRequest: decision.taskRequest,
		hasFileFields: decision.hasFileFields,
	});
}

export type TaskDecision = {
	taskRequest: ?Object,
	hasFileFields: boolean,
};

/**
 * The decision the form of a single task holds, read out of it: the request a group call may repeat,
 * and whether the form carried a file.
 *
 * The values of the form travel under `fields`, keyed by the identifiers of the fields - that is where
 * the task reads them from when the decision comes for a set of tasks at once. The names of the
 * controls of this form are not those identifiers (a field asking for information is rendered as
 * `bpriact_<id>`), and this very form has them only because the request of a single task carries its
 * whole body: the task then reads the values out of the request of the page. A group call has no such
 * body - its request is about many tasks - so a decision that keeps control names arrives without
 * values at all, and every task of the group is refused for a required field nobody filled.
 *
 * A control the type of a field renders next to the value ({@see companionNames}) has nowhere of its
 * own to travel either, so its value goes inside the value of its field, as `{ value, tz }` - the form
 * `Bitrix\Bizproc\BaseType\Date::internalizeValue` reads. A field of several values carries a record
 * per value, paired by the order the form holds them in. Nothing is computed here: the timezone
 * travels exactly as the form holds it, sentinels (`''` for the time of the server, `current` for the
 * time of the person) included.
 *
 * Files stay in this window: a task that asks for one is not repeated for a group anyway. The base
 * type of the field is what says the task asks for one ({@see hasFileField}) - the value of such a
 * field travels as a string, so the object of a file no longer marks it. Staying here as well is a
 * decision made on a control of a type nobody described here - repeating it would decide the group
 * by another value than the very task the decision was made on ({@see isFieldCompanion}).
 * And so does a decision on a field whose identifier no value can travel to the server under
 * ({@see UNSENDABLE_FIELD_IDS}): the request of the group would lose that field, or never leave the page.
 */
export function buildTaskDecision(formData: FormData, taskFields: ?Array<TaskField>): TaskDecision
{
	const controls = fieldControls(taskFields);
	const companions = companionControls(taskFields);
	const decision = {};
	const fields = {};
	const values = new Map();
	const listFields = new Set();
	const companionValues = new Map();
	let hasFileFields = hasFileField(taskFields);
	let hasUnknown = false;

	for (const [name, value] of formData.entries())
	{
		if (value instanceof File)
		{
			hasFileFields = true;

			continue;
		}

		if (SERVICE_FIELD_NAMES.has(name))
		{
			continue;
		}

		const control = controls.get(name);

		if (control)
		{
			if (control.isFile)
			{
				continue;
			}

			if (UNSENDABLE_FIELD_IDS.has(control.id))
			{
				hasUnknown = true;

				continue;
			}

			pushValue(values, control.id, value);

			if (control.isList)
			{
				listFields.add(control.id);
			}

			continue;
		}

		// a control of the reserved name fills no field of the task, and it must not shadow the values
		if (name === FIELDS_KEY)
		{
			continue;
		}

		const companionId = companions.get(name);

		if (companionId !== undefined)
		{
			if (UNSENDABLE_FIELD_IDS.has(companionId))
			{
				hasUnknown = true;

				continue;
			}

			pushValue(companionValues, companionId, value);

			continue;
		}

		if (isFieldCompanion(name, controls))
		{
			hasUnknown = true;

			continue;
		}

		// the button of the decision, and anything else the form carries on its own
		decision[name] = nextValue(decision, name, value, false);
	}

	// a companion whose field brought no value at all is the same mismatch as a count that differs
	for (const id of companionValues.keys())
	{
		if (!values.has(id))
		{
			hasUnknown = true;
		}
	}

	for (const [id, collected] of values)
	{
		const companion = companionValues.get(id);

		if (companion === undefined)
		{
			fields[id] = listFields.has(id) ? collected : collected[0];

			continue;
		}

		// guessing which value lost its companion would shift a date without a word; the group falls apart instead
		if (companion.length !== collected.length)
		{
			hasUnknown = true;

			continue;
		}

		const paired = collected.map((value, index) => ({ value, tz: companion[index] }));

		fields[id] = listFields.has(id) ? paired : paired[0];
	}

	if (Object.keys(fields).length > 0)
	{
		decision[FIELDS_KEY] = fields;
	}

	return {
		taskRequest: hasUnknown ? null : decision,
		hasFileFields,
	};
}

type FieldControl = {
	id: string,
	isList: boolean,
	isFile: boolean,
};

type NamedFieldControl = {
	id: string,
	name: string,
	isList: boolean,
};

/**
 * The identifier, the name of the control and the multiplicity of a field, as the task and the form
 * know them. A multi-value field is posted under the name with `[]` appended, and its identifier
 * carries that suffix as well - neither belongs to the identifier the task knows the field by.
 */
function fieldControl(field: TaskField): ?NamedFieldControl
{
	const fullId = String(field?.Id ?? '');
	const id = fullId.replace('[]', '');
	const name = String(field?.FieldId ?? fullId).replace('[]', '');

	if (id === '' || name === '')
	{
		return null;
	}

	return { id, name, isList: field?.Multiple === true || fullId.endsWith('[]') };
}

/** The controls of the form by name, each pointing at the field it fills. */
function fieldControls(taskFields: ?Array<TaskField>): Map<string, FieldControl>
{
	const controls = new Map();

	if (!Type.isArrayFilled(taskFields))
	{
		return controls;
	}

	taskFields.forEach((field) => {
		const control = fieldControl(field);

		if (!control)
		{
			return;
		}

		const isFile = fieldBaseType(field) === FILE_BASE_TYPE;

		controls.set(control.name, { id: control.id, isList: control.isList, isFile });
		controls.set(`${control.name}[]`, { id: control.id, isList: true, isFile });
	});

	return controls;
}

/**
 * The type of `Bitrix\Bizproc\BaseType` the server drew the control of a field by, which is what
 * decides the companion controls: an alias of a date (`S:DateTime` of a list, `UF:date` of a custom
 * field) draws the very same select of the timezone. A field assembled without that type - a slider
 * opened before this travelled from the server, or a set built by hand - is read by its own type,
 * as it was read before.
 */
function fieldBaseType(field: TaskField): string
{
	const baseType = String(field?.BaseType ?? '');

	return baseType === '' ? String(field?.Type ?? '') : baseType;
}

/**
 * Whether the task asks for a file at all, by the base type of its fields. An empty field carries no
 * value of the form and a filled one carries a string - a token of an upload or an identifier of an
 * attached file - so the values of the form no longer tell such a field apart.
 */
function hasFileField(taskFields: ?Array<TaskField>): boolean
{
	return (
		Type.isArrayFilled(taskFields)
		&& taskFields.some((field) => fieldBaseType(field) === FILE_BASE_TYPE)
	);
}

/**
 * The controls the type of a field renders next to the value and names after it. One record today: a
 * date carries the timezone of its value in a select of its own (`tz_<control>` of
 * `Bitrix\Bizproc\BaseType\Date::renderControl`, with `[]` appended for a field of several values).
 * A new base type answering the same way is a new record here.
 */
function companionNames(field: TaskField): Array<string>
{
	if (!DATE_BASE_TYPES.has(fieldBaseType(field)))
	{
		return [];
	}

	const control = fieldControl(field);

	if (!control)
	{
		return [];
	}

	return [control.isList ? `tz_${control.name}[]` : `tz_${control.name}`];
}

/** The companion controls of the form by name, each pointing at the identifier of the field its value goes inside. */
function companionControls(taskFields: ?Array<TaskField>): Map<string, string>
{
	const companions = new Map();

	if (!Type.isArrayFilled(taskFields))
	{
		return companions;
	}

	taskFields.forEach((field) => {
		const control = fieldControl(field);

		if (!control)
		{
			return;
		}

		companionNames(field).forEach((name) => companions.set(name, control.id));
	});

	return companions;
}

/**
 * Whether a control of the form carries the name of a field without being the control of it - the
 * control of a type nobody described here. What such a type calls its controls is unknown by
 * definition: a companion is named after the field by a prefix (`tz_<control>`) or a suffix
 * (`<control>_tz`), and a type drawing a value of its own per row of a multiple field numbers them
 * inside the name (`<control>[n0]`, `<control>[n0][VALUE]`). Carrying the name is therefore all this
 * asks for, and a decision made with such a control is not repeated for a group at all: the value it
 * carries has nowhere to travel, and the field it belongs to would reach the group empty.
 *
 * The controls of the described fields never reach here - `fieldControls` answers for the value and
 * `companionControls` for the timezone next to it, both earlier - so the price of asking that little
 * is a decision refused for a group over a control of the form that merely happens to be named after
 * a field.
 */
function isFieldCompanion(name: string, controls: Map<string, FieldControl>): boolean
{
	for (const controlName of controls.keys())
	{
		if (name.includes(controlName))
		{
			return true;
		}
	}

	return false;
}

/** A value appended to the list its key collects, in the order the form holds them. */
function pushValue(collected: Map<string, Array<mixed>>, key: string, value: mixed): void
{
	const list = collected.get(key) ?? [];

	list.push(value);
	collected.set(key, list);
}

/** A value under its key, and a key met more than once holds all of them. */
function nextValue(target: Object, key: string, value: mixed, isList: boolean): mixed
{
	const isKnownKey = Object.hasOwn(target, key);

	if (!isList && !isKnownKey)
	{
		return value;
	}

	const collected = target[key];

	if (Array.isArray(collected))
	{
		return [...collected, value];
	}

	return isKnownKey ? [collected, value] : [value];
}
