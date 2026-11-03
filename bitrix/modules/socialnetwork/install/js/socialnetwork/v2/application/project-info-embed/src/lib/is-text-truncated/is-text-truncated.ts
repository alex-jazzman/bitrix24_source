export function isTextTruncated(
	isExpanded: boolean,
	currentValue: boolean,
	scrollHeight: number,
	clientHeight: number,
): boolean
{
	return isExpanded ? currentValue : scrollHeight > clientHeight + 1;
}
