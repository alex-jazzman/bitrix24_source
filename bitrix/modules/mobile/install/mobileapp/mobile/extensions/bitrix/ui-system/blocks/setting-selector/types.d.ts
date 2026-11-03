/**
 * `modeParams` of `SettingMode.PARAMETER`: the value on the right of the title and the chevron
 * that says the row opens something.
 */
interface SettingParameterParams
{
	text?: string;
	chevron?: boolean;
	/** Both the value and the chevron, unless `textColor` says otherwise. */
	color?: Color;
	textColor?: Color;
	/** One by default: a value too long for the width is cut, it does not grow the row. */
	numberOfLines?: number;
	/** `Ellipsize` of `utils/enums/style`, or its value; the end is cut by default. */
	ellipsize?: BaseEnum | Ellipsize;
	/** How much of the row the value may take; half of it by default, so the title keeps its own. */
	maxWidth?: string | number;
	iconRef?: Function;
}

/** `modeParams` of `SettingMode.RIGHT_ICON`: props of `IconView`, passed on as they are. */
type SettingIconParams = object;

type SettingModeParams = SettingParameterParams | SettingIconParams;

interface SettingSelectorProps
{
	testId: string;
	checked?: boolean;
	locked?: boolean;
	divider?: boolean;
	icon?: Icon;
	iconColor?: Color;
	title?: string;
	/** Color of the title; `Color.base1` by default. */
	color?: Color;
	titleEllipsize?: BaseEnum | Ellipsize;
	/** Two by default. */
	numberOfLinesTitle?: number;
	subtitle?: string;
	subtitleEllipsize?: BaseEnum | Ellipsize;
	/** Five by default. */
	numberOfLinesSubtitle?: number;
	/** `SettingMode`; the switch stands when none is named. */
	mode?: BaseEnum;
	/** Read by the mode, see `SettingParameterParams`. */
	modeParams?: SettingModeParams;
	/** `SwitcherSize`; `SwitcherSize.XL` by default. */
	switcherSize?: BaseEnum;
	/** Shown below the title and the subtitle. */
	additionalContent?: LayoutComponent<Record<string, unknown>, Record<string, unknown>>;
	style?: Partial<ElementStyle>;
	/** Takes the state of the switch, and of the row itself in the other modes. */
	onClick?: (checked: boolean) => void;
}

declare function SettingSelector(props: SettingSelectorProps): LayoutComponent<SettingSelectorProps, { checked: boolean }>;

export {
	SettingSelector,
	SettingSelectorProps,
	SettingModeParams,
	SettingParameterParams,
	SettingIconParams,
};
