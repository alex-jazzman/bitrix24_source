import { KeyChecker } from './classes/key-checker';
import { PlatformUtil } from './platform';

export const HotkeyOs = {
	windows: 'windows',
	macos: 'macos',
};

const KeyName = {
	[HotkeyOs.windows]: {
		NumpadEnter: 'Enter',
		ArrowUp: '↑',
	},
	[HotkeyOs.macos]: {
		NumpadEnter: 'Enter',
		ArrowUp: '↑',
		Ctrl: '⌘',
		Alt: '⌥',
	},
};

export const KeyUtil = {
	isCmdOrCtrl(event: PointerEvent | KeyboardEvent): boolean
	{
		return (new KeyChecker(event)).isCmdOrCtrl();
	},

	isShift(event: PointerEvent | KeyboardEvent): boolean
	{
		return (new KeyChecker(event)).isShift();
	},

	isAltOrOption(event: PointerEvent | KeyboardEvent): boolean
	{
		return (new KeyChecker(event)).isAltOrOption();
	},

	isCombination(event: KeyboardEvent, rawCombinationList: string | string[]): boolean
	{
		return (new KeyChecker(event)).isCombination(rawCombinationList);
	},

	isExactCombination(event: KeyboardEvent, rawCombinationList: string | string[]): boolean
	{
		return (new KeyChecker(event)).isExactCombination(rawCombinationList);
	},

	getCombinationText(combination: string | string[], os: string = getCurrentOs()): string
	{
		return mainVariant(combination)
			.split('+')
			.map((key: string) => KeyName[os]?.[key] ?? key)
			.join(' + ')
		;
	},
};

const getCurrentOs = (): string => {
	return PlatformUtil.isMac() ? HotkeyOs.macos : HotkeyOs.windows;
};

const mainVariant = (combination: string | string[]): string => {
	return Array.isArray(combination) ? combination[0] : combination;
};
