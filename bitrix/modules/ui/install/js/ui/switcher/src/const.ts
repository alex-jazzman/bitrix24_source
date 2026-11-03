/*
 * extraLarge, large, extraExtraSmall options supported only by the air button
 * */
export const SwitcherSize = {
	extraLarge: 'extra-large',
	large: 'large',
	medium: 'medium',
	small: 'small',
	extraSmall: 'extra-small',
	extraExtraSmall: 'extra-extra-small',
} as const;

export type SwitcherSize = typeof SwitcherSize[keyof typeof SwitcherSize];

export const SwitcherColor = {
	primary: 'primary',
	green: 'green',
} as const;

export type SwitcherColor = typeof SwitcherColor[keyof typeof SwitcherColor];

// Names read the way the rest of the Air set spells them - `AirButtonStyle` is the reference. The
// class the value maps onto keeps the shorthand of the token group it paints with, so the wording of a
// public value and the wording of a group stay free of each other.
export const AirSwitcherStyle = {
	FILLED: 'FILLED',
	// a value of its own, mapped onto the design of FILLED: kept working for the call sites that
	// already pass it
	SOLID: 'SOLID',
	TINTED: 'TINTED',
	FILLED_SUCCESS: 'FILLED_SUCCESS',
	FILLED_ALERT: 'FILLED_ALERT',
	FILLED_WARNING: 'FILLED_WARNING',
	FILLED_BLACK: 'FILLED_BLACK',
	FILLED_WHITE: 'FILLED_WHITE',
	FILLED_NO_ACCENT: 'FILLED_NO_ACCENT',
	// gradient fills: the group hands over stops of a gradient, not a flat colour
	FILLED_BITRIX_GPT: 'FILLED_BITRIX_GPT',
	FILLED_BOOST: 'FILLED_BOOST',
	// the look TINTED had before it moved to the group of its own name
	TINTED_ACCENT_1: 'TINTED_ACCENT_1',
	TINTED_SUCCESS: 'TINTED_SUCCESS',
	TINTED_ALERT: 'TINTED_ALERT',
	TINTED_WARNING: 'TINTED_WARNING',
	TINTED_GREEN: 'TINTED_GREEN',
	TINTED_VIOLET: 'TINTED_VIOLET',
	TINTED_NO_ACCENT: 'TINTED_NO_ACCENT',
	TINTED_BITRIX_GPT: 'TINTED_BITRIX_GPT',
	// the ring is what makes these readable: their `-bg` equals the surface behind them
	OUTLINE: 'OUTLINE',
	OUTLINE_ACCENT_1: 'OUTLINE_ACCENT_1',
	OUTLINE_ACCENT_2: 'OUTLINE_ACCENT_2',
	OUTLINE_ALERT: 'OUTLINE_ALERT',
	OUTLINE_BOOST: 'OUTLINE_BOOST',
	OUTLINE_NO_ACCENT: 'OUTLINE_NO_ACCENT',
	OUTLINE_SUCCESS: 'OUTLINE_SUCCESS',
	OUTLINE_WARNING: 'OUTLINE_WARNING',
	// the ring of this one is a gradient, so it is drawn by a layer of its own and not by a shadow
	OUTLINE_BITRIX_GPT: 'OUTLINE_BITRIX_GPT',
	SELECTION: 'SELECTION',
} as const;

export type AirSwitcherStyle = typeof AirSwitcherStyle[keyof typeof AirSwitcherStyle];
