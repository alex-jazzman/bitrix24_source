/* eslint-disable */
declare namespace BX.Bizproc.Fields.Int {
	/**
	 * Concrete integer field type.
	 *
	 * Renders an editable single-line numeric control through the base field's default text
	 * control, styled by its own `bizproc-fields-int*` classes. Structurally identical to
	 * StringField (a single `<input type="text">`), but the interactive input is filtered to
	 * an integer while typing/pasting: only digits and one leading `-` survive.
	 *
	 * Value handling (getValue/setValue), multiple cloning and the selection provider are
	 * inherited from BaseField: the inner `<input>` is the value node of the returned pair, so
	 * the base machinery reads/writes its `.value` transparently.
	 *
	 * The integer rule is attached through bindInputFilter(), which listens on the interactive
	 * `input` event only. That is what keeps the value model tolerant of strings: setValue()
	 * writes `.value` without dispatching `input`, so programmatic values (e.g. future macro-string
	 * insertion like `{{Document:PROPERTY}}`) pass through unfiltered. setValue/getValue are
	 * intentionally NOT overridden.
	 */
	class IntField extends BX.Bizproc.Fields.BaseField {
		protected getDefaultPlaceholder(): string;
		/**
		 * `inputmode="numeric"` requests a numeric keyboard on mobile.
		 */
		renderControl(value: string | string[] | null): BX.Bizproc.Fields.RenderedControl;
	}
}
