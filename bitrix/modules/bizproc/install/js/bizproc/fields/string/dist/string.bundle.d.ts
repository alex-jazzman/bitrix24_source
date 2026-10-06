/* eslint-disable */
declare namespace BX.Bizproc.Fields.String {
	/**
	 * Concrete string field type.
	 *
	 * Renders an editable single-line text control through the base field's default text
	 * control, styled by its own `bizproc-fields-string*` classes.
	 *
	 * Value handling (getValue/setValue), multiple cloning and the selection provider are
	 * inherited from BaseField: the inner `<input>` is the value node of the returned pair,
	 * so the base machinery reads/writes its `.value` transparently.
	 */
	class StringField extends BX.Bizproc.Fields.BaseField {
		protected getDefaultPlaceholder(): string;
		renderControl(value: string | string[] | null): BX.Bizproc.Fields.RenderedControl;
	}
}
