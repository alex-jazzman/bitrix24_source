import {Dom, Event, Reflection, Tag, Text, Type} from 'main.core';
import {type NameBlockPlacementValue, type Property} from '../../const/type';
import {NameBlockPlacement} from '../../const/const';
import {isRequired} from '../../lib/property/property';

import 'ui.hint';
import 'ui.icon-set.outline';

const ADD_BUTTON_CLASS = 'bizproc-fields-multiple__add';
const ADD_BUTTON_SELECTOR = `.${ADD_BUTTON_CLASS}`;
const NAME_INSIDE_MODIFIER = '--name-inside';

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

		// The block is interactive where a type puts it beside a labelable control (bool in its
		// checkbox view): a click on it toggles the flag through the `for` below.
		const block = params.isGroup
			? Tag.render`<legend class="bizproc-fields-header" data-testid="bizproc-field-name-block"></legend>`
			: Tag.render`<label class="bizproc-fields-header" data-testid="bizproc-field-name-block"></label>`;

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

			// A click anywhere inside a `<label for>` activates the control it names, and the hint
			// stands inside the block because that is where the mockup draws it. Left alone, opening
			// the hint of a field whose named node is a native flag (bool in its checkbox view)
			// would toggle the flag and announce a value change the user never asked for. The hint
			// keeps its own click - ui.hint opens on it - and only the activation the label would
			// add on top is taken away.
			if (block.hasAttribute('for'))
			{
				Event.bind(hintNode, 'click', (event: MouseEvent) => event.preventDefault());
			}
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

		const requiredMark = isRequired(property)
			? Tag.render`
				<span
					class="bizproc-fields-label__required"
					aria-hidden="true"
					data-testid="bizproc-field-required-mark"
				>*</span>
			`
			: '';

		return Tag.render`
			<span class="bizproc-fields-label" data-testid="bizproc-field-label">
				${Text.encode(name)}
				${requiredMark}
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
		// Carries the field name so that rows of different fields on one page are told apart; rows
		// of the same field are told apart by their position, the way the row labels number them.
		const row = Tag.render`
			<div
				class="bizproc-fields-multiple__row"
				data-testid="${Text.encode(`bizproc-field-multiple-row-${params.fieldName}`)}"
			></div>
		`;
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
		nameBlockPlacement?: NameBlockPlacementValue,
		expressionRowNode?: HTMLElement | null,
	}): HTMLElement
	{
		const {nameBlockNode, captionNode, controlNode, showLabels, expressionRowNode} = params;
		const isGroup = params.isGroup === true;
		// A group ignores what the type declares: a <legend> names its fieldset only while it is
		// the direct first child of it (WCAG 1.3.1), and there is no control wrapper to move the
		// block into either.
		const nameBlockInsideControlRow = !isGroup
			&& params.nameBlockPlacement === NameBlockPlacement.InsideControlRow;

		if (!showLabels)
		{
			const bareControl = FieldLayout.#wrapControl(controlNode);

			// The one companion of a core-driven multiple stands beside the rows rather than inside
			// one, so nothing else would mount it here: with no name block there is no row to put it
			// behind, and the field would keep its tabs while losing the node the expression travels
			// in. A type drawing its own companion has it inside the control already.
			if (!Type.isNil(expressionRowNode) && !controlNode.contains(expressionRowNode))
			{
				Dom.append(expressionRowNode, bareControl);
			}

			return bareControl;
		}

		// A group of controls is named by <legend>, so it needs a <fieldset>. Same visual
		// treatment as a single field (no frame - the frame belongs to the containing
		// "block", not to the field itself); the modifier class only resets fieldset chrome.
		const row = isGroup
			? Tag.render`
				<fieldset class="bizproc-fields-row bizproc-fields-row--multiple" data-testid="bizproc-field-row"></fieldset>
			`
			: Tag.render`<div class="bizproc-fields-row" data-testid="bizproc-field-row"></div>`;

		const controlHolder = isGroup ? controlNode : FieldLayout.#wrapControl(controlNode);

		// The name block comes first, which for a group is the only place it may go (see above).
		// Where the type asked for it inside the control row it lands in the wrapper instead,
		// behind the control that is already there.
		if (!Type.isNull(nameBlockNode))
		{
			if (nameBlockInsideControlRow)
			{
				// The wrapper turns from a stack into a row, and only the core can say so: a type
				// has no way to select the wrapper that the core renders around its control.
				Dom.addClass(controlHolder, NAME_INSIDE_MODIFIER);
			}

			Dom.append(nameBlockNode, nameBlockInsideControlRow ? controlHolder : row);

			// The mockup draws the expression row below the name, and reading order has to be the
			// visual one (WCAG 1.3.2): the row moves out of the control and behind the name block
			// instead of being ordered back down by CSS, where a screen reader would still meet
			// the nameless companion before the name of the field.
			if (nameBlockInsideControlRow && !Type.isNil(expressionRowNode))
			{
				Dom.append(expressionRowNode, controlHolder);
			}
		}

		Dom.append(controlHolder, row);

		// A group has no control wrapper to move the row into, so the one companion of the field
		// goes into the <fieldset> behind the rows it belongs to. Behind rather than in front:
		// reading order has to be the visual one (WCAG 1.3.2), and the mockup order of a single
		// field - tabs, then the control, then the expression - is what a group repeats.
		if (isGroup && !Type.isNil(expressionRowNode))
		{
			Dom.append(expressionRowNode, row);
		}

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
