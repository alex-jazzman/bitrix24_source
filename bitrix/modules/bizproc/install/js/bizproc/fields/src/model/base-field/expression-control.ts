import {Dom, Loc, Tag, Text, Type} from 'main.core';

/**
 * The row itself, named here because the core finds it back from the companion input when it
 * dims the carrier the value mode left behind.
 */
export const EXPRESSION_ROW_CLASS: string = 'bizproc-fields-expression';

/**
 * What a type declares about the expression row of its field: nothing but the value the
 * companion input shows. The phrase, the read-only mode and the insert button are the same
 * for every type and come from the field itself.
 */
export type ExpressionControlOptions = {
	value: string | string[] | null,
	/**
	 * The companion holds one whole value rather than text typed into it, so an inserted value
	 * replaces what it shows instead of landing at the caret (`data-select-mode`, read by the
	 * inline selector). Declared by the type: a file expression names a group of files and an
	 * expression typed into another one names none, while a plain string takes the caret.
	 */
	writeOver?: boolean,
};

export type ExpressionControlParams = ExpressionControlOptions & {
	fieldName: string,
	readOnly: boolean,
	insertButton: HTMLElement | null,
};

/**
 * The rendered expression row: `node` is the row a type appends below its control, `input` is
 * the companion the expression is typed into - the node the type declares at once as its
 * expression node and as the anchor insertion attaches to.
 */
export type ExpressionControl = {
	node: HTMLElement,
	input: HTMLElement,
};

/**
 * The second line of a field whose own control cannot show an expression: one bordered input
 * filling the row, the `...` button beside it - outside the border, on its bottom edge - and
 * room in the row for the value constructor that will stand next to the button.
 *
 * Unlike the insert row of select, this input is not a stub: it carries the `{fieldName}_text`
 * value of the field, so it is typed into like any other control and the core names it - both
 * the submitted name and the accessible one (see BaseField.#nameExpressionNodes): the phrase
 * needs the field, which the row knows nothing about. The placeholder stays a placeholder, which
 * is a hint about the input and no name for it (WCAG 3.3.2).
 */
export function buildExpressionControl(params: ExpressionControlParams): ExpressionControl
{
	const placeholder = Loc.getMessage('BIZPROC_FIELDS_EXPRESSION_PLACEHOLDER') ?? '';
	const value = Type.isArray<string>(params.value) ? (params.value[0] ?? '') : (params.value ?? '');

	const input: HTMLElement = Tag.render`
		<input
			type="text"
			class="bizproc-fields-expression__input"
			value="${Text.encode(value)}"
			placeholder="${Text.encode(placeholder)}"
			data-role="${params.readOnly ? '' : 'inline-selector-target'}"
			data-testid="${Text.encode(`bizproc-field-expression-${params.fieldName}`)}"
		/>
	`;

	if (params.readOnly)
	{
		Dom.attr(input, 'readonly', '');
	}

	if (params.writeOver === true)
	{
		Dom.attr(input, 'data-select-mode', 'replace');
	}

	const node: HTMLElement = Tag.render`
		<div
			class="${EXPRESSION_ROW_CLASS}${params.readOnly ? ` ${EXPRESSION_ROW_CLASS}--readonly` : ''}"
			data-testid="${Text.encode(`bizproc-field-expression-row-${params.fieldName}`)}"
		>
			${input}
		</div>
	`;

	if (!Type.isNull(params.insertButton))
	{
		Dom.append(params.insertButton, node);
	}

	return {node, input};
}
