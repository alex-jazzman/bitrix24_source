import 'ui.design-tokens';
import 'ui.icon-set.outline';
import 'ui.forms';

import './style.css';

import { Tag, Text, Loc, Dom, Event, Type } from 'main.core';
import { BaseField, FieldRegistry, RenderMode, type Property, type RenderedControl } from 'bizproc.fields';

const LIST_SELECTOR: string = '.bizproc-fields-select__list';
const OPTION_INPUT_SELECTOR: string = '.bizproc-fields-select__option';

/**
 * A single resolved option: `key` is the value stored/returned, `label` is the
 * human-readable caption shown to the user. `group` is the owning group's name,
 * present only when the option comes from a `Settings.Groups` group with a
 * non-empty name (it drives the visual subtitle; untitled groups leave it unset).
 */
type SelectOption = {
	key: string,
	label: string,
	group?: string,
};

/**
 * A raw option entry in the order-preserving form the backend `Select` contract
 * emits: `value` is the stored key, `name` the caption. Mirrors the array shape
 * produced by Select::convertPropertyToView (`[{value, name}]`).
 */
type SelectOptionEntry = {
	value: string,
	name: string,
};

/**
 * One entry of `Settings.Groups`, mirroring the backend `Select` shape
 * `['name' => string, 'items' => [key => label]]`. Items accept the same two
 * forms as `Options` (order-preserving array or legacy flat map).
 */
type SelectGroup = {
	name?: string,
	items?: SelectOptionEntry[] | Record<string, string>,
};

/**
 * The `select` property carries extra fields the framework `Property` type does
 * not declare (they are specific to this field type and owned by the backend
 * `Select` contract). Narrowed locally rather than widened on the shared framework
 * type: `Options` is either the order-preserving array of entries
 * or a legacy flat key->label map, `Settings.ShowEmptyValue` drives the empty
 * option, `Settings.Groups` (when a non-empty array) supersedes `Options` as the
 * option source, `Default` pre-selects an existing key.
 */
type SelectProperty = Property & {
	Options?: SelectOptionEntry[] | Record<string, string>,
	Settings?: { ShowEmptyValue?: unknown, Groups?: SelectGroup[] } & Record<string, unknown>,
	Default?: string | string[] | null,
};

/**
 * The rendered insert row: `node` goes under the option list, `anchor` is the input value
 * insertion attaches to (RenderedControl.insertAnchor).
 */
type SelectInsertRow = {
	node: HTMLElement,
	anchor: HTMLInputElement,
};

/**
 * Concrete "list" (select) field type.
 *
 * Renders an inline list of options as native controls built on ui.forms
 * design-system markup (`ui-ctl ui-ctl-radio|ui-ctl-checkbox`, `ui-ctl-element`,
 * `ui-ctl-label-text`): `single` -> `<input type="radio">`, `multiple` ->
 * `<input type="checkbox">` - ONE control in both modes (not the framework's
 * N-row multiple machinery). The value is the option key(s).
 *
 * The list is a group of controls whatever the `Multiple` property says, so the type
 * declares rendersGroup(): the core then names the group with a `<fieldset>`/`<legend>`,
 * puts its control id on no single option, and leaves its N-row machinery off - here
 * multiplicity is one list of checkboxes.
 *
 * The declared value node is the first input of the group (the container itself when
 * there is no option to point at). getValue()/applyValue() work over the `:checked`
 * state of the whole group instead, because that is where the value lives - the inputs
 * are resolved from the DOM on every read (see #getInputs).
 *
 * The value invariant matches backend `Select`: the outward value is the option
 * key(s) - single -> key or `''` ("not set"), multiple -> array of keys in option
 * order. A value that matches no option (a macro expression `{{...}}`, which the
 * backend keeps as a separate element) renders no control, but is preserved and
 * returned by getValue() pass-through, so saving never silently drops it. An
 * expression already held as a value therefore survives; the `...` insert-row
 * picker that would let the user author a new one is still a stub.
 *
 * Option keys and labels are arbitrary user strings (legacy), therefore treated
 * as untrusted: Text.encode/Tag.render everywhere (name/value/label/aria/testid),
 * values only via `.value`/`.checked`, never innerHTML.
 */
class SelectField extends BaseField
{
	// Requested values that matched no rendered option - typically a macro
	// expression (`{{...}}`) the backend stores as a separate element. They render
	// no input, so `:checked` cannot carry them; without stashing them here
	// getValue() would drop them and the next save would erase the expression. Held
	// as the raw incoming value(s) and merged back by getValue() until the user makes
	// an explicit selection (see #handleUserInput / applyValue), which supersedes them.
	// Only the actual incoming value is stashed - property.Default is preselect-only
	// and never enters (a Default naming no option must not leak into getValue()).
	#unmatched: string[] = [];

	/**
	 * A radio/checkbox list is a group of controls even when the field is not multiple:
	 * naming one option would not name the list.
	 */
	rendersGroup(): boolean
	{
		return true;
	}

	/**
	 * The requirement of the list is carried by every option input: a radio and a checkbox are
	 * valid holders of `aria-required`, the group element around them is not. Read off the
	 * rendered markup rather than collected while rendering, for the same reason as #getInputs.
	 */
	protected getGroupRequiredNodes(root: HTMLElement): HTMLElement[]
	{
		return [...root.querySelectorAll<HTMLInputElement>(OPTION_INPUT_SELECTOR)];
	}

	/**
	 * Overridable option source, always returning a flat ordered array.
	 *
	 * Static synchronous fast-path over the property, mirroring the backend `Select`
	 * render rule: when `Settings.Groups` is a non-empty array, options come ONLY
	 * from the groups - in group order, then item order inside each group - and
	 * plain `Options` is ignored; otherwise `property.Options` is used. Group
	 * entries that are not objects are skipped. An option carries its group name
	 * in `group` only when the group name is non-empty (an untitled group renders
	 * its items without a subtitle).
	 *
	 * Both sources accept the canonical order-preserving array `[{value, name}]`
	 * (the shape the backend emits for mobile via Select::convertPropertyToView,
	 * RENDER_MODE_JN_MOBILE - it keeps the author's option order across the JSON
	 * boundary) and the legacy flat `key => label` map as a fallback (order-safe
	 * for non-numeric keys only, see #normalizeOptions).
	 * This is the single extension point for future backend-loaded options
	 * (`OptionsLoader`, `internalselect`): the method is designed to later return
	 * options resolved asynchronously, but here it is synchronous so the list renders
	 * without a placeholder.
	 */
	resolveOptions(): SelectOption[]
	{
		const property = this.getProperty() as SelectProperty;
		const groups = property.Settings?.Groups;

		if (Type.isArrayFilled<SelectGroup>(groups))
		{
			const result: SelectOption[] = [];

			groups.forEach((group) =>
			{
				if (!Type.isObjectLike(group) || Type.isArray(group))
				{
					return;
				}

				const name = Type.isNil(group.name) ? '' : String(group.name);

				result.push(...SelectField.#normalizeOptions(group.items, name === '' ? undefined : name));
			});

			return result;
		}

		return SelectField.#normalizeOptions(property.Options);
	}

	/**
	 * Normalizes a raw option source into resolved options, tagging each with the
	 * group name when given.
	 *
	 * Order-preserving array form `[{value, name}]`: options render exactly in the
	 * authored order. This is the shape order-sensitive data must use. Entries are
	 * validated defensively - a malformed element (not an object, or without a
	 * `value`) is skipped, and a missing `name` falls back to the value - so a
	 * partial entry never renders the literal string "undefined".
	 *
	 * Legacy flat `key -> label` map: a plain object cannot preserve declaration
	 * order for purely numeric keys - the JS engine iterates integer-like keys in
	 * ascending numeric order - so this path is order-safe only for non-numeric
	 * keys. Order-sensitive data must arrive as the array form above.
	 */
	static #normalizeOptions(
		options: SelectOptionEntry[] | Record<string, string> | null | undefined,
		group?: string,
	): SelectOption[]
	{
		if (!Type.isObjectLike(options))
		{
			return [];
		}

		const makeOption = (key: string, label: string): SelectOption => (
			Type.isUndefined(group) ? { key, label } : { key, label, group }
		);

		if (Type.isArray<SelectOptionEntry>(options))
		{
			return options
				.filter((option) => !Type.isNil(option) && !Type.isNil(option.value))
				.map((option) => makeOption(String(option.value), String(option.name ?? option.value)));
		}

		return Object.entries(options).map(([key, label]) => makeOption(String(key), String(label)));
	}

	/**
	 * Whether the empty "[Not set]" option is shown, following the legacy backend
	 * `Select` rule: shown when `Settings.ShowEmptyValue` is truthy, or when it is
	 * not set at all and the field is not multiple. For multiple without an explicit
	 * truthy value, deselecting everything already means "empty", so no empty option.
	 */
	showEmptyOption(): boolean
	{
		const setting = (this.getProperty() as SelectProperty).Settings?.ShowEmptyValue;

		// Type.isNil matches both `null` and `undefined`: an unset or
		// explicitly-null ShowEmptyValue on a single field still shows the empty option.
		if (Type.isNil(setting))
		{
			return !this.isMultiple();
		}

		// Normalize like the backend CBPHelper::getBool: a legacy feeder may send the
		// flag as `'Y'`/`'1'`/`1` rather than a strict boolean `true`.
		return SelectField.#toBool(setting);
	}

	/**
	 * Mirrors CBPHelper::getBool blacklist semantics: false for the PHP-empty
	 * shapes (null/undefined/false/0/''/'0'/empty array), the string 'false' and
	 * the case-insensitive flag 'N'; anything else is Boolean(value) - so legacy
	 * truthy shapes like `2`, `'yes'` or `'y'` count as true.
	 */
	static #toBool(value: unknown): boolean
	{
		if (
			Type.isNil(value)
			|| value === false
			|| value === 0
			|| value === ''
			|| value === '0'
			|| value === 'false'
			|| (Type.isString(value) && value.toUpperCase() === 'N')
			|| (Type.isArray(value) && value.length === 0)
		)
		{
			return false;
		}

		return Boolean(value);
	}

	/**
	 * Builds the option list as one grouped control.
	 *
	 * The empty option (value `''`) is prepended per showEmptyOption(), before any
	 * group subtitle. Selection is derived from `value ?? property.Default`; a
	 * Default that matches no option key simply pre-selects nothing - only the
	 * actual incoming value is stashed as unmatched (Default is preselect-only).
	 *
	 * Options that carry a group name (see resolveOptions) are preceded by a purely
	 * visual subtitle row (an optgroup analogue): it is not an option, so the flat
	 * sequential testid indexing over the options is unaffected.
	 *
	 * Grouping semantics, the accessible name and the ARIA of the group come from the core:
	 * because the type declares rendersGroup(), the core wraps this control in the naming
	 * `<fieldset>`/`<legend>`, wires `aria-describedby` on that same element and puts
	 * `aria-required` on the option inputs it asks the type for (getGroupRequiredNodes).
	 * The type states what it renders and leaves the announcing to the core.
	 *
	 * When AllowSelection is on and the field is editable, a `...` insert row is appended
	 * below the list - in public mode only when a selection provider is there to decorate
	 * it, since without one the type mirrors the backend Select, which renders no selector
	 * in that mode. The row's input is the insert anchor of the pair, so the provider's
	 * `...` button lands in that row rather than inside an option label.
	 */
	renderControl(value: string | string[] | null): RenderedControl
	{
		const property = this.getProperty() as SelectProperty;
		const multiple = this.isMultiple();
		const readOnly = this.isReadOnly();
		const controlName = this.getControlName();
		const fieldName = this.getFieldName();
		const inputType = multiple ? 'checkbox' : 'radio';
		const ctlClass = multiple ? 'ui-ctl-checkbox' : 'ui-ctl-radio';

		const options = this.resolveOptions();
		if (this.showEmptyOption())
		{
			options.unshift({ key: '', label: Loc.getMessage('BIZPROC_FIELDS_SELECT_NOT_SET') ?? '' });
		}

		const selected = this.#selectedKeys(value ?? property.Default ?? null);

		// Stash only the actual incoming value that matches no option (e.g. a macro
		// expression): it renders no input, so getValue() reads it from here instead
		// of the DOM. Default is preselect-only and must never enter the stash.
		const valuesToPreserve = Type.isNull(value) ? new Set<string>() : this.#selectedKeys(value);

		this.#stashUnmatched(valuesToPreserve, new Set(options.map((option) => option.key)));

		const list: HTMLElement = Tag.render`<div class="bizproc-fields-select__list"></div>`;

		let currentGroup: string | undefined;

		options.forEach((option, index) =>
		{
			// Visual group subtitle (optgroup analogue): purely presentational, never
			// an option. The group name is an untrusted user string - Text.encode only.
			if (!Type.isUndefined(option.group) && option.group !== currentGroup)
			{
				const groupTitle: HTMLElement = Tag.render`
					<div class="bizproc-fields-select__group-title">${Text.encode(option.group)}</div>
				`;

				Dom.append(groupTitle, list);
			}

			currentGroup = option.group;

			const input: HTMLInputElement = Tag.render`
				<input
					type="${inputType}"
					class="ui-ctl-element bizproc-fields-select__option"
					name="${Text.encode(controlName)}"
					value="${Text.encode(option.key)}"
					data-testid="${Text.encode(`bizproc-field-control-${fieldName}-${index}`)}"
				/>
			`;

			if (selected.has(option.key))
			{
				// The selection goes into the attribute, not into the `.checked` property:
				// the decorator replaces the value node (the first input) with a cloneNode()
				// copy, and cloneNode carries attributes over, not properties. `disabled`
				// below needs no such treatment - that property does reflect to its attribute.
				Dom.attr(input, 'checked', 'checked');
			}

			if (readOnly)
			{
				input.disabled = true;
			}

			const row: HTMLElement = Tag.render`
				<label class="ui-ctl ${ctlClass}">
					${input}
					<div class="ui-ctl-label-text">${Text.encode(option.label)}</div>
				</label>
			`;

			Dom.append(row, list);
		});

		if (!multiple)
		{
			// Single mode only: picking a radio replaces the value, so it supersedes any
			// stashed unmatched value (an expression) - drop the stash on that change.
			// Multiple mode is additive: toggling one checkbox does not replace the
			// value, so it must NOT drop a stashed expression; there the stash is only
			// superseded by an explicit setValue() (see #handleUserInput / #unmatched).
			// The listener sits on the list rather than on each input: the decorator
			// replaces the first input with a clone, and cloneNode drops listeners. Only
			// the options emit `change` inside the list (the insert row is outside it).
			Event.bind(list, 'change', this.#handleUserInput);
		}

		// No options at all (e.g. an empty Options map with no empty option added):
		// show a muted placeholder instead of a blank list. getValue() still returns
		// ''/[] correctly since the list holds no input.
		if (options.length === 0)
		{
			const emptyNode: HTMLElement = Tag.render`
				<div class="bizproc-fields-select__empty">
					${Text.encode(Loc.getMessage('BIZPROC_FIELDS_SELECT_EMPTY') ?? '')}
				</div>
			`;

			Dom.append(emptyNode, list);
		}

		const container: HTMLElement = Tag.render`
			<div class="bizproc-fields-select${readOnly ? ' bizproc-fields-select--readonly' : ''}">
				${list}
			</div>
		`;

		const decorates = this.decoratesSelection();
		const ownInsertRow = this.getRenderMode() !== RenderMode.Public && this.isSelectable() && !readOnly;

		// The insert row is where the `...` button belongs, whoever draws it, so it is rendered
		// in public mode too once a provider is there to decorate the field: the row is what
		// keeps that button out of an option label. Left to itself the type follows the backend
		// Select, which renders no selector in public mode.
		const insertRow = (decorates || ownInsertRow) ? this.#renderInsertRow(!decorates) : null;

		if (!Type.isNull(insertRow))
		{
			// Inset divider separating the option list from the insert zone, inside the card.
			Dom.append(Tag.render`<div class="bizproc-fields-select__divider"></div>`, container);
			Dom.append(insertRow.node, container);
		}

		const firstInput = list.querySelector<HTMLInputElement>(OPTION_INPUT_SELECTOR);

		// The first input is what the core treats as the value node of the group; with no
		// option to point at, the container stands in for it. Insertion attaches elsewhere -
		// to the insert row input - because anchored at the first option it would land inside
		// that option's `<label>`, between the radio and its caption.
		return {root: container, valueNode: firstInput ?? container, insertAnchor: insertRow?.anchor};
	}

	/**
	 * Overridden: value is the `:checked` state of the group, not any node's
	 * `.value`. Single -> the checked key or `''`; multiple -> the checked keys in
	 * option order.
	 *
	 * A value that matched no option (a macro expression) renders no control, so it
	 * lives in `#unmatched` rather than the DOM. It is folded back in here so a
	 * save never drops it: single returns the checked key first and falls back to
	 * the stashed value only when nothing is checked; multiple merges the checked
	 * keys (option order) with the stashed values so a mixed value (real key +
	 * expression) survives.
	 */
	getValue(): string | string[]
	{
		const checked = this.#getInputs().filter((input) => input.checked).map((input) => input.value);

		if (this.isMultiple())
		{
			return [...checked, ...this.#unmatched.filter((item) => !checked.includes(item))];
		}

		return checked[0] ?? this.#unmatched[0] ?? '';
	}

	/**
	 * Overridden: the value is the `:checked` state of the group, so the inputs whose key
	 * matches are checked and the rest cleared. super.applyValue() is deliberately NOT
	 * called - it writes the value into the value node's `.value`, which here is the first
	 * radio and whose `.value` is that option's key.
	 *
	 * The stash is recomputed against the current options: a value naming only matched
	 * keys clears it, an unmatched value (expression) re-stashes it - so an explicit
	 * setValue supersedes any prior stash, matching an explicit user selection. The core
	 * keeps the value itself, so a later render() reflects it.
	 */
	protected applyValue(value: string | string[]): void
	{
		const want = this.#selectedKeys(value);
		const inputs = this.#getInputs();

		inputs.forEach((input) =>
		{
			input.checked = want.has(input.value);
		});

		this.#stashUnmatched(want, new Set(inputs.map((input) => input.value)));
	}

	/**
	 * The live option inputs of the group, in option order.
	 *
	 * Resolved from the DOM on every read instead of collected while rendering: the
	 * selection decorator replaces the declared value node - the first input - with a
	 * cloneNode() copy, so a captured array would hold a detached node in its first slot.
	 * The list is reached through the node the core tracks, which the decorator keeps
	 * pointing at the live copy. An empty result means "nothing to read the value from"
	 * (no options at all), which is exactly what getValue() falls back on.
	 */
	#getInputs(): HTMLInputElement[]
	{
		const [valueNode] = this.getValueNodes();

		if (Type.isUndefined(valueNode))
		{
			return [];
		}

		const list = valueNode.closest(LIST_SELECTOR);

		if (Type.isNull(list))
		{
			return [];
		}

		return [...list.querySelectorAll<HTMLInputElement>(OPTION_INPUT_SELECTOR)];
	}

	/**
	 * Records the requested keys that match no rendered option (see `#unmatched`).
	 * The empty string is the "not set" sentinel, never an expression, so it is
	 * never stashed - dropping it keeps getValue()'s "" fallback the single source
	 * of the not-set value.
	 */
	#stashUnmatched(selected: Set<string>, optionKeys: Set<string>): void
	{
		this.#unmatched = [...selected].filter((key) => key !== '' && !optionKeys.has(key));
	}

	/**
	 * Single mode only (bound to the option list): picking a radio replaces the value, so
	 * the explicit selection becomes the source of truth and any stashed unmatched value
	 * (an expression that came in with the value) is dropped and no longer folded into
	 * getValue(). Multiple mode does not bind this, so a checkbox toggle never drops a
	 * stashed expression - only an explicit setValue() supersedes it.
	 */
	#handleUserInput = (): void =>
	{
		this.#unmatched = [];
	};

	/**
	 * Normalizes a raw value into the set of selected option keys.
	 * Multiple -> an array (or a single scalar) of keys; single -> the one key
	 * (first element of an array), where `''` means the empty option.
	 */
	#selectedKeys(value: string | string[] | null): Set<string>
	{
		if (this.isMultiple())
		{
			const list = Type.isArray<string>(value)
				? value
				: (Type.isStringFilled(value) ? [value] : []);

			return new Set(list.map((item) => String(item)));
		}

		const single = Type.isArray<string>(value) ? (value[0] ?? '') : (value ?? '');

		return new Set([String(single)]);
	}

	/**
	 * The insert row shown below the list (see renderControl for when): an editable text
	 * input next to a `...` button, matching the mockup.
	 *
	 * The insert zone lives inside the field card, below a divider that splits it
	 * from the option list: a bordered `<input>` fills the row and the `...` button
	 * sits next to it, outside the input.
	 *
	 * The input is also what the row hands back as its anchor, so a selection provider
	 * wraps that input and puts its own `...` button here. `withOwnButton` is therefore
	 * false whenever a provider will do that: the two buttons are one and the same, and
	 * only one of them is ever drawn.
	 *
	 * The input is a read-only stub (a value-insertion placeholder) and carries an
	 * aria-label so it is named for assistive tech. It is kept OUT of the value model:
	 * it is not an option of the list, so neither the value node the core tracks nor
	 * #getInputs() ever reaches it, and getValue()/applyValue() ignore it.
	 * Marking it `readonly` (rather than leaving it freely editable) stops typed text
	 * from being silently dropped and matches the CSS "readonly stub" note. The value
	 * contract stays "option key(s) only": a typed macro expression is never captured
	 * as the field value.
	 */
	#renderInsertRow(withOwnButton: boolean): SelectInsertRow
	{
		const fieldName = this.getFieldName();

		const input: HTMLInputElement = Tag.render`
			<input
				type="text"
				class="bizproc-fields-select__insert-input"
				readonly
				placeholder="${Text.encode(Loc.getMessage('BIZPROC_FIELDS_SELECT_INSERT_PLACEHOLDER') ?? '')}"
				aria-label="${Text.encode(Loc.getMessage('BIZPROC_FIELDS_SELECT_INSERT_PLACEHOLDER') ?? '')}"
				data-testid="${Text.encode(`bizproc-field-insert-input-${fieldName}`)}"
			/>
		`;

		const node: HTMLElement = Tag.render`
			<div class="bizproc-fields-select__insert-row">
				${input}
			</div>
		`;

		if (withOwnButton)
		{
			Dom.append(this.renderInsertButton(), node);
		}

		return {node, anchor: input};
	}
}

FieldRegistry.register('select', SelectField);

export { SelectField };
