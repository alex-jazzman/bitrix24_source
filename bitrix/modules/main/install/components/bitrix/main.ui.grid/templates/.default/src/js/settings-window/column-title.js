/**
 * Column titles the user renamed in the settings window are stored in the grid user
 * options, keyed by column id. A column the user never renamed keeps the name it
 * comes with.
 */
export function getColumnTitle(column: Object, customNames: ?Object): string
{
	const { id, name } = column;

	if (BX.Type.isPlainObject(customNames) && id in customNames)
	{
		return customNames[id];
	}

	return name;
}

/**
 * The name the user just typed, written straight into the table head. The reload that follows
 * the save brings the head from the server, but it is served by another process, which can
 * still hold the options this save has replaced - and then the head keeps the old name until
 * the page is reloaded by hand.
 *
 * Only the text is replaced: the title also carries the hint node, which has to stay.
 */
export function setColumnHeaderTitle(headerCell: ?HTMLElement, title: string): void
{
	const titleNode = headerCell?.querySelector('.main-grid-head-title');

	if (!titleNode)
	{
		return;
	}

	const textNode = [...titleNode.childNodes].find((node) => node.nodeType === Node.TEXT_NODE);

	if (textNode)
	{
		textNode.nodeValue = title;

		return;
	}

	titleNode.prepend(document.createTextNode(title));
}
