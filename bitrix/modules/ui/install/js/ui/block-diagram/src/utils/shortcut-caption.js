// The single place the shape of "action (shortcut)" is written. A label with nothing in it - an empty
// string, or the null of a phrase missing from the portal - is how a caller says there is no caption at
// all, and an empty shortcut leaves the action named without an empty pair of brackets.
export function withShortcut(label: ?string, shortcut: string): string
{
	if (!label)
	{
		return '';
	}

	if (shortcut === '')
	{
		return label;
	}

	return `${label} (${shortcut})`;
}
