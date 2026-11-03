/* eslint-disable */
type MeasureGridOptions = Readonly<{
	gridId: string;
	componentName: string;
	editUrlTemplate: string;
	isSlider: boolean;
}>;

declare namespace BX.Crm.Config {
	class MeasureGrid {
		private constructor();
		static create(options: MeasureGridOptions): MeasureGrid | null;
		static handleEditAction(gridId: string, url: string): boolean;
	}
}
