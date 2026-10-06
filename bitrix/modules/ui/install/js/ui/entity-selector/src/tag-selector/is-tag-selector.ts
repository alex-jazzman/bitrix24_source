import { TagSelector } from './tag-selector';

export function isTagSelector(selector: unknown): selector is TagSelector
{
	return selector instanceof TagSelector;
}
