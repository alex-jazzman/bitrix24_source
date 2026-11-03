import { ViewMode, type ViewMode as ViewModeValue } from '../../const/view-mode';

export function isViewMode(mode: unknown): mode is ViewModeValue
{
	return mode === ViewMode.Hint || mode === ViewMode.Rules;
}

export function resolveViewMode(hasHint: boolean, preferredMode: unknown): ViewModeValue
{
	if (hasHint !== true)
	{
		return ViewMode.Rules;
	}

	return isViewMode(preferredMode) ? preferredMode : ViewMode.Hint;
}
