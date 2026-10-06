import {Dom, Tag, Text, Type} from 'main.core';

/**
 * What a type declares about its own text control: everything else (name, placeholder,
 * read-only mode, the insert button) the base field knows about itself and fills in.
 */
export type TextControlOptions = {
	blockClass: string,
	value: string | string[] | null,
	/** A <textarea> instead of an <input>: the value then lives in the node content. */
	multiline?: boolean,
	inputMode?: string,
	/** The input never accepts typing, even in edit mode - a date is picked in the calendar. */
	nonEditable?: boolean,
	/** The wrapper row carries data-testid. False only for `string`, which never had one. */
	rowTestId?: boolean,
	/** Type-owned nodes of the row, placed after the control and before the insert button. */
	rowNodes?: Array<HTMLElement | null>,
};

export type TextControlParams = TextControlOptions & {
	fieldName: string,
	name: string,
	placeholder: string,
	readOnly: boolean,
	selectable: boolean,
	insertButton: HTMLElement | null,
};

/**
 * The rendered-control pair for a control that is one text node in a bordered row: the row is the root,
 * the input is the value node. `control` is the bordered box around the input and is not part
 * of the pair - a type that owns extra nodes inside the box (a calendar button) appends them
 * there and returns the pair as it is.
 */
export type TextControl = {
	root: HTMLElement,
	control: HTMLElement,
	valueNode: HTMLElement,
};

export function buildTextControl(params: TextControlParams): TextControl
{
	const stringValue = toSingleValue(params.value);
	const valueNode = params.multiline === true
		? renderTextarea(params, stringValue)
		: renderInput(params, stringValue);

	if (Type.isStringFilled(params.inputMode))
	{
		Dom.attr(valueNode, 'inputmode', params.inputMode);
	}

	if (params.readOnly || params.nonEditable === true)
	{
		Dom.attr(valueNode, 'readonly', '');
	}

	// The framework class next to the type's own one is what core styles key off, so a rule
	// about the bordered box holds for every type built here and names none of them.
	const control: HTMLElement = Tag.render`
		<div class="bizproc-fields-box ${params.blockClass}${params.readOnly ? ` ${params.blockClass}--readonly` : ''}">
			${valueNode}
		</div>
	`;

	const root = renderRow(params);
	Dom.append(control, root);

	(params.rowNodes ?? []).forEach((node) => {
		if (!Type.isNull(node))
		{
			Dom.append(node, root);
		}
	});

	if (!Type.isNull(params.insertButton))
	{
		Dom.append(params.insertButton, root);
	}

	return {root, control, valueNode};
}

function toSingleValue(value: string | string[] | null): string
{
	return Type.isArray<string>(value) ? (value[0] ?? '') : (value ?? '');
}

function renderInput(params: TextControlParams, stringValue: string): HTMLElement
{
	return Tag.render`
		<input
			type="text"
			class="${params.blockClass}__input"
			name="${Text.encode(params.name)}"
			value="${Text.encode(stringValue)}"
			placeholder="${Text.encode(params.placeholder)}"
			data-role="${selectorRole(params)}"
			data-testid="${Text.encode(`bizproc-field-control-${params.fieldName}`)}"
		/>
	`;
}

function renderTextarea(params: TextControlParams, stringValue: string): HTMLElement
{
	const node: HTMLElement = Tag.render`
		<textarea
			class="${params.blockClass}__input"
			name="${Text.encode(params.name)}"
			placeholder="${Text.encode(params.placeholder)}"
			data-role="${selectorRole(params)}"
			data-testid="${Text.encode(`bizproc-field-control-${params.fieldName}`)}"
		></textarea>
	`;

	// The value lives in the content, not in the `.value` property: the selection decorator
	// deep-clones the node, and cloneNode carries content over but never IDL properties.
	Dom.adjust(node, {text: stringValue});

	return node;
}

function renderRow(params: TextControlParams): HTMLElement
{
	if (params.rowTestId === false)
	{
		return Tag.render`<div class="${params.blockClass}-row"></div>`;
	}

	return Tag.render`
		<div
			class="${params.blockClass}-row"
			data-testid="${Text.encode(`bizproc-field-row-${params.fieldName}`)}"
		></div>
	`;
}

function selectorRole(params: TextControlParams): string
{
	return params.selectable && !params.readOnly ? 'inline-selector-target' : '';
}
