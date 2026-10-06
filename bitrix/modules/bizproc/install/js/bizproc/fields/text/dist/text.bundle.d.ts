/* eslint-disable */
declare namespace BX.Bizproc.Fields.Text {
	class TextField extends BX.Bizproc.Fields.BaseField {
		protected getDefaultPlaceholder(): string;
		renderControl(value: string | string[] | null): BX.Bizproc.Fields.RenderedControl;
	}
}
