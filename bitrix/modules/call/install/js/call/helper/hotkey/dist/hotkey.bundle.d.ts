/* eslint-disable */
interface Hotkey {
	readonly action: string;
	readonly option: string;
	readonly control: string;
}

declare namespace BX.Call.Helper {
	const hotkey: Hotkey;
}
