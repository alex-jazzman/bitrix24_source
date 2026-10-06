import 'ui.design-tokens';
import 'ui.icon-set.outline';

import './style.css';

import { Tag, Text, Loc, Dom, Event, Type } from 'main.core';
import { Switcher, type SwitcherOptions } from 'ui.switcher';
import { BaseField, FieldRegistry, type RenderedControl } from 'bizproc.fields';

const ROW_SELECTOR: string = '.bizproc-fields-bool-row';
const VALUE_INPUT_SELECTOR: string = '.bizproc-fields-bool__value';

/**
 * Boolean ("yes/no") field type. The control is a `ui.switcher` toggle paired
 * with a hidden `<input>` carrying the 'Y'/'N' value: the hidden input is the value
 * node of the rendered pair, the switcher is its named node. So the core reads and
 * writes the value on the input, while the label and the focus go to the visible
 * toggle the user actually operates.
 */
class BoolField extends BaseField
{
	#switcherByRow: WeakMap<HTMLElement, Switcher> = new WeakMap();

	render(): HTMLElement
	{
		this.#switcherByRow = new WeakMap();

		return super.render();
	}

	renderControl(value: string | string[] | null): RenderedControl
	{
		const name = this.getControlName();
		const readOnly = this.isReadOnly();
		const rawValue = Type.isArray<string>(value) ? (value[0] ?? '') : (value ?? '');
		const on = (rawValue === 'Y');

		const row: HTMLElement = Tag.render`
			<div
				class="bizproc-fields-bool-row"
				data-testid="${Text.encode(`bizproc-field-row-${this.getFieldName()}`)}"
			></div>
		`;

		// The value goes into the attribute, not into the `.value` property alone: the
		// selection decorator replaces the value node with a cloneNode() copy, and
		// cloneNode carries attributes over, not properties. The class is what finds that
		// copy back inside the row.
		const hiddenInput: HTMLInputElement = Tag.render`
			<input
				type="hidden"
				class="bizproc-fields-bool__value"
				name="${Text.encode(name)}"
				value="${on ? 'Y' : 'N'}"
				data-testid="${Text.encode(`bizproc-field-control-${this.getFieldName()}`)}"
			/>
		`;

		// SwitcherOptions types every field as required, but init() treats them as optional.
		const switcherOptions: Partial<SwitcherOptions> = {
			checked: on,
			disabled: readOnly,
			handlers: {
				// Use ONLY the neutral 'toggled' event + isChecked(): ui.switcher's
				// 'checked'/'unchecked' events are inverted (fired for the opposite
				// state), so relying on them would desync the value.
				toggled: (): void => {
					this.#syncControl(row, switcher.isChecked());
					// The value lives in a hidden input written to programmatically, which fires
					// no native change: without this the switch would flip and nobody would hear.
					// Only the user path reaches here - a programmatic write checks the switcher
					// with fireEvents=false and never re-enters this handler.
					this.emitChange();
				},
			},
		};
		const switcher = new Switcher(switcherOptions as SwitcherOptions);

		const switcherNode = switcher.getNode();
		this.#applyAccessibility(switcherNode, switcher, on, readOnly);

		Dom.append(switcherNode, row);
		Dom.append(hiddenInput, row);

		// No anchor is declared: the provider decorates the hidden value node, and its wrapper -
		// the `...` button included - is visible in this very row. So the field's own button is
		// drawn only where no provider takes the insertion over.
		if (this.isSelectable() && !readOnly && !this.decoratesSelection())
		{
			Dom.append(this.renderInsertButton(), row);
		}

		// Keyed by the row, not by the input: the decorator swaps the input for a copy,
		// while the row stays the same node for the whole life of the control.
		this.#switcherByRow.set(row, switcher);

		return {root: row, valueNode: hiddenInput, namedNode: switcherNode};
	}

	// Adds ARIA switch semantics and keyboard support, which a bare ui.switcher node lacks.
	#applyAccessibility(switcherNode: HTMLElement, switcher: Switcher, on: boolean, readOnly: boolean): void
	{
		Dom.attr(switcherNode, 'role', 'switch');
		Dom.attr(switcherNode, 'aria-checked', on);
		// The switcher node is a <span>, which `<label for>` cannot name (only labelable
		// elements are), so the accessible name has to be spelled out here.
		// Dom.attr wraps setAttribute (a DOM API, not an HTML sink): no Text.encode, or the screen reader would read literal entities.
		Dom.attr(switcherNode, 'aria-label', this.#getSwitcherLabel());
		// The switcher node (not the hidden input) is what e2e clicks and what carries the ARIA role.
		Dom.attr(switcherNode, 'data-testid', `bizproc-field-switch-${this.getFieldName()}`);

		if (readOnly)
		{
			// A native `disabled` has no effect on a <div>; aria-disabled announces the locked state to screen readers.
			Dom.attr(switcherNode, 'aria-disabled', 'true');

			return;
		}

		Dom.attr(switcherNode, 'tabindex', '0');
		Event.bind(switcherNode, 'keydown', (event: KeyboardEvent) => {
			if (event.key === ' ' || event.key === 'Spacebar' || event.key === 'Enter')
			{
				event.preventDefault(); // Space would otherwise scroll the page.
				switcher.toggle();
			}
		});
	}

	#getSwitcherLabel(): string
	{
		const name = this.getProperty().Name;

		if (Type.isStringFilled(name))
		{
			return name;
		}

		return Loc.getMessage('BIZPROC_FIELDS_BOOL_LABEL') ?? '';
	}

	// Overridden because the base only writes the hidden input's `.value`; the switcher
	// does not reflect `.value` on its own, so we bridge value -> visual state here.
	protected applyValue(value: string | string[]): void
	{
		super.applyValue(value);

		const nodes = this.getValueNodes();

		if (this.isMultiple())
		{
			const values = Type.isArray<string>(value) ? value : value.split(',');
			nodes.forEach((node, index) => {
				this.#syncFromValueNode(node, values[index] === 'Y');
			});

			return;
		}

		const node = nodes[0];
		if (!Type.isUndefined(node))
		{
			const scalar = Type.isArray<string>(value) ? (value[0] ?? '') : value;
			this.#syncFromValueNode(node, scalar === 'Y');
		}
	}

	#syncFromValueNode(valueNode: HTMLElement, on: boolean): void
	{
		const row = valueNode.closest<HTMLElement>(ROW_SELECTOR);

		if (!Type.isNull(row))
		{
			this.#syncControl(row, on);
		}
	}

	/**
	 * Keeps the hidden input and the switcher on one value. Both are looked up from the
	 * row: the selection decorator replaces the input with a copy of it, so the node
	 * rendered here is not necessarily the live one.
	 */
	#syncControl(row: HTMLElement, on: boolean): void
	{
		const input = row.querySelector<HTMLInputElement>(VALUE_INPUT_SELECTOR);
		if (!Type.isNull(input))
		{
			input.value = on ? 'Y' : 'N';
		}

		const switcher = this.#switcherByRow.get(row);
		if (!Type.isUndefined(switcher))
		{
			// fireEvents=false so this does not re-enter the 'toggled' handler and loop.
			switcher.check(on, false);
			Dom.attr(switcher.getNode(), 'aria-checked', on);
		}
	}
}

FieldRegistry.register('bool', BoolField);

export { BoolField };
