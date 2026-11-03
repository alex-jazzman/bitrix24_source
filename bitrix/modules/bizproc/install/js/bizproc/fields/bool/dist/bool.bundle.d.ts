/* eslint-disable */
declare namespace BX.Bizproc.Fields.Bool {
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
	class BoolField extends BX.Bizproc.Fields.BaseField {
		/**
		 * A switch and a flag both name themselves to their right, so the name block goes into the
		 * control row behind the control instead of standing above it. In the checkbox view that
		 * block is the caption of the flag, and a `<label for>` is what has a click on it toggle
		 * the flag - which is why the named node there is the native checkbox.
		 */
		getNameBlockPlacement(): BX.Bizproc.Fields.NameBlockPlacementValue;
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
		supportsExpressionMode(): boolean;
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
		decoratesSelection(): boolean;
		/**
		 * The one companion of a multiple is the same text input a single field carries, so the
		 * provider takes insertion over there by the same rule. The clause above that keeps it off
		 * the Y/N rows is what is deliberately missing here: this row is the field's only carrier of
		 * an expression, and the rows it stands beside are untouched either way.
		 */
		protected decoratesSharedExpressionRow(): boolean;
		/**
		 * ui.switcher keeps every instance in a static list and the checkbox holds handlers of its
		 * own, so the controls of the render being dropped have to be destroyed here or they hold
		 * their nodes forever. The collections are recreated at the end of this, not in render():
		 * the base render() calls release() first, so a reset done before super.render() would leave
		 * nothing to free.
		 */
		protected release(): void;
		/**
		 * The same letting go for one row: release() answers for a redraw, which drops every row at
		 * once, while a row removed by hand leaves the field alive. Without this its switcher would
		 * stay in the static list ui.switcher keeps and hold its detached node with it, and repeating
		 * "add, remove" would grow that list without bound.
		 */
		protected releaseRow(valueNode: HTMLElement): void;
		renderControl(value: string | string[] | null): BX.Bizproc.Fields.RenderedControl;
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
		getValueState(): BX.Bizproc.Fields.FieldValueState;
		/**
		 * Overridden because the base only writes the hidden input's `.value`; neither the toggle nor
		 * the flag reflects `.value` on its own, so we bridge value -> visual state here.
		 *
		 * The write itself happens only while the toggle is the carrier. Every other path calls this
		 * one - setValue() does, and applyProperty() does twice around a redraw - so an unconditional
		 * write would put an 'N' back into a value node the expression mode requires empty, and the
		 * backend would stop reading the companion.
		 */
		protected applyValue(value: string | string[]): void;
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
		protected onValueModeChanged(mode: BX.Bizproc.Fields.ValueModeValue): void;
	}
}
