import 'ui.design-tokens';
import 'ui.icon-set.outline';
import 'ui.forms';

import './style.css';

import { Tag, Text, Loc, Dom, Event, Runtime, Type } from 'main.core';
import { type Menu, type MenuItemOptions, type MenuOptions } from 'ui.system.menu';
import {
	BaseField,
	EXPRESSION_ROW_CLASS,
	FieldRegistry,
	RenderMode,
	SelectView,
	isExpressionValue,
	readSelectView,
	type FieldValueState,
	type Property,
	type RenderedControl,
} from 'bizproc.fields';

const LIST_SELECTOR: string = '.bizproc-fields-select__list';
const OPTION_INPUT_SELECTOR: string = '.bizproc-fields-select__option';
const INSERT_INPUT_SELECTOR: string = '.bizproc-fields-select__insert-input';
const DROPDOWN_CLASS: string = 'bizproc-fields-select-dropdown';
const DROPDOWN_SELECTOR: string = `.${DROPDOWN_CLASS}`;
const DROPDOWN_INPUT_SELECTOR: string = `.${DROPDOWN_CLASS}__input`;
const DROPDOWN_VALUE_SELECTOR: string = `.${DROPDOWN_CLASS}__value`;
const DROPDOWN_FIELD_SELECTOR: string = `.${DROPDOWN_CLASS}__field`;
const DROPDOWN_CHEVRON_SELECTOR: string = `.${DROPDOWN_CLASS}__chevron`;
const DROPDOWN_DECORATED_CLASS: string = `${DROPDOWN_CLASS}__field--decorated`;

/**
 * Fetched on the first open of a menu and not with the page. The types of the framework travel to
 * every consumer through `post_rel`, so declared as a dependency the menu and its whole chain would
 * arrive with every form that draws any field at all - while a menu belongs to the dropdown view
 * alone, and appears only after a click on its chevron.
 *
 * `Runtime.loadExtension` keeps every name it has loaded, so the bundle is fetched once for the
 * page - however many dropdowns a form carries, and however many times each of them is opened.
 */
const MENU_EXTENSION: string = 'ui.system.menu';

/**
 * What the lazy load answers with. `Runtime.loadExtension` is typed as handing back an array of
 * exports and reduces the namespaces of every name it was given into one object before returning
 * it, so the class is read off that one object under the name the extension exports it by.
 */
type MenuExports = {
	Menu: new (options: MenuOptions) => Menu,
};

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
 * insertion attaches to (RenderedControl.insertAnchor) and at the same time the companion the
 * expression of the field travels in (RenderedControl.expressionNode).
 */
type SelectInsertRow = {
	node: HTMLElement,
	anchor: HTMLInputElement,
};

/**
 * Concrete "list" (select) field type, drawn in one of the two views the property asks for
 * (see readSelectView).
 *
 * The list view renders the options as native controls built on ui.forms design-system markup
 * (`ui-ctl ui-ctl-radio|ui-ctl-checkbox`, `ui-ctl-element`, `ui-ctl-label-text`): `single` ->
 * `<input type="radio">`, `multiple` -> `<input type="checkbox">` - ONE control in both modes
 * (not the framework's N-row multiple machinery). The value is the option key(s).
 *
 * That view is a group of controls whatever the `Multiple` property says, so the type declares
 * rendersGroup(): the core then names the group with a `<fieldset>`/`<legend>`, puts its control
 * id on no single option, and leaves its N-row machinery off - here multiplicity is one list of
 * checkboxes. Its declared value node is the first input of the group (the container itself when
 * there is no option to point at); getValue()/applyValue() work over the `:checked` state of the
 * whole group instead, because that is where the value lives - the inputs are resolved from the
 * DOM on every read (see #getInputs).
 *
 * The dropdown view is one text control instead, with the options behind a chevron button that
 * opens a `ui.system.menu` over it (see #renderDropdownControl). One control is no group, so the
 * type declares none there and the core names, describes and marks that control itself.
 *
 * The value invariant matches backend `Select`: the outward value is the option
 * key(s) - single -> key or `''` ("not set"), multiple -> array of keys in option
 * order. In the list view a value that matches no option (a macro expression `{{...}}`, which the
 * backend keeps as a separate element) renders no control, but is preserved and returned by
 * getValue() pass-through, so saving never silently drops it: it is shown in the companion of the
 * insert row where that row is drawn, and held apart where it is not (see #carriedExpressions).
 *
 * Option keys and labels are arbitrary user strings (legacy), therefore treated
 * as untrusted: Text.encode/Tag.render everywhere (name/value/label/aria/testid),
 * values only via `.value`/`.checked`, never innerHTML. The menu of the dropdown view encodes
 * the titles it is handed itself (MenuItem renders them through Text.encode).
 */
class SelectField extends BaseField
{
	// Requested values that matched no rendered option - typically a macro expression (`{{...}}`)
	// the backend stores as a separate element. They render no input, so `:checked` cannot carry
	// them; without holding them somewhere getValue() would drop them and the next save would
	// erase the expression. Where the insert row is drawn the first of them goes to its companion
	// input (see #handStashToCompanion), where the user reads and edits it, and the rest stay here:
	// the companion is one input per field, and a multiple list may carry more than one such value.
	// Both halves are merged back by getValue() until an explicit selection supersedes them (see
	// #handleUserInput / applyValue).
	// Only the actual incoming value ever enters - property.Default is preselect-only
	// (a Default naming no option must not leak into getValue()).
	#unmatched: string[] = [];

	// Whether what stands in the companion right now came from `#unmatched` and has not been edited
	// since. Such a value is data the field was given - a macro expression, or a key the options
	// stopped offering - and getValue() carries it on whatever it looks like, because dropping it
	// would erase the field on a save the user never made. Text the user types there is the other
	// case and keeps the plain rule (see #carriedExpressions).
	#companionCarriesStashedValue: boolean = false;

	/**
	 * The menu of the dropdown view, built on the first open and reused afterwards. Kept so it can
	 * be told the current selection again (updateItems) and let go of on release(): the popup lives
	 * in PopupManager and would outlive the node it was opened over.
	 */
	#menu: Menu | null = null;

	/**
	 * The number of the last open asked for. An open waits for the extension to arrive, and what
	 * happens meanwhile decides whether it still stands: an open whose number is no longer this one
	 * has been superseded and shows nothing (see #openMenu and #cancelMenuOpening).
	 */
	#openRequest: number = 0;

	/**
	 * A radio/checkbox list is a group of controls even when the field is not multiple:
	 * naming one option would not name the list. The dropdown view is one control, and a
	 * `<fieldset>` around a single input would announce a group that is not there.
	 */
	rendersGroup(): boolean
	{
		return !this.#showsDropdown();
	}

	/**
	 * Both views hold the whole selection in controls of their own, so the core lays out no rows
	 * for a multiple field. Declared apart from rendersGroup() because the dropdown view answers
	 * no there and would otherwise be spread over N rows the type reads no value from.
	 */
	rendersOwnMultiple(): boolean
	{
		return true;
	}

	/**
	 * Lets go of the menu of the previous render: it is registered in PopupManager and holds the
	 * trigger it was opened over, so a redraw without this would leave one behind per render. An
	 * open still waiting for the extension is called off here too: it belongs to the render being
	 * dropped, and the markup it was clicked on may well still stand in the document.
	 */
	protected release(): void
	{
		this.#cancelMenuOpening();
		this.#menu?.destroy();
		this.#menu = null;
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
	 * The control of the view the property asks for. The two are alternatives, not layers: a field
	 * is either a list of options or a dropdown, and nothing in the pair below is shared markup.
	 */
	renderControl(value: string | string[] | null): RenderedControl
	{
		return this.#showsDropdown()
			? this.#renderDropdownControl(value)
			: this.#renderListControl(value);
	}

	/**
	 * The chevron of the dropdown view follows the input into the decoration, and the field says
	 * that it carries one.
	 *
	 * A provider splices its wrapper in place of the input and puts its `...` button right after it,
	 * so a chevron left outside that wrapper is reached by the keyboard after a button standing to
	 * its right (WCAG 2.4.3). Moving it costs nothing on screen: it is out of the flow and anchored
	 * to the field, whichever wrapper inside the field it sits in. The class is what tells the
	 * stylesheet the right edge of the field now belongs to that button - `:has()` would say the
	 * same, and Firefox 115 of the target build does not know it yet.
	 */
	protected renderSelectionControl(control: RenderedControl): RenderedControl
	{
		const decorated = super.renderSelectionControl(control);

		const field = decorated.root.querySelector<HTMLElement>(DROPDOWN_FIELD_SELECTOR);
		const chevron = decorated.root.querySelector<HTMLElement>(DROPDOWN_CHEVRON_SELECTOR);

		if (Type.isNull(field) || Type.isNull(chevron) || decorated.valueNode.parentElement === field)
		{
			return decorated;
		}

		Dom.insertAfter(chevron, decorated.valueNode);
		Dom.addClass(field, DROPDOWN_DECORATED_CLASS);

		return decorated;
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
	 * When AllowSelection is on and the field is editable, a `...` insert row is placed
	 * below the card - in public mode only when a selection provider is there to decorate
	 * it, since without one the type mirrors the backend Select, which renders no selector
	 * in that mode. The row's input is the insert anchor of the pair, so the provider's
	 * `...` button lands in that row rather than inside an option label, and at the same time
	 * the companion the expression of the field travels in.
	 */
	#renderListControl(value: string | string[] | null): RenderedControl
	{
		const property = this.getProperty() as SelectProperty;
		const multiple = this.isMultiple();
		const readOnly = this.isReadOnly();
		const controlName = this.getControlName();
		const fieldName = this.getFieldName();
		const inputType = multiple ? 'checkbox' : 'radio';
		const ctlClass = multiple ? 'ui-ctl-checkbox' : 'ui-ctl-radio';

		const options = this.#optionsWithEmpty();

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

		// The insert row is where the `...` button belongs, whoever draws it, so it is rendered
		// in public mode too once a provider is there to decorate the field: the row is what
		// keeps that button out of an option label. Left to itself the type follows the backend
		// Select, which renders no selector in public mode.
		const carried = this.#unmatched[0] ?? '';
		const insertRow = (decorates || this.#ownsInsertButton())
			? this.#renderInsertRow(!decorates, carried)
			: null;

		this.#companionCarriesStashedValue = !Type.isNull(insertRow) && Type.isStringFilled(carried);

		if (!Type.isNull(insertRow))
		{
			// The one that went into the row now stands in an input the user can read and edit, so it
			// is no longer held apart: getValue() reads it back off that input. The rest have no such
			// input of their own and stay here (see #carriedExpressions).
			this.#unmatched = this.#unmatched.slice(1);
			Dom.append(insertRow.node, container);
		}

		const firstInput = list.querySelector<HTMLInputElement>(OPTION_INPUT_SELECTOR);

		// The first input is what the core treats as the value node of the group; with no
		// option to point at, the container stands in for it. Insertion attaches elsewhere -
		// to the insert row input - because anchored at the first option it would land inside
		// that option's `<label>`, between the radio and its caption. That same input is the
		// companion of the field: the core names it `{fieldName}_text` and the backend reads it
		// back from there (Base::extractValueSingle).
		return {
			root: container,
			valueNode: firstInput ?? container,
			insertAnchor: insertRow?.anchor,
			expressionNode: insertRow?.anchor,
		};
	}

	/**
	 * Overridden: the value is the `:checked` state of the group and not any node's `.value`.
	 *
	 * A value that matched no option (a macro expression) renders no control and lives outside the
	 * group - in the companion of the insert row, and in `#unmatched` for whatever that one input
	 * had no room for - so it is folded back in here and a save never drops it.
	 *
	 * "Names a value" and not merely "is checked", because the empty "[Not set]" option is a checked
	 * control standing for no value - the one a fresh single field pre-selects. The pair is read the
	 * way the backend reads it: Base::extractValueSingle takes `{name}_text` exactly past an empty
	 * value of the field itself, so an option picked in earnest supersedes the expression and the
	 * not-set one leaves it standing.
	 *
	 * The dropdown view keeps its value in the hidden input under the field name instead, so there
	 * is nothing to merge there.
	 */
	getValue(): string | string[]
	{
		if (this.#showsDropdown())
		{
			return this.#getDropdownValue();
		}

		const checked = this.#getInputs().filter((input) => input.checked).map((input) => input.value);
		const carried = this.#carriedExpressions();

		if (this.isMultiple())
		{
			return [...checked, ...carried.filter((item) => !checked.includes(item))];
		}

		return Type.isStringFilled(checked[0]) ? checked[0] : (carried[0] ?? '');
	}

	/**
	 * Overridden: the value is the `:checked` state of the group, so the inputs whose key
	 * matches are checked and the rest cleared. super.applyValue() is deliberately NOT
	 * called - it writes the value into the value node's `.value`, which here is the first
	 * radio and whose `.value` is that option's key.
	 *
	 * The unmatched part of the value is recomputed against the current options: a value naming
	 * only matched keys clears it, an unmatched value (expression) takes its place - so an
	 * explicit setValue supersedes whatever the field carried, matching an explicit user
	 * selection. The core keeps the value itself, so a later render() reflects it.
	 */
	protected applyValue(value: string | string[]): void
	{
		if (this.#showsDropdown())
		{
			this.#applyDropdownValue(value);

			return;
		}

		const want = this.#selectedKeys(value);
		const inputs = this.#getInputs();

		inputs.forEach((input) =>
		{
			input.checked = want.has(input.value);
		});

		this.#stashUnmatched(want, new Set(inputs.map((input) => input.value)));
		this.#handStashToCompanion();
	}

	/**
	 * Overridden for the dropdown view: the text of that view stands in the visible control, while
	 * the core reads the text of the state off a companion this view has none of (see
	 * #renderDropdownControl). Left at that, the state would carry nothing and the rebuild restored
	 * from it would wipe the text off the screen together with the ERR-01 mark it raised.
	 *
	 * Only text standing in for no value travels that way. The caption of an option picked in
	 * earnest is carried by the value like any other, and an expression IS the value here - typing
	 * one puts it under the field name (see #handleDropdownInput) - so neither is carried twice.
	 */
	getValueState(): FieldValueState
	{
		const state = super.getValueState();

		if (!this.#showsDropdown())
		{
			return state;
		}

		return { ...state, expression: this.#dropdownCarriedText() };
	}

	/**
	 * Overridden to put back what the state carries beside the value: text typed by hand that is no
	 * expression lives in the state alone, and a rebuild would otherwise wipe it off the screen
	 * (applyProperty restores a state around each rebuild). The value itself is written by the core.
	 */
	setValueState(state: FieldValueState): void
	{
		super.setValueState(state);

		this.#restoreCarriedText(state.expression);
		this.checkExpressionCarrier();
	}

	/**
	 * Overridden for the dropdown view: its control shows the caption of the option that was
	 * picked, and a caption is no expression - checked by the plain rule, every pick would be
	 * called an error. The caption alone does not prove a pick, though, and the pair tells the
	 * two apart: a pick puts the key of the option into the hidden input (#pickDropdownOption),
	 * typing leaves it empty (#handleDropdownInput). So the caption of the option the field
	 * really holds passes, and the same text typed by hand does not - it names no option and
	 * stands in for no value, which is exactly what the field submits nothing for (DDN-01) and
	 * what ERR-01 is there to say out loud. The list view carries the plain rule of the core in
	 * its insert row.
	 */
	protected isExpressionCarrierValid(input: HTMLInputElement): boolean
	{
		if (super.isExpressionCarrierValid(input))
		{
			return true;
		}

		if (!this.#showsDropdown())
		{
			return false;
		}

		const hidden = this.#getDropdownValueInput();
		const current = Type.isNull(hidden) ? '' : hidden.value;

		return this.#holdsOptionShownAs(current, input.value);
	}

	/**
	 * Whether an option named by `key` carries `label` as its caption - the empty "[Not set]" one
	 * included where it is drawn, exactly as #optionsWithEmpty() lists it. One match and not that
	 * joined list: this is asked on every change and focusout of the carrier (ERR-01), and the empty
	 * option is the only one #optionsWithEmpty() puts in front of the resolved ones, so it is
	 * answered for apart. The options themselves are resolved anew on every ask all the same -
	 * resolveOptions() is the extension point for backend-loaded options and keeps no cache.
	 */
	#holdsOptionShownAs(key: string, label: string): boolean
	{
		if (key === '' && this.showEmptyOption() && label === SelectField.#emptyOptionLabel())
		{
			return true;
		}

		return this.resolveOptions().some((option) => option.key === key && option.label === label);
	}

	/**
	 * Puts back into the carrier of the view what the state carries and the value does not. Text
	 * typed by hand that is no expression never reaches the value - the list takes only an
	 * expression off its companion (see #carriedExpressions), and the dropdown keeps its value in
	 * a hidden input such text never enters (see #handleDropdownInput) - so it lives in the state
	 * alone, and a rebuild around applyProperty would wipe it off the screen together with the
	 * ERR-01 mark it raised, leaving the field complaining about text no longer there.
	 *
	 * Each view carries it in a node of its own: the list in the companion of its insert row, the
	 * dropdown in the visible control itself.
	 */
	#restoreCarriedText(text: string): void
	{
		if (!Type.isStringFilled(text))
		{
			return;
		}

		if (this.#showsDropdown())
		{
			this.#restoreDropdownText(text);

			return;
		}

		const companion = this.#getCompanionInput();

		if (Type.isNull(companion) || Type.isStringFilled(companion.value))
		{
			return;
		}

		companion.value = text;
		this.checkExpressionCarrier();
	}

	/**
	 * The dropdown carries the text in the control the user reads, so it goes back over the caption
	 * applyValue() has just written there. Nothing of the user's is lost that way: an empty hidden
	 * input is the field holding nothing (DDN-01), and the caption over it stands for the not-set
	 * option or for nothing at all.
	 */
	#restoreDropdownText(text: string): void
	{
		const input = this.#getDropdownInput();

		if (Type.isNull(input) || Type.isStringFilled(this.#dropdownStoredValue()))
		{
			return;
		}

		input.value = text;
		this.checkExpressionCarrier();
	}

	/**
	 * What the dropdown carries beside its value: text typed by hand into the visible control that
	 * names no option and is no expression - the very case ERR-01 marks it for. A hidden input
	 * standing filled means the control shows the caption of what the field really holds, and that
	 * is carried by the value (DDN-01).
	 */
	#dropdownCarriedText(): string
	{
		const input = this.#getDropdownInput();

		if (Type.isNull(input) || Type.isStringFilled(this.#dropdownStoredValue()))
		{
			return '';
		}

		return this.isExpressionCarrierValid(input) ? '' : input.value;
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
	 * the explicit selection becomes the source of truth and an unmatched value held apart
	 * (an expression that came in with the value) is dropped and no longer folded into
	 * getValue(). Multiple mode does not bind this, so a checkbox toggle never drops it -
	 * only an explicit setValue() supersedes it.
	 *
	 * Reaches nothing where the insert row is drawn: there the expression stands in the companion,
	 * and a pick does not empty it. The two carriers are then filled at once, and both sides keep
	 * them apart by the one rule - `{name}_text` stands in only past an empty value of the field
	 * itself (see getValue and Base::extractValueSingle).
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
	 * The insert row shown under the card (see #renderListControl for when): a bordered `<input>`
	 * filling the row and the `...` button beside it, outside the input, matching the mockup.
	 *
	 * The input is the companion of the field: it carries the `{fieldName}_text` value the backend
	 * reads back when the field itself came back empty (Base::extractValueSingle). The core names
	 * it, both the submitted name and the accessible one. It is also the anchor the row hands
	 * back, so a provider wraps it and brings its own `...` - which is why `withOwnButton` is
	 * false whenever one will.
	 *
	 * The row wears the expression row class of the core beside its own: that is how the core
	 * finds the row back from the companion (BaseField.#expressionRowOf) and places it below the
	 * option group (FieldLayout.assemble). Without it the bare input is moved out of here and the
	 * `...` button is left standing alone.
	 */
	#renderInsertRow(withOwnButton: boolean, expression: string): SelectInsertRow
	{
		const fieldName = this.getFieldName();

		const input: HTMLInputElement = Tag.render`
			<input
				type="text"
				class="bizproc-fields-select__insert-input"
				value="${Text.encode(expression)}"
				placeholder="${Text.encode(Loc.getMessage('BIZPROC_FIELDS_SELECT_INSERT_PLACEHOLDER') ?? '')}"
				data-testid="${Text.encode(`bizproc-field-insert-input-${fieldName}`)}"
			/>
		`;

		// The companion is where an inserted value goes in this view, and a host walking the markup
		// knows a target of insertion by this role alone (BackendRenderer.#initSelectors). Said of
		// every row drawn, because the row is what carries the condition: it exists only where
		// insertion is open to the field (see #renderListControl), so its input is always a target.
		// Set rather than printed empty, as on the dropdown control: those walks match the attribute
		// whatever it holds, so a node with no role must not carry it at all.
		Dom.attr(input, 'data-role', 'inline-selector-target');

		const node: HTMLElement = Tag.render`
			<div
				class="${EXPRESSION_ROW_CLASS} bizproc-fields-select__insert-row"
				data-testid="${Text.encode(`bizproc-field-insert-row-${fieldName}`)}"
			>
				${input}
			</div>
		`;

		if (withOwnButton)
		{
			Dom.append(this.renderInsertButton(), node);
		}

		// Only an expression stands in for a value here (see #carriedExpressions), so the row is
		// what says so when the user types something else into it (ERR-01).
		this.watchExpressionCarrier(node, INSERT_INPUT_SELECTOR);

		// An edit is what tells the value the field handed to the companion from the one the user
		// put there (see #carriedExpressions). Both events, and neither `focusout`: a value
		// inserted by a provider is announced with `change` alone, and passing through a carrier
		// changes nothing that stands in it.
		Event.bind(node, 'input', this.#handleCompanionEdit);
		Event.bind(node, 'change', this.#handleCompanionEdit);

		return {node, anchor: input};
	}

	/**
	 * The expressions the field carries as it stands now: what the companion of the insert row
	 * holds, and beside it the values that matched no option and had no companion left to go into -
	 * every one of them where no such row was drawn (a read-only field, the live document without a
	 * provider), the ones past the first where it was.
	 *
	 * What the field itself put into the companion is taken back whatever it looks like: it is the
	 * value the field was given, and a key the options stopped offering is no less of one than a
	 * macro expression - dropped here, it would disappear on a save the user never made. Free text
	 * typed by hand is the other case and stands in for no value, so the field is not filled with
	 * it; [P2.T4] is what tells the user as much instead of letting it travel to the server as one.
	 */
	#carriedExpressions(): string[]
	{
		const companion = this.#getCompanionInput();

		if (Type.isNull(companion) || !Type.isStringFilled(companion.value))
		{
			return this.#unmatched;
		}

		if (!this.#companionCarriesStashedValue && !isExpressionValue(companion.value))
		{
			return this.#unmatched;
		}

		return [companion.value, ...this.#unmatched];
	}

	/**
	 * The companion holds what the user put there from now on, so the value the field handed it is
	 * no longer what stands in the input: an expression passes the plain rule on its own, and text
	 * that is none stands in for no value (ERR-01).
	 */
	#handleCompanionEdit = (): void => {
		this.#companionCarriesStashedValue = false;
	};

	/**
	 * Hands the first of what applyValue() found unmatched over to the companion, where the insert
	 * row was drawn: the expression then stands where the user reads and edits it, and the stash
	 * keeps only what has nowhere else to go - the companion is one input, and a multiple list may
	 * carry more than one unmatched value. What was handed over is dropped from the stash: kept in
	 * both, the two would drift apart and getValue() would answer with it twice.
	 *
	 * The one place this type writes into its own carrier, so ERR-01 is checked again right here: a
	 * programmatic write fires no event. Left unchecked, a key that named an option before the
	 * options changed would stand in the companion unmarked - carried on by getValue() so the save
	 * loses nothing, and refused by the backend all the same, with nothing on screen saying why.
	 */
	#handStashToCompanion(): void
	{
		const companion = this.#getCompanionInput();

		if (Type.isNull(companion))
		{
			return;
		}

		const carried = this.#unmatched[0] ?? '';

		companion.value = carried;
		this.#unmatched = this.#unmatched.slice(1);
		this.#companionCarriesStashedValue = Type.isStringFilled(carried);
		this.checkExpressionCarrier();
	}

	/**
	 * The companion input of the current render, `null` where no insert row was drawn. Asked of
	 * the core rather than captured: the decorator wraps the anchor in its own markup and hands
	 * the live copy back there, so a captured node would be the detached original.
	 */
	#getCompanionInput(): HTMLInputElement | null
	{
		const [node] = this.getExpressionNodes();

		return Type.isUndefined(node) ? null : (node as HTMLInputElement);
	}

	/**
	 * Whether the field draws the `...` button itself: where insertion is open to it and no
	 * provider brought one. Public mode is the live document, and there the type follows the
	 * backend Select, which renders no selector of its own.
	 */
	#ownsInsertButton(): boolean
	{
		if (this.decoratesSelection())
		{
			return false;
		}

		return this.getRenderMode() !== RenderMode.Public && this.isSelectable() && !this.isReadOnly();
	}

	/**
	 * A multiple property stays a list whatever view it asks for: the dropdown holds one value -
	 * one hidden input under the field name, and a pick that replaces rather than adds - so drawn
	 * for a multiple field it would keep the first value and lose the rest. The list view carries
	 * the whole selection in its group, which is what the backend reads back
	 * (Base::extractValueMultiple).
	 */
	#showsDropdown(): boolean
	{
		return !this.isMultiple() && readSelectView(this.getProperty()) === SelectView.Dropdown;
	}

	/** The options as they are drawn: the empty "[Not set]" one first, per showEmptyOption(). */
	#optionsWithEmpty(): SelectOption[]
	{
		const options = this.resolveOptions();

		// A new array and not an unshift into the one resolveOptions() handed over: that method is
		// the extension point for backend-loaded options and may later answer from a cache or a
		// preloaded list, which an unshift would grow by one empty option per call.
		return this.showEmptyOption()
			? [{ key: '', label: SelectField.#emptyOptionLabel() }, ...options]
			: options;
	}

	/** The caption of the empty option - the one standing for no value, drawn per showEmptyOption(). */
	static #emptyOptionLabel(): string
	{
		return Loc.getMessage('BIZPROC_FIELDS_SELECT_NOT_SET') ?? '';
	}

	/**
	 * The dropdown view (DDN-01): a text control showing the caption of the chosen option, a
	 * chevron opening the menu of options, and a hidden input carrying what the field submits.
	 *
	 * The visible input is the value node, so the core names and marks it and insertion attaches
	 * there. What it shows is the caption of an option and no value of its own, so it asks every
	 * provider to write over it rather than into the caret (`data-select-mode`, read by
	 * InlineSelector.parseTargetProperties): appended to a caption the inserted expression would
	 * name no option and leave the field submitting nothing (see #handleDropdownInput). The chevron
	 * stays outside the flow: the provider splices its wrapper in place of the input, and a chevron
	 * in the flow would be pushed out of the field by it.
	 *
	 * The control stays an ordinary textbox and the menu belongs to the chevron - overlaying an
	 * ARIA combobox on a component implementing `menu`/`menuitem` would redefine its roles from
	 * the outside. Keyboard, focus and `aria-expanded` therefore come from `ui.system.menu`.
	 */
	#renderDropdownControl(value: string | string[] | null): RenderedControl
	{
		const property = this.getProperty() as SelectProperty;
		const readOnly = this.isReadOnly();
		const fieldName = this.getFieldName();
		const options = this.#optionsWithEmpty();
		const key = SelectField.#firstValue(value ?? property.Default ?? null);

		// A value is data and goes under the field name as it came, even where the options no longer
		// hold it: emptied here it would disappear on a save the user never made, while kept it is
		// marked by the ERR-01 check the core runs past the render (see isExpressionCarrierValid).
		// A Default is a preselect and no value of the field, so one naming no option stays out.
		const stored = Type.isNull(value) ? SelectField.#preselectedValue(options, key) : key;

		const input: HTMLInputElement = Tag.render`
			<input
				type="text"
				class="${DROPDOWN_CLASS}__input"
				value="${Text.encode(SelectField.#visibleText(options, stored))}"
				placeholder="${Text.encode(this.getPlaceholder())}"
				data-select-mode="replace"
				data-testid="${Text.encode(`bizproc-field-dropdown-input-${fieldName}`)}"
			/>
		`;

		if (this.isSelectable() && !readOnly)
		{
			// Set rather than printed empty: the [data-role] walks of the insertion hosts match the
			// attribute whatever it holds, so a node with no role must not carry it at all.
			Dom.attr(input, 'data-role', 'inline-selector-target');
		}

		if (readOnly)
		{
			Dom.attr(input, 'readonly', '');
		}

		const chevron: HTMLButtonElement = Tag.render`
			<button
				type="button"
				class="${DROPDOWN_CLASS}__chevron"
				aria-label="${Text.encode(Loc.getMessage('BIZPROC_FIELDS_SELECT_DROPDOWN_OPEN') ?? '')}"
				data-testid="${Text.encode(`bizproc-field-dropdown-toggle-${fieldName}`)}"
			>
				<div class="ui-icon-set --chevron-down-m" aria-hidden="true"></div>
			</button>
		`;

		const hidden: HTMLInputElement = Tag.render`
			<input
				type="hidden"
				class="${DROPDOWN_CLASS}__value"
				name="${Text.encode(this.getControlName())}"
				value="${Text.encode(stored)}"
				data-testid="${Text.encode(`bizproc-field-control-${fieldName}`)}"
			/>
		`;

		const root: HTMLElement = Tag.render`
			<div
				class="${DROPDOWN_CLASS}"
				data-testid="${Text.encode(`bizproc-field-dropdown-${fieldName}`)}"
			>
				<div class="${DROPDOWN_CLASS}__field">
					${input}
					${chevron}
				</div>
			</div>
		`;

		if (readOnly)
		{
			// A read-only field opens nothing, and a disabled button says so and leaves the tab
			// order - the same lock the options of the list view take.
			chevron.disabled = true;
		}
		else
		{
			Event.bind(chevron, 'click', () => {
				this.#toggleMenu(chevron);
			});

			// Typed text reaches the field name only as an expression (DDN-01). The listener sits
			// on the root because the decorator replaces the visible input with a clone and
			// cloneNode drops listeners; `change` is there for the provider, which announces an
			// inserted value that way (InlineSelector fires it after writing) and no `input` at all.
			Event.bind(root, 'input', this.#handleDropdownInput);
			Event.bind(root, 'change', this.#handleDropdownInput);

			// The control is the carrier of the expression in this view, so the ERR-01 check goes
			// on it: text that names no option and is no expression leaves the field empty (DDN-01).
			this.watchExpressionCarrier(root, DROPDOWN_INPUT_SELECTOR);
		}

		if (this.#ownsInsertButton())
		{
			Dom.append(this.renderInsertButton(), root);
		}

		Dom.append(hidden, root);

		return { root, valueNode: input };
	}

	/**
	 * Keeps the hidden input on what the visible one shows, by the rule of DDN-01: an expression
	 * is what the field is filled with and travels under its name, anything else typed by hand
	 * names no option and leaves the field carrying nothing.
	 */
	#handleDropdownInput = (): void => {
		const input = this.#getDropdownInput();
		const hidden = this.#getDropdownValueInput();

		if (Type.isNull(input) || Type.isNull(hidden))
		{
			return;
		}

		hidden.value = isExpressionValue(input.value) ? input.value : '';
	};

	/**
	 * Opens the menu of options over the chevron, or closes the one already open. The mouse and the
	 * keyboard arrive here alike: the chevron is a native button, so Enter and Space reach it as a
	 * click of their own.
	 */
	#toggleMenu(trigger: HTMLElement): void
	{
		const opened = this.#menu;

		if (!Type.isNull(opened) && opened.getPopup()?.isShown() === true)
		{
			opened.close();

			return;
		}

		this.#openMenu(trigger).catch((error: unknown) => {
			// The menu is the whole answer the chevron gives: a load that never arrived would leave
			// the click silent and say nowhere what went wrong.
			console.error(
				'[bizproc.fields.select] the option menu could not be loaded, the click opened nothing',
				error,
			);
		});
	}

	/**
	 * Shows the menu over the chevron, waiting for the extension it is built from to arrive (see
	 * MENU_EXTENSION).
	 *
	 * The instance is built once and told the current selection again on every open: an item marks
	 * itself selected, and the value may have changed since the last time the list was seen. The
	 * items are collected after the wait, for the same reason - the value read before it would be
	 * the one the field held when the chevron was clicked.
	 */
	async #openMenu(trigger: HTMLElement): Promise<void>
	{
		const request = this.#cancelMenuOpening();
		const loaded: unknown = await Runtime.loadExtension(MENU_EXTENSION);
		const MenuClass = (loaded as MenuExports).Menu;

		// Nothing is shown for a click that no longer stands: a later one took the entry over, or the
		// field was released or re-rendered while the extension was on its way - and a menu bound to
		// a chevron outside the document has nothing to stand over.
		if (request !== this.#openRequest || !trigger.isConnected)
		{
			return;
		}

		const items = this.#buildMenuItems();
		const opened = this.#menu;

		if (!Type.isNull(opened))
		{
			opened.updateItems(items);
			opened.show(trigger);

			return;
		}

		// Partial and then widened: the menu option types declare every field required, and typed as
		// the partial it is, what IS passed keeps its names and its types checked.
		const options: Partial<MenuOptions> = {
			items,
			// The popup hides itself on any click outside it, and it does so in the capture phase -
			// before the click reaches the chevron. Left to that rule, a click on an open menu would
			// close it there and the branch above would open it again within the same click. So the
			// trigger is not "outside" as far as the auto-hide is concerned, and closing the menu
			// from it is what that branch does.
			autoHideHandler: (event: MouseEvent): boolean => {
				const target = event.target as Node;

				return !trigger.contains(target) && !this.#menuHolds(target);
			},
		};

		const menu = new MenuClass(options as MenuOptions);

		this.#menu = menu;
		menu.show(trigger);
	}

	/**
	 * Calls off an open still waiting for the extension and answers with the number of the one taking
	 * the entry over: a later click, and a release, are the two events that do so.
	 *
	 * The release is the case it is really for. A field let go of, or re-rendered, must open nothing
	 * afterwards, and the node the click landed on may well still stand in the document - a consumer
	 * swaps the markup in its own time - so being connected proves nothing by itself.
	 */
	#cancelMenuOpening(): number
	{
		this.#openRequest += 1;

		return this.#openRequest;
	}

	/** Whether the node clicked belongs to the open menu itself. */
	#menuHolds(node: Node): boolean
	{
		const container = this.#menu?.getPopupContainer();

		// Nil, not undefined: Menu.getPopupContainer() hands back whatever its popup holds, and
		// a destroyed popup holds null.
		return Type.isNil(container) ? false : container.contains(node);
	}

	/**
	 * The options as menu items. The titles are arbitrary user strings and go in raw: MenuItem
	 * renders them through Text.encode itself, and encoding them here would show the entities.
	 */
	#buildMenuItems(): MenuItemOptions[]
	{
		const hidden = this.#getDropdownValueInput();
		const current = Type.isNull(hidden) ? '' : hidden.value;
		const fieldName = this.getFieldName();

		return this.#optionsWithEmpty().map((option, index): MenuItemOptions => {
			// Partial and then widened, as in #openMenu: the item option type declares every field
			// required, and what IS passed stays checked.
			const item: Partial<MenuItemOptions> = {
				title: option.label,
				isSelected: option.key === current,
				dataset: { testid: `bizproc-field-dropdown-item-${fieldName}-${index}` },
				onClick: (): void => {
					this.#pickDropdownOption(option);
				},
			};

			return item as MenuItemOptions;
		});
	}

	/** The caption goes into the control the user reads, the key into the input the form submits. */
	#pickDropdownOption(option: SelectOption): void
	{
		const input = this.#getDropdownInput();
		const hidden = this.#getDropdownValueInput();

		if (Type.isNull(input) || Type.isNull(hidden))
		{
			return;
		}

		input.value = option.label;
		hidden.value = option.key;

		// A pick fills the field, so whatever ERR-01 was showing about the text it replaces goes.
		this.checkExpressionCarrier();

		// Both inputs are written programmatically, and that fires no native event: without this
		// the pick would change the value of the field and nobody would hear.
		this.emitChange();
	}

	/**
	 * What the dropdown holds: the hidden input under the field name. A multiple field answers
	 * with a list all the same - the shape follows isMultiple() as everywhere else - though this
	 * view holds one value whatever the property says.
	 */
	#getDropdownValue(): string | string[]
	{
		const hidden = this.#getDropdownValueInput();
		const value = Type.isNull(hidden) ? '' : hidden.value;

		if (!this.isMultiple())
		{
			return value;
		}

		return value === '' ? [] : [value];
	}

	#applyDropdownValue(value: string | string[]): void
	{
		const input = this.#getDropdownInput();
		const hidden = this.#getDropdownValueInput();

		if (Type.isNull(input) || Type.isNull(hidden))
		{
			return;
		}

		const options = this.#optionsWithEmpty();
		const key = SelectField.#firstValue(value);

		input.value = SelectField.#visibleText(options, key);
		// The written value is data like the one a render is given, so a key the options no longer
		// hold is kept rather than emptied - #writeValue runs the ERR-01 check right after this.
		hidden.value = key;
	}

	/**
	 * The visible control of the dropdown - the value node of the pair, which the core keeps
	 * pointing at the live copy the decoration handed back.
	 */
	#getDropdownInput(): HTMLInputElement | null
	{
		const [valueNode] = this.getValueNodes();

		return Type.isUndefined(valueNode) ? null : (valueNode as HTMLInputElement);
	}

	/** What the field submits as it stands now, `''` where the view is not drawn at all. */
	#dropdownStoredValue(): string
	{
		const hidden = this.#getDropdownValueInput();

		return Type.isNull(hidden) ? '' : hidden.value;
	}

	/** The hidden input beside it, found through the control root rather than captured. */
	#getDropdownValueInput(): HTMLInputElement | null
	{
		const input = this.#getDropdownInput();
		const root = Type.isNull(input) ? null : input.closest(DROPDOWN_SELECTOR);

		return Type.isNull(root) ? null : root.querySelector<HTMLInputElement>(DROPDOWN_VALUE_SELECTOR);
	}

	/** What the dropdown shows for a key: the caption of its option, or the key itself. */
	static #visibleText(options: SelectOption[], key: string): string
	{
		const option = options.find((item) => item.key === key);

		return Type.isUndefined(option) ? key : option.label;
	}

	/**
	 * What the field name carries for a key the property preselects (DDN-01): the key of an option,
	 * or the expression standing in for one. Anything else names no option and no value either, and
	 * a Default is preselect-only - it must never leak into getValue(), the way the list view keeps
	 * it out of its stash. An incoming value is the other case and is carried on as it came.
	 */
	static #preselectedValue(options: SelectOption[], key: string): string
	{
		if (key === '')
		{
			return '';
		}

		const known = options.some((option) => option.key === key);

		return (known || isExpressionValue(key)) ? key : '';
	}

	/** The one value of a view that holds one, whatever shape the caller handed in. */
	static #firstValue(value: string | string[] | null): string
	{
		if (Type.isArray<string>(value))
		{
			return String(value[0] ?? '');
		}

		return Type.isNil(value) ? '' : String(value);
	}
}

FieldRegistry.register('select', SelectField);

export { SelectField };
