/* eslint-disable */
declare namespace BX.Bizproc.Fields.Datetime {
	class DatetimeField extends BX.Bizproc.Fields.BaseField {
		/**
		 * Destroying a picker closes a calendar left open - it would otherwise hang over a node no
		 * longer in the document - and takes its popup out of the document; merely hiding it would
		 * leave the node behind, and PopupManager would keep holding the picker.
		 */
		protected release(): void;
		protected getDefaultPlaceholder(): string;
		/**
		 * The input is never typed into - the moment is picked in the calendar - so it carries
		 * `readonly` even when the field is editable. The calendar button belongs inside the
		 * bordered box, the zone select next to it in the row.
		 */
		renderControl(value: string | string[] | null): BX.Bizproc.Fields.RenderedControl;
		/**
		 * Overridden because the value of a datetime is split across two controls: the input
		 * holds the date the user reads, the select next to it holds the zone, and the stored
		 * format joins them as `<datetime> [offset]` (backend Value\DateTime::serialize).
		 * Reading only the input would drop the zone on every round trip - the re-render feeds
		 * the field back from its own value, so the offset would be lost there.
		 */
		getValue(): string | string[];
		/**
		 * Overridden as the counterpart of getValue(): the base would write the whole
		 * `<datetime> [offset]` string into the input. The datetime goes into the input, the
		 * offset back into the zone select - by the same rules renderControl() follows, so
		 * writing a value and rendering it produce the same state.
		 */
		protected applyValue(value: string | string[]): void;
	}
}
