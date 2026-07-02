const ARROW_HORIZONTAL = 0b0000000001;
const ARROW_VERTICAL = 0b0000000010;
const JK_BITS = 0b0000000100;
const HL_BITS = 0b0000001000;
const HOME_AND_END = 0b0000010000;
const WS_BITS = 0b0000100000;
const AD_BITS = 0b0001000000;
const TAB_BIT = 0b0010000000;
const PAGE_UP_DOWN = 0b0100000000;
const BACKSPACE_BIT = 0b1000000000;

export const FocusKeys = {
	/** Left / Right arrow keys (previous / next) */
	ArrowHorizontal: ARROW_HORIZONTAL,
	/** Up / Down arrow keys (previous / next) */
	ArrowVertical: ARROW_VERTICAL,
	/** J / K keys (next / previous) */
	JK: JK_BITS,
	/** H / L keys (previous / next) */
	HL: HL_BITS,
	/** Home / End keys (start / end) */
	HomeAndEnd: HOME_AND_END,
	/** W / S keys (previous / next) */
	WS: WS_BITS,
	/** A / D keys (previous / next) */
	AD: AD_BITS,
	/** Tab key (next; Shift+Tab = previous) */
	Tab: TAB_BIT,
	/** PageUp / PageDown keys (start / end) */
	PageUpDown: PAGE_UP_DOWN,
	/** Backspace key (previous) */
	Backspace: BACKSPACE_BIT,

	// Combinations
	ArrowAll: ARROW_HORIZONTAL | ARROW_VERTICAL,
	HJKL: HL_BITS | JK_BITS,
	WASD: WS_BITS | AD_BITS,
	All: ARROW_HORIZONTAL | ARROW_VERTICAL | JK_BITS | HL_BITS
		| HOME_AND_END | WS_BITS | AD_BITS | TAB_BIT | PAGE_UP_DOWN | BACKSPACE_BIT,
};
