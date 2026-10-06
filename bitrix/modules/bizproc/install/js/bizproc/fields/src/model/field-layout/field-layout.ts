import {Dom, Event, Reflection, Tag, Text, Type} from 'main.core';
import {type Property} from '../../const/type';
import {isRequired} from '../../lib/property/property';

import 'ui.hint';
import 'ui.icon-set.outline';

const ADD_BUTTON_CLASS = 'bizproc-fields-multiple__add';
const ADD_BUTTON_SELECTOR = `.${ADD_BUTTON_CLASS}`;

type HintApi = {
	init: (container: HTMLElement) => void,
};

type MultipleRowParams = {
	readOnly: boolean,
	onRemove: (control: HTMLElement) => void,
	removeLabel: string,
	fieldName: string,
};

type MultipleWrapParams = MultipleRowParams & {
	onAddClick: (wrapper: HTMLElement) => void,
	addLabel: string,
};

type NameBlockParams = {
	property: Property,
	isGroup: boolean,
	showDescription: boolean,
	controlId?: string,
};

export function initFieldHints(container: HTMLElement): void
{
	const hint = Reflection.getClass('BX.UI.Hint') as HintApi | null;

	if (!Type.isNull(hint) && Type.isFunction(hint.init))
	{
		hint.init(container);
	}
}

export class FieldLayout
{
	/**
	 * The name block of a field: the name with its required asterisk, then the
	 * description hint. Content, order and classes are the same for every field in
	 * both multiplicity modes; only the shell differs - a <label for> names a single
	 * control, a <legend> names a group.
	 */
	static renderNameBlock(params: NameBlockParams): HTMLElement | null
	{
		const nameNode = FieldLayout.#renderName(params.property);
		const hintNode = params.showDescription ? FieldLayout.#renderDescription(params.property) : null;

		if (Type.isNull(nameNode) && Type.isNull(hintNode))
		{
			return null;
		}

		const block = params.isGroup
			? Tag.render`<legend class="bizproc-fields-header"></legend>`
			: Tag.render`<label class="bizproc-fields-header"></label>`;

		if (!params.isGroup && Type.isStringFilled(params.controlId))
		{
			Dom.attr(block, 'for', params.controlId);
		}

		if (!Type.isNull(nameNode))
		{
			Dom.append(nameNode, block);
		}

		if (!Type.isNull(hintNode))
		{
			Dom.append(hintNode, block);
		}

		return block;
	}

	/**
	 * The name itself. The asterisk belongs to the name, not to the block: it must
	 * stay glued to the name whatever gap the block puts between its own items.
	 */
	static #renderName(property: Property): HTMLElement | null
	{
		const name = property.Name;

		// Whitespace is no name: it would draw a label with nothing to read - the asterisk of a
		// required field standing there alone - while the accessible name falls back to the field
		// name, and the field would be called two different things at once.
		if (!Type.isString(name) || name.trim() === '')
		{
			return null;
		}

		const required = isRequired(property);

		return Tag.render`
			<span class="bizproc-fields-label">
				${Text.encode(name)}
				${required ? Tag.render`<span class="bizproc-fields-label__required" aria-hidden="true">*</span>` : ''}
			</span>
		`;
	}

	static #renderDescription(property: Property): HTMLElement | null
	{
		const description = property.Description;

		if (!description)
		{
			return null;
		}

		return Tag.render`
			<span
				class="ui-hint"
				data-hint="${Text.encode(String(description))}"
				data-testid="bizproc-field-hint"
			></span>
		`;
	}

	static renderCaption(property: Property, captionId?: string): HTMLElement | null
	{
		const description = property.Description;

		if (!description)
		{
			return null;
		}

		const node = Tag.render`<div class="bizproc-fields-caption">${Text.encode(String(description))}</div>`;

		if (captionId)
		{
			Dom.attr(node, 'id', captionId);
		}

		return node;
	}

	static buildMultipleRow(control: HTMLElement, params: MultipleRowParams): HTMLElement
	{
		const row = Tag.render`<div class="bizproc-fields-multiple__row"></div>`;
		Dom.append(control, row);

		if (!params.readOnly)
		{
			const removeButton = Tag.render`
				<button
					type="button"
					class="bizproc-fields-multiple__remove"
					aria-label="${Text.encode(params.removeLabel)}"
					data-testid="${Text.encode(`bizproc-field-remove-${params.fieldName}`)}"
				>
					<div class="ui-icon-set --cross-l"></div>
				</button>
			`;

			Event.bind(removeButton, 'click', () =>
			{
				// Focus lives inside the row being removed, and a detached node drops it to
				// <body> - keyboard and screen-reader users would lose their place in the form.
				// It goes to the Add button of the same group: one point that stays put whichever
				// row was removed, and the action the user is most likely to take next.
				const addButton = row.parentElement?.querySelector<HTMLElement>(ADD_BUTTON_SELECTOR) ?? null;

				row.remove();
				params.onRemove(control);

				if (!Type.isNull(addButton))
				{
					addButton.focus();
				}
			});

			Dom.append(removeButton, row);
		}

		return row;
	}

	static wrapMultiple(controls: HTMLElement[], params: MultipleWrapParams): HTMLElement
	{
		const wrapper = Tag.render`<div class="bizproc-fields-multiple" data-testid="bizproc-field-multiple-wrap"></div>`;

		controls.forEach((ctrl) =>
		{
			Dom.append(FieldLayout.buildMultipleRow(ctrl, params), wrapper);
		});

		if (!params.readOnly)
		{
			const addButton = Tag.render`
				<button type="button" class="${ADD_BUTTON_CLASS}" data-testid="bizproc-field-clone-btn">
					<div class="ui-icon-set --plus-l"></div>
					<span>${Text.encode(params.addLabel)}</span>
				</button>
			`;

			Event.bind(addButton, 'click', () =>
			{
				params.onAddClick(wrapper);
			});

			Dom.append(addButton, wrapper);
		}

		return wrapper;
	}

	static assemble(params: {
		nameBlockNode: HTMLElement | null,
		captionNode?: HTMLElement | null,
		controlNode: HTMLElement,
		showLabels: boolean,
		isGroup?: boolean,
	}): HTMLElement
	{
		const {nameBlockNode, captionNode, controlNode, showLabels} = params;
		const isGroup = params.isGroup === true;

		if (!showLabels)
		{
			return FieldLayout.#wrapControl(controlNode);
		}

		// A group of controls is named by <legend>, so it needs a <fieldset>. Same visual
		// treatment as a single field (no frame - the frame belongs to the containing
		// "block", not to the field itself); the modifier class only resets fieldset chrome.
		const row = isGroup
			? Tag.render`
				<fieldset class="bizproc-fields-row bizproc-fields-row--multiple" data-testid="bizproc-field-row"></fieldset>
			`
			: Tag.render`<div class="bizproc-fields-row" data-testid="bizproc-field-row"></div>`;

		// The name block comes first: a <legend> names its group only while it is the
		// fieldset's direct first child (WCAG 1.3.1).
		if (!Type.isNull(nameBlockNode))
		{
			Dom.append(nameBlockNode, row);
		}

		Dom.append(isGroup ? controlNode : FieldLayout.#wrapControl(controlNode), row);

		if (!Type.isNil(captionNode))
		{
			Dom.append(captionNode, row);
		}

		return row;
	}

	static #wrapControl(controlNode: HTMLElement): HTMLElement
	{
		return Tag.render`
			<div class="bizproc-fields-control-wrap" data-testid="bizproc-field-control-wrap">
				${controlNode}
			</div>
		`;
	}
}
