/* eslint-disable */
declare namespace BX.Sign.V2.Grid.B2e {
	/**
	 * Client half of the tab "Processes". The rows, the groups and everything written in them are built by the
	 * component of the page; this class answers only for what a row lets the officer do - the retry of a launch
	 * that did not take place (AC-015c) and the protocol of a process (ERR-006).
	 */
	class ProcessList {
		/**
		 * Entry point of the page. The grid replaces its rows over ajax and loads the composition of a group
		 * into them, so the actions are delegated and bound once - a repeated call after a reload changes
		 * nothing.
		 */
		static bind(gridId: string): void;
		constructor(gridId: string);
	}
}
