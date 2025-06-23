import ButtonSize from '../button/button-size';
import { ButtonCounterSize } from 'ui.buttons';

export const getCounterSize = (buttonSize: string): string => {
	switch (buttonSize)
	{
		case ButtonSize.EXTRA_EXTRA_SMALL: return ButtonCounterSize.SMALL;
		case ButtonSize.EXTRA_SMALL: return ButtonCounterSize.SMALL;
		case ButtonSize.SMALL: return ButtonCounterSize.SMALL;
		case ButtonSize.MEDIUM: return ButtonCounterSize.MEDIUM;
		case ButtonSize.LARGE: return ButtonCounterSize.LARGE;
		case ButtonSize.EXTRA_LARGE: return ButtonCounterSize.LARGE;
		default: return ButtonCounterSize.MEDIUM;
	}
}
