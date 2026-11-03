/* eslint-disable */
type AirMessageBoxOptions = {
	title: string;
	message: string;
	maxWidth?: number;
	className?: string | null;
	popupOptions?: Object;
	buttonsFactory?: (messageBox: BX.UI.Dialogs.MessageBox) => Array<Object> | null;
};

declare namespace BX.Disk.AirMessageBox {
	function showAirMessageBox(options: AirMessageBoxOptions): BX.UI.Dialogs.MessageBox | null;

	/**
	 * Replaces the #NAME# placeholder with an overflow-safe file name: the head shrinks with an
	 * ellipsis while the tail with the extension stays visible. Screen readers get the whole name.
	 */
	function formatFileName(message: string, name: string): string;
}
