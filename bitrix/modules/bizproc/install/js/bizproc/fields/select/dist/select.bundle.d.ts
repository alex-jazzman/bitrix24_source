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
	class SelectField extends BX.Bizproc.Fields.BaseField {
		/**
		 * A radio/checkbox list is a group of controls even when the field is not multiple:
		 * naming one option would not name the list. The dropdown view is one control, and a
		 * `<fieldset>` around a single input would announce a group that is not there.
		 */
		rendersGroup(): boolean;
		/**
		 * Both views hold the whole selection in controls of their own, so the core lays out no rows
		 * for a multiple field. Declared apart from rendersGroup() because the dropdown view answers
		 * no there and would otherwise be spread over N rows the type reads no value from.
		 */
		rendersOwnMultiple(): boolean;
		/**
		 * Lets go of the menu of the previous render: it is registered in PopupManager and holds the
		 * trigger it was opened over, so a redraw without this would leave one behind per render. An
		 * open still waiting for the extension is called off here too: it belongs to the render being
		 * dropped, and the markup it was clicked on may well still stand in the document.
		 */
		protected release(): void;
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
		 * The control of the view the property asks for. The two are alternatives, not layers: a field
		 * is either a list of options or a dropdown, and nothing in the pair below is shared markup.
		 */
		renderControl(value: string | string[] | null): BX.Bizproc.Fields.RenderedControl;
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
		protected renderSelectionControl(control: BX.Bizproc.Fields.RenderedControl): BX.Bizproc.Fields.RenderedControl;
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
		getValue(): string | string[];
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
		protected applyValue(value: string | string[]): void;
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
		getValueState(): BX.Bizproc.Fields.FieldValueState;
		/**
		 * Overridden to put back what the state carries beside the value: text typed by hand that is no
		 * expression lives in the state alone, and a rebuild would otherwise wipe it off the screen
		 * (applyProperty restores a state around each rebuild). The value itself is written by the core.
		 */
		setValueState(state: BX.Bizproc.Fields.FieldValueState): void;
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
		protected isExpressionCarrierValid(input: HTMLInputElement): boolean;
	}
}
