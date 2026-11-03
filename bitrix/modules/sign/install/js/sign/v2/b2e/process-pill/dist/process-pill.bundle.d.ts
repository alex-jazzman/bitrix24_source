/* eslint-disable */
declare namespace BX.Sign.V2.B2e {
	/**
	 * Pill "Processes" of the row of the views of the KEDO section. It is not a segment of the switch of the
	 * views (AC-006): the set of views comes out of crm and takes no item from outside, so the pill stands in
	 * the row as an element of its own, right after the block of the navigation (Q-3).
	 */
	class ProcessPill {
		/**
		 * Mounts the pill once the row of the toolbar is in the document. Called at the load of the extension:
		 * the toolbar of the section renders no script of its own to call it from, and the extension is loaded
		 * by `sign.start` under the feature flag alone (AC-016).
		 */
		static mount(): void;
	}
}
