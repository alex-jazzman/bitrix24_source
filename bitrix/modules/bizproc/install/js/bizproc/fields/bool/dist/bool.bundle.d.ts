/* eslint-disable */
declare namespace BX.Bizproc.Fields.Bool {
	/**
	 * Boolean ("yes/no") field type. The control is a `ui.switcher` toggle paired
	 * with a hidden `<input>` carrying the 'Y'/'N' value: the hidden input is the value
	 * node of the rendered pair, the switcher is its named node. So the core reads and
	 * writes the value on the input, while the label and the focus go to the visible
	 * toggle the user actually operates.
	 */
	class BoolField extends BX.Bizproc.Fields.BaseField {
		render(): HTMLElement;
		renderControl(value: string | string[] | null): BX.Bizproc.Fields.RenderedControl;
		protected applyValue(value: string | string[]): void;
	}
}
