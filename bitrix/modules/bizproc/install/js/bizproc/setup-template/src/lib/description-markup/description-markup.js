import { NodeFormatter, type ConvertCallbackOptions } from 'ui.bbcode.formatter';

/**
 * The nodes the html formatter of `ui` renders on its own, apart from the structural ones — `#root`,
 * `#text`, `#tab`, `#linebreak` — which carry the text itself rather than markup the author chose.
 * The set is written out because a formatter tells no one what it renders until it is built, while
 * the description needs that answer earlier: the formatters of a node are given to the constructor.
 */
const RENDERED_NODES: Array<string> = Object.freeze([
	'b', 'i', 'u', 's', 'p', 'list', '*', 'url',
	'img', 'video', 'quote', 'code', 'spoiler',
	'table', 'tr', 'td', 'th',
	'user', 'department', 'project',
]);

const IMAGE_NODE = 'img';

/**
 * Renders a node as its own content: the children of a node are formatted and appended by the
 * formatter itself, so an empty fragment in place of the element leaves the text of the node where
 * it was written and builds nothing out of it.
 */
function createNodeAsItsContent(name: string): NodeFormatter
{
	return new NodeFormatter({
		name,
		convert(): DocumentFragment
		{
			return document.createDocumentFragment();
		},
	});
}

/**
 * A smiley is an image the formatter puts into the text on its own, so a surface that renders no
 * image node gets no smiley either: the reader sees the typing the author wrote, the way the editor
 * of the description shows it. Text inside a `code` node reaches the reader as it was written, which
 * is what the formatter of `ui` does with it in any case.
 */
function createTextWithoutSmileys(): NodeFormatter
{
	return new NodeFormatter({
		name: '#text',
		convert({ node }: ConvertCallbackOptions): Text
		{
			return document.createTextNode(node.toString({ encode: false }));
		},
	});
}

/**
 * The editor of the description gives the author emphasis, lists and links, while the formatter of
 * the form renders everything BBCode can express: media makes the browser of every reader fetch a
 * url the author chose, a spoiler hides text behind a control nobody wrote, a mention builds a link
 * to a profile. Such markup reaches the column through import, the REST API and values stored before
 * the editor existed, so every node outside the set is given a formatter that renders it as its own
 * content — the reader sees the text and nothing is built out of it.
 *
 * These go to the html formatter of `ui` as its `formatters` option, which it reads after its own,
 * so for their nodes these are the formatters that answer.
 */
export function createDescriptionNodeFormatters(allowedNodes: Array<string>): Array<NodeFormatter>
{
	const formatters: Array<NodeFormatter> = RENDERED_NODES
		.filter((name: string): boolean => !allowedNodes.includes(name))
		.map((name: string): NodeFormatter => createNodeAsItsContent(name))
	;

	if (!allowedNodes.includes(IMAGE_NODE))
	{
		formatters.push(createTextWithoutSmileys());
	}

	return formatters;
}
