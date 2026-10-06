/* eslint-disable */
declare namespace BX.Bizproc.Fields.Double {
	class DoubleField extends BX.Bizproc.Fields.BaseField {
		protected getDefaultPlaceholder(): string;
		/**
		 * A comma is the decimal separator here (see sanitizeDecimal), so a scalar value is one
		 * number and never a comma-separated list: `1,5` is a single value, not `1` and `5`.
		 */
		protected splitsScalarValue(): boolean;
		renderControl(value: string | string[] | null): BX.Bizproc.Fields.RenderedControl;
	}
}
