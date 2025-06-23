import { type Slider } from '../slider';
import { type Label } from '../label';

export type LabelOptions = {
	bgColor?: string | [string, number],
	color?: string,
	text?: string,
	iconClass?: string,
	iconTitle?: string,
	onclick?: (label: Label, slider: Slider) => void,
};
