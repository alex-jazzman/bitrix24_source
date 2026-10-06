/* eslint-disable */
/**
 * A single resolved option: `key` is the value stored/returned, `label` is the
 * human-readable caption shown to the user. `group` is the owning group's name,
 * present only when the option comes from a `Settings.Groups` group with a
 * non-empty name (it drives the visual subtitle; untitled groups leave it unset).
 */
type SelectOption = {
	key: string;
	label: string;
	group?: string;
};

declare namespace BX.Bizproc.Fields.Select {
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
	class SelectField extends BX.Bizproc.Fields.BaseField {
		/**
		 * A radio/checkbox list is a group of controls even when the field is not multiple:
		 * naming one option would not name the list.
		 */
		rendersGroup(): boolean;
		/**
		 * The requirement of the list is carried by every option input: a radio and a checkbox are
		 * valid holders of `aria-required`, the group element around them is not. Read off the
		 * rendered markup rather than collected while rendering, for the same reason as #getInputs.
		 */
		protected getGroupRequiredNodes(root: HTMLElement): HTMLElement[];
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
		resolveOptions(): SelectOption[];
		/**
		 * Whether the empty "[Not set]" option is shown, following the legacy backend
		 * `Select` rule: shown when `Settings.ShowEmptyValue` is truthy, or when it is
		 * not set at all and the field is not multiple. For multiple without an explicit
		 * truthy value, deselecting everything already means "empty", so no empty option.
		 */
		showEmptyOption(): boolean;
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
		renderControl(value: string | string[] | null): BX.Bizproc.Fields.RenderedControl;
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
		getValue(): string | string[];
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
		protected applyValue(value: string | string[]): void;
	}
}
