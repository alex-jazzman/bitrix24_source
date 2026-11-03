import 'ui.design-tokens';
import 'ui.icon-set.outline';

import './style.css';

import { Tag, Text, Loc, Dom, Event, Type } from 'main.core';
import { Switcher, SwitcherSize, type SwitcherOptions } from 'ui.switcher';
import { Checkbox, CheckboxSize } from 'ui.system.checkbox';
import {
	BaseField,
	BoolView,
	FieldRegistry,
	NameBlockPlacement,
	RenderMode,
	ValueMode,
	isExpressionValue,
	readBoolView,
	type FieldValueState,
	type NameBlockPlacementValue,
	type RenderedControl,
	type ValueModeValue,
} from 'bizproc.fields';

const ROW_CLASS: string = 'bizproc-fields-bool-row';
const ROW_SELECTOR: string = `.${ROW_CLASS}`;
const CHECKBOX_ROW_MODIFIER: string = 'bizproc-fields-bool-row--checkbox';
const VALUE_INPUT_SELECTOR: string = '.bizproc-fields-bool__value';
/** The switcher node as this type's own, so its faded state is styled without reaching for `.ui-switcher`. */
const SWITCH_CLASS: string = 'bizproc-fields-bool__switch';
/**
 * The native flag inside the design-system component. Asked for by its own semantics rather than
 * by the class the component draws it with: the internal classes of a design-system component are
 * not part of its API.
 */
const NATIVE_CHECKBOX_SELECTOR: string = 'input[type="checkbox"]';

/**
 * The visible control of one row, whichever view drew it - a toggle or a flag. Both are objects
 * of a design-system extension with a lifetime of their own, so the type keeps them behind one
 * shape: the value is written through setChecked(), read back through isChecked(), and release()
 * lets go through destroy().
 */
type ToggleControl = {
	setChecked: (on: boolean) => void,
	isChecked: () => boolean,
	destroy: () => void,
};

/**
 * What the flag of the design system hands its onChange callback. Typed down to the one thing
 * needed from the native event it carries: `Event` in this file is the main.core helper, so the
 * DOM event has no name left to be annotated by - the same collision that has the core dispatch
 * through `globalThis.Event`.
 */
type CheckboxChange = {
	checked: boolean,
	// Optional because the component types its callback as a bare `Function`: it passes the event
	// from every path it has today, but nothing in the contract holds it to that.
	event?: { stopPropagation: () => void },
};

/**
 * Boolean ("yes/no") field type. In its default view the control is a `ui.switcher` toggle paired
 * with a hidden `<input>` carrying the 'Y'/'N' value: the hidden input is the value
 * node of the rendered pair, the switcher is its named node. So the core reads and
 * writes the value on the input, while the label and the focus go to the visible
 * toggle the user actually operates.
 *
 * A toggle shows no expression, so where the field may hold one the type puts the shared
 * expression row below it and declares its companion input at once as the expression node
 * and as the insert anchor - the `...` button belongs to that row, not beside the toggle.
 *
 * The two then stand side by side as the two ways of filling the field, and the core puts its
 * tabs above them: the toggle carries the value in the one mode, the companion in the other, and
 * the node of the mode standing quiet is emptied rather than kept - see applyValue().
 *
 * The property may ask for the other view of the field instead (see readBoolView): a flag with
 * its name beside it. There the control is the checkbox of the design system, the field is filled
 * that one way alone, and neither the tabs nor the expression row are drawn.
 */
class BoolField extends BaseField
{
	#controlByRow: WeakMap<HTMLElement, ToggleControl> = new WeakMap();
	// A WeakMap cannot be walked, so release() gets the controls of the current render from here.
	#controls: ToggleControl[] = [];

	/**
	 * A switch and a flag both name themselves to their right, so the name block goes into the
	 * control row behind the control instead of standing above it. In the checkbox view that
	 * block is the caption of the flag, and a `<label for>` is what has a click on it toggle
	 * the flag - which is why the named node there is the native checkbox.
	 */
	getNameBlockPlacement(): NameBlockPlacementValue
	{
		return NameBlockPlacement.InsideControlRow;
	}

	/**
	 * A toggle is on or off and shows nothing else, so an expression cannot live inside the control
	 * itself: the field is filled either by the toggle or by the companion beside it, and the two
	 * are what the tabs of the core switch between. The labels are the base ones - they name this
	 * very toggle.
	 *
	 * The checkbox view offers no such pair: the mockup draws a flag with a caption and nothing
	 * else, and one answer here takes away both the tabs and the expression row (see
	 * BaseField.renderExpressionControl).
	 *
	 * Neither does the live document, whatever AllowSelection says there: this is the form a person
	 * fills in rather than the designer, and a tab offering to type an expression into it means
	 * nothing to them. The same rule the backend keeps for this very type, unconditionally
	 * (BoolType::renderControlSingle switches $allowSelection off in the public render mode), and
	 * the same one select keeps on this side.
	 *
	 * A multiple field is offered the pair too, and the companion there is one for the whole field:
	 * the core puts it beside the group of rows instead of into each of them, because a field
	 * carries exactly one expression whatever its multiplicity - it travels under the plain
	 * `{name}_text`. So this answer says nothing about multiplicity; where the one companion goes
	 * is the core's business (see BaseField.hasSharedExpressionRow).
	 */
	supportsExpressionMode(): boolean
	{
		return !this.#showsCheckbox() && this.getRenderMode() !== RenderMode.Public;
	}

	/**
	 * Insertion has nowhere to go here but the companion of the expression row, so the permission
	 * follows the declaration of the modes. Without this the decorator falls back to wrapping the
	 * value node (see applySelectionDecorator), and that node holds strictly Y/N: the field would get
	 * an insert button the mockup does not draw, an inserted expression would land in the node that
	 * travels under the plain field name, and BoolType::extractValue would answer with
	 * BPDT_BOOL_INVALID over a control showing a perfectly valid state.
	 *
	 * Asked inside renderExpressionControl() under a true supportsExpressionMode(), so the rule
	 * "the field draws no button of its own where the provider brought one" is unchanged.
	 *
	 * A field whose companion is the shared one answers no for the same reason: its rows have no
	 * companion to anchor at, so the decorator would fall back to the value node of every row -
	 * one `...` button per row over nodes holding strictly Y/N. That leaves the row itself out of
	 * this answer, not out of insertion: it is asked about on its own below.
	 */
	decoratesSelection(): boolean
	{
		return this.supportsExpressionMode()
			&& !this.hasSharedExpressionRow()
			&& super.decoratesSelection();
	}

	/**
	 * The one companion of a multiple is the same text input a single field carries, so the
	 * provider takes insertion over there by the same rule. The clause above that keeps it off
	 * the Y/N rows is what is deliberately missing here: this row is the field's only carrier of
	 * an expression, and the rows it stands beside are untouched either way.
	 */
	protected decoratesSharedExpressionRow(): boolean
	{
		return this.supportsExpressionMode() && super.decoratesSelection();
	}

	/**
	 * ui.switcher keeps every instance in a static list and the checkbox holds handlers of its
	 * own, so the controls of the render being dropped have to be destroyed here or they hold
	 * their nodes forever. The collections are recreated at the end of this, not in render():
	 * the base render() calls release() first, so a reset done before super.render() would leave
	 * nothing to free.
	 */
	protected release(): void
	{
		this.#controls.forEach((control) => control.destroy());
		this.#controls = [];
		this.#controlByRow = new WeakMap();
	}

	/**
	 * The same letting go for one row: release() answers for a redraw, which drops every row at
	 * once, while a row removed by hand leaves the field alive. Without this its switcher would
	 * stay in the static list ui.switcher keeps and hold its detached node with it, and repeating
	 * "add, remove" would grow that list without bound.
	 */
	protected releaseRow(valueNode: HTMLElement): void
	{
		const row = valueNode.closest<HTMLElement>(ROW_SELECTOR);

		if (Type.isNull(row))
		{
			return;
		}

		const control = this.#controlByRow.get(row);

		if (Type.isUndefined(control))
		{
			return;
		}

		control.destroy();
		this.#controlByRow.delete(row);
		this.#controls = this.#controls.filter((item) => item !== control);
	}

	renderControl(value: string | string[] | null): RenderedControl
	{
		const rawValue = Type.isArray<string>(value) ? (value[0] ?? '') : (value ?? '');

		return this.#showsCheckbox()
			? this.#renderCheckboxControl(rawValue)
			: this.#renderSwitcherControl(rawValue);
	}

	#renderSwitcherControl(rawValue: string): RenderedControl
	{
		const readOnly = this.isReadOnly();
		// An expression is no boolean: it travels in the companion input and the value node is left
		// empty, which is what has the backend read it back from `{fieldName}_text` - its
		// extractValueSingle falls back to the companion only for an empty value. The same split
		// Base::renderControlSingle does.
		const expressionValue = isExpressionValue(rawValue) ? rawValue : '';
		const expression = this.renderExpressionControl({ value: expressionValue });
		// Only where the row is actually there: a field that inserts nothing keeps reading the value
		// the way it always has, expression or not.
		const holdsExpression = !Type.isNull(expression) && expressionValue !== '';
		const on = (rawValue === 'Y');
		// Redrawn in the expression mode, the pair has to come back the way the mode left it: the
		// companion filled and the value node empty. Writing the usual 'N' here would fill both,
		// and the backend, reading `{name}_text` only for an empty value, would never reach the
		// expression again. A redraw is not rare - applyProperty re-renders on every property change.
		const carriesValue = !holdsExpression && this.#toggleIsCarrier();

		const row = this.#renderRow();
		const hiddenInput = this.#renderValueInput(carriesValue ? (on ? 'Y' : 'N') : '');

		// SwitcherOptions types every field as required, but init() treats them as optional.
		const switcherOptions: Partial<SwitcherOptions> = {
			checked: on,
			disabled: readOnly,
			// Air at md is the mockup toggle to the pixel (30x15 with an 11px cursor), so the
			// field needs no sizing of its own. The node structure is the same in both designs,
			// which is what lets the ARIA and keyboard wiring below stay as it is.
			useAirDesign: true,
			size: SwitcherSize.medium,
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
		Dom.addClass(switcherNode, SWITCH_CLASS);
		this.#applyAccessibility(switcherNode, switcher, on, readOnly);

		Dom.append(switcherNode, row);
		Dom.append(hiddenInput, row);

		this.#trackControl(row, {
			setChecked: (checked: boolean): void => {
				// fireEvents=false so this does not re-enter the 'toggled' handler and loop.
				switcher.check(checked, false);
				Dom.attr(switcherNode, 'aria-checked', checked);
			},
			isChecked: (): boolean => switcher.isChecked(),
			destroy: (): void => switcher.destroy(),
		});

		if (Type.isNull(expression))
		{
			return {root: row, valueNode: hiddenInput, namedNode: switcherNode};
		}

		Dom.append(expression.node, row);

		return {
			root: row,
			valueNode: hiddenInput,
			namedNode: switcherNode,
			expressionNode: expression.input,
			// Insertion attaches to the companion, which is also where the `...` button of the row
			// comes from: anchored at the hidden input it would put the button back beside the
			// toggle and write inserted values into the node that holds strictly Y/N.
			insertAnchor: expression.input,
		};
	}

	/**
	 * The other view of the field: the flag of the design system with the name block of the core
	 * standing beside it as its caption. The type renders no caption of its own - the block is the
	 * one the core builds and places (NameBlockPlacement.InsideControlRow), so the field keeps the
	 * asterisk of a required one and the hint of a described one, exactly as every other type does.
	 *
	 * The named node is the native `<input type="checkbox">` inside the component: `<label for>` of
	 * the caption may only point at a labelable element, and it is that linkage - not a handler of
	 * ours - that has a click on the caption toggle the flag. The value stays where it is in the
	 * toggle view, on the hidden input beside the control.
	 *
	 * No ARIA is added here beyond the name: a native checkbox carries its role, its state and its
	 * keyboard itself, and its name is the one thing it takes from outside - see #nameFlag().
	 */
	#renderCheckboxControl(rawValue: string): RenderedControl
	{
		const on = (rawValue === 'Y');

		const row = this.#renderRow();
		Dom.addClass(row, CHECKBOX_ROW_MODIFIER);

		const hiddenInput = this.#renderValueInput(on ? 'Y' : 'N');

		const checkbox = new Checkbox({
			// md is the 18x18 box of the mockup, so the field sizes nothing itself.
			size: CheckboxSize.Md,
			checked: on,
			// A native flag takes the native lock, unlike the switch of the other view: there a
			// `disabled` has no effect on the <span> the switch is drawn as, which is why that view
			// announces the lock through aria-disabled and keeps its stop in the tab order instead.
			disabled: this.isReadOnly(),
			attributes: {
				'data-testid': `bizproc-field-checkbox-${this.getFieldName()}`,
			},
			onChange: ({event}: CheckboxChange): void => {
				this.#syncControl(row, checkbox.isChecked());
				// Unlike the switch, the flag fires a native change of its own, and from inside the
				// field: left to bubble it would reach a consumer beside the one emitChange() sends
				// from the root, and one click would be heard as two changes. Stopped here rather
				// than dropping emitChange(), so both views announce a change the one way - from
				// the root, once the hidden input carrying the value has been written.
				event?.stopPropagation();
				this.emitChange();
			},
		});

		const checkboxNode = checkbox.render();
		// Guaranteed by the component: render() builds the native input first and wraps it.
		const nativeInput = checkboxNode.querySelector<HTMLInputElement>(NATIVE_CHECKBOX_SELECTOR)!;
		this.#nameFlag(nativeInput);

		Dom.append(checkboxNode, row);
		Dom.append(hiddenInput, row);

		this.#trackControl(row, {
			setChecked: (checked: boolean): void => {
				checkbox.setChecked(checked);
			},
			isChecked: (): boolean => checkbox.isChecked(),
			destroy: (): void => checkbox.destroy(),
		});

		return {root: row, valueNode: hiddenInput, namedNode: nativeInput};
	}

	#renderRow(): HTMLElement
	{
		return Tag.render`
			<div
				class="${ROW_CLASS}"
				data-testid="${Text.encode(`bizproc-field-row-${this.getFieldName()}`)}"
			></div>
		`;
	}

	/**
	 * The node the value is read off and written to, the same one in both views. The value goes
	 * into the attribute, not into the `.value` property alone, so a copy of the node carries it
	 * (cloneNode carries attributes over, not properties). The class is what finds the input back
	 * inside its row.
	 */
	#renderValueInput(value: string): HTMLInputElement
	{
		return Tag.render`
			<input
				type="hidden"
				class="bizproc-fields-bool__value"
				name="${Text.encode(this.getControlName())}"
				value="${value}"
				data-testid="${Text.encode(`bizproc-field-control-${this.getFieldName()}`)}"
			/>
		`;
	}

	/**
	 * Takes the control of one row into both collections. Keyed by the row, not by the input: the
	 * row stays the same node for the whole life of the control, whatever the selection decorator
	 * replaces inside it.
	 */
	#trackControl(row: HTMLElement, control: ToggleControl): void
	{
		this.#controlByRow.set(row, control);
		this.#controls.push(control);
	}

	#showsCheckbox(): boolean
	{
		return readBoolView(this.getProperty()) === BoolView.Checkbox;
	}

	// Adds ARIA switch semantics and keyboard support, which a bare ui.switcher node lacks.
	#applyAccessibility(switcherNode: HTMLElement, switcher: Switcher, on: boolean, readOnly: boolean): void
	{
		Dom.attr(switcherNode, 'role', 'switch');
		Dom.attr(switcherNode, 'aria-checked', on);
		// The switcher node is a <span>, which `<label for>` cannot name (only labelable
		// elements are), so the accessible name has to be spelled out here.
		// Dom.attr wraps setAttribute (a DOM API, not an HTML sink): no Text.encode, or the screen reader would read literal entities.
		Dom.attr(switcherNode, 'aria-label', this.#getControlLabel());
		// The switcher node (not the hidden input) is what e2e clicks and what carries the ARIA role.
		Dom.attr(switcherNode, 'data-testid', `bizproc-field-switch-${this.getFieldName()}`);
		this.#hideSwitcherContents(switcherNode);

		// Read-only is one thing across the whole field: the expression row of a read-only field
		// stays in the tab order too (it holds an expression that has to stay readable), and a
		// toggle left out of it would be the one control whose state a keyboard user cannot read
		// at all. So it stays focusable and announces itself locked, and only the keys that would
		// change it are not bound - `aria-disabled` rather than `disabled` is what allows that.
		Dom.attr(switcherNode, 'tabindex', '0');

		if (readOnly)
		{
			// A native `disabled` has no effect on a <span>; aria-disabled announces the locked
			// state to screen readers.
			Dom.attr(switcherNode, 'aria-disabled', 'true');

			return;
		}

		Event.bind(switcherNode, 'keydown', (event: KeyboardEvent) => {
			if (event.key === ' ' || event.key === 'Spacebar' || event.key === 'Enter')
			{
				event.preventDefault(); // Space would otherwise scroll the page.
				switcher.toggle();
			}
		});
	}

	/**
	 * Takes what the component draws inside the toggle out of the accessibility tree: the on and
	 * off captions are both in the node at once, and a `role="switch"` takes its name from its
	 * contents, so a screen reader reads "on off" over the name and the state it already announced
	 * through aria-checked (WCAG 4.1.2). Every child is hidden rather than the captions by their
	 * classes: the internals of a design-system component are not part of its API, and none of them
	 * is anything but decoration once the switch is named and its state is announced.
	 */
	#hideSwitcherContents(switcherNode: HTMLElement): void
	{
		Array.from(switcherNode.children).forEach((child: Element) => {
			Dom.attr(child as HTMLElement, 'aria-hidden', 'true');
		});
	}

	/**
	 * Names the flag where the caption beside it will not. The caption is the name block of the
	 * core, and the core draws it only with the labels shown and a name to put into it - a block
	 * built for a hint alone holds no text and names nothing either. Missing it, the flag is
	 * announced as "checkbox, unchecked" and nothing more (WCAG 4.1.2, 1.3.1), which is the very
	 * case the toggle already covers with a label of its own.
	 *
	 * Left alone where the caption is there: an aria-label wins over the text of the `<label for>`,
	 * so naming both would name the field twice and let the two names drift apart.
	 *
	 * Dom.attr wraps setAttribute (a DOM API, not an HTML sink): no Text.encode, or the screen
	 * reader would read literal entities.
	 */
	#nameFlag(nativeInput: HTMLInputElement): void
	{
		if (this.showsLabels() && Type.isStringFilled(this.#getPropertyName()))
		{
			return;
		}

		Dom.attr(nativeInput, 'aria-label', this.#getControlLabel());
	}

	/** What names the visible control of the field where nothing on screen does. */
	#getControlLabel(): string
	{
		const name = this.#getPropertyName();

		if (Type.isStringFilled(name))
		{
			return name;
		}

		return Loc.getMessage('BIZPROC_FIELDS_BOOL_LABEL') ?? '';
	}

	/**
	 * The name of the property, trimmed the way the core trims it for its own accessible name and
	 * for the name block: whitespace draws no caption and names nobody, so it has to fall through
	 * to the default phrase instead of ending up in an aria-label assistive technologies discard.
	 */
	#getPropertyName(): string
	{
		const name = this.getProperty().Name;

		return Type.isString(name) ? name.trim() : '';
	}

	/**
	 * Overridden because the value node answers for the field only while the toggle carries it. In
	 * the expression mode nobody writes that node (see applyValue), so a write that reached the
	 * field there moved the toggle alone - and the base, reading the snapshot off the node, would
	 * take the emptiness instead. Carried back through setValue() that emptiness puts the toggle
	 * out, and the redraw of the very next applyProperty() loses the last write the field received:
	 * the user returns to the toggle tab and saves 'N' over a programmatic 'Y'.
	 *
	 * A toggle is never empty - it stands on or off whatever the mode did - so where the node holds
	 * nothing by construction, what the control shows is what the snapshot takes. The value node
	 * stays out of it either way: applyValue() still skips the write in this mode, and the redraw
	 * seeds the node empty (see #renderSwitcherControl), so the backend keeps reading the companion.
	 */
	getValueState(): FieldValueState
	{
		const state = super.getValueState();

		if (this.#toggleIsCarrier())
		{
			return state;
		}

		const shown = this.#readControlState();

		return Type.isNull(shown) ? state : { ...state, value: shown };
	}

	/**
	 * Y/N as the controls of the field stand now, shaped the way getValue() shapes its answer - a
	 * multiple answers per row, because there the one expression stands against all of them and
	 * every row has a toggle of its own to come back to. Null before a render put any control
	 * there: then the base answers, rather than this inventing an "N" nothing shows.
	 */
	#readControlState(): string | string[] | null
	{
		const rows = this.getValueNodes().map((valueNode) => valueNode.closest<HTMLElement>(ROW_SELECTOR));

		if (rows.length === 0)
		{
			return null;
		}

		const states = rows.map((row) => (!Type.isNull(row) && this.#controlIsChecked(row) ? 'Y' : 'N'));

		return this.isMultiple() ? states : states[0]!;
	}

	/**
	 * Overridden because the base only writes the hidden input's `.value`; neither the toggle nor
	 * the flag reflects `.value` on its own, so we bridge value -> visual state here.
	 *
	 * The write itself happens only while the toggle is the carrier. Every other path calls this
	 * one - setValue() does, and applyProperty() does twice around a redraw - so an unconditional
	 * write would put an 'N' back into a value node the expression mode requires empty, and the
	 * backend would stop reading the companion.
	 */
	protected applyValue(value: string | string[]): void
	{
		if (this.#toggleIsCarrier())
		{
			super.applyValue(value);
		}

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

	/**
	 * A toggle is never empty - it stands on or off whatever the mode did - so when it becomes the
	 * carrier again the state it shows has to be the value the field carries. The core gives back
	 * what the value node had stashed, and a field rendered straight into the expression mode
	 * stashed nothing there: without this both carriers would be left empty, the toggle showing
	 * "off" while the field carried no value at all (the backend reads that as "not set", not as
	 * "No"), and the next redraw would put an 'N' in behind the user's back.
	 *
	 * Written whatever the value node came back holding, and read off the control rather than assumed
	 * 'N'. What the core gives back is what the node held when the mode left it, and that can be older
	 * than the control: in the expression mode nobody writes the value node (applyValue skips
	 * super.applyValue there), so a write that reached the field then moved the toggle alone. Letting
	 * the stashed value win would leave the toggle showing "on" over a field carrying 'N'. Where the
	 * two agree - every other path here - the write changes nothing, and a row added in the expression
	 * mode, which stashed nothing at all, gets the state it shows instead of staying empty.
	 */
	protected onValueModeChanged(mode: ValueModeValue): void
	{
		if (mode !== ValueMode.Value)
		{
			return;
		}

		this.getValueNodes().forEach((valueNode) => {
			const row = valueNode.closest<HTMLElement>(ROW_SELECTOR);

			if (!Type.isNull(row))
			{
				this.#syncControl(row, this.#controlIsChecked(row));
			}
		});
	}

	/** Whether the toggle is the carrier of the field now, as opposed to the companion beside it. */
	#toggleIsCarrier(): boolean
	{
		return this.getValueMode() === ValueMode.Value;
	}

	/** What the visible control of this row shows now. A row whose control is gone shows nothing. */
	#controlIsChecked(row: HTMLElement): boolean
	{
		const control = this.#controlByRow.get(row);

		return !Type.isUndefined(control) && control.isChecked();
	}

	#syncFromValueNode(valueNode: HTMLElement, on: boolean): void
	{
		const row = valueNode.closest<HTMLElement>(ROW_SELECTOR);

		if (Type.isNull(row))
		{
			return;
		}

		if (this.#toggleIsCarrier())
		{
			this.#syncControl(row, on);

			return;
		}

		// The quiet carrier still shows where it stands, it just holds no value while it does.
		this.#syncToggle(row, on);
	}

	/**
	 * Keeps the hidden input and the visible control on one value. Both are looked up from the row,
	 * which is what tells the pairs of a multiple apart: a field renders one row per value and
	 * the control of a row has to follow the input of that same row.
	 */
	#syncControl(row: HTMLElement, on: boolean): void
	{
		const input = row.querySelector<HTMLInputElement>(VALUE_INPUT_SELECTOR);
		if (!Type.isNull(input))
		{
			input.value = on ? 'Y' : 'N';
		}

		this.#syncToggle(row, on);
	}

	#syncToggle(row: HTMLElement, on: boolean): void
	{
		const control = this.#controlByRow.get(row);

		if (Type.isUndefined(control))
		{
			return;
		}

		control.setChecked(on);
	}
}

FieldRegistry.register('bool', BoolField);

export { BoolField };
